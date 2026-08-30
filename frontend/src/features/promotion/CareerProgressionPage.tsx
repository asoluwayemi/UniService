import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Chip, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { STATUS_LABELS, type PromotionSummary } from './types';

interface Eligibility {
  eligible: boolean;
  dueDate: string | null;
  gradeLevel: number | null;
  requiredYearsInPost: number;
  completedAppraisals: number;
  requiredAppraisals: number;
  outstandingCriteria: string[];
}

export function CareerProgressionPage() {
  const navigate = useNavigate();
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [applications, setApplications] = useState<PromotionSummary[]>([]);
  const [statement, setStatement] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    httpClient
      .get<Eligibility>('/api/promotions/eligibility')
      .then((r) => setEligibility(r.data))
      .catch(() => setError('Career progression could not be loaded.'));
    httpClient
      .get<PromotionSummary[]>('/api/promotions/mine')
      .then((r) => setApplications(r.data))
      .catch(() => undefined);
  };

  useEffect(load, []);

  async function apply() {
    try {
      await httpClient.post('/api/promotions', { staffStatement: statement || undefined });
      setStatement('');
      load();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'Promotion application could not be submitted.',
      );
    }
  }

  if (!eligibility) {
    return <CircularProgress />;
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Career Progression</Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Promotion eligibility</Typography>
              <Chip
                label={eligibility.eligible ? 'Eligible to apply' : 'Not yet eligible'}
                color={eligibility.eligible ? 'success' : 'default'}
              />
            </Stack>
            <Typography>Grade level: {eligibility.gradeLevel ?? 'Not recorded by HR'}</Typography>
            <Typography>
              Minimum tenure: {eligibility.requiredYearsInPost} years · Due date:{' '}
              {eligibility.dueDate ?? 'Pending HR profile completion'}
            </Typography>
            <Typography>
              Completed APERs: {eligibility.completedAppraisals} of {eligibility.requiredAppraisals}
            </Typography>
            {eligibility.outstandingCriteria.map((criterion) => (
              <Alert key={criterion} severity="info">
                {criterion}
              </Alert>
            ))}
            {eligibility.eligible && (
              <>
                <TextField
                  label="Supporting statement (optional)"
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  multiline
                  minRows={3}
                />
                <Button variant="contained" onClick={apply} sx={{ alignSelf: 'flex-start' }}>
                  Apply for Promotion
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            My applications
          </Typography>
          {applications.length === 0 ? (
            <Typography color="text.secondary">No promotion applications yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {applications.map((application) => (
                <Stack
                  key={application.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ p: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/promotions/${application.id}`)}
                >
                  <Typography>
                    GL {application.currentGradeLevel} → GL {application.requestedGradeLevel}
                  </Typography>
                  <Chip size="small" label={STATUS_LABELS[application.status]} />
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
