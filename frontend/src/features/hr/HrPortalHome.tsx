import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';

interface CreateHrUserForm {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const EMPTY_FORM: CreateHrUserForm = { username: '', email: '', password: '', firstName: '', lastName: '' };

export function HrPortalHome() {
  const { user, hasPermission, refreshUser } = useAuth();
  const navigate = useNavigate();
  const canCreateHrUser = hasPermission('HR_USER_MANAGE') || hasPermission('USER_MANAGE');

  const [form, setForm] = useState<CreateHrUserForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exiting, setExiting] = useState(false);

  function updateField(field: keyof CreateHrUserForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleExit() {
    setExiting(true);
    try {
      await httpClient.post('/api/hr/step-up/exit');
      await refreshUser();
      navigate('/dashboard');
    } finally {
      setExiting(false);
    }
  }

  async function handleCreateHrUser() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await httpClient.post('/api/auth/users', { ...form, roleNames: ['HR_STAFF'] });
      setSuccess(`HR account created for ${form.username}.`);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create this account.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4">HR Portal</Typography>
          <Typography color="text.secondary">Verified access — staff records and HR administration.</Typography>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleExit}
          disabled={exiting}
        >
          {exiting ? 'Exiting…' : 'Exit HR Portal'}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <BadgeIcon color="primary" />
                <Typography variant="h6">Staff Directory</Typography>
                <Typography variant="body2" color="text.secondary">
                  View and update staff records.
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/staff')} sx={{ alignSelf: 'flex-start' }}>
                  Open
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <AccountTreeIcon color="primary" />
                <Typography variant="h6">Organization</Typography>
                <Typography variant="body2" color="text.secondary">
                  Browse the college / faculty / department / unit structure.
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/organization')} sx={{ alignSelf: 'flex-start' }}>
                  Open
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {canCreateHrUser && (
        <Card>
          <CardContent>
            <Stack spacing={2} sx={{ maxWidth: 480 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonAddIcon color="primary" />
                <Typography variant="h6">Create HR User</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Creates a new account restricted to HR staff access.
              </Typography>

              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <TextField label="Username" value={form.username} onChange={(e) => updateField('username', e.target.value)} fullWidth />
              <TextField label="Email" value={form.email} onChange={(e) => updateField('email', e.target.value)} fullWidth />
              <TextField
                label="Temporary Password"
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                fullWidth
              />
              <TextField label="First Name" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} fullWidth />
              <TextField label="Last Name" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} fullWidth />

              <Button
                variant="contained"
                disabled={submitting || !form.username || !form.email || !form.password}
                onClick={handleCreateHrUser}
                sx={{ alignSelf: 'flex-start' }}
              >
                {submitting ? 'Creating…' : 'Create Account'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
