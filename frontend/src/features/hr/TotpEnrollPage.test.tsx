import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { TotpEnrollPage } from './TotpEnrollPage';
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
    <MemoryRouter initialEntries={['/hr/totp/enroll']}>
      <Routes>
        <Route path="/hr/totp/enroll" element={<TotpEnrollPage />} />
        <Route path="/hr" element={<div>HR Portal Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TotpEnrollPage', () => {
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

  it('fetches setup data and renders the QR code', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { secret: 'JBSWY3DPEHPK3PXP', otpAuthUri: 'otpauth://totp/x', qrCodeDataUri: 'data:image/png;base64,abc' },
    });

    renderPage();

    expect(await screen.findByAltText('TOTP QR code')).toBeInTheDocument();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    expect(mockedPost).toHaveBeenCalledWith('/api/auth/totp/setup');
  });

  it('confirms the code and navigates to the HR portal', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { secret: 'JBSWY3DPEHPK3PXP', otpAuthUri: 'otpauth://totp/x', qrCodeDataUri: 'data:image/png;base64,abc' },
    });

    renderPage();
    await screen.findByAltText('TOTP QR code');

    mockedPost.mockResolvedValueOnce({ data: {} });
    await userEvent.type(screen.getByLabelText('6-digit code'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm & Enable' }));

    await waitFor(() => expect(screen.getByText('HR Portal Home')).toBeInTheDocument());
    expect(mockedPost).toHaveBeenCalledWith('/api/auth/totp/confirm', { code: '123456' });
  });
});
