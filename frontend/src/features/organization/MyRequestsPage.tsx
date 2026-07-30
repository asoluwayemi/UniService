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
import type { ChangeRequest, ChangeRequestStatus } from './types';

const STATUS_COLOR: Record<ChangeRequestStatus, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

function describe(r: ChangeRequest): string {
  if (r.action === 'CREATE') return `Create ${r.proposedType?.toLowerCase()} "${r.proposedName}"`;
  if (r.action === 'ARCHIVE') return `Archive "${r.targetOrgUnitName}"`;
  return `Update "${r.targetOrgUnitName}"`;
}

export function MyRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    httpClient
      .get<ChangeRequest[]>('/api/org/change-requests/mine')
      .then((res) => setRequests(res.data))
      .catch(() => setError('Could not load your requests.'));
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">My Requests</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!requests && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {requests && requests.length === 0 && (
        <Typography color="text.secondary">You haven't submitted any organization change requests yet.</Typography>
      )}

      {requests && requests.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reviewed By</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{describe(r)}</TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" color={STATUS_COLOR[r.status]} />
                  </TableCell>
                  <TableCell>{r.reviewedByUsername ?? '—'}</TableCell>
                  <TableCell>{r.reviewNotes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
