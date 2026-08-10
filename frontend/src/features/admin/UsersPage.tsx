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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { UserSummary } from '../auth/types';

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [registrationOpen, setRegistrationOpen] = useState(false);
  const load = useCallback(() => {
    httpClient
      .get<UserSummary[]>('/api/auth/users')
      .then((response) => setUsers(response.data))
      .catch(() => setError('Could not load users.'));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box><Typography variant="h4">Staff Registration</Typography><Typography color="text.secondary">Create a staff login here, then add their employment profile in the Staff Directory.</Typography></Box>
        <Button variant="contained" onClick={() => setRegistrationOpen(true)}>Register Staff User</Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

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
                <TableCell>Username</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(u.roles ?? []).map((role) => (
                        <Chip key={role} label={role} size="small" color="primary" variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.enabled ? 'Active' : 'Disabled'}
                      size="small"
                      color={u.enabled ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <RegisterStaffDialog open={registrationOpen} onClose={() => setRegistrationOpen(false)} onCreated={() => { setRegistrationOpen(false); load(); }} />
    </Stack>
  );
}

function RegisterStaffDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [username, setUsername] = useState(''); const [email, setEmail] = useState(''); const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState(''); const [password, setPassword] = useState(''); const [roleName, setRoleName] = useState('STAFF'); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const create = async () => { setSaving(true); setError(null); try { await httpClient.post('/api/auth/users', { username, email, firstName, lastName, password, roleNames: [roleName] }); onCreated(); } catch (e: unknown) { setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Could not register this staff user.'); } finally { setSaving(false); } };
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Register Staff User</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /><TextField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required /><TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /><TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required /><TextField label="Temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} helperText="At least 8 characters" required /><TextField select label="Initial role" value={roleName} onChange={(e) => setRoleName(e.target.value)}><MenuItem value="STAFF">Staff</MenuItem><MenuItem value="ACADEMIC_STAFF">Academic Staff</MenuItem><MenuItem value="NON_ACADEMIC_STAFF">Non-Academic Staff</MenuItem><MenuItem value="HR_STAFF">HR Staff</MenuItem></TextField></Stack></DialogContent><DialogActions><Button onClick={onClose} disabled={saving}>Cancel</Button><Button variant="contained" onClick={create} disabled={saving || !username || !email || !firstName || !lastName || password.length < 8}>Register</Button></DialogActions></Dialog>;
}
