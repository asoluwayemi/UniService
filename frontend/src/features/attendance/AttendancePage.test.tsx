import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AttendancePage, formatMinutes } from './AttendancePage';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import type { AttendanceRecord, AttendanceSummary } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../../app/AuthContext', () => ({ useAuth: vi.fn() }));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;
const mockedUseAuth = vi.mocked(useAuth);

function rec(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: 1,
    username: 'jdoe',
    fullName: 'Jane Doe',
    workDate: '2027-03-10',
    clockIn: '2027-03-10T08:00:00Z',
    clockOut: null,
    late: false,
    minutesWorked: null,
    ...overrides,
  };
}

const summary: AttendanceSummary = {
  month: '2027-03',
  daysPresent: 2,
  daysLate: 1,
  totalMinutesWorked: 750,
  records: [rec({ id: 2, workDate: '2027-03-09', late: true, minutesWorked: 480, clockOut: '2027-03-09T16:00:00Z' })],
};

function setup(todayRecord: AttendanceRecord | null, viewAll = false) {
  mockedUseAuth.mockReturnValue({ hasPermission: (p: string) => viewAll && p === 'ATTENDANCE_VIEW_ALL' } as never);
  mockedGet.mockImplementation((url: string) => {
    if (url === '/api/attendance/today') return Promise.resolve({ data: todayRecord });
    if (url === '/api/attendance/me') return Promise.resolve({ data: summary });
    if (url === '/api/attendance') return Promise.resolve({ data: [rec({ fullName: 'Ada Obi' })] });
    return Promise.reject(new Error('unexpected ' + url));
  });
}

describe('AttendancePage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('formats minutes', () => {
    expect(formatMinutes(null)).toBe('—');
    expect(formatMinutes(125)).toBe('2h 05m');
  });

  it('offers clock in when not yet clocked in, and posts on click', async () => {
    setup(null);
    mockedPost.mockResolvedValue({ data: rec() });
    render(<AttendancePage />);

    await userEvent.click(await screen.findByRole('button', { name: /clock in/i }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/attendance/clock-in'));
    expect(screen.getByText('Days present: 2')).toBeInTheDocument();
    expect(screen.getByText('Days late: 1')).toBeInTheDocument();
  });

  it('offers clock out after clocking in', async () => {
    setup(rec());
    mockedPost.mockResolvedValue({ data: rec() });
    render(<AttendancePage />);

    await userEvent.click(await screen.findByRole('button', { name: /clock out/i }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/attendance/clock-out'));
  });

  it('shows day complete once clocked out', async () => {
    setup(rec({ clockOut: '2027-03-10T16:00:00Z', minutesWorked: 480 }));
    render(<AttendancePage />);
    expect(await screen.findByText('Day complete')).toBeInTheDocument();
  });

  it('shows an error when clocking in fails', async () => {
    setup(null);
    mockedPost.mockImplementation(async () => {
      throw new Error('409');
    });
    render(<AttendancePage />);
    await userEvent.click(await screen.findByRole('button', { name: /clock in/i }));
    expect(await screen.findByText(/Could not record attendance/)).toBeInTheDocument();
  });

  it('hides the all-staff tab without permission', async () => {
    setup(null, false);
    render(<AttendancePage />);
    await screen.findByText('Today');
    expect(screen.queryByRole('tab', { name: 'All staff' })).not.toBeInTheDocument();
  });

  it('lets HR view all staff for a date', async () => {
    setup(null, true);
    render(<AttendancePage />);
    await userEvent.click(await screen.findByRole('tab', { name: 'All staff' }));
    expect(await screen.findByText('Ada Obi')).toBeInTheDocument();
  });
});
