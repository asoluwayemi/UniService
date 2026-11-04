import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
import type { ApplicationStage, JobApplication, JobPosting, PostingStatus } from './types';

const stageColor: Record<ApplicationStage, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  APPLIED: 'default',
  SHORTLISTED: 'info',
  INTERVIEW: 'warning',
  OFFERED: 'warning',
  HIRED: 'success',
  REJECTED: 'error',
};

const statusColor: Record<PostingStatus, 'default' | 'success' | 'error'> = {
  DRAFT: 'default',
  OPEN: 'success',
  CLOSED: 'error',
};

export function RecruitmentPage() {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [selected, setSelected] = useState<JobPosting | null>(null);
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [postingOpen, setPostingOpen] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', category: 'ACADEMIC', description: '', closingDate: '' });
  const [applicantOpen, setApplicantOpen] = useState(false);
  const [applicant, setApplicant] = useState({ applicantName: '', email: '', phone: '', coverNote: '' });
  const [rejecting, setRejecting] = useState<JobApplication | null>(null);
  const [reason, setReason] = useState('');
  const [onboarding, setOnboarding] = useState<JobApplication | null>(null);
  const [startDate, setStartDate] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const loadPostings = useCallback(async () => {
    try {
      const res = await httpClient.get<JobPosting[]>('/api/recruitment/postings');
      setPostings(res.data);
      setSelected((cur) => (cur ? (res.data.find((p) => p.id === cur.id) ?? null) : null));
    } catch {
      setError('Failed to load job postings.');
    }
  }, []);

  const loadApps = useCallback(async (postingId: number) => {
    try {
      const res = await httpClient.get<JobApplication[]>(`/api/recruitment/postings/${postingId}/applications`);
      setApps(res.data);
    } catch {
      setError('Failed to load applications.');
    }
  }, []);

  useEffect(() => {
    void loadPostings();
  }, [loadPostings]);

  useEffect(() => {
    if (selected) void loadApps(selected.id);
    else setApps([]);
  }, [selected?.id, loadApps]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(action: () => Promise<unknown>, failure: string) {
    setError(null);
    try {
      await action();
    } catch {
      setError(failure);
    }
  }

  const createPosting = () =>
    run(async () => {
      await httpClient.post('/api/recruitment/postings', { ...form, closingDate: form.closingDate || null });
      setPostingOpen(false);
      setForm({ title: '', department: '', category: 'ACADEMIC', description: '', closingDate: '' });
      await loadPostings();
    }, 'Could not create the posting. Check the fields and closing date.');

  const setStatus = (p: JobPosting, status: PostingStatus) =>
    run(async () => {
      await httpClient.post(`/api/recruitment/postings/${p.id}/status`, { status });
      await loadPostings();
    }, 'Could not change the posting status.');

  const addApplicant = () =>
    run(async () => {
      if (!selected) return;
      await httpClient.post(`/api/recruitment/postings/${selected.id}/applications`, applicant);
      setApplicantOpen(false);
      setApplicant({ applicantName: '', email: '', phone: '', coverNote: '' });
      await Promise.all([loadApps(selected.id), loadPostings()]);
    }, 'Could not add the applicant. The posting must be open and the email unique.');

  const moveStage = (a: JobApplication, stage: ApplicationStage, note?: string) =>
    run(async () => {
      await httpClient.post(`/api/recruitment/applications/${a.id}/stage`, { stage, note });
      setRejecting(null);
      setReason('');
      await loadApps(a.postingId);
    }, 'Could not move this application.');

  const startOnboarding = () =>
    run(async () => {
      if (!onboarding) return;
      await httpClient.post(`/api/onboarding/cases/from-application/${onboarding.id}`, { startDate });
      setNotice(`Onboarding started for ${onboarding.applicantName}. Continue in the Onboarding page.`);
      setOnboarding(null);
      setStartDate('');
    }, 'Could not start onboarding. It may already have been started.');

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          Recruitment
        </Typography>
        <Button variant="contained" onClick={() => setPostingOpen(true)}>
          New posting
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Publish vacancies, record applicants and move them through the hiring pipeline.
      </Typography>

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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        <Stack spacing={1.5} sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
          {postings.length === 0 && <Alert severity="info">No job postings yet.</Alert>}
          {postings.map((p) => (
            <Card key={p.id} variant="outlined" sx={{ borderColor: selected?.id === p.id ? 'primary.main' : undefined }}>
              <CardActionArea onClick={() => setSelected(p)}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={600}>{p.title}</Typography>
                    <Chip size="small" label={p.status} color={statusColor[p.status]} variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {p.department} · {p.applicationCount} applicant{p.applicationCount === 1 ? '' : 's'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>

        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {!selected && <Alert severity="info">Select a posting to see its applicants.</Alert>}
          {selected && (
            <>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
                <Typography variant="h6" fontWeight={700} sx={{ mr: 'auto' }}>
                  {selected.title}
                </Typography>
                {selected.status === 'DRAFT' && (
                  <Button size="small" variant="outlined" onClick={() => void setStatus(selected, 'OPEN')}>
                    Open for applications
                  </Button>
                )}
                {selected.status === 'OPEN' && (
                  <>
                    <Button size="small" variant="contained" onClick={() => setApplicantOpen(true)}>
                      Add applicant
                    </Button>
                    <Button size="small" color="error" onClick={() => void setStatus(selected, 'CLOSED')}>
                      Close
                    </Button>
                  </>
                )}
              </Stack>
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Applicant</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apps.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{a.applicantName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {a.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={a.stage} color={stageColor[a.stage]} />
                          {a.stageNote && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {a.stageNote}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {a.stage === 'HIRED' && (
                            <Button size="small" color="success" onClick={() => setOnboarding(a)}>
                              Start onboarding
                            </Button>
                          )}
                          {a.allowedNext.map((next) =>
                            next === 'REJECTED' ? (
                              <Button key={next} size="small" color="error" onClick={() => setRejecting(a)}>
                                Reject
                              </Button>
                            ) : (
                              <Button key={next} size="small" onClick={() => void moveStage(a, next)}>
                                {`Move to ${next.toLowerCase()}`}
                              </Button>
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {apps.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No applicants yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
        </Box>
      </Stack>

      <Dialog open={postingOpen} onClose={() => setPostingOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New job posting</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <MenuItem value="ACADEMIC">Academic</MenuItem>
              <MenuItem value="NON_ACADEMIC">Non-academic</MenuItem>
            </TextField>
            <TextField
              label="Closing date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.closingDate}
              onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostingOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.title || !form.department || !form.description} onClick={() => void createPosting()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={applicantOpen} onClose={() => setApplicantOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add applicant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full name" value={applicant.applicantName} onChange={(e) => setApplicant({ ...applicant, applicantName: e.target.value })} />
            <TextField label="Email" type="email" value={applicant.email} onChange={(e) => setApplicant({ ...applicant, email: e.target.value })} />
            <TextField label="Phone" value={applicant.phone} onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })} />
            <TextField label="Cover note" multiline minRows={2} value={applicant.coverNote} onChange={(e) => setApplicant({ ...applicant, coverNote: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplicantOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!applicant.applicantName || !applicant.email} onClick={() => void addApplicant()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={onboarding !== null} onClose={() => setOnboarding(null)} fullWidth maxWidth="xs">
        <DialogTitle>Start onboarding for {onboarding?.applicantName}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="date"
            label="Start date"
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOnboarding(null)}>Cancel</Button>
          <Button variant="contained" disabled={!startDate} onClick={() => void startOnboarding()}>
            Start
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejecting !== null} onClose={() => setRejecting(null)} fullWidth maxWidth="xs">
        <DialogTitle>Reject {rejecting?.applicantName}?</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Reason" sx={{ mt: 1 }} value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={!reason.trim()} onClick={() => rejecting && void moveStage(rejecting, 'REJECTED', reason)}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
