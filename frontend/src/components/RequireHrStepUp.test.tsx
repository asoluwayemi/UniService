import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireHrStepUp } from './RequireHrStepUp';
import { useAuth } from '../app/AuthContext';
import type { CurrentUser } from '../features/auth/types';

vi.mock('../app/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function baseUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: 1,
    username: 'hr',
    email: 'hr@uniservice.local',
    firstName: 'H',
    lastName: 'R',
    roles: ['HR_ADMIN'],
    permissions: ['HR_PORTAL_ACCESS'],
    totpEnabled: false,
    hrStepUpExpiresAt: null,
    ...overrides,
  };
}

function authValue(user: CurrentUser | null) {
  return {
    user,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(),
    hasPermission: vi.fn(() => true),
    refreshUser: vi.fn(),
  };
}

function renderWithRoutes(user: CurrentUser | null) {
  mockedUseAuth.mockReturnValue(authValue(user));
  return render(
    <MemoryRouter initialEntries={['/hr']}>
      <Routes>
        <Route path="/hr/totp/enroll" element={<div>Enroll Page</div>} />
        <Route path="/hr/step-up" element={<div>Step Up Page</div>} />
        <Route
          path="/hr"
          element={
            <RequireHrStepUp>
              <div>HR Portal Content</div>
            </RequireHrStepUp>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireHrStepUp', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('redirects to TOTP enrollment when the user has not enrolled', () => {
    renderWithRoutes(baseUser({ totpEnabled: false }));

    expect(screen.getByText('Enroll Page')).toBeInTheDocument();
  });

  it('redirects to step-up when enrolled but never stepped up', () => {
    renderWithRoutes(baseUser({ totpEnabled: true, hrStepUpExpiresAt: null }));

    expect(screen.getByText('Step Up Page')).toBeInTheDocument();
  });

  it('redirects to step-up when the previous elevation has expired', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    renderWithRoutes(baseUser({ totpEnabled: true, hrStepUpExpiresAt: past }));

    expect(screen.getByText('Step Up Page')).toBeInTheDocument();
  });

  it('renders children when enrolled and currently stepped up', () => {
    const future = new Date(Date.now() + 15 * 60_000).toISOString();
    renderWithRoutes(baseUser({ totpEnabled: true, hrStepUpExpiresAt: future }));

    expect(screen.getByText('HR Portal Content')).toBeInTheDocument();
  });
});
