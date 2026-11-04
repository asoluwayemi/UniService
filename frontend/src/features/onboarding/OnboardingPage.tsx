import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { OnboardingCase, OnboardingStatus } from './types';

const statusColor: Record<OnboardingStatus, 'info' | 'success' | 'default'> = {
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

function CaseCard({
  c,
  onToggle,
  onLink,
  onCancel,
}: {
  c: OnboardingCase;
  onToggle: (taskId: number, done: boolean) => void;
  onLink: (c: OnboardingCase) => void;
  onCancel: (c: OnboardingCase) => void;
}) {
  const locked = c.status === 'CANCELLED';
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" sx={{ gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {c.newHireName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {c.position} · {c.department} · starts {c.startDate}
            </Typography>
          </Box>
          <Chip size="small" label={c.status.replace('_', ' ')} color={statusColor[c.status]} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ my: 1.5 }} flexWrap="wrap" useFlexGap>
          {c.linkedUsername ? (
            <Chip size="small" variant="outlined" color="success" label={`Account: ${c.linkedUsername}`} />
          ) : (
            <Chip size="small" variant="outlined" color="warning" label="No account linked" />
          )}
          <Chip size="small" variant="outlined" color={c.profileReady ? 'success' : 'default'} label={c.profileReady ? 'Profile ready' : 'No staff profile'} />
          <Chip size="small" variant="outlined" color={c.payrollReady ? 'success' : 'default'} label={c.payrollReady ? 'Payroll ready' : 'Not payroll ready'} />
        </Stack>

        <LinearProgress variant="determinate" value={c.tasksTotal ? (c.tasksDone / c.tasksTotal) * 100 : 0} sx={{ height: 8, borderRadius: 4 }} />
        <Typography variant="caption" color="text.secondary">
          {c.tasksDone} of {c.tasksTotal} tasks done
        </Typography>

        <Stack sx={{ mt: 1 }}>
          {c.tasks.map((t) => (
            <FormControlLabel
              key={t.id}
              disabled={locked}
              control={<Checkbox size="small" checked={t.done} onChange={(e) => onToggle(t.id, e.target.checked)} />}
              label={
                <Typography variant="body2" sx={{ textDecoration: t.done ? 'line-through' : 'none' }}>
                  {t.title} <Chip size="small" label={t.ownerTeam} sx={{ ml: 0.5, height: 18 }} />
                </Typography>
              }
            />
          ))}
        </Stack>

        {c.status !== 'CANCELLED' && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            {!c.linkedUsername && (
              <Button size="small" variant="outlined" onClick={() => onLink(c)}>
                Link staff account
              </Button>
            )}
            {c.status === 'IN_PROGRESS' && (
              <Button size="small" color="error" onClick={() => onCancel(c)}>
                Cancel onboarding
              </Button>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export function OnboardingPage() {
  const [cases, setCases] = useState<OnboardingCase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ newHireName: '', email: '', position: '', department: '', startDate: '' });
  const [linking, setLinking] = useState<OnboardingCase | null>(null);
  const [linkEmail, setLinkEmail] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await httpClient.get<OnboardingCase[]>('/api/onboarding/cases');
      setCases(res.data);
    } catch {
      setError('Failed to load onboarding cases.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, failure: string) {
    setError(null);
    try {
      await action();
      await load();
    } catch {
      setError(failure);
    }
  }

  const create = () =>
    run(async () => {
      await httpClient.post('/api/onboarding/cases', form);
      setCreateOpen(false);
      setForm({ newHireName: '', email: '', position: '', department: '', startDate: '' });
    }, 'Could not start onboarding. Check the fields.');

  const toggle = (taskId: number, done: boolean) =>
    run(() => httpClient.post(`/api/onboarding/tasks/${taskId}`, { done }), 'Could not update the task.');

  const cancel = (c: OnboardingCase) =>
    run(() => httpClient.post(`/api/onboarding/cases/${c.id}/cancel`), 'Could not cancel this onboarding.');

  const link = () =>
    run(async () => {
      if (!linking) return;
      await httpClient.post(`/api/onboarding/cases/${linking.id}/link-user`, { email: linkEmail });
      setLinking(null);
      setLinkEmail('');
    }, 'No staff account was found with that email.');

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          Onboarding
        </Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          New hire
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Track each new hire from offer to first day. Create their account in Staff Registration, then link it here.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {cases.length === 0 && <Alert severity="info">No onboarding cases yet.</Alert>}

      <Stack spacing={2}>
        {cases.map((c) => (
          <CaseCard key={c.id} c={c} onToggle={(id, done) => void toggle(id, done)} onLink={setLinking} onCancel={(x) => void cancel(x)} />
        ))}
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New hire</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full name" value={form.newHireName} onChange={(e) => setForm({ ...form, newHireName: e.target.value })} />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <TextField
              label="Start date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={Object.values(form).some((v) => !v)} onClick={() => void create()}>
            Start onboarding
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={linking !== null} onClose={() => setLinking(null)} fullWidth maxWidth="xs">
        <DialogTitle>Link staff account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the email of the account created for {linking?.newHireName}.
          </Typography>
          <TextField autoFocus fullWidth label="Account email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinking(null)}>Cancel</Button>
          <Button variant="contained" disabled={!linkEmail.trim()} onClick={() => void link()}>
            Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
