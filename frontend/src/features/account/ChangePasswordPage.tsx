import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await httpClient.post('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setError('Could not change password. Check your current password and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card sx={{ maxWidth: 480 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Change Password
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">Password updated successfully.</Alert>}
            <TextField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Updating…' : 'Update Password'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
