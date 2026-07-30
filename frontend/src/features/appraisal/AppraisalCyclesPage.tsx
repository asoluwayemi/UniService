import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import AddIcon from '@mui/icons-material/Add';
import { httpClient } from '../../app/httpClient';
import type { AppraisalCycle } from './types';

export function AppraisalCyclesPage() {
  const [cycles, setCycles] = useState<AppraisalCycle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    httpClient
      .get<AppraisalCycle[]>('/api/appraisal-cycles')
      .then((res) => setCycles(res.data))
      .catch(() => setError('Could not load appraisal cycles.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    setDialogError(null);
    setSubmitting(true);
    try {
      await httpClient.post('/api/appraisal-cycles', { year: Number(year) });
      setDialogOpen(false);
      load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create this cycle.';
      setDialogError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(cycle: AppraisalCycle) {
    setBusyId(cycle.id);
    try {
      await httpClient.post(`/api/appraisal-cycles/${cycle.id}/close`);
      load();
    } catch {
      setError('Could not close this cycle.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Appraisal Cycles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          New Cycle
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {!cycles && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {cycles && cycles.length === 0 && <Typography color="text.secondary">No appraisal cycles yet.</Typography>}

      {cycles && cycles.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell>{cycle.year}</TableCell>
                  <TableCell>
                    <Chip label={cycle.status} size="small" color={cycle.status === 'OPEN' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    {cycle.status === 'OPEN' && (
                      <Button size="small" disabled={busyId === cycle.id} onClick={() => handleClose(cycle)}>
                        Close
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New Appraisal Cycle</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <TextField
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={submitting || !year.trim()}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
