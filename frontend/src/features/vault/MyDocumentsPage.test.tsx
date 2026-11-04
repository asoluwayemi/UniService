import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MyDocumentsPage } from './MyDocumentsPage';
import { httpClient } from '../../app/httpClient';
import type { VaultDocument } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn() } }));
const mockedGet = httpClient.get as Mock;

export function vaultDoc(overrides: Partial<VaultDocument> = {}): VaultDocument {
  return {
    id: 1, ownerUsername: 'jdoe', ownerName: 'Jane Doe', category: 'CONTRACT', title: 'Employment contract',
    description: null, filename: 'contract.pdf', contentType: 'application/pdf', sizeBytes: 2048, expiresOn: null,
    daysToExpiry: null, visibleToOwner: true, uploadedBy: 'hr', uploadedAt: '2027-01-01T00:00:00Z', ...overrides,
  };
}

describe('MyDocumentsPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });

  it('lists the staff member\'s documents', async () => {
    mockedGet.mockResolvedValue({ data: [vaultDoc(), vaultDoc({ id: 2, title: 'ID card', category: 'ID_DOCUMENT', daysToExpiry: 12, expiresOn: '2027-03-22' })] });
    render(<MyDocumentsPage />);

    expect(await screen.findByText('Employment contract')).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('12 days left')).toBeInTheDocument();
  });

  it('flags expired documents', async () => {
    mockedGet.mockResolvedValue({ data: [vaultDoc({ daysToExpiry: -3, expiresOn: '2027-01-01' })] });
    render(<MyDocumentsPage />);
    expect(await screen.findByText('Expired')).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    mockedGet.mockResolvedValue({ data: [] });
    render(<MyDocumentsPage />);
    expect(await screen.findByText('No documents on file yet.')).toBeInTheDocument();
  });

  it('downloads through the API with a blob response', async () => {
    mockedGet.mockImplementation((url: string) =>
      url === '/api/vault/me' ? Promise.resolve({ data: [vaultDoc()] }) : Promise.resolve({ data: new Blob(['x']) }),
    );
    render(<MyDocumentsPage />);

    await userEvent.click(await screen.findByRole('button', { name: /Download/ }));

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/api/vault/documents/1/download', { responseType: 'blob' }),
    );
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows an error when loading fails', async () => {
    mockedGet.mockImplementation(async () => {
      throw new Error('500');
    });
    render(<MyDocumentsPage />);
    expect(await screen.findByText('Failed to load your documents.')).toBeInTheDocument();
  });
});
