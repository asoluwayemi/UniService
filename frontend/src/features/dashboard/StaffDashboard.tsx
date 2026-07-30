import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import { RecentNotificationsCard } from './RecentNotificationsCard';
import type { StaffProfile } from '../staff/types';

interface StaffDashboardProps {
  audienceLabel: string;
}

export function StaffDashboard({ audienceLabel }: StaffDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    httpClient
      .get<StaffProfile>('/api/staff/me')
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setProfileChecked(true));
  }, []);

  if (!user) return null;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Welcome back, {user.firstName}</Typography>
        <Typography variant="body1" color="text.secondary">
          {audienceLabel} · {user.email}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                <Typography variant="h6">My Profile</Typography>
                {profile && (
                  <Chip
                    label={profile.employmentStatus}
                    size="small"
                    color={profile.employmentStatus === 'ACTIVE' ? 'success' : 'default'}
                  />
                )}
              </Stack>

              {!profileChecked && (
                <Typography variant="body2" color="text.secondary">
                  Loading…
                </Typography>
              )}

              {profileChecked && !profile && (
                <Typography variant="body2" color="text.secondary">
                  Your staff profile hasn't been set up yet. Contact HR if this seems wrong.
                </Typography>
              )}

              {profile && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Staff No.</strong> {profile.staffNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Designation</strong> {profile.designation ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Department</strong> {profile.orgUnitName ?? '—'}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                    onClick={() => navigate('/staff/me')}
                  >
                    View full profile
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <RecentNotificationsCard />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonIcon />}
                onClick={() => navigate('/staff/me')}
                sx={{ justifyContent: 'flex-start', py: 1.25 }}
              >
                My Profile
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => navigate('/account/password')}
                sx={{ justifyContent: 'flex-start', py: 1.25 }}
              >
                Change Password
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
