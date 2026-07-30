import { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { StaffProfileCard } from './StaffProfileCard';
import type { StaffProfile } from './types';

export function MyProfilePage() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    httpClient
      .get<StaffProfile>('/api/staff/me')
      .then((res) => setProfile(res.data))
      .catch(() => setError('No staff profile has been set up for your account yet. Contact HR if this seems wrong.'))
      .finally(() => setLoaded(true));
  }, []);

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

  return (
    <Stack spacing={3}>
      <Typography variant="h4">My Profile</Typography>

      <StaffProfileCard profile={profile} />

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Academic Qualifications
          </Typography>
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
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Employment History
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
    </Stack>
  );
}
