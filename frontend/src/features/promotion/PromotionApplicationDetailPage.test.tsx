import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { PromotionApplicationDetailPage } from './PromotionApplicationDetailPage';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import type { PromotionApplication } from './types';

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
const mockedPost = httpClient.post as Mock;
const mockedUseAuth = vi.mocked(useAuth);

function baseApplication(overrides: Partial<PromotionApplication> = {}): PromotionApplication {
  return {
    id: 1,
    staffProfileId: 1,
    staffFullName: 'Jane Doe',
    staffNumber: 'STAFF-0001',
    currentGradeLevel: 10,
    requestedGradeLevel: 11,
    eligibilityDate: '2026-01-01',
    status: 'SUBMITTED',
    staffStatement: null,
    reviewerComment: null,
    reviewedByUsername: null,
    reviewedAt: null,
    examScheduledDate: null,
    interviewScheduledDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/promotions/1']}>
      <Routes>
        <Route path="/promotions/:id" element={<PromotionApplicationDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function authWithPermission(hasIt: boolean) {
  mockedUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(() => false),
    hasPermission: (permission: string) => hasIt && permission === 'PROMOTION_MANAGE',
    refreshUser: vi.fn(),
  });
}

describe('PromotionApplicationDetailPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('shows application details for a reviewer', async () => {
    authWithPermission(true);
    mockedGet.mockResolvedValueOnce({ data: baseApplication() });

    renderPage();

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('STAFF-0001')).toBeInTheDocument();
  });

  it('shows reviewer actions appropriate to SUBMITTED status', async () => {
    authWithPermission(true);
    mockedGet.mockResolvedValueOnce({ data: baseApplication({ status: 'SUBMITTED' }) });

    renderPage();

    await screen.findByText('Jane Doe');
    expect(screen.getByRole('button', { name: 'Verify Documents' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request More Documents' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject Application' })).toBeInTheDocument();
  });

  it('hides reviewer actions for a viewer without PROMOTION_MANAGE', async () => {
    authWithPermission(false);
    mockedGet.mockResolvedValueOnce({ data: baseApplication({ status: 'SUBMITTED' }) });

    renderPage();

    await screen.findByText('Jane Doe');
    expect(screen.queryByRole('button', { name: 'Verify Documents' })).not.toBeInTheDocument();
  });

  it('submits verify-documents and reloads', async () => {
    authWithPermission(true);
    mockedGet
      .mockResolvedValueOnce({ data: baseApplication({ status: 'SUBMITTED' }) })
      .mockResolvedValueOnce({ data: baseApplication({ status: 'DOCUMENTS_VERIFIED' }) });
    mockedPost.mockResolvedValueOnce({ data: baseApplication({ status: 'DOCUMENTS_VERIFIED' }) });

    renderPage();

    await screen.findByText('Jane Doe');
    await userEvent.click(screen.getByRole('button', { name: 'Verify Documents' }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/promotions/1/verify-documents', { comment: '' }),
    );
  });

  it('requires a comment before submitting a reject action', async () => {
    authWithPermission(true);
    mockedGet.mockResolvedValueOnce({ data: baseApplication({ status: 'SUBMITTED' }) });

    renderPage();

    await screen.findByText('Jane Doe');
    await userEvent.click(screen.getByRole('button', { name: 'Reject Application' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Submit' })).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText(/Comment/), 'Not eligible');
    expect(within(dialog).getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  it('requires a date before submitting schedule-exam', async () => {
    authWithPermission(true);
    mockedGet.mockResolvedValueOnce({ data: baseApplication({ status: 'DOCUMENTS_VERIFIED' }) });

    renderPage();

    await screen.findByText('Jane Doe');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule Exam' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('shows no action panel for a terminal GAZETTED application', async () => {
    authWithPermission(true);
    mockedGet.mockResolvedValueOnce({ data: baseApplication({ status: 'GAZETTED' }) });

    renderPage();

    await screen.findByText('Jane Doe');
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });
});
