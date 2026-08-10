import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';

import { httpClient } from '../../app/httpClient';
import { StaffProfileCard } from './StaffProfileCard';
import { AddQualificationDialog } from './AddQualificationDialog';
import { AcademicProgressSection } from './AcademicProgressSection';
import { NonAcademicProgressSection } from './NonAcademicProgressSection';
import { GenerateCvModal } from './GenerateCvModal';
import type { StaffProfile } from './types';

export function MyProfilePage() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [addQualificationOpen, setAddQualificationOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);

  const loadProfile = () => {
    httpClient
      .get<StaffProfile>('/api/staff/me')
      .then((res) => setProfile(res.data))
      .catch(() => setError('No staff profile has been set up for your account yet. Contact HR if this seems wrong.'))
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const removeQualification = async (qualificationId: number) => {
    if (!profile) return;
    try {
      await httpClient.delete(`/api/staff/${profile.id}/qualifications/${qualificationId}`);
      loadProfile();
    } catch {
      // ignore
    }
  };

  if (!loaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return <Alert severity="info">{error}</Alert>;
  }

  const isAcademic = profile.category === 'ACADEMIC';

  return (
    <Stack spacing={3.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          My Staff Profile
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DescriptionIcon />}
          onClick={() => setCvModalOpen(true)}
          sx={{ fontWeight: 700, borderRadius: '10px', px: 2.5 }}
        >
          Generate CV
        </Button>
      </Stack>

      <StaffProfileCard profile={profile} />

      {/* Conditional Progress Section based on Academic vs Non-Academic */}
      {isAcademic ? (
        <AcademicProgressSection staffProfileId={profile.id} isMine={true} />
      ) : (
        <NonAcademicProgressSection
          staffProfileId={profile.id}
          isMine={true}
          scheduleOfDuties={profile.scheduleOfDuties}
        />
      )}

      {/* Academic & Professional Qualifications */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Academic & Professional Qualifications
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddQualificationOpen(true)}
            >
              Add Qualification
            </Button>
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
                  <ListItemSecondaryAction>
                    <IconButton edge="end" color="error" onClick={() => removeQualification(q.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Employment History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Employment & Cadre History
          </Typography>
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
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {addQualificationOpen && (
        <AddQualificationDialog
          open
          staffProfileId={profile.id}
          onClose={() => setAddQualificationOpen(false)}
          onAdded={() => {
            setAddQualificationOpen(false);
            loadProfile();
          }}
        />
      )}

      {cvModalOpen && (
        <GenerateCvModal
          open
          profile={profile}
          onClose={() => setCvModalOpen(false)}
        />
      )}
    </Stack>
  );
}
