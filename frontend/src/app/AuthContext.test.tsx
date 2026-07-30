import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { httpClient } from './httpClient';

vi.mock('./httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

function TestConsumer() {
  const { user, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <button onClick={() => login('jdoe', 'pass')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const currentUser = {
  id: 1,
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  roles: ['ACADEMIC_STAFF'],
  permissions: [],
};

describe('AuthProvider', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('hydrates the user from /me on mount when a session already exists', async () => {
    mockedGet.mockResolvedValueOnce({ data: currentUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('jdoe');
  });

  it('sets user to null when no session exists on mount', async () => {
    mockedGet.mockRejectedValueOnce(new Error('401'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('login populates the user after a successful call', async () => {
    mockedGet.mockRejectedValueOnce(new Error('401'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    mockedPost.mockResolvedValueOnce({ data: { accessToken: 'token', tokenType: 'Bearer', username: 'jdoe' } });
    mockedGet.mockResolvedValueOnce({ data: currentUser });

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('jdoe'));
  });

  it('logout clears the user', async () => {
    mockedGet.mockResolvedValueOnce({ data: currentUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('jdoe'));

    mockedPost.mockResolvedValueOnce({ data: undefined });

    await act(async () => {
      screen.getByText('logout').click();
    });

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });
});
