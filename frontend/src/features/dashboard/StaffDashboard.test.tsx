import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { StaffDashboard } from './StaffDashboard';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../app/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedGet = httpClient.get as Mock;
const mockedUseAuth = vi.mocked(useAuth);

const profile = {
  id: 1,
  userId: 2,
  username: 'jdoe',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jdoe@uniservice.local',
  staffNumber: 'STAFF-0001',
  dateOfBirth: null,
  gender: null,
  phone: null,
  address: null,
  nationality: null,
  category: 'ACADEMIC',
  designation: 'Lecturer',
  orgUnitId: 1,
  orgUnitName: 'Computer Science',
  employmentType: 'FULL_TIME',
  employmentStatus: 'ACTIVE',
  dateOfHire: '2024-01-15',
  contractStartDate: null,
  contractEndDate: null,
  bankName: null,
  bankAccountName: null,
  bankAccountNumber: null,
  qualifications: [],
  employmentHistory: [],
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <StaffDashboard audienceLabel="Academic Staff" />
    </MemoryRouter>,
  );
}

describe('StaffDashboard', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedUseAuth.mockReturnValue({
      user: { id: 2, username: 'jdoe', email: 'jdoe@uniservice.local', firstName: 'Jane', lastName: 'Doe', roles: ['ACADEMIC_STAFF'], permissions: [] },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(() => false),
      hasPermission: vi.fn(() => false),
    });
  });

  it('shows the profile summary when one exists', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/staff/me') return Promise.resolve({ data: profile });
      return Promise.resolve({ data: [] });
    });

    renderDashboard();

    expect(await screen.findByText('STAFF-0001')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText(/Academic Staff/)).toBeInTheDocument();
  });

  it('shows an empty-state message when no profile exists yet', async () => {
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/staff/me') return Promise.reject(new Error('not found'));
      return Promise.resolve({ data: [] });
    });

    renderDashboard();

    expect(await screen.findByText(/hasn't been set up yet/)).toBeInTheDocument();
  });
});
