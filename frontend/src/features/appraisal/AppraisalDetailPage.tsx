import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { httpClient } from '../../app/httpClient';
import {
  RATING_KEYS,
  RATING_LABELS,
  type AppraisalForm,
  type OverallGrading,
  type Promotability,
  type RatingKey,
  type SickLeaveEntryPayload,
  type UnitHeadReviewPayload,
} from './types';

const OVERALL_GRADINGS: OverallGrading[] = ['OUTSTANDING', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'SATISFACTORY', 'FAIR', 'POOR'];
const PROMOTABILITY_OPTIONS: Promotability[] = ['WELL_FITTED', 'FITTED', 'NOT_FITTED'];

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
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

function emptyUnitHeadReview(): UnitHeadReviewPayload {
  const ratings = Object.fromEntries(RATING_KEYS.map((k) => [k, null])) as Record<RatingKey, number | null>;
  return {
    ...ratings,
    overallGrading: 'SATISFACTORY',
    promotability: 'FITTED',
    sickLeaves: [],
  };
}

export function AppraisalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<AppraisalForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [scheduleOfDuties, setScheduleOfDuties] = useState('');
  const [review, setReview] = useState<UnitHeadReviewPayload>(emptyUnitHeadReview());
  const [staffComments, setStaffComments] = useState('');
  const [departmentHeadComments, setDepartmentHeadComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    httpClient
      .get<AppraisalForm>(`/api/appraisals/${id}`)
      .then((res) => {
        setForm(res.data);
        setScheduleOfDuties(res.data.scheduleOfDuties ?? '');
      })
      .catch(() => setError('Could not load this appraisal.'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function updateRating(key: RatingKey, value: number | null) {
    setReview((prev) => ({ ...prev, [key]: value }));
  }

  function updateSickLeave(index: number, patch: Partial<SickLeaveEntryPayload>) {
    setReview((prev) => ({
      ...prev,
      sickLeaves: prev.sickLeaves.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    }));
  }

  function addSickLeaveRow() {
    setReview((prev) => ({ ...prev, sickLeaves: [...prev.sickLeaves, {}] }));
  }

  function removeSickLeaveRow(index: number) {
    setReview((prev) => ({ ...prev, sickLeaves: prev.sickLeaves.filter((_, i) => i !== index) }));
  }

  async function submitStaffBiodata() {
    setActionError(null);
    setSubmitting(true);
    try {
      await httpClient.post(`/api/appraisals/${id}/staff-submit`, { scheduleOfDuties: scheduleOfDuties || undefined });
      load();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not submit your details.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitUnitHeadReview() {
    setActionError(null);
    setSubmitting(true);
    try {
      await httpClient.post(`/api/appraisals/${id}/unit-head-review`, review);
      load();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not submit this review.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitStaffCounterComment() {
    setActionError(null);
    setSubmitting(true);
    try {
      await httpClient.post(`/api/appraisals/${id}/staff-counter-comment`, { staffComments: staffComments || undefined });
      load();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not submit your comments.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDepartmentHeadSignOff() {
    setActionError(null);
    setSubmitting(true);
    try {
      await httpClient.post(`/api/appraisals/${id}/department-head-sign`, {
        departmentHeadComments: departmentHeadComments || undefined,
      });
      load();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not sign off this appraisal.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!form) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const unitHeadReviewed = form.status !== 'STAFF_DRAFT' && form.status !== 'AWAITING_UNIT_HEAD';
  const staffHasCountered = form.status === 'AWAITING_DEPARTMENT_HEAD' || form.status === 'COMPLETED';
  const departmentHeadSigned = form.status === 'COMPLETED';

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4">Appraisal — {form.cycleYear}</Typography>
          <Typography color="text.secondary">
            {form.staffFullName} · {form.staffNumber}
          </Typography>
        </Box>
        <Chip label={form.status.replace(/_/g, ' ')} color={form.status === 'COMPLETED' ? 'success' : 'default'} />
      </Stack>

      {actionError && <Alert severity="error">{actionError}</Alert>}

      {/* Section A: biodata */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Personal Biodata
          </Typography>
          {form.status === 'STAFF_DRAFT' && form.viewerIsOwner ? (
            <Stack spacing={2}>
              <TextField
                label="Schedule of Duties"
                value={scheduleOfDuties}
                onChange={(e) => setScheduleOfDuties(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <Button variant="contained" onClick={submitStaffBiodata} disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
                Submit to Head of Unit
              </Button>
            </Stack>
          ) : (
            <Grid container spacing={2}>
              <Field label="Schedule of Duties" value={form.scheduleOfDuties} />
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Section B-H: Head of Unit review */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Head of Unit Review
          </Typography>

          {form.status === 'AWAITING_UNIT_HEAD' && form.viewerIsUnitHead ? (
            <Stack spacing={3}>
              <Grid container spacing={1}>
                {RATING_KEYS.map((key) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={key}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{RATING_LABELS[key]}</Typography>
                      <Rating value={review[key]} onChange={(_, v) => updateRating(key, v)} />
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              <TextField
                label="Loyalty to the Institution"
                value={review.loyaltyToInstitution ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, loyaltyToInstitution: e.target.value }))}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                select
                label="Overall Grading"
                value={review.overallGrading}
                onChange={(e) => setReview((prev) => ({ ...prev, overallGrading: e.target.value as OverallGrading }))}
                fullWidth
              >
                {OVERALL_GRADINGS.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Courses/Conferences/Seminars Attended"
                value={review.coursesAttended ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, coursesAttended: e.target.value }))}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Training Needs"
                value={review.trainingNeeds ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, trainingNeeds: e.target.value }))}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                select
                label="Promotability"
                value={review.promotability}
                onChange={(e) => setReview((prev) => ({ ...prev, promotability: e.target.value as Promotability }))}
                fullWidth
              >
                {PROMOTABILITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
              {review.promotability === 'NOT_FITTED' && (
                <TextField
                  label="Comments (why not fitted)"
                  value={review.promotabilityComments ?? ''}
                  onChange={(e) => setReview((prev) => ({ ...prev, promotabilityComments: e.target.value }))}
                  multiline
                  minRows={2}
                  fullWidth
                />
              )}
              <TextField
                label="Long Term Potentials"
                value={review.longTermPotentials ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, longTermPotentials: e.target.value }))}
                multiline
                minRows={2}
                fullWidth
              />

              <Divider />
              <Typography variant="subtitle2">Health Records (Sick Leave)</Typography>
              {review.sickLeaves.map((entry, index) => (
                <Stack direction="row" spacing={2} alignItems="center" key={index}>
                  <TextField
                    label="From"
                    type="date"
                    value={entry.fromDate ?? ''}
                    onChange={(e) => updateSickLeave(index, { fromDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="To"
                    type="date"
                    value={entry.toDate ?? ''}
                    onChange={(e) => updateSickLeave(index, { toDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Days"
                    type="number"
                    value={entry.numberOfDays ?? ''}
                    onChange={(e) => updateSickLeave(index, { numberOfDays: Number(e.target.value) })}
                    sx={{ width: 100 }}
                  />
                  <IconButton aria-label="Remove sick leave entry" onClick={() => removeSickLeaveRow(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={addSickLeaveRow} sx={{ alignSelf: 'flex-start' }}>
                Add sick leave entry
              </Button>

              <Divider />
              <Typography variant="subtitle2">General Remarks &amp; Conduct</Typography>
              <TextField
                label="General Remarks"
                value={review.generalRemarks ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, generalRemarks: e.target.value }))}
                multiline
                minRows={3}
                fullWidth
              />
              <TextField
                label="Served under me for (years)"
                type="number"
                value={review.servedUnderReportingOfficerYears ?? ''}
                onChange={(e) =>
                  setReview((prev) => ({ ...prev, servedUnderReportingOfficerYears: Number(e.target.value) }))
                }
                fullWidth
              />
              <TextField
                label="Number of Queries During the Year"
                type="number"
                value={review.numberOfQueries ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, numberOfQueries: Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Pending Disciplinary Action"
                value={review.pendingDisciplinaryAction ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, pendingDisciplinaryAction: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Concluded Disciplinary Action"
                value={review.concludedDisciplinaryAction ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, concludedDisciplinaryAction: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Your Post (Reporting Officer)"
                value={review.unitHeadPost ?? ''}
                onChange={(e) => setReview((prev) => ({ ...prev, unitHeadPost: e.target.value }))}
                fullWidth
              />

              <Button variant="contained" onClick={submitUnitHeadReview} disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
                Submit Review
              </Button>
            </Stack>
          ) : unitHeadReviewed ? (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                {RATING_KEYS.map((key) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {RATING_LABELS[key]}
                    </Typography>
                    <Rating value={form[key]} readOnly />
                  </Grid>
                ))}
                <Field label="Loyalty to the Institution" value={form.loyaltyToInstitution} />
                <Field label="Overall Grading" value={form.overallGrading} />
                <Field label="Courses/Conferences/Seminars Attended" value={form.coursesAttended} />
                <Field label="Training Needs" value={form.trainingNeeds} />
                <Field label="Promotability" value={form.promotability} />
                <Field label="Promotability Comments" value={form.promotabilityComments} />
                <Field label="Long Term Potentials" value={form.longTermPotentials} />
                <Field label="General Remarks" value={form.generalRemarks} />
                <Field label="Served Under Reporting Officer (years)" value={form.servedUnderReportingOfficerYears} />
                <Field label="Number of Queries" value={form.numberOfQueries} />
                <Field label="Pending Disciplinary Action" value={form.pendingDisciplinaryAction} />
                <Field label="Concluded Disciplinary Action" value={form.concludedDisciplinaryAction} />
                <Field label="Reporting Officer" value={form.unitHeadName} />
                <Field label="Reporting Officer Post" value={form.unitHeadPost} />
              </Grid>
              {form.sickLeaves.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Health Records</Typography>
                  {form.sickLeaves.map((s) => (
                    <Typography key={s.id} variant="body2">
                      {s.fromDate ?? '—'} to {s.toDate ?? '—'} ({s.numberOfDays ?? '—'} days)
                    </Typography>
                  ))}
                </>
              )}
            </Stack>
          ) : (
            <Typography color="text.secondary">Awaiting Head of Unit review.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Section I: staff counter-comment */}
      {form.status !== 'STAFF_DRAFT' && form.status !== 'AWAITING_UNIT_HEAD' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Comments of Officer Being Reported Upon
            </Typography>
            {form.status === 'AWAITING_STAFF_COUNTER_COMMENT' && form.viewerIsOwner ? (
              <Stack spacing={2}>
                <TextField
                  label="Your Comments"
                  value={staffComments}
                  onChange={(e) => setStaffComments(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={submitStaffCounterComment}
                  disabled={submitting}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Submit Comments
                </Button>
              </Stack>
            ) : staffHasCountered ? (
              <Typography variant="body1">{form.staffComments || '—'}</Typography>
            ) : (
              <Typography color="text.secondary">Awaiting the staff member's comments.</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section J: Head of Department sign-off */}
      {staffHasCountered && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Comments and Signature of Head of Department
            </Typography>
            {form.status === 'AWAITING_DEPARTMENT_HEAD' && form.viewerIsDepartmentHead ? (
              <Stack spacing={2}>
                <TextField
                  label="Comments"
                  value={departmentHeadComments}
                  onChange={(e) => setDepartmentHeadComments(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={submitDepartmentHeadSignOff}
                  disabled={submitting}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Sign Off &amp; Complete
                </Button>
              </Stack>
            ) : departmentHeadSigned ? (
              <Stack spacing={1}>
                <Typography variant="body1">{form.departmentHeadComments || '—'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Signed by {form.departmentHeadName}
                </Typography>
              </Stack>
            ) : (
              <Typography color="text.secondary">Awaiting Head of Department sign-off.</Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
