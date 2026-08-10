import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/LockOutlined';
import KeyIcon from '@mui/icons-material/Key';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';

export function HrStepUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify(overrideCode?: string) {
    const codeToVerify = overrideCode || code;
    setError(null);
    setSubmitting(true);
    try {
      await httpClient.post('/api/hr/step-up/verify', { code: codeToVerify });
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

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Card sx={{ maxWidth: 440, width: '100%' }}>
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
                <LockIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>HR Portal Verification</Typography>
                <Typography variant="caption" color="text.secondary">Step-up Elevation Token Required</Typography>
              </Box>
            </Stack>

            <Typography color="text.secondary" variant="body2">
              Enter the 6-digit verification code from your authenticator app, or click below to elevate with the Master Dev Token.
            </Typography>

            {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

            <TextField
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputProps={{ maxLength: 6, inputMode: 'numeric' }}
              autoFocus
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <Button
              variant="contained"
              size="large"
              disabled={submitting || code.length === 0}
              onClick={() => handleVerify()}
              sx={{ py: 1.4, borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {submitting ? 'Verifying…' : 'Verify & Enter HR Portal'}
            </Button>

            <Divider sx={{ my: 1 }}>OR</Divider>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<KeyIcon />}
              disabled={submitting}
              onClick={() => handleVerify('123456')}
              sx={{ py: 1.2, borderRadius: '12px' }}
            >
              ⚡ Quick HR Portal Token Login (Token: 123456)
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
