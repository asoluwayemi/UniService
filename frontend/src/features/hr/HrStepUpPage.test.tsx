import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { HrStepUpPage } from './HrStepUpPage';
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

const mockedPost = httpClient.post as Mock;
const mockedUseAuth = vi.mocked(useAuth);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/hr/step-up']}>
      <Routes>
        <Route path="/hr/step-up" element={<HrStepUpPage />} />
        <Route path="/hr" element={<div>HR Portal Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HrStepUpPage', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('shows an error when the code is rejected', async () => {
    mockedPost.mockRejectedValueOnce({ response: { data: { message: 'Invalid code' } } });

    renderPage();
    await userEvent.type(screen.getByLabelText('6-digit code'), '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByText('Invalid code')).toBeInTheDocument();
  });

  it('verifies the code and navigates to the HR portal', async () => {
    mockedPost.mockResolvedValueOnce({ data: { hrStepUpExpiresAt: new Date().toISOString() } });

    renderPage();
    await userEvent.type(screen.getByLabelText('6-digit code'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => expect(screen.getByText('HR Portal Home')).toBeInTheDocument());
    expect(mockedPost).toHaveBeenCalledWith('/api/hr/step-up/verify', { code: '123456' });
  });
});
