import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AdminDashboardHome } from './AdminDashboardHome';
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
  { id: 1, staffNumber: 'STAFF-0001', firstName: 'A', lastName: 'B', email: 'a@x.com', category: 'ACADEMIC', designation: null, orgUnitId: null, orgUnitName: null, employmentType: 'FULL_TIME', employmentStatus: 'ACTIVE' },
  { id: 2, staffNumber: 'STAFF-0002', firstName: 'C', lastName: 'D', email: 'c@x.com', category: 'NON_ACADEMIC', designation: null, orgUnitId: null, orgUnitName: null, employmentType: 'FULL_TIME', employmentStatus: 'ACTIVE' },
];
const orgUnits = [
  { id: 0, name: 'College of Science and Engineering', code: 'CSE', type: 'COLLEGE', parentId: null, headId: null, headName: null, status: 'ACTIVE' },
  { id: 1, name: 'Engineering', code: 'ENG', type: 'FACULTY', parentId: 0, headId: null, headName: null, status: 'ACTIVE' },
  { id: 2, name: 'Old Faculty', code: 'OLD', type: 'FACULTY', parentId: 0, headId: null, headName: null, status: 'ARCHIVED' },
  { id: 3, name: 'Computer Science', code: 'CS', type: 'DEPARTMENT', parentId: 1, headId: null, headName: null, status: 'ACTIVE' },
  { id: 4, name: 'Networking Lab', code: 'NETLAB', type: 'UNIT', parentId: 3, headId: null, headName: null, status: 'ACTIVE' },
];

function mockEndpoints(overrides: Partial<Record<string, unknown>> = {}) {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/api/staff') return Promise.resolve({ data: overrides.staff ?? staff });
    if (url === '/api/org/units') return Promise.resolve({ data: overrides.orgUnits ?? orgUnits });
    if (url === '/api/org/change-requests/pending') return Promise.resolve({ data: overrides.pending ?? [] });
    if (url === '/api/auth/users') return Promise.resolve({ data: overrides.users ?? [] });
    if (url === '/api/notifications') return Promise.resolve({ data: overrides.notifications ?? [] });
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminDashboardHome />
    </MemoryRouter>,
  );
}

function authValue(overrides: Partial<ReturnType<typeof useAuth>>) {
  return {
    user: { id: 1, username: 'admin', email: 'admin@uniservice.local', firstName: 'System', lastName: 'Admin', roles: ['SYSTEM_ADMIN'], permissions: ['STAFF_READ', 'ORG_READ', 'ORG_WRITE', 'USER_MANAGE'], totpEnabled: false, hrStepUpExpiresAt: null },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(() => false),
    hasPermission: vi.fn(() => false),
    refreshUser: vi.fn(),
    ...overrides,
  };
}

