import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { NonAcademicProgressSection } from './NonAcademicProgressSection';
import { httpClient } from '../../app/httpClient';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;
const mockedDelete = httpClient.delete as Mock;

const data = {
  trainings: [{ id: 1, title: 'Leadership Workshop', organizer: 'HR Dept', yearAttended: 2026, certificateNumber: 'CERT-1' }],
  projects: [{ id: 2, projectTitle: 'New Wing', role: 'Coordinator', status: 'COMPLETED' }],
};

describe('NonAcademicProgressSection', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedDelete.mockReset();
  });

  it('loads data from /api/non-academic/mine when isMine is true', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<NonAcademicProgressSection staffProfileId={1} isMine />);

    expect(await screen.findByText('Leadership Workshop')).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith('/api/non-academic/mine');
  });

  it('loads data from /api/non-academic/staff/{id} when viewing someone else', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<NonAcademicProgressSection staffProfileId={7} isMine={false} />);

    await screen.findByText('Leadership Workshop');
    expect(mockedGet).toHaveBeenCalledWith('/api/non-academic/staff/7');
  });

  it('shows a fallback schedule of duties when none is provided', async () => {
    mockedGet.mockResolvedValueOnce({ data: { trainings: [], projects: [] } });

    render(<NonAcademicProgressSection staffProfileId={1} isMine scheduleOfDuties={null} />);

    expect(await screen.findByText(/Primary Administrative Duties/)).toBeInTheDocument();
  });

  it('shows the provided schedule of duties when set', async () => {
    mockedGet.mockResolvedValueOnce({ data: { trainings: [], projects: [] } });

    render(<NonAcademicProgressSection staffProfileId={1} isMine scheduleOfDuties="Custom duties text" />);

    expect(await screen.findByText('Custom duties text')).toBeInTheDocument();
  });

  it('hides delete buttons when not isMine', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<NonAcademicProgressSection staffProfileId={7} isMine={false} />);

    await screen.findByText('Leadership Workshop');
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument();
  });

  it('adds a training record', async () => {
    mockedGet.mockResolvedValue({ data: { trainings: [], projects: [] } });
    mockedPost.mockResolvedValueOnce({ data: {} });

    render(<NonAcademicProgressSection staffProfileId={1} isMine />);

    await screen.findByText('No training or certification records recorded yet.');
    await userEvent.click(screen.getByRole('button', { name: /Add Workshop/ }));

    await userEvent.type(screen.getByLabelText('Training / Workshop Title'), 'Safety Training');
    await userEvent.type(screen.getByLabelText('Organizing Institution / Association'), 'Facilities');
    await userEvent.click(screen.getByRole('button', { name: 'Save Record' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/non-academic/trainings', expect.objectContaining({
        title: 'Safety Training',
        organizer: 'Facilities',
      })),
    );
  });

  it('deletes a project', async () => {
    mockedGet.mockResolvedValueOnce({ data }).mockResolvedValueOnce({ data: { trainings: data.trainings, projects: [] } });
    mockedDelete.mockResolvedValueOnce({ data: {} });

    render(<NonAcademicProgressSection staffProfileId={1} isMine />);

    await screen.findByText('New Wing');
    const deleteButtons = screen.getAllByRole('button').filter((b) => b.querySelector('svg[data-testid="DeleteIcon"]'));
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('/api/non-academic/projects/2'));
  });
});
