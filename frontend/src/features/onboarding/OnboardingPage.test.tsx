import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { OnboardingPage } from './OnboardingPage';
import { httpClient } from '../../app/httpClient';
import type { OnboardingCase } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }));
const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

function onboardingCase(overrides: Partial<OnboardingCase> = {}): OnboardingCase {
  return {
    id: 1, newHireName: 'Ada Obi', email: 'ada@x.com', position: 'Lecturer I', department: 'Physics',
    startDate: '2027-04-01', status: 'IN_PROGRESS', applicationId: null, linkedUsername: null,
    profileReady: false, payrollReady: false, tasksDone: 1, tasksTotal: 2,
    tasks: [
      { id: 10, title: 'Create the staff account', ownerTeam: 'HR', done: true, doneAt: null, doneBy: 'hr' },
      { id: 11, title: 'Issue staff ID card', ownerTeam: 'HR', done: false, doneAt: null, doneBy: null },
    ],
    ...overrides,
  };
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('shows cases with progress and readiness', async () => {
    mockedGet.mockResolvedValue({ data: [onboardingCase()] });
    render(<OnboardingPage />);

    expect(await screen.findByText('Ada Obi')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 tasks done')).toBeInTheDocument();
    expect(screen.getByText('No account linked')).toBeInTheDocument();
    expect(screen.getByText('Not payroll ready')).toBeInTheDocument();
  });

  it('ticks a task', async () => {
    mockedGet.mockResolvedValue({ data: [onboardingCase()] });
    mockedPost.mockResolvedValue({ data: onboardingCase() });
    render(<OnboardingPage />);

    await userEvent.click(await screen.findByRole('checkbox', { name: /Issue staff ID card/ }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/onboarding/tasks/11', { done: true }));
  });

  it('links a staff account by email', async () => {
    mockedGet.mockResolvedValue({ data: [onboardingCase()] });
    mockedPost.mockResolvedValue({ data: onboardingCase() });
    render(<OnboardingPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Link staff account' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Account email'), 'aobi@uni.edu');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Link' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/onboarding/cases/1/link-user', { email: 'aobi@uni.edu' }),
    );
  });

  it('locks a cancelled case', async () => {
    mockedGet.mockResolvedValue({ data: [onboardingCase({ status: 'CANCELLED' })] });
    render(<OnboardingPage />);

    expect(await screen.findByText('CANCELLED')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Issue staff ID card/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Cancel onboarding' })).not.toBeInTheDocument();
  });

  it('cancels an in-progress case', async () => {
    mockedGet.mockResolvedValue({ data: [onboardingCase()] });
    mockedPost.mockResolvedValue({ data: onboardingCase({ status: 'CANCELLED' }) });
    render(<OnboardingPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel onboarding' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/onboarding/cases/1/cancel'));
  });

  it('shows an error when linking fails', async () => {
    mockedGet.mockResolvedValue({ data: [onboardingCase()] });
    mockedPost.mockImplementation(async () => {
      throw new Error('400');
    });
    render(<OnboardingPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Link staff account' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Account email'), 'x@y.com');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Link' }));

    expect(await screen.findByText('No staff account was found with that email.')).toBeInTheDocument();
  });
});
