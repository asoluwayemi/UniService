import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { formatMoney } from './money';
import type { PayrollRun, Payslip } from './types';

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [period, setPeriod] = useState(currentPeriod());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<PayrollRun | null>(null);
  const [viewing, setViewing] = useState<{ run: PayrollRun; slips: Payslip[] } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await httpClient.get<PayrollRun[]>('/api/payroll/runs');
      setRuns(res.data);
    } catch {
      setError('Failed to load payroll runs.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await httpClient.post<PayrollRun>('/api/payroll/runs', { period });
      setNotice(
        `Generated ${res.data.staffCount} payslips for ${res.data.period}` +
          (res.data.skippedCount > 0 ? ` (${res.data.skippedCount} staff skipped: no grade level or salary scale)` : '') +
          '.',
      );
      await load();
    } catch {
      setError('Could not generate payroll. A published period cannot be regenerated.');
    } finally {
      setBusy(false);
    }
  }

  async function publish(run: PayrollRun) {
    setConfirm(null);
    setBusy(true);
    setError(null);
    try {
      await httpClient.post(`/api/payroll/runs/${run.id}/publish`);
      setNotice(`Published ${run.period}. Staff have been notified.`);
      await load();
    } catch {
      setError('Could not publish this run.');
    } finally {
      setBusy(false);
    }
  }

  async function view(run: PayrollRun) {
    try {
      const res = await httpClient.get<Payslip[]>(`/api/payroll/runs/${run.id}/payslips`);
      setViewing({ run, slips: res.data });
    } catch {
      setError('Failed to load payslips.');
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Payroll
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Generate a draft for a month, review it, then publish to release payslips to staff.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Period"
          type="month"
          size="small"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" disabled={busy || !period} onClick={() => void generate()}>
          Generate draft
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Staff</TableCell>
              <TableCell align="right">Gross</TableCell>
              <TableCell align="right">Net</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.period}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.status} color={r.status === 'PUBLISHED' ? 'success' : 'warning'} variant="outlined" />
                </TableCell>
                <TableCell align="right">{r.staffCount}</TableCell>
                <TableCell align="right">{formatMoney(r.totalGross)}</TableCell>
                <TableCell align="right">{formatMoney(r.totalNet)}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => void view(r)}>
                    View
                  </Button>
                  {r.status === 'DRAFT' && (
                    <Button size="small" color="success" disabled={busy} onClick={() => setConfirm(r)}>
                      Publish
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No payroll runs yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)}>
        <DialogTitle>Publish payroll?</DialogTitle>
        <DialogContent>
          <Typography>
            Publishing {confirm?.period} makes {confirm?.staffCount} payslips visible to staff and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => confirm && void publish(confirm)}>
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewing !== null} onClose={() => setViewing(null)} maxWidth="md" fullWidth>
        <DialogTitle>Payslips · {viewing?.run.period}</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Staff</TableCell>
                <TableCell align="right">Grade</TableCell>
                <TableCell align="right">Gross</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">Net</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {viewing?.slips.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell align="right">{s.gradeLevel}</TableCell>
                  <TableCell align="right">{formatMoney(s.gross)}</TableCell>
                  <TableCell align="right">{formatMoney(s.pension + s.tax)}</TableCell>
                  <TableCell align="right">{formatMoney(s.net)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewing(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
