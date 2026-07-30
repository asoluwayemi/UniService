import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
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
import type { ChangeRequest } from './types';

function describe(r: ChangeRequest): string {
  if (r.action === 'CREATE') return `Create ${r.proposedType?.toLowerCase()} "${r.proposedName}" (${r.proposedCode})`;
  if (r.action === 'ARCHIVE') return `Archive "${r.targetOrgUnitName}"`;
  return `Update "${r.targetOrgUnitName}"`;
}

export function ApprovalsPage() {
  const [requests, setRequests] = useState<ChangeRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ChangeRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    httpClient
      .get<ChangeRequest[]>('/api/org/change-requests/pending')
      .then((res) => setRequests(res.data))
      .catch(() => setError('Could not load pending requests.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(request: ChangeRequest) {
    setBusyId(request.id);
    setError(null);
    try {
      await httpClient.post(`/api/org/change-requests/${request.id}/approve`, {});
      load();
    } catch {
      setError('Could not approve this request. It may have already been reviewed.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    setError(null);
    try {
      await httpClient.post(`/api/org/change-requests/${rejectTarget.id}/reject`, { notes: rejectNotes });
      setRejectTarget(null);
      setRejectNotes('');
      load();
    } catch {
      setError('Could not reject this request.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Pending Approvals</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!requests && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {requests && requests.length === 0 && <Typography color="text.secondary">No pending requests.</Typography>}

      {requests && requests.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{describe(r)}</TableCell>
                  <TableCell>{r.requestedByUsername}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busyId === r.id}
                        onClick={() => handleApprove(r)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={busyId === r.id}
                        onClick={() => setRejectTarget(r)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={rejectTarget != null} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reject request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Reason"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            required
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1 }}
            helperText="Required — the requester will see this."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={!rejectNotes.trim()}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
