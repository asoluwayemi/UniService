import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { StaffDirectoryPage } from './StaffDirectoryPage';
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

const staff = [
  {
    id: 1,
    staffNumber: 'STAFF-0001',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jdoe@uniservice.local',
    category: 'ACADEMIC',
    designation: 'Lecturer',
    orgUnitId: 1,
    orgUnitName: 'Computer Science',
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <StaffDirectoryPage />
    </MemoryRouter>,
  );
}

describe('StaffDirectoryPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(() => false),
      refreshUser: vi.fn(),
    });
  });

  it('renders the staff list', async () => {
    mockedGet.mockResolvedValueOnce({ data: staff });

    renderPage();

    expect(await screen.findByText('STAFF-0001')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
  });

  it('shows an empty state when there are no staff profiles', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    renderPage();

    expect(await screen.findByText('No staff profiles yet.')).toBeInTheDocument();
  });

  it('shows the "New Staff Profile" action only when the user has STAFF_WRITE', async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: (permission: string) => permission === 'STAFF_WRITE',
      refreshUser: vi.fn(),
    });
    mockedGet.mockResolvedValueOnce({ data: staff });

    renderPage();

    expect(await screen.findByText('New Staff Profile')).toBeInTheDocument();
  });

  it('hides the "New Staff Profile" action when the user lacks STAFF_WRITE', async () => {
    mockedGet.mockResolvedValueOnce({ data: staff });

    renderPage();

    await screen.findByText('STAFF-0001');

    expect(screen.queryByText('New Staff Profile')).not.toBeInTheDocument();
  });
});
