import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { RecruitmentPage } from './RecruitmentPage';
import { httpClient } from '../../app/httpClient';
import type { JobApplication, JobPosting } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }));
const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

function posting(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    id: 1, title: 'Lecturer I', department: 'Physics', category: 'ACADEMIC', description: 'd',
    status: 'OPEN', closingDate: null, applicationCount: 1, ...overrides,
  };
}

function app(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 9, postingId: 1, applicantName: 'Ada Obi', email: 'ada@x.com', phone: null, coverNote: null,
    stage: 'APPLIED', stageNote: null, appliedAt: '2027-03-01T00:00:00Z', allowedNext: ['SHORTLISTED', 'REJECTED'],
    ...overrides,
  };
}

function setup(p: JobPosting = posting(), apps: JobApplication[] = [app()]) {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/api/recruitment/postings') return Promise.resolve({ data: [p] });
    if (url.endsWith('/applications')) return Promise.resolve({ data: apps });
    return Promise.reject(new Error('unexpected ' + url));
  });
}

describe('RecruitmentPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('lists postings and prompts to select one', async () => {
    setup();
    render(<RecruitmentPage />);
    expect(await screen.findByText('Lecturer I')).toBeInTheDocument();
    expect(screen.getByText(/Physics · 1 applicant/)).toBeInTheDocument();
    expect(screen.getByText('Select a posting to see its applicants.')).toBeInTheDocument();
  });

  it('shows applicants for the selected posting', async () => {
    setup();
    render(<RecruitmentPage />);
    await userEvent.click(await screen.findByText('Lecturer I'));
    expect(await screen.findByText('Ada Obi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to shortlisted' })).toBeInTheDocument();
  });

  it('advances an applicant to the next stage', async () => {
    setup();
    mockedPost.mockResolvedValue({ data: app({ stage: 'SHORTLISTED' }) });
    render(<RecruitmentPage />);
    await userEvent.click(await screen.findByText('Lecturer I'));
    await userEvent.click(await screen.findByRole('button', { name: 'Move to shortlisted' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/recruitment/applications/9/stage', { stage: 'SHORTLISTED', note: undefined }),
    );
  });

  it('requires a reason before rejecting', async () => {
    setup();
    mockedPost.mockResolvedValue({ data: app({ stage: 'REJECTED' }) });
    render(<RecruitmentPage />);
    await userEvent.click(await screen.findByText('Lecturer I'));
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));

    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Reject' });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Not a fit');
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/recruitment/applications/9/stage', { stage: 'REJECTED', note: 'Not a fit' }),
    );
  });

  it('offers to open a draft posting', async () => {
    setup(posting({ status: 'DRAFT' }), []);
    mockedPost.mockResolvedValue({ data: posting() });
    render(<RecruitmentPage />);
    await userEvent.click(await screen.findByText('Lecturer I'));
    await userEvent.click(await screen.findByRole('button', { name: 'Open for applications' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/recruitment/postings/1/status', { status: 'OPEN' }));
    expect(await screen.findByText('No applicants yet.')).toBeInTheDocument();
  });

  it('shows an error when a stage change fails', async () => {
    setup();
    mockedPost.mockImplementation(async () => {
      throw new Error('400');
    });
    render(<RecruitmentPage />);
    await userEvent.click(await screen.findByText('Lecturer I'));
    await userEvent.click(await screen.findByRole('button', { name: 'Move to shortlisted' }));
    expect(await screen.findByText('Could not move this application.')).toBeInTheDocument();
  });
});
