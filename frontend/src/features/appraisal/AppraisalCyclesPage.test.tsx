import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AppraisalCyclesPage } from './AppraisalCyclesPage';
import { httpClient } from '../../app/httpClient';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

const cycles = [
  { id: 1, year: 2026, status: 'OPEN' },
  { id: 2, year: 2025, status: 'CLOSED' },
];

describe('AppraisalCyclesPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('renders existing cycles', async () => {
    mockedGet.mockResolvedValueOnce({ data: cycles });

    render(<AppraisalCyclesPage />);

    expect(await screen.findByText('2026')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
  });

  it('shows an empty state when there are no cycles', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    render(<AppraisalCyclesPage />);

    expect(await screen.findByText('No appraisal cycles yet.')).toBeInTheDocument();
  });

  it('creates a new cycle and reloads the list', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: cycles });
    mockedPost.mockResolvedValueOnce({ data: { id: 1, year: 2026, status: 'OPEN' } });

    render(<AppraisalCyclesPage />);

    await screen.findByText('No appraisal cycles yet.');
    await userEvent.click(screen.getByRole('button', { name: 'New Cycle' }));

    const dialog = await screen.findByRole('dialog');
    const yearInput = within(dialog).getByLabelText(/Year/);
    await userEvent.clear(yearInput);
    await userEvent.type(yearInput, '2026');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(mockedPost).toHaveBeenCalledWith('/api/appraisal-cycles', { year: 2026 });
  });

  it('closes an open cycle', async () => {
    mockedGet.mockResolvedValueOnce({ data: cycles }).mockResolvedValueOnce({ data: cycles });
    mockedPost.mockResolvedValueOnce({ data: { id: 1, year: 2026, status: 'CLOSED' } });

    render(<AppraisalCyclesPage />);

    await screen.findByText('2026');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(mockedPost).toHaveBeenCalledWith('/api/appraisal-cycles/1/close');
  });
});
