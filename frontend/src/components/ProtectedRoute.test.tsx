import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../app/AuthContext';

vi.mock('../app/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderWithRoute(initialPath: string, requiredRole?: string, requiredPermission?: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole={requiredRole} requiredPermission={requiredPermission}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const baseUser = {
  id: 1,
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  roles: ['ACADEMIC_STAFF'],
  permissions: [] as string[],
  totpEnabled: false,
  hrStepUpExpiresAt: null,
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('shows a loading indicator while auth state is loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithRoute('/protected');

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithRoute('/protected');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: (role: string) => role === 'ACADEMIC_STAFF',
      hasPermission: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithRoute('/protected');

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /dashboard when authenticated but missing the required role', () => {
    mockedUseAuth.mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: () => false,
      hasPermission: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithRoute('/protected', 'SYSTEM_ADMIN');

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders children when authenticated with the required permission', () => {
    mockedUseAuth.mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: (permission: string) => permission === 'ORG_READ',
      refreshUser: vi.fn(),
    });

    renderWithRoute('/protected', undefined, 'ORG_READ');

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /dashboard when authenticated but missing the required permission', () => {
    mockedUseAuth.mockReturnValue({
      user: baseUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: () => false,
      refreshUser: vi.fn(),
    });

    renderWithRoute('/protected', undefined, 'ORG_WRITE');

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
