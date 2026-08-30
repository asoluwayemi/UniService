import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';

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
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                <QrCode2Icon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Set Up Authenticator App</Typography>
                <Typography variant="caption" color="text.secondary">HR Portal Multi-Factor Security</Typography>
              </Box>
            </Stack>

            <Typography color="text.secondary" variant="body2">
              Scan this QR code with an authenticator app (Google Authenticator, Authy), then enter the 6-digit code it generates.
            </Typography>

            {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

            {setup && (
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Stack spacing={2} alignItems="center">
                  <Box component="img" src={setup.qrCodeDataUri} alt="TOTP QR code" sx={{ width: 180, height: 180, borderRadius: '8px' }} />
                  <Typography variant="caption" color="text.secondary">
                    Manual key:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all', bgcolor: '#f1f5f9', p: 1, borderRadius: '8px' }}>
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <Button
              variant="contained"
              size="large"
              disabled={submitting || code.length !== 6}
              onClick={() => handleConfirm()}
              sx={{ py: 1.4, borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {submitting ? 'Verifying…' : 'Confirm & Enable'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
