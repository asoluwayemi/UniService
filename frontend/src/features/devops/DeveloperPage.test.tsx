import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { DeveloperPage } from './DeveloperPage';
import { httpClient } from '../../app/httpClient';
import type { DeploymentRun } from './types';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

function run(overrides: Partial<DeploymentRun> = {}): DeploymentRun {
  return {
    id: 1,
    runType: 'PUSH',
    status: 'SUCCESS',
    triggeredByUsername: 'developer',
    output: 'Everything up-to-date',
    startedAt: '2027-01-01T00:00:00Z',
    finishedAt: '2027-01-01T00:00:05Z',
    ...overrides,
  };
}

describe('DeveloperPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('renders a GitHub link and both run cards', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/devops/push/latest') return Promise.resolve({ data: run({ runType: 'PUSH' }) });
      if (url === '/api/devops/deploy/latest') return Promise.resolve({ data: null });
      return Promise.reject(new Error('unexpected url'));
    });

    render(<DeveloperPage />);

    const githubLink = await screen.findByRole('link', { name: /Open on GitHub/ });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/asoluwayemi/UniService');
    expect(githubLink).toHaveAttribute('target', '_blank');

    expect(screen.getByRole('heading', { name: 'Push to GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Deploy' })).toBeInTheDocument();
    expect(screen.getByText('Everything up-to-date')).toBeInTheDocument();
    expect(screen.getByText('No runs yet.')).toBeInTheDocument();
  });

  it('triggers a push after confirming the dialog', async () => {
    mockedGet.mockResolvedValue({ data: null });
    mockedPost.mockResolvedValueOnce({ data: run({ runType: 'PUSH', status: 'RUNNING', output: null }) });

    render(<DeveloperPage />);

    await screen.findAllByText('No runs yet.');
    await userEvent.click(screen.getByRole('button', { name: 'Push' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/pushes the current branch/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/devops/push'));
  });

  it('disables the trigger button while a run is in progress', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/devops/deploy/latest') return Promise.resolve({ data: run({ runType: 'DEPLOY', status: 'RUNNING', output: null }) });
      return Promise.resolve({ data: null });
    });

    render(<DeveloperPage />);

    await screen.findByText('Running…');
    expect(screen.getByRole('button', { name: 'Running…' })).toBeDisabled();
  });

  it('shows an error message when triggering fails', async () => {
    mockedGet.mockResolvedValue({ data: null });
    mockedPost.mockRejectedValueOnce({ response: { data: { message: 'A push is already running' } } });

    render(<DeveloperPage />);

    await screen.findAllByText('No runs yet.');
    await userEvent.click(screen.getAllByRole('button', { name: 'Push' })[0]);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('A push is already running')).toBeInTheDocument();
  });
});
