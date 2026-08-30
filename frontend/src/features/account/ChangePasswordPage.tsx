import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';

function NotificationPreferencesCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    httpClient
      .get<{ enabled: boolean }>('/api/notifications/preferences')
      .then((res) => setEnabled(res.data.enabled))
      .catch(() => setEnabled(true));
  }, []);

  async function handleToggle(next: boolean) {
    setEnabled(next);
    setSaving(true);
    try {
      await httpClient.put('/api/notifications/preferences', { enabled: next });
    } catch {
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card sx={{ maxWidth: 480 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Notification Preferences
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={enabled ?? true}
              disabled={enabled === null || saving}
              onChange={(e) => handleToggle(e.target.checked)}
            />
          }
          label="Receive in-app notifications"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          When turned off, you won't receive new in-app notifications (leave, appraisal, organization, and HR
          updates). You can turn this back on at any time.
        </Typography>
      </CardContent>
    </Card>
  );
}

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
    <Stack spacing={3}>
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

      <NotificationPreferencesCard />
    </Stack>
  );
}
