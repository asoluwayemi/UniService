import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '../../../app/AuthContext';

vi.mock('../../../app/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('LoginPage', () => {
  const login = vi.fn();

  beforeEach(() => {
    login.mockReset();
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login,
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );
  }

  it('renders the login form', () => {
    renderPage();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls login with the entered credentials on submit', async () => {
    login.mockResolvedValueOnce(undefined);
    renderPage();

    await userEvent.type(screen.getByLabelText(/username/i), 'jdoe');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('jdoe', 'password123'));
  });

  it('shows an error message when login fails', async () => {
    login.mockRejectedValueOnce(new Error('bad credentials'));
    renderPage();

    await userEvent.type(screen.getByLabelText(/username/i), 'jdoe');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
  });
});
