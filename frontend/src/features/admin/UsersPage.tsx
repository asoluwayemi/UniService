import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { httpClient } from '../../app/httpClient';
import type { UserSummary } from '../auth/types';
import { useAuth } from '../../app/AuthContext';

const ALL_ROLES = [
  { value: 'SYSTEM_ADMIN',      label: 'System Admin' },
  { value: 'HR_ADMIN',          label: 'HR Admin' },
  { value: 'HOD_DEAN',          label: 'HOD / Dean' },
  { value: 'ACADEMIC_STAFF',    label: 'Academic Staff' },
  { value: 'NON_ACADEMIC_STAFF',label: 'Non-Academic Staff' },
  { value: 'FINANCE_OFFICER',   label: 'Finance Officer' },
  { value: 'AUDITOR',           label: 'Auditor' },
  { value: 'STAFF',             label: 'Staff' },
  { value: 'HR_STAFF',          label: 'HR Staff' },
];

export function UsersPage() {
  const { hasRole } = useAuth();
  const isSystemAdmin = hasRole('SYSTEM_ADMIN');

  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(() => {
    httpClient
      .get<UserSummary[]>('/api/auth/users')
      .then((response) => setUsers(response.data))
      .catch(() => setError('Could not load users.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleEnabled = async (user: UserSummary) => {
    setTogglingId(user.id);
    try {
      await httpClient.patch(`/api/auth/users/${user.id}/enable?enabled=${!user.enabled}`);
      load();
    } catch {
      setError('Could not update account status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4">Staff Accounts</Typography>
          <Typography color="text.secondary">
            Manage system user accounts. Create new accounts and control access.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setRegistrationOpen(true)}
        >
          Register Staff User
        </Button>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {!users && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {users && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell align="center">Status</TableCell>
                {isSystemAdmin && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {u.username}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(u.roles ?? []).map((role) => (
                        <Chip key={role} label={role} size="small" color="primary" variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={u.enabled ? 'Active' : 'Disabled'}
                      size="small"
                      color={u.enabled ? 'success' : 'default'}
                    />
                  </TableCell>
                  {isSystemAdmin && (
                    <TableCell align="center">
                      <Tooltip title={u.enabled ? 'Disable account' : 'Enable account'}>
                        <Switch
                          checked={u.enabled}
                          disabled={togglingId === u.id}
                          onChange={() => toggleEnabled(u)}
                          size="small"
                          color="success"
                        />
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RegisterStaffDialog
        open={registrationOpen}
        isSystemAdmin={isSystemAdmin}
        onClose={() => setRegistrationOpen(false)}
        onCreated={() => { setRegistrationOpen(false); load(); }}
      />
    </Stack>
  );
}

function RegisterStaffDialog({
  open, onClose, onCreated, isSystemAdmin,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  isSystemAdmin: boolean;
}) {
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [password, setPassword]     = useState('');
  const [roleName, setRoleName]     = useState('STAFF');
  const [error, setError]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  // Auto-generate username from email when email changes
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (!username) {
      setUsername(value.split('@')[0]);
    }
  };

  const reset = () => {
    setUsername(''); setEmail(''); setFirstName('');
    setLastName(''); setPassword(''); setRoleName('STAFF'); setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      await httpClient.post('/api/auth/users', {
        username, email, firstName, lastName, password,
        roleNames: [roleName],
      });
      reset();
      onCreated();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } }).response?.data?.message
          ?? 'Could not register this staff user.',
      );
    } finally {
      setSaving(false);
    }
  };

  const availableRoles = isSystemAdmin ? ALL_ROLES : ALL_ROLES.filter(
    (r) => ['STAFF', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'HR_STAFF'].includes(r.value),
  );

  const isValid = username && email && firstName && lastName && password.length >= 8;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Register Staff User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" spacing={2}>
            <TextField
              label="First name" value={firstName} fullWidth required
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              label="Last name" value={lastName} fullWidth required
              onChange={(e) => setLastName(e.target.value)}
            />
          </Stack>
          <TextField
            label="Email" type="email" value={email} fullWidth required
            onChange={(e) => handleEmailChange(e.target.value)}
          />
          <TextField
            label="Username" value={username} fullWidth required
            helperText="Auto-generated from email — you can edit it"
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Temporary password" type="password" value={password} fullWidth required
            helperText="At least 8 characters"
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            select label="Initial role" value={roleName} fullWidth
            onChange={(e) => setRoleName(e.target.value)}
          >
            {availableRoles.map((r) => (
              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={create} disabled={saving || !isValid}>
          {saving ? 'Registering…' : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
