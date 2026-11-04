import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { AuditPage } from './types';

const ACTIONS = [
  'USER_CREATED',
  'USER_ENABLED',
  'USER_DISABLED',
  'DEPLOYMENT_PUSH_TRIGGERED',
  'DEPLOYMENT_DEPLOY_TRIGGERED',
];

function actionColor(action: string): 'default' | 'success' | 'error' | 'warning' | 'info' {
  if (action.endsWith('DISABLED')) return 'error';
  if (action.endsWith('ENABLED') || action.endsWith('CREATED')) return 'success';
  if (action.startsWith('DEPLOYMENT')) return 'warning';
  return 'info';
}

export function AuditLogPage() {
  const [data, setData] = useState<AuditPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await httpClient.get<AuditPage>('/api/audit', {
        params: { actor: actor || undefined, action: action || undefined, page, size },
      });
      setData(res.data);
    } catch {
      setError('Failed to load the audit log.');
    }
  }, [actor, action, page, size]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Audit Log
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        A tamper-evident trail of account changes and deployments.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Actor"
          size="small"
          value={actor}
          onChange={(e) => {
            setActor(e.target.value);
            setPage(0);
          }}
        />
        <TextField
          select
          label="Action"
          size="small"
          value={action}
          sx={{ minWidth: 260 }}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
        >
          <MenuItem value="">All actions</MenuItem>
          {ACTIONS.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>
        <Button onClick={() => void load()}>Refresh</Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Detail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{e.actor}</TableCell>
                  <TableCell>
                    <Chip size="small" label={e.action} color={actionColor(e.action)} variant="outlined" />
                  </TableCell>
                  <TableCell>{e.entityType ? `${e.entityType} #${e.entityId ?? ''}` : '—'}</TableCell>
                  <TableCell>{e.detail ?? '—'}</TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No audit entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.totalElements ?? 0}
          page={page}
          rowsPerPage={size}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}
