import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import type { TotpSetupResponse } from './types';

export function TotpEnrollPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    httpClient
      .post<TotpSetupResponse>('/api/auth/totp/setup')
      .then((res) => setSetup(res.data))
      .catch(() => setError('Could not start authenticator app enrollment.'));
  }, []);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await httpClient.post('/api/auth/totp/confirm', { code });
      await refreshUser();
      const from = (location.state as { from?: Location })?.from;
      navigate(from ? `${from.pathname}${from.search ?? ''}` : '/hr', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid code. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!setup && !error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Typography variant="h4">Set Up Authenticator App</Typography>
      <Typography color="text.secondary">
        The HR Portal requires a second verification step. Scan this QR code with an authenticator app (Google
        Authenticator, Authy, etc.), then enter the 6-digit code it shows you.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {setup && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2} alignItems="center">
            <Box component="img" src={setup.qrCodeDataUri} alt="TOTP QR code" sx={{ width: 200, height: 200 }} />
            <Typography variant="caption" color="text.secondary">
              Can't scan? Enter this key manually:
            </Typography>
            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
              {setup.secret}
            </Typography>
          </Stack>
        </Paper>
      )}

      <TextField
        label="6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputProps={{ maxLength: 6, inputMode: 'numeric' }}
        fullWidth
      />

      <Button variant="contained" disabled={submitting || code.length === 0} onClick={handleConfirm}>
        {submitting ? 'Verifying…' : 'Confirm & Enable'}
      </Button>
    </Stack>
  );
}
