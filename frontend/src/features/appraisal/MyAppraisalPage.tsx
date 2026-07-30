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
import { httpClient } from '../../app/httpClient';
import type { AppraisalCycle, AppraisalForm } from './types';

export function MyAppraisalPage() {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<AppraisalCycle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  async function openMine(cycle: AppraisalCycle) {
    setBusyId(cycle.id);
    setError(null);
    try {
      const res = await httpClient.get<AppraisalForm>('/api/appraisals/mine', { params: { cycleId: cycle.id } });
      navigate(`/appraisals/${res.data.id}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not open your appraisal for this cycle.';
      setError(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">My Appraisal</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!cycles && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {cycles && cycles.length === 0 && (
        <Typography color="text.secondary">No appraisal cycles have been opened yet.</Typography>
      )}

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
                    <Button size="small" variant="outlined" disabled={busyId === cycle.id} onClick={() => openMine(cycle)}>
                      Open My Appraisal
                    </Button>
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
