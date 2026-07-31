import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BadgeIcon from '@mui/icons-material/Badge';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import GroupIcon from '@mui/icons-material/Group';
import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import { StatCard } from './StatCard';
import { RecentNotificationsCard } from './RecentNotificationsCard';
import type { StaffProfileSummary } from '../staff/types';
import type { OrgUnit, ChangeRequest } from '../organization/types';
import type { UserSummary } from '../auth/types';

interface QuickAction {
  label: string;
  icon: ReactNode;
  to: string;
}

interface OrgUnitCounts {
  college: number;
  faculty: number;
  department: number;
  unit: number;
}

export function AdminDashboardHome() {
  const { user, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();

  const canReadStaff = hasPermission('STAFF_READ') || hasPermission('STAFF_READ_SUBTREE');
  const canReadOrg = hasPermission('ORG_READ') || hasPermission('ORG_READ_SUBTREE');
  const canWriteOrg = hasPermission('ORG_WRITE');
  const isSystemAdmin = hasRole('SYSTEM_ADMIN');

  // HR-portal-tier users (blanket STAFF_READ/ORG_READ/ORG_WRITE) must have completed the
  // HR step-up before these links are shown or their counts fetched -- same gate as the
  // sidebar nav, so nothing HR-only surfaces before the user is actually inside HR Portal.
  const isHrPortalTier = hasPermission('HR_PORTAL_ACCESS');
  const stepUpActive = !!user?.hrStepUpExpiresAt && new Date(user.hrStepUpExpiresAt) > new Date();
  const hrGateOk = !isHrPortalTier || stepUpActive;

  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [academicCount, setAcademicCount] = useState(0);
  const [orgUnitCounts, setOrgUnitCounts] = useState<OrgUnitCounts | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    if (!canReadStaff || !hrGateOk) return;
    httpClient
      .get<StaffProfileSummary[]>('/api/staff')
      .then((res) => {
        setStaffCount(res.data.length);
        setAcademicCount(res.data.filter((s) => s.category === 'ACADEMIC').length);
      })
      .catch(() => setStaffCount(0));
  }, [canReadStaff, hrGateOk]);

  useEffect(() => {
    if (!canReadOrg || !hrGateOk) return;
    httpClient
      .get<OrgUnit[]>('/api/org/units')
      .then((res) => {
        const active = res.data.filter((u) => u.status === 'ACTIVE');
        setOrgUnitCounts({
          college: active.filter((u) => u.type === 'COLLEGE').length,
          faculty: active.filter((u) => u.type === 'FACULTY').length,
          department: active.filter((u) => u.type === 'DEPARTMENT').length,
          unit: active.filter((u) => u.type === 'UNIT').length,
        });
      })
      .catch(() => setOrgUnitCounts({ college: 0, faculty: 0, department: 0, unit: 0 }));
  }, [canReadOrg, hrGateOk]);

  useEffect(() => {
    if (!isSystemAdmin) return;
    if (hrGateOk) {
      httpClient
        .get<ChangeRequest[]>('/api/org/change-requests/pending')
        .then((res) => setPendingApprovalsCount(res.data.length))
        .catch(() => setPendingApprovalsCount(0));
    }
    httpClient
      .get<UserSummary[]>('/api/auth/users')
      .then((res) => setUserCount(res.data.length))
      .catch(() => setUserCount(0));
  }, [isSystemAdmin, hrGateOk]);

  if (!user) return null;

  const quickActions: QuickAction[] = [];
  if (canReadStaff && hrGateOk) quickActions.push({ label: 'Staff Directory', icon: <BadgeIcon />, to: '/staff' });
  if (canReadOrg && hrGateOk) quickActions.push({ label: 'Organization', icon: <AccountTreeIcon />, to: '/organization' });
  if (canWriteOrg && hrGateOk) quickActions.push({ label: 'My Requests', icon: <PlaylistAddCheckIcon />, to: '/organization/my-requests' });
  if (isSystemAdmin && hrGateOk) quickActions.push({ label: 'Approvals', icon: <FactCheckIcon />, to: '/organization/approvals' });
  if (isSystemAdmin) quickActions.push({ label: 'Manage Users', icon: <GroupIcon />, to: '/admin/users' });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Welcome back, {user.firstName}</Typography>
        <Typography variant="body1" color="text.secondary">
          {user.email}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {canReadStaff && hrGateOk && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<GroupsIcon />}
              color="primary"
              label="Total Staff"
              value={staffCount ?? '—'}
              caption={staffCount !== null ? `${academicCount} academic · ${staffCount - academicCount} non-academic` : undefined}
              onClick={() => navigate('/staff')}
            />
          </Grid>
        )}
        {isSystemAdmin && hrGateOk && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FactCheckIcon />}
              color="warning"
              label="Pending Approvals"
              value={pendingApprovalsCount ?? '—'}
              onClick={() => navigate('/organization/approvals')}
            />
          </Grid>
        )}
        {isSystemAdmin && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<ManageAccountsIcon />}
              color="info"
              label="System Users"
              value={userCount ?? '—'}
              onClick={() => navigate('/admin/users')}
            />
          </Grid>
        )}
      </Grid>

      {canReadOrg && hrGateOk && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Organization
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<SchoolIcon />}
                color="secondary"
                label="Colleges"
                value={orgUnitCounts?.college ?? '—'}
                onClick={() => navigate('/organization')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<AccountBalanceIcon />}
                color="secondary"
                label="Faculties"
                value={orgUnitCounts?.faculty ?? '—'}
                onClick={() => navigate('/organization')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<ApartmentIcon />}
                color="secondary"
                label="Departments"
                value={orgUnitCounts?.department ?? '—'}
                onClick={() => navigate('/organization')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<GroupWorkIcon />}
                color="secondary"
                label="Units"
                value={orgUnitCounts?.unit ?? '—'}
                onClick={() => navigate('/organization')}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              {quickActions.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No quick actions available for your role.
                </Typography>
              )}
              <Grid container spacing={1.5}>
                {quickActions.map((action) => (
                  <Grid key={action.to} size={{ xs: 12, sm: 6 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => navigate(action.to)}
                      sx={{ justifyContent: 'flex-start', py: 1.25 }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
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
            Your Access
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            {user.roles.map((role) => (
              <Chip key={role} label={role} color="primary" variant="outlined" size="small" />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {user.permissions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No permissions assigned.
              </Typography>
            )}
            {user.permissions.map((permission) => (
              <Chip key={permission} label={permission} color="secondary" variant="outlined" size="small" />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
