import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AnalyticsPage } from './AnalyticsPage';
import { httpClient } from '../../app/httpClient';
import type { AnalyticsData } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn() } }));
const mockedGet = httpClient.get as Mock;

function data(overrides: Partial<AnalyticsData> = {}): AnalyticsData {
  return {
    generatedAt: '2027-03-10T12:00:00Z',
    staff: {
      total: 42, active: 40,
      byCategory: [{ label: 'ACADEMIC', value: 25 }, { label: 'NON_ACADEMIC', value: 17 }],
      byStatus: [{ label: 'ACTIVE', value: 40 }, { label: 'ON_LEAVE', value: 0 }, { label: 'SEPARATED', value: 2 }],
      byDepartment: [{ label: 'Physics', value: 9 }, { label: 'Unassigned', value: 3 }],
    },
    leave: { pending: 4, byStatus: [{ label: 'PENDING', value: 4 }, { label: 'APPROVED', value: 10 }] },
    recruitment: null, payroll: null, attendance: null, expiringDocuments: null, onboardingInProgress: null,
    ...overrides,
  };
}

const days = Array.from({ length: 14 }, (_, i) => ({ date: `2027-03-${String(i + 1).padStart(2, '0')}`, present: i, late: 0 }));

describe('AnalyticsPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('shows headline tiles and breakdowns for a basic viewer, and nothing sensitive', async () => {
    mockedGet.mockResolvedValue({ data: data() });
    render(<AnalyticsPage />);

    expect(await screen.findByText('Headcount by department')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('40 active')).toBeInTheDocument();
    expect(screen.getByText('Pending leave')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Physics: 9' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Non academic: 17' })).toBeInTheDocument();
    expect(screen.queryByText('Recruitment pipeline')).not.toBeInTheDocument();
    expect(screen.queryByText(/Net payroll/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Attendance, last 14 days/)).not.toBeInTheDocument();
  });

  it('shows the permission-gated sections when the API includes them', async () => {
    mockedGet.mockResolvedValue({
      data: data({
        recruitment: { openPostings: 3, pipeline: [{ label: 'APPLIED', value: 12 }, { label: 'HIRED', value: 1 }] },
        payroll: { history: [{ period: '2027-02', totalGross: 500000, totalNet: 400000, staffCount: 40 }] },
        attendance: { activeStaff: 40, presentToday: 36, lateToday: 5, last14Days: days },
        expiringDocuments: { value: 7 },
        onboardingInProgress: { value: 2 },
      }),
    });
    render(<AnalyticsPage />);

    expect(await screen.findByText('Recruitment pipeline')).toBeInTheDocument();
    expect(screen.getByText('Open vacancies')).toBeInTheDocument();
    expect(screen.getByText('90% of active · 5 late')).toBeInTheDocument();
    expect(screen.getByText('Documents expiring')).toBeInTheDocument();
    expect(screen.getByText('Net pay 2027-02')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Staff present per day over the last 14 days' })).toBeInTheDocument();
    expect(screen.getAllByTestId('column').length).toBe(15);
  });

  it('switches a chart to an accessible table', async () => {
    mockedGet.mockResolvedValue({ data: data() });
    render(<AnalyticsPage />);

    const card = (await screen.findByText('Employment status')).closest('.MuiCard-root') as HTMLElement;
    await userEvent.click(within(card).getByRole('button', { name: 'View table' }));

    expect(within(card).getByRole('table')).toBeInTheDocument();
    expect(within(card).getByRole('cell', { name: 'Separated' })).toBeInTheDocument();
    await userEvent.click(within(card).getByRole('button', { name: 'View chart' }));
    expect(within(card).queryByRole('table')).not.toBeInTheDocument();
  });

  it('says so when a breakdown has no data', async () => {
    mockedGet.mockResolvedValue({ data: data({ leave: { pending: 0, byStatus: [{ label: 'PENDING', value: 0 }] } }) });
    render(<AnalyticsPage />);
    expect(await screen.findByText('No leave requests yet.')).toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    mockedGet.mockImplementation(async () => {
      throw new Error('500');
    });
    render(<AnalyticsPage />);
    expect(await screen.findByText('Failed to load analytics.')).toBeInTheDocument();
  });
});
