import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';

export function HrStepUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify() {
    setError(null);
    setSubmitting(true);
    try {
      await httpClient.post('/api/hr/step-up/verify', { code });
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
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <Typography variant="h4">HR Portal Verification</Typography>
      <Typography color="text.secondary">
        Enter the current code from your authenticator app to continue into the HR Portal.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        label="6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputProps={{ maxLength: 6, inputMode: 'numeric' }}
        autoFocus
        fullWidth
      />

      <Button variant="contained" disabled={submitting || code.length === 0} onClick={handleVerify}>
        {submitting ? 'Verifying…' : 'Verify'}
      </Button>
    </Stack>
  );
}
