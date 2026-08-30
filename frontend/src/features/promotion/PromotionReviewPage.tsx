import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { STATUS_LABELS, type PromotionSummary } from './types';

const TERMINAL_STATUSES = new Set(['GAZETTED', 'REJECTED']);

function statusColor(status: string): 'default' | 'success' | 'error' | 'warning' | 'info' {
  if (status === 'GAZETTED' || status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'DOCUMENTS_PENDING') return 'warning';
  return 'info';
}

export function PromotionReviewPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<PromotionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    httpClient
      .get<PromotionSummary[]>('/api/promotions')
      .then((res) => setApplications(res.data))
      .catch(() => setError('Could not load promotion applications.'));
  }, []);

  const active = applications?.filter((a) => !TERMINAL_STATUSES.has(a.status)) ?? [];
  const completed = applications?.filter((a) => TERMINAL_STATUSES.has(a.status)) ?? [];

  function renderTable(rows: PromotionSummary[]) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Staff</TableCell>
              <TableCell>Staff No.</TableCell>
              <TableCell>Grade Change</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((app) => (
              <TableRow key={app.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/promotions/${app.id}`)}>
                <TableCell>{app.staffFullName}</TableCell>
                <TableCell>{app.staffNumber}</TableCell>
                <TableCell>
                  GL {app.currentGradeLevel} → GL {app.requestedGradeLevel}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={STATUS_LABELS[app.status]} color={statusColor(app.status)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Promotion Applications</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!applications && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {applications && (
        <>
          <Typography variant="h6">Active ({active.length})</Typography>
          {active.length === 0 ? (
            <Typography color="text.secondary">No active promotion applications.</Typography>
          ) : (
            renderTable(active)
          )}

          <Typography variant="h6" sx={{ mt: 2 }}>
            Completed ({completed.length})
          </Typography>
          {completed.length === 0 ? (
            <Typography color="text.secondary">No completed applications yet.</Typography>
          ) : (
            renderTable(completed)
          )}
        </>
      )}
    </Stack>
  );
}
