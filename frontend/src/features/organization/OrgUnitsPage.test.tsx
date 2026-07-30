import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { OrgUnitsPage } from './OrgUnitsPage';
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

const flatUnits = [
  { id: 1, name: 'Engineering', code: 'ENG', type: 'FACULTY', parentId: null, headId: null, headName: null, status: 'ACTIVE' },
  { id: 2, name: 'Computer Science', code: 'CS', type: 'DEPARTMENT', parentId: 1, headId: null, headName: null, status: 'ACTIVE' },
];

describe('OrgUnitsPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(() => false),
    });
  });

  it('renders the org hierarchy from a flat list', async () => {
    mockedGet.mockResolvedValueOnce({ data: flatUnits });

    render(<OrgUnitsPage />);

    expect(await screen.findByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
  });

  it('shows an empty state when there are no org units', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    render(<OrgUnitsPage />);

    expect(await screen.findByText('No organization units yet.')).toBeInTheDocument();
  });

  it('shows propose actions only when the user has ORG_WRITE', async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: (permission: string) => permission === 'ORG_WRITE',
    });
    mockedGet.mockResolvedValueOnce({ data: flatUnits });

    render(<OrgUnitsPage />);

    await waitFor(() => expect(screen.getByText('Engineering')).toBeInTheDocument());

    expect(screen.getByLabelText('Propose new college')).toBeInTheDocument();
    expect(screen.getByLabelText('Propose edit to Engineering')).toBeInTheDocument();
  });

  it('hides propose actions when the user lacks ORG_WRITE', async () => {
    mockedGet.mockResolvedValueOnce({ data: flatUnits });

    render(<OrgUnitsPage />);

    await waitFor(() => expect(screen.getByText('Engineering')).toBeInTheDocument());

    expect(screen.queryByLabelText('Propose new college')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Propose edit to Engineering')).not.toBeInTheDocument();
  });
});
