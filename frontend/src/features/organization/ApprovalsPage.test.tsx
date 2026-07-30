import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApprovalsPage } from './ApprovalsPage';
import { httpClient } from '../../app/httpClient';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

const pendingRequest = {
  id: 5,
  action: 'CREATE',
  targetOrgUnitId: null,
  targetOrgUnitName: null,
  proposedName: 'Engineering',
  proposedCode: 'ENG',
  proposedType: 'FACULTY',
  proposedParentId: null,
  proposedParentName: null,
  proposedHeadId: null,
  proposedHeadName: null,
  status: 'PENDING',
  requestedByUsername: 'hr.director',
  reviewedByUsername: null,
  reviewNotes: null,
  createdAt: '2026-07-30T00:00:00Z',
  reviewedAt: null,
};

describe('ApprovalsPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('renders pending requests', async () => {
    mockedGet.mockResolvedValueOnce({ data: [pendingRequest] });

    render(<ApprovalsPage />);

    expect(await screen.findByText(/Create faculty "Engineering"/)).toBeInTheDocument();
    expect(screen.getByText('hr.director')).toBeInTheDocument();
  });

  it('shows an empty state when there are no pending requests', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    render(<ApprovalsPage />);

    expect(await screen.findByText('No pending requests.')).toBeInTheDocument();
  });

  it('approves a request and reloads the list', async () => {
    mockedGet.mockResolvedValueOnce({ data: [pendingRequest] }).mockResolvedValueOnce({ data: [] });
    mockedPost.mockResolvedValueOnce({ data: { ...pendingRequest, status: 'APPROVED' } });

    render(<ApprovalsPage />);

    await screen.findByText(/Create faculty "Engineering"/);
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/org/change-requests/5/approve', {}));
    await waitFor(() => expect(mockedGet).toHaveBeenCalledTimes(2));
  });

  it('rejects a request with notes and reloads the list', async () => {
    mockedGet.mockResolvedValueOnce({ data: [pendingRequest] }).mockResolvedValueOnce({ data: [] });
    mockedPost.mockResolvedValueOnce({ data: { ...pendingRequest, status: 'REJECTED' } });

    render(<ApprovalsPage />);

    await screen.findByText(/Create faculty "Engineering"/);
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/Reason/), 'Budget not approved');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/org/change-requests/5/reject', { notes: 'Budget not approved' }),
    );
  });
});
