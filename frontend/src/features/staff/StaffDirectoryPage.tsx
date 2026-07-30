import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
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
import AddIcon from '@mui/icons-material/Add';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import { NewStaffProfileDialog } from './NewStaffProfileDialog';
import type { StaffProfileSummary } from './types';

export function StaffDirectoryPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('STAFF_WRITE');
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffProfileSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(() => {
    httpClient
      .get<StaffProfileSummary[]>('/api/staff')
      .then((res) => setStaff(res.data))
      .catch(() => setError('Could not load staff records.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Staff Directory</Typography>
        {canWrite && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New Staff Profile
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {!staff && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {staff && staff.length === 0 && <Typography color="text.secondary">No staff profiles yet.</Typography>}

      {staff && staff.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id} hover onClick={() => navigate(`/staff/${s.id}`)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{s.staffNumber}</TableCell>
                  <TableCell>
                    {s.firstName} {s.lastName}
                  </TableCell>
                  <TableCell>{s.orgUnitName ?? '—'}</TableCell>
                  <TableCell>{s.designation ?? '—'}</TableCell>
                  <TableCell>
                    <Chip label={s.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.employmentStatus}
                      size="small"
                      color={s.employmentStatus === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {dialogOpen && (
        <NewStaffProfileDialog
          open
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setDialogOpen(false);
            load();
          }}
        />
      )}
    </Stack>
  );
}
