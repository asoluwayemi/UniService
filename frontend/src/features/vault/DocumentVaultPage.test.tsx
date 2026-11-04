import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { DocumentVaultPage } from './DocumentVaultPage';
import { httpClient } from '../../app/httpClient';
import type { VaultDocument } from './types';

vi.mock('../../app/httpClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;
const mockedDelete = httpClient.delete as Mock;

function doc(overrides: Partial<VaultDocument> = {}): VaultDocument {
  return {
    id: 1, ownerUsername: 'jdoe', ownerName: 'Jane Doe', category: 'CONTRACT', title: 'Employment contract',
    description: null, filename: 'contract.pdf', contentType: 'application/pdf', sizeBytes: 2048, expiresOn: null,
    daysToExpiry: null, visibleToOwner: false, uploadedBy: 'hr', uploadedAt: '2027-01-01T00:00:00Z', ...overrides,
  };
}

const lookup = { userId: 2, username: 'jdoe', fullName: 'Jane Doe', email: 'jdoe@uni.edu' };

function setup() {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/api/vault/lookup') return Promise.resolve({ data: lookup });
    if (url === '/api/vault/staff/2') return Promise.resolve({ data: [doc()] });
    if (url === '/api/vault/expiring') return Promise.resolve({ data: [doc({ id: 7, title: 'Passport', daysToExpiry: 9, expiresOn: '2027-03-19' })] });
    return Promise.reject(new Error('unexpected ' + url));
  });
}

async function findStaff() {
  await userEvent.type(screen.getByLabelText('Staff email'), 'jdoe@uni.edu');
  await userEvent.click(screen.getByRole('button', { name: 'Find' }));
  await screen.findByText('Employment contract');
}

describe('DocumentVaultPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedDelete.mockReset();
  });

  it('finds a staff member by email and lists their records, marking HR-only ones', async () => {
    setup();
    render(<DocumentVaultPage />);
    await findStaff();

    expect(screen.getByText('HR only')).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith('/api/vault/lookup', { params: { email: 'jdoe@uni.edu' } });
  });

  it('reports an unknown email', async () => {
    mockedGet.mockImplementation(async () => {
      throw new Error('404');
    });
    render(<DocumentVaultPage />);
    await userEvent.type(screen.getByLabelText('Staff email'), 'nobody@uni.edu');
    await userEvent.click(screen.getByRole('button', { name: 'Find' }));
    expect(await screen.findByText('No staff account was found with that email.')).toBeInTheDocument();
  });

  it('uploads a document as multipart form data', async () => {
    setup();
    mockedPost.mockResolvedValue({ data: doc() });
    render(<DocumentVaultPage />);
    await findStaff();

    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }));
    const dialog = await screen.findByRole('dialog');
    const upload = within(dialog).getByRole('button', { name: 'Upload' });
    expect(upload).toBeDisabled();

    await userEvent.upload(within(dialog).getByLabelText('File'), new File(['x'], 'letter.pdf', { type: 'application/pdf' }));
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Appointment letter');
    await userEvent.click(upload);

    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    const [url, body] = mockedPost.mock.calls[0] as [string, FormData];
    expect(url).toBe('/api/vault/staff/2');
    expect(body.get('title')).toBe('Appointment letter');
    expect(body.get('category')).toBe('CONTRACT');
    expect(body.get('visibleToOwner')).toBe('true');
    expect((body.get('file') as File).name).toBe('letter.pdf');
  });

  it('deletes only after confirmation', async () => {
    setup();
    mockedDelete.mockResolvedValue({});
    render(<DocumentVaultPage />);
    await findStaff();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(mockedDelete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('/api/vault/documents/1'));
  });

  it('shows documents expiring soon', async () => {
    setup();
    render(<DocumentVaultPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Expiring soon' }));
    expect(await screen.findByText('Passport')).toBeInTheDocument();
    expect(screen.getByText('9 days left')).toBeInTheDocument();
  });

  it('shows an error when upload is rejected', async () => {
    setup();
    mockedPost.mockImplementation(async () => {
      throw new Error('400');
    });
    render(<DocumentVaultPage />);
    await findStaff();
    await userEvent.click(screen.getByRole('button', { name: 'Upload document' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.upload(within(dialog).getByLabelText('File'), new File(['x'], 'a.pdf', { type: 'application/pdf' }));
    await userEvent.type(within(dialog).getByLabelText('Title'), 'T');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText(/Upload failed/)).toBeInTheDocument();
  });
});
