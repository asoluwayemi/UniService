import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { PayrollRunsPage } from './PayrollRunsPage';
import { httpClient } from '../../app/httpClient';
import type { PayrollRun } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }));
const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

function run(overrides: Partial<PayrollRun> = {}): PayrollRun {
  return {
    id: 5, period: '2027-03', status: 'DRAFT', staffCount: 2, skippedCount: 0,
    totalGross: 280000, totalNet: 244400, generatedBy: 'finance', publishedAt: null, ...overrides,
  };
}

describe('PayrollRunsPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('lists runs with status', async () => {
    mockedGet.mockResolvedValue({ data: [run(), run({ id: 4, period: '2027-02', status: 'PUBLISHED' })] });
    render(<PayrollRunsPage />);

    expect(await screen.findByText('2027-03')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Publish' })).toHaveLength(1);
  });

  it('generates a draft for the chosen period and reports skipped staff', async () => {
    mockedGet.mockResolvedValue({ data: [] });
    mockedPost.mockResolvedValue({ data: run({ skippedCount: 3 }) });
    render(<PayrollRunsPage />);
    await screen.findByText('No payroll runs yet.');

    await userEvent.click(screen.getByRole('button', { name: 'Generate draft' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/payroll/runs', { period: expect.stringMatching(/^\d{4}-\d{2}$/) }),
    );
    expect(await screen.findByText(/3 staff skipped/)).toBeInTheDocument();
  });

  it('publishes only after confirming', async () => {
    mockedGet.mockResolvedValue({ data: [run()] });
    mockedPost.mockResolvedValue({ data: run({ status: 'PUBLISHED' }) });
    render(<PayrollRunsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Publish' }));
    expect(mockedPost).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/payroll/runs/5/publish'));
    expect(await screen.findByText(/Staff have been notified/)).toBeInTheDocument();
  });

  it('shows an error when generation fails', async () => {
    mockedGet.mockResolvedValue({ data: [] });
    mockedPost.mockImplementation(async () => {
      throw new Error('400');
    });
    render(<PayrollRunsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Generate draft' }));
    expect(await screen.findByText(/Could not generate payroll/)).toBeInTheDocument();
  });
});
