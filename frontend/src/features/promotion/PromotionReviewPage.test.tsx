import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { PromotionReviewPage } from './PromotionReviewPage';
import { httpClient } from '../../app/httpClient';
import type { PromotionSummary } from './types';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;

function summary(overrides: Partial<PromotionSummary> = {}): PromotionSummary {
  return {
    id: 1,
    staffProfileId: 1,
    staffFullName: 'Jane Doe',
    staffNumber: 'STAFF-0001',
    currentGradeLevel: 10,
    requestedGradeLevel: 11,
    status: 'SUBMITTED',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PromotionReviewPage />
    </MemoryRouter>,
  );
}

describe('PromotionReviewPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('splits applications into active and completed sections', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [summary({ id: 1, status: 'SUBMITTED' }), summary({ id: 2, staffFullName: 'John Smith', status: 'GAZETTED' })],
    });

    renderPage();

    expect(await screen.findByText('Active (1)')).toBeInTheDocument();
    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('shows an empty state when there are no applications', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    renderPage();

    expect(await screen.findByText('No active promotion applications.')).toBeInTheDocument();
    expect(screen.getByText('No completed applications yet.')).toBeInTheDocument();
  });
});
