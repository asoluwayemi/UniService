import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import type { AttendanceRecord, AttendanceSummary } from './types';

export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return '—';
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function time(iso: string | null): string {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function ClockCard({ record, onChange }: { record: AttendanceRecord | null; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clockedIn = record !== null;
  const done = record?.clockOut != null;

  async function act(path: 'clock-in' | 'clock-out') {
    setBusy(true);
    setError(null);
    try {
      await httpClient.post(`/api/attendance/${path}`);
      await onChange();
    } catch {
      setError('Could not record attendance. You may have already done this today.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Today
            </Typography>
            {!clockedIn && <Typography color="text.secondary">You have not clocked in yet.</Typography>}
            {clockedIn && (
              <Typography color="text.secondary">
                In at {time(record.clockIn)}
                {record.late && <Chip size="small" color="warning" label="Late" sx={{ ml: 1 }} />}
                {done && ` · Out at ${time(record.clockOut)} · ${formatMinutes(record.minutesWorked)}`}
              </Typography>
            )}
          </Box>
          {!clockedIn && (
            <Button variant="contained" startIcon={<LoginIcon />} disabled={busy} onClick={() => void act('clock-in')}>
              Clock in
            </Button>
          )}
          {clockedIn && !done && (
            <Button variant="contained" color="secondary" startIcon={<LogoutIcon />} disabled={busy} onClick={() => void act('clock-out')}>
              Clock out
            </Button>
          )}
          {done && <Chip color="success" label="Day complete" />}
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function RecordsTable({ records, showStaff }: { records: AttendanceRecord[]; showStaff?: boolean }) {
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {showStaff && <TableCell>Staff</TableCell>}
            <TableCell>Date</TableCell>
            <TableCell>In</TableCell>
            <TableCell>Out</TableCell>
            <TableCell>Worked</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id} hover>
              {showStaff && <TableCell>{r.fullName || r.username}</TableCell>}
              <TableCell>{r.workDate}</TableCell>
              <TableCell>{time(r.clockIn)}</TableCell>
              <TableCell>{time(r.clockOut)}</TableCell>
              <TableCell>{formatMinutes(r.minutesWorked)}</TableCell>
              <TableCell>
                <Chip size="small" variant="outlined" color={r.late ? 'warning' : 'success'} label={r.late ? 'Late' : 'On time'} />
              </TableCell>
            </TableRow>
          ))}
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={showStaff ? 6 : 5} align="center">
                No attendance records.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

export function AttendancePage() {
  const { hasPermission } = useAuth();
  const canViewAll = hasPermission('ATTENDANCE_VIEW_ALL');
  const [tab, setTab] = useState(0);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [date, setDate] = useState(todayIso());
  const [dayRecords, setDayRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMine = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        httpClient.get<AttendanceRecord | null>('/api/attendance/today'),
        httpClient.get<AttendanceSummary>('/api/attendance/me'),
      ]);
      setToday(t.data ?? null);
      setSummary(s.data);
      setError(null);
    } catch {
      setError('Failed to load attendance.');
    }
  }, []);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  useEffect(() => {
    if (!canViewAll || tab !== 1) return;
    httpClient
      .get<AttendanceRecord[]>('/api/attendance', { params: { date } })
      .then((res) => setDayRecords(res.data))
      .catch(() => setError('Failed to load attendance.'));
  }, [canViewAll, tab, date]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Attendance
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Clock in and out, and review your attendance this month.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {canViewAll && (
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="My attendance" />
          <Tab label="All staff" />
        </Tabs>
      )}

      {tab === 0 && (
        <>
          <ClockCard record={today} onChange={loadMine} />
          {summary && (
            <>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip label={`Days present: ${summary.daysPresent}`} color="primary" variant="outlined" />
                <Chip label={`Days late: ${summary.daysLate}`} color="warning" variant="outlined" />
                <Chip label={`Hours: ${formatMinutes(summary.totalMinutesWorked)}`} variant="outlined" />
              </Stack>
              <RecordsTable records={summary.records} />
            </>
          )}
        </>
      )}

      {tab === 1 && canViewAll && (
        <>
          <TextField
            type="date"
            label="Date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <RecordsTable records={dayRecords} showStaff />
        </>
      )}
    </Box>
  );
}
