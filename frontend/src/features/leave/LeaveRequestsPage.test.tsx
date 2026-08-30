import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { LeaveRequestsPage } from './LeaveRequestsPage';
import { httpClient } from '../../app/httpClient';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

const balance = { gradeLevel: 10, annualEntitlementDays: 30, usedDaysThisYear: 5, remainingDaysThisYear: 25 };

const myRequest = {
  id: 1,
  staffName: 'Jane Doe',
  leaveType: 'ANNUAL',
  startDate: '2027-01-10',
  endDate: '2027-01-12',
  numberOfDays: 3,
  reason: 'Rest',
  status: 'PENDING',
  reviewerName: null,
  reviewerComment: null,
  handoverOfficerId: null,
  handoverOfficerName: null,
  handoverNotes: null,
  handoverStatus: 'NOT_REQUIRED',
  resumptionDate: null,
  resumptionNotes: null,
  resumptionStatus: 'NOT_RESUMED',
  allowanceEligible: false,
  allowanceHandoffStatus: 'NOT_ELIGIBLE',
  allowanceAmount: null,
};

const pendingRequest = { ...myRequest, id: 2, staffName: 'John Smith', status: 'PENDING' };

const staffSummary = { id: 5, userId: 7, staffNumber: 'STAFF-0007', firstName: 'Bob', lastName: 'Builder' };

function mockLoad(overrides: { mine?: unknown[]; pending?: unknown[]; handovers?: unknown[]; staff?: unknown[] } = {}) {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/api/leave-requests/balance') return Promise.resolve({ data: balance });
    if (url === '/api/leave-requests/mine') return Promise.resolve({ data: overrides.mine ?? [myRequest] });
    if (url === '/api/leave-requests/pending') return Promise.resolve({ data: overrides.pending ?? [] });
    if (url === '/api/leave-requests/handovers') return Promise.resolve({ data: overrides.handovers ?? [] });
    if (url === '/api/staff/colleagues') return Promise.resolve({ data: overrides.staff ?? [staffSummary] });
    return Promise.reject(new Error('unexpected url: ' + url));
  });
}

describe('LeaveRequestsPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('renders the leave balance and own requests', async () => {
    mockLoad();

    render(<LeaveRequestsPage />);

    expect(await screen.findByText('GL 10')).toBeInTheDocument();
    expect(screen.getByText('25 Days')).toBeInTheDocument();
    expect(screen.getByText('ANNUAL')).toBeInTheDocument();
  });

  it('fetches handover officer candidates from the real staff endpoint', async () => {
    mockLoad();

    render(<LeaveRequestsPage />);

    await screen.findByText('GL 10');
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/api/staff/colleagues'));
  });

  it('shows pending review requests in a separate section', async () => {
    mockLoad({ pending: [pendingRequest] });

    render(<LeaveRequestsPage />);

    expect(await screen.findByText('Awaiting Your Approval / Review')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('cancels a pending request', async () => {
    mockLoad();
    mockedPost.mockResolvedValueOnce({ data: { ...myRequest, status: 'CANCELLED' } });

    render(<LeaveRequestsPage />);

    await screen.findByText('ANNUAL');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/leave-requests/1/cancel'));
  });

  it('approves a pending request using the review prompt', async () => {
    mockLoad({ pending: [pendingRequest] });
    mockedPost.mockResolvedValueOnce({ data: { ...pendingRequest, status: 'APPROVED' } });
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Looks good');

    render(<LeaveRequestsPage />);

    await screen.findByText('John Smith');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/leave-requests/2/approve', { comment: 'Looks good' }),
    );
    promptSpy.mockRestore();
  });

  it('submits a new leave request', async () => {
    mockLoad();
    mockedPost.mockResolvedValueOnce({ data: myRequest });

    render(<LeaveRequestsPage />);

    await screen.findByText('GL 10');
    await userEvent.click(screen.getByRole('button', { name: 'Request Leave' }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.type(dialog.querySelector('input[type="date"]')!, '2027-02-01');
    const dateInputs = dialog.querySelectorAll('input[type="date"]');
    await userEvent.type(dateInputs[1], '2027-02-03');
    await userEvent.type(screen.getByLabelText(/Reason for Leave/), 'Family event');

    await userEvent.click(screen.getByRole('button', { name: 'Submit Request' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/leave-requests', expect.objectContaining({
      reason: 'Family event',
    })));
  });
});
