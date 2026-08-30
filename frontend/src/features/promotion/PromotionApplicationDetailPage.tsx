import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import { STATUS_LABELS, type PromotionApplication, type PromotionApplicationStatus } from './types';

type ActionKind =
  | 'request-documents'
  | 'verify-documents'
  | 'schedule-exam'
  | 'schedule-interview'
  | 'recommend'
  | 'approve'
  | 'gazette'
  | 'reject';

const ACTION_LABELS: Record<ActionKind, string> = {
  'request-documents': 'Request More Documents',
  'verify-documents': 'Verify Documents',
  'schedule-exam': 'Schedule Exam',
  'schedule-interview': 'Schedule Oral Interview',
  recommend: 'Recommend for Promotion',
  approve: 'Approve Promotion',
  gazette: 'Mark as Gazetted',
  reject: 'Reject Application',
};

const REQUIRES_COMMENT: Set<ActionKind> = new Set(['request-documents', 'reject']);
const REQUIRES_DATE: Partial<Record<ActionKind, string>> = {
  'schedule-exam': 'Exam Date',
  'schedule-interview': 'Interview Date',
};

function actionsFor(status: PromotionApplicationStatus): ActionKind[] {
  switch (status) {
    case 'SUBMITTED':
      return ['verify-documents', 'request-documents', 'reject'];
    case 'DOCUMENTS_PENDING':
      return ['verify-documents', 'reject'];
    case 'DOCUMENTS_VERIFIED':
      return ['schedule-exam', 'reject'];
    case 'EXAM_SCHEDULED':
      return ['schedule-interview', 'reject'];
    case 'ORAL_INTERVIEW_SCHEDULED':
      return ['recommend', 'reject'];
    case 'RECOMMENDED':
      return ['approve', 'reject'];
    case 'APPROVED':
      return ['gazette'];
    default:
      return [];
  }
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value !== null && value !== undefined && value !== '' ? value : '—'}</Typography>
    </Grid>
  );
}

export function PromotionApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('PROMOTION_MANAGE');

  const [app, setApp] = useState<PromotionApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionKind | null>(null);
  const [comment, setComment] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    httpClient
      .get<PromotionApplication>(`/api/promotions/${id}`)
      .then((res) => setApp(res.data))
      .catch(() => setError('Could not load this promotion application.'))
      .finally(() => setLoaded(true));
  };

  useEffect(load, [id]);

  function openDialog(kind: ActionKind) {
    setActionDialog(kind);
    setComment('');
    setDateValue('');
    setActionError(null);
  }

  async function submitAction() {
    if (!actionDialog) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const dateField = actionDialog === 'schedule-exam' ? 'examDate' : actionDialog === 'schedule-interview' ? 'interviewDate' : null;
      const payload: Record<string, string> = { comment };
      if (dateField) payload[dateField] = dateValue;

      await httpClient.post(`/api/promotions/${id}/${actionDialog}`, payload);
      setActionDialog(null);
      load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'This action could not be completed.';
      setActionError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !app) {
    return <Alert severity="error">{error}</Alert>;
  }

  const availableActions = canManage ? actionsFor(app.status) : [];
  const requiresComment = actionDialog ? REQUIRES_COMMENT.has(actionDialog) : false;
  const dateLabel = actionDialog ? REQUIRES_DATE[actionDialog] : undefined;
  const canSubmit = !requiresComment || comment.trim() !== '';
  const canSubmitDate = !dateLabel || dateValue !== '';

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Promotion Application</Typography>
        <Button variant="outlined" onClick={() => navigate(canManage ? '/promotions/review' : '/career')}>
          Back
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack>
              <Typography variant="h5">{app.staffFullName}</Typography>
              <Typography color="text.secondary">{app.staffNumber}</Typography>
            </Stack>
            <Chip label={STATUS_LABELS[app.status]} color="primary" />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Field label="Current Grade Level" value={`GL ${app.currentGradeLevel}`} />
            <Field label="Requested Grade Level" value={`GL ${app.requestedGradeLevel}`} />
            <Field label="Eligibility Date" value={app.eligibilityDate} />
            <Field label="Submitted" value={new Date(app.createdAt).toLocaleDateString()} />
            <Field label="Exam Scheduled" value={app.examScheduledDate} />
            <Field label="Interview Scheduled" value={app.interviewScheduledDate} />
            <Field label="Reviewed By" value={app.reviewedByUsername} />
            <Field label="Reviewed At" value={app.reviewedAt ? new Date(app.reviewedAt).toLocaleString() : null} />
          </Grid>

          {app.staffStatement && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Staff Statement
              </Typography>
              <Typography variant="body2">{app.staffStatement}</Typography>
            </>
          )}

          {app.reviewerComment && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Reviewer Comment
              </Typography>
              <Typography variant="body2">{app.reviewerComment}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      {canManage && availableActions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Actions
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {availableActions.map((action) => (
                <Button
                  key={action}
                  variant={action === 'reject' ? 'outlined' : 'contained'}
                  color={action === 'reject' ? 'error' : 'primary'}
                  onClick={() => openDialog(action)}
                >
                  {ACTION_LABELS[action]}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Dialog open={actionDialog !== null} onClose={() => setActionDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{actionDialog ? ACTION_LABELS[actionDialog] : ''}</DialogTitle>
        <DialogContent>
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {dateLabel && (
              <TextField
                label={dateLabel}
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
            <TextField
              label={requiresComment ? 'Comment (required)' : 'Comment (optional)'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required={requiresComment}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submitAction} variant="contained" disabled={submitting || !canSubmit || !canSubmitDate}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
