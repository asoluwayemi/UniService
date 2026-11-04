import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuditLogPage } from './AuditLogPage';
import { httpClient } from '../../app/httpClient';
import type { AuditPage } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn() } }));
const mockedGet = httpClient.get as Mock;

function page(overrides: Partial<AuditPage> = {}): AuditPage {
  return {
    items: [
      {
        id: 1,
        actor: 'admin',
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: '7',
        detail: 'roles=STAFF',
        createdAt: '2027-01-01T00:00:00Z',
      },
    ],
    page: 0,
    size: 25,
    totalElements: 1,
    totalPages: 1,
    ...overrides,
  };
}

describe('AuditLogPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('renders audit entries', async () => {
    mockedGet.mockResolvedValue({ data: page() });
    render(<AuditLogPage />);

    expect(await screen.findByText('USER_CREATED')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('User #7')).toBeInTheDocument();
    expect(screen.getByText('roles=STAFF')).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    mockedGet.mockResolvedValue({ data: page({ items: [], totalElements: 0, totalPages: 0 }) });
    render(<AuditLogPage />);
    expect(await screen.findByText('No audit entries found.')).toBeInTheDocument();
  });

  it('re-queries with the actor filter', async () => {
    mockedGet.mockResolvedValue({ data: page() });
    render(<AuditLogPage />);
    await screen.findByText('USER_CREATED');

    await userEvent.type(screen.getByLabelText('Actor'), 'bob');

    await waitFor(() =>
      expect(mockedGet).toHaveBeenLastCalledWith(
        '/api/audit',
        expect.objectContaining({ params: expect.objectContaining({ actor: 'bob', page: 0 }) }),
      ),
    );
  });

  it('shows an error when loading fails', async () => {
    mockedGet.mockImplementation(async () => {
      throw new Error('boom');
    });
    render(<AuditLogPage />);
    expect(await screen.findByText('Failed to load the audit log.')).toBeInTheDocument();
  });
});