describe('AdminDashboardHome', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedUseAuth.mockReset();
  });

  it('shows all stat cards and counts for a SYSTEM_ADMIN', async () => {
    mockEndpoints();
    mockedUseAuth.mockReturnValue(
      authValue({
        user: {
          id: 1, username: 'admin', email: 'admin@uniservice.local', firstName: 'System', lastName: 'Admin',
          roles: ['SYSTEM_ADMIN'], permissions: ['STAFF_READ', 'ORG_READ', 'ORG_WRITE', 'USER_MANAGE', 'HR_PORTAL_ACCESS'],
          totpEnabled: true, hrStepUpExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        },
        hasRole: (r: string) => r === 'SYSTEM_ADMIN',
        hasPermission: () => true,
      }),
    );

    renderPage();

    expect(await screen.findByText('Total Staff')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(await screen.findByText('1 academic · 1 non-academic')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Organization' })).toBeInTheDocument();

    const collegesCard = screen.getByText('Colleges').closest('button') as HTMLElement;
    expect(within(collegesCard).getByText('1')).toBeInTheDocument();

    const facultiesCard = screen.getByText('Faculties').closest('button') as HTMLElement;
    expect(within(facultiesCard).getByText('1')).toBeInTheDocument();

    const departmentsCard = screen.getByText('Departments').closest('button') as HTMLElement;
    expect(within(departmentsCard).getByText('1')).toBeInTheDocument();

    const unitsCard = screen.getByText('Units').closest('button') as HTMLElement;
    expect(within(unitsCard).getByText('1')).toBeInTheDocument();

    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('System Users')).toBeInTheDocument();
  });

  it('shows independent counts per org unit type', async () => {
    mockEndpoints({
      orgUnits: [
        { id: 1, name: 'College A', code: 'CA', type: 'COLLEGE', parentId: null, headId: null, headName: null, status: 'ACTIVE' },
        { id: 2, name: 'College B', code: 'CB', type: 'COLLEGE', parentId: null, headId: null, headName: null, status: 'ACTIVE' },
        { id: 3, name: 'Engineering', code: 'ENG', type: 'FACULTY', parentId: 1, headId: null, headName: null, status: 'ACTIVE' },
        { id: 4, name: 'Science', code: 'SCI', type: 'FACULTY', parentId: 1, headId: null, headName: null, status: 'ACTIVE' },
        { id: 5, name: 'Arts', code: 'ART', type: 'FACULTY', parentId: 2, headId: null, headName: null, status: 'ACTIVE' },
        { id: 6, name: 'Computer Science', code: 'CS', type: 'DEPARTMENT', parentId: 3, headId: null, headName: null, status: 'ACTIVE' },
      ],
    });
    mockedUseAuth.mockReturnValue(
      authValue({
        user: {
          id: 1, username: 'admin', email: 'admin@uniservice.local', firstName: 'System', lastName: 'Admin',
          roles: ['SYSTEM_ADMIN'], permissions: ['STAFF_READ', 'ORG_READ', 'ORG_WRITE', 'USER_MANAGE', 'HR_PORTAL_ACCESS'],
          totpEnabled: true, hrStepUpExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        },
        hasRole: (r: string) => r === 'SYSTEM_ADMIN',
        hasPermission: () => true,
      }),
    );

    renderPage();

    const collegesCard = (await screen.findByText('Colleges')).closest('button') as HTMLElement;
    expect(within(collegesCard).getByText('2')).toBeInTheDocument();

    const facultiesCard = screen.getByText('Faculties').closest('button') as HTMLElement;
    expect(within(facultiesCard).getByText('3')).toBeInTheDocument();

    const departmentsCard = screen.getByText('Departments').closest('button') as HTMLElement;
    expect(within(departmentsCard).getByText('1')).toBeInTheDocument();

    const unitsCard = screen.getByText('Units').closest('button') as HTMLElement;
    expect(within(unitsCard).getByText('0')).toBeInTheDocument();
  });

  it('only shows the staff card for a role with just STAFF_READ', async () => {
    mockEndpoints();
    mockedUseAuth.mockReturnValue(
      authValue({
        user: { id: 4, username: 'finance', email: 'f@x.com', firstName: 'Finn', lastName: 'Ance', roles: ['FINANCE_OFFICER'], permissions: ['STAFF_READ'], totpEnabled: false, hrStepUpExpiresAt: null },
        hasRole: () => false,
        hasPermission: (p: string) => p === 'STAFF_READ',
      }),
    );

    renderPage();

    expect(await screen.findByText('Total Staff')).toBeInTheDocument();
    expect(screen.queryByText('Organization')).not.toBeInTheDocument();
    expect(screen.queryByText('Colleges')).not.toBeInTheDocument();
    expect(screen.queryByText('Pending Approvals')).not.toBeInTheDocument();
    expect(screen.queryByText('System Users')).not.toBeInTheDocument();
  });

  it('hides HR-portal-tier cards and quick actions until HR step-up is complete', async () => {
    mockEndpoints();
    mockedUseAuth.mockReturnValue(
      authValue({
        user: {
          id: 5, username: 'hrhead', email: 'hrhead@uniservice.local', firstName: 'HR', lastName: 'Head',
          roles: ['HR_ADMIN'], permissions: ['STAFF_READ', 'ORG_READ', 'ORG_WRITE', 'HR_PORTAL_ACCESS'],
          totpEnabled: true, hrStepUpExpiresAt: null,
        },
        hasRole: () => false,
        hasPermission: (p: string) => ['STAFF_READ', 'ORG_READ', 'ORG_WRITE', 'HR_PORTAL_ACCESS'].includes(p),
      }),
    );

    renderPage();

    await screen.findByText('Welcome back, HR');
    expect(screen.queryByText('Total Staff')).not.toBeInTheDocument();
    expect(screen.queryByText('Organization')).not.toBeInTheDocument();
    expect(screen.queryByText('Staff Directory')).not.toBeInTheDocument();
  });
});
