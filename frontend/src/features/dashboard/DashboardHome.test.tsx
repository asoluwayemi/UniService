import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardHome } from './DashboardHome';
import { useAuth } from '../../app/AuthContext';

vi.mock('../../app/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./AdminDashboardHome', () => ({
  AdminDashboardHome: () => <div>Admin Dashboard</div>,
}));
vi.mock('./AcademicStaffDashboard', () => ({
  AcademicStaffDashboard: () => <div>Academic Dashboard</div>,
}));
vi.mock('./NonAcademicStaffDashboard', () => ({
  NonAcademicStaffDashboard: () => <div>Non-Academic Dashboard</div>,
}));

const mockedUseAuth = vi.mocked(useAuth);

function authValue(overrides: Partial<ReturnType<typeof useAuth>>) {
  return {
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(),
    hasPermission: vi.fn(() => false),
    refreshUser: vi.fn(),
    ...overrides,
  };
}

describe('DashboardHome', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('renders nothing while the user is not yet loaded', () => {
    mockedUseAuth.mockReturnValue(authValue({ user: null }));

    const { container } = render(<DashboardHome />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the admin dashboard for a user with STAFF_READ', () => {
    mockedUseAuth.mockReturnValue(
      authValue({
        user: { id: 1, username: 'admin', email: 'a@x.com', firstName: 'A', lastName: 'B', roles: ['HR_ADMIN'], permissions: ['STAFF_READ'], totpEnabled: false, hrStepUpExpiresAt: null },
        hasPermission: (p: string) => p === 'STAFF_READ',
      }),
    );

    render(<DashboardHome />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders the academic dashboard for an ACADEMIC_STAFF user with no management permissions', () => {
    mockedUseAuth.mockReturnValue(
      authValue({
        user: { id: 2, username: 'jdoe', email: 'j@x.com', firstName: 'Jane', lastName: 'Doe', roles: ['ACADEMIC_STAFF'], permissions: [], totpEnabled: false, hrStepUpExpiresAt: null },
      }),
    );

    render(<DashboardHome />);

    expect(screen.getByText('Academic Dashboard')).toBeInTheDocument();
  });

  it('renders the non-academic dashboard for a NON_ACADEMIC_STAFF user with no management permissions', () => {
    mockedUseAuth.mockReturnValue(
      authValue({
        user: { id: 3, username: 'psupport', email: 'p@x.com', firstName: 'Pat', lastName: 'Support', roles: ['NON_ACADEMIC_STAFF'], permissions: [], totpEnabled: false, hrStepUpExpiresAt: null },
      }),
    );

    render(<DashboardHome />);

    expect(screen.getByText('Non-Academic Dashboard')).toBeInTheDocument();
  });
});
