import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BadgeIcon from '@mui/icons-material/Badge';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import { RecentNotificationsCard } from './RecentNotificationsCard';
import type { StaffProfileSummary } from '../staff/types';
import type { OrgUnit, ChangeRequest } from '../organization/types';
import type { UserSummary } from '../auth/types';

interface QuickActionTile {
  id: string;
  label: string;
  subtitle: string;
  to: string;
  icon: ReactNode;
  bgTint: string;
  iconBg: string;
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
  const isSystemAdmin = hasRole('SYSTEM_ADMIN');

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

  const quickActionTiles: QuickActionTile[] = [
    {
      id: 'academic',
      label: 'Academic Staff Portal',
      subtitle: 'Teaching, research & PG supervision',
      to: '/academic-portal',
      icon: <SchoolIcon sx={{ color: '#fff', fontSize: 24 }} />,
      bgTint: '#e0e7ff',
      iconBg: '#4f46e5',
    },
    {
      id: 'staff',
      label: 'Staff Directory',
      subtitle: 'View workforce & academic profiles',
      to: '/staff',
      icon: <BadgeIcon sx={{ color: '#fff', fontSize: 24 }} />,
      bgTint: '#e0f2fe',
      iconBg: '#0284c7',
    },
    {
      id: 'leave',
      label: 'Request Leave',
      subtitle: 'Entitlements, handovers & allowances',
      to: '/leave',
      icon: <BeachAccessIcon sx={{ color: '#fff', fontSize: 24 }} />,
      bgTint: '#d1fae5',
      iconBg: '#10b981',
    },
    {
      id: 'career',
      label: 'Career Progression',
      subtitle: 'Check eligibility & apply for promotion',
      to: '/career',
      icon: <TrendingUpIcon sx={{ color: '#fff', fontSize: 24 }} />,
      bgTint: '#f3e8ff',
      iconBg: '#8b5cf6',
    },
    {
      id: 'appraisal',
      label: 'My Appraisal',
      subtitle: 'APER targets & self-evaluations',
      to: '/my-appraisal',
      icon: <AssignmentIcon sx={{ color: '#fff', fontSize: 24 }} />,
      bgTint: '#fef3c7',
      iconBg: '#f59e0b',
    },
    {
      id: 'org',
      label: 'Organization Chart',
      subtitle: 'Colleges, faculties & departments',
      to: '/organization',
      icon: <AccountTreeIcon sx={{ color: '#fff', fontSize: 24 }} />,
      bgTint: '#ffe4e6',
      iconBg: '#f43f5e',
    },
  ];

  return (
    <Stack spacing={3.5}>
      {/* Welcome Banner */}
      <Box sx={{ p: 3, borderRadius: '16px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#fff', boxShadow: '0 8px 30px rgba(30, 27, 75, 0.2)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Welcome back, {user.firstName}! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: '#c7d2fe', fontSize: '0.95rem' }}>
          {user.email} · System Administrator Portal
        </Typography>
      </Box>

      {/* VIBRANT TOP STAT CARDS ROW (Matching Screenshot #2 Top Row) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {/* Card 1: Total Staff */}
        <Card sx={{ borderTop: '4px solid #10b981', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' }, transition: 'all 0.2s' }} onClick={() => navigate('/staff')}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  TOTAL STAFF
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {staffCount ?? '—'}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 46, height: 46 }}>
                <GroupsIcon />
              </Avatar>
            </Stack>
            <Chip
              size="small"
              icon={<ArrowUpwardIcon sx={{ fontSize: '12px !important', color: '#065f46 !important' }} />}
              label={staffCount !== null ? `${academicCount} Academic · ${staffCount - academicCount} Non-Academic` : 'Workforce Record'}
              sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '11px' }}
            />
          </CardContent>
        </Card>

        {/* Card 2: Pending Approvals */}
        <Card sx={{ borderTop: '4px solid #8b5cf6', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' }, transition: 'all 0.2s' }} onClick={() => navigate('/organization/approvals')}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  PENDING APPROVALS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {pendingApprovalsCount ?? '—'}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', width: 46, height: 46 }}>
                <FactCheckIcon />
              </Avatar>
            </Stack>
            <Chip
              size="small"
              label="Requires Executive Review"
              sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', fontWeight: 700, fontSize: '11px' }}
            />
          </CardContent>
        </Card>

        {/* Card 3: System Users */}
        <Card sx={{ borderTop: '4px solid #0284c7', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' }, transition: 'all 0.2s' }} onClick={() => navigate('/admin/users')}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  SYSTEM USERS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {userCount ?? '—'}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', width: 46, height: 46 }}>
                <ManageAccountsIcon />
              </Avatar>
            </Stack>
            <Chip
              size="small"
              label="RBAC Accounts Active"
              sx={{ bgcolor: '#e0f2fe', color: '#075985', fontWeight: 700, fontSize: '11px' }}
            />
          </CardContent>
        </Card>

        {/* Card 4: Org Structure */}
        <Card sx={{ borderTop: '4px solid #f59e0b', cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' }, transition: 'all 0.2s' }} onClick={() => navigate('/organization')}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  FACULTIES & UNITS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {(orgUnitCounts?.faculty ?? 0) + (orgUnitCounts?.department ?? 0)}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 46, height: 46 }}>
                <AccountBalanceIcon />
              </Avatar>
            </Stack>
            <Chip
              size="small"
              label={`${orgUnitCounts?.college ?? 0} Colleges · ${orgUnitCounts?.faculty ?? 0} Faculties`}
              sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '11px' }}
            />
          </CardContent>
        </Card>
      </Box>

      {/* QUICK ACTIONS GRID TILES (Matching Screenshot #2 Pastel Tiles Grid) */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Quick Portals & Actions
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {quickActionTiles.map((tile) => (
            <Card
              key={tile.id}
              onClick={() => navigate(tile.to)}
              sx={{
                bgcolor: tile.bgTint,
                border: 'none',
                cursor: 'pointer',
                p: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: tile.iconBg, width: 48, height: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {tile.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      {tile.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475467', fontSize: '0.8rem', mt: 0.4 }}>
                      {tile.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* BOTTOM SECTION: Notifications & Role Access */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
        <RecentNotificationsCard />

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Your System Access
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
              ACTIVE ROLES
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
              {user.roles.map((role) => (
                <Chip key={role} label={role} color="primary" sx={{ fontWeight: 700 }} size="small" />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
              SYSTEM PERMISSIONS
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {user.permissions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No permissions assigned.
                </Typography>
              ) : (
                user.permissions.map((permission) => (
                  <Chip key={permission} label={permission} color="secondary" variant="outlined" sx={{ fontWeight: 700 }} size="small" />
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
