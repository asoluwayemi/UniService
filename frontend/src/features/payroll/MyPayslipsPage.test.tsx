import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MyPayslipsPage } from './MyPayslipsPage';
import { httpClient } from '../../app/httpClient';
import type { Payslip } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn() } }));
const mockedGet = httpClient.get as Mock;

const slip: Payslip = {
  id: 1, period: '2027-03', staffNumber: 'S1', fullName: 'Ada Doe', gradeLevel: 10,
  basic: 100000, housing: 25000, transport: 15000, gross: 140000, pension: 8000, tax: 9800, net: 122200,
  bankName: 'GTBank', accountLast4: '6789',
};

describe('MyPayslipsPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('shows a published payslip breakdown', async () => {
    mockedGet.mockResolvedValue({ data: [slip] });
    render(<MyPayslipsPage />);

    expect(await screen.findByText('2027-03')).toBeInTheDocument();
    expect(screen.getByText('Gross pay')).toBeInTheDocument();
    expect(screen.getAllByText(/122,200\.00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/GTBank ····6789/)).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    mockedGet.mockResolvedValue({ data: [] });
    render(<MyPayslipsPage />);
    expect(await screen.findByText('No payslips published yet.')).toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    mockedGet.mockImplementation(async () => {
      throw new Error('500');
    });
    render(<MyPayslipsPage />);
    expect(await screen.findByText('Failed to load your payslips.')).toBeInTheDocument();
  });
});
