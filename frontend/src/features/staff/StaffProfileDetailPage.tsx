import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import { StaffProfileCard } from './StaffProfileCard';
import { EditStaffProfileDialog } from './EditStaffProfileDialog';
import { AddQualificationDialog } from './AddQualificationDialog';
import { AddEmploymentHistoryDialog } from './AddEmploymentHistoryDialog';
import type { StaffProfile } from './types';
import type { AppraisalSummary } from '../appraisal/types';

export function StaffProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('STAFF_WRITE');
  const canReadAppraisals = hasPermission('APPRAISAL_READ');

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addQualificationOpen, setAddQualificationOpen] = useState(false);
  const [addHistoryOpen, setAddHistoryOpen] = useState(false);
  const [appraisals, setAppraisals] = useState<AppraisalSummary[] | null>(null);

  const load = useCallback(() => {
    httpClient
      .get<StaffProfile>(`/api/staff/${id}`)
      .then((res) => setProfile(res.data))
      .catch(() => setError('Could not load this staff profile.'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canReadAppraisals || !id) return;
    httpClient
      .get<AppraisalSummary[]>(`/api/appraisals/staff/${id}`)
      .then((res) => setAppraisals(res.data))
      .catch(() => setAppraisals([]));
  }, [id, canReadAppraisals]);

  async function removeQualification(qualificationId: number) {
    await httpClient.delete(`/api/staff/${id}/qualifications/${qualificationId}`);
    load();
  }

  async function removeEmploymentHistory(historyId: number) {
    await httpClient.delete(`/api/staff/${id}/employment-history/${historyId}`);
    load();
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Staff Profile</Typography>
        {canWrite && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        )}
      </Stack>

      <StaffProfileCard profile={profile} />

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Academic Qualifications</Typography>
            {canWrite && (
              <IconButton aria-label="Add qualification" onClick={() => setAddQualificationOpen(true)} size="small">
                <AddIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
          {profile.qualifications.length === 0 ? (
            <Typography color="text.secondary">No qualifications recorded.</Typography>
          ) : (
            <List disablePadding>
              {profile.qualifications.map((q) => (
                <ListItem key={q.id} divider>
                  <ListItemText
                    primary={`${q.degree}${q.fieldOfStudy ? ` — ${q.fieldOfStudy}` : ''}`}
                    secondary={`${q.institution}${q.yearObtained ? ` (${q.yearObtained})` : ''}`}
                  />
                  {canWrite && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label={`Remove qualification ${q.degree}`}
                        onClick={() => removeQualification(q.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Employment History</Typography>
            {canWrite && (
              <IconButton aria-label="Add employment history" onClick={() => setAddHistoryOpen(true)} size="small">
                <AddIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
          {profile.employmentHistory.length === 0 ? (
            <Typography color="text.secondary">No employment history recorded.</Typography>
          ) : (
            <List disablePadding>
              {profile.employmentHistory.map((h) => (
                <ListItem key={h.id} divider>
                  <ListItemText
                    primary={`${h.positionTitle} — ${h.organization}`}
                    secondary={`${h.startDate ?? 'Unknown'} – ${h.endDate ?? 'Present'}${h.description ? ` · ${h.description}` : ''}`}
                  />
                  {canWrite && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label={`Remove employment history at ${h.organization}`}
                        onClick={() => removeEmploymentHistory(h.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {canReadAppraisals && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Appraisal History
            </Typography>
            {appraisals === null ? (
              <Typography color="text.secondary">Loading…</Typography>
            ) : appraisals.length === 0 ? (
              <Typography color="text.secondary">No appraisals recorded.</Typography>
            ) : (
              <List disablePadding>
                {appraisals.map((a) => (
                  <ListItem key={a.id} divider disablePadding>
                    <ListItemButton onClick={() => navigate(`/appraisals/${a.id}`)}>
                      <ListItemText primary={`${a.cycleYear} Appraisal`} />
                      <Chip label={a.status.replace(/_/g, ' ')} size="small" color={a.status === 'COMPLETED' ? 'success' : 'default'} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {editOpen && (
        <EditStaffProfileDialog
          open
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            load();
          }}
        />
      )}
      {addQualificationOpen && (
        <AddQualificationDialog
          open
          staffProfileId={profile.id}
          onClose={() => setAddQualificationOpen(false)}
          onAdded={() => {
            setAddQualificationOpen(false);
            load();
          }}
        />
      )}
      {addHistoryOpen && (
        <AddEmploymentHistoryDialog
          open
          staffProfileId={profile.id}
          onClose={() => setAddHistoryOpen(false)}
          onAdded={() => {
            setAddHistoryOpen(false);
            load();
          }}
        />
      )}
    </Stack>
  );
}
