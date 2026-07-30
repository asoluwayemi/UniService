import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { NotificationBell } from './NotificationBell';
import { httpClient } from '../app/httpClient';

vi.mock('../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('shows the unread count badge', async () => {
    mockedGet.mockResolvedValueOnce({ data: { count: 3 } });

    renderBell();

    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('lists notifications and marks one read on click', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { count: 1 } })
      .mockResolvedValueOnce({
        data: [{ id: 1, message: 'New org change request', link: '/organization/approvals', read: false, createdAt: '2026-07-30T00:00:00Z' }],
      })
      .mockResolvedValueOnce({ data: { count: 0 } });
    mockedPost.mockResolvedValueOnce({ data: undefined });

    renderBell();

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button'));

    const item = await screen.findByText('New org change request');
    await userEvent.click(item);

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/api/notifications/1/read'));
  });
});
