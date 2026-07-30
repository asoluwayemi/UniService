import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { UserSummary } from '../auth/types';

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    httpClient
      .get<UserSummary[]>('/api/auth/users')
      .then((response) => setUsers(response.data))
      .catch(() => setError('Could not load users.'));
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Manage Users</Typography>

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
                      {u.roles.map((role) => (
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
    </Stack>
  );
}
