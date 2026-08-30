import { useState, type ReactNode } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LockIcon from '@mui/icons-material/LockOutlined';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import ApartmentIcon from '@mui/icons-material/Apartment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import { NotificationBell } from '../../components/NotificationBell';

const DRAWER_WIDTH = 270;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  badgeColor?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function formatRoleLabel(role: string): string {
  return role
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export function DashboardLayout() {
  const { user, hasRole, hasPermission, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  async function handleExitHrServices() {
    try {
      await httpClient.post('/api/hr/step-up/exit');
      await refreshUser();
      navigate('/dashboard');
    } catch {
      // fallback
    }
  }

  const stepUpActive = !!user?.hrStepUpExpiresAt && new Date(user.hrStepUpExpiresAt) > new Date();

  const sections: NavSection[] = [];

  if (stepUpActive) {
    // EXCLUSIVE HR PORTAL MODE: Show ONLY HR features
    const hrPortalItems: NavItem[] = [
      { label: 'HR Portal Home', to: '/hr', icon: <AdminPanelSettingsIcon fontSize="small" />, badgeColor: '#14b8a6' },
    ];
    if (hasPermission('HR_USER_MANAGE')) {
      hrPortalItems.push({ label: 'Staff Registration', to: '/admin/users', icon: <GroupIcon fontSize="small" />, badgeColor: '#10b981' });
    }
    if (hasPermission('STAFF_READ')) {
      hrPortalItems.push({ label: 'Staff Directory', to: '/staff', icon: <BadgeIcon fontSize="small" />, badgeColor: '#0284c7' });
    }
    if (hasPermission('ORG_READ')) {
      hrPortalItems.push({ label: 'Organization Chart', to: '/organization', icon: <AccountTreeIcon fontSize="small" />, badgeColor: '#f43f5e' });
    }
    if (hasPermission('ORG_WRITE')) {
      hrPortalItems.push({ label: 'My Requests', to: '/organization/my-requests', icon: <PlaylistAddCheckIcon fontSize="small" />, badgeColor: '#8b5cf6' });
    }
    if (hasPermission('APPRAISAL_MANAGE')) {
      hrPortalItems.push({ label: 'Appraisal Cycles', to: '/appraisal-cycles', icon: <EventNoteIcon fontSize="small" />, badgeColor: '#f59e0b' });
    }
    if (hasPermission('PROMOTION_MANAGE')) {
      hrPortalItems.push({ label: 'Promotion Review', to: '/promotions/review', icon: <TrendingUpIcon fontSize="small" />, badgeColor: '#ec4899' });
    }
    if (hasRole('SYSTEM_ADMIN')) {
      hrPortalItems.push({ label: 'Approvals Queue', to: '/organization/approvals', icon: <FactCheckIcon fontSize="small" />, badgeColor: '#ef4444' });
    }
    if (hasPermission('DEPLOYMENT_TRIGGER')) {
      hrPortalItems.push({ label: 'Developer Tools', to: '/developer', icon: <RocketLaunchIcon fontSize="small" />, badgeColor: '#6366f1' });
    }

    sections.push({ label: 'HR SERVICES PORTAL', items: hrPortalItems });
  } else {
    // STANDARD STAFF / LEADERSHIP MODE
    sections.push({
      label: 'OVERVIEW',
      items: [{ label: 'Dashboard', to: '/dashboard', icon: <DashboardIcon fontSize="small" />, badgeColor: '#8b5cf6' }],
    });

    const selfServiceItems: NavItem[] = [
      { label: 'My Profile', to: '/staff/me', icon: <PersonIcon fontSize="small" />, badgeColor: '#10b981' },
      { label: 'My Account', to: '/account/password', icon: <LockIcon fontSize="small" />, badgeColor: '#0284c7' },
      { label: 'Leave Requests', to: '/leave', icon: <BeachAccessIcon fontSize="small" />, badgeColor: '#f59e0b' },
      { label: 'Career Progression', to: '/career', icon: <TrendingUpIcon fontSize="small" />, badgeColor: '#ec4899' },
    ];

    if (hasRole('DEAN')) {
      selfServiceItems.push({ label: 'Dean Portal', to: '/dean', icon: <SchoolIcon fontSize="small" />, badgeColor: '#8b5cf6' });
    } else if (hasRole('HOD')) {
      selfServiceItems.push({ label: 'HoD Portal', to: '/hod', icon: <ApartmentIcon fontSize="small" />, badgeColor: '#0284c7' });
    } else if (hasRole('HOU')) {
      selfServiceItems.push({ label: 'HoU Portal (Appraise)', to: '/hou', icon: <RateReviewIcon fontSize="small" />, badgeColor: '#10b981' });
    }

    sections.push({ label: 'SELF SERVICE', items: selfServiceItems });

    const performanceItems: NavItem[] = [
      { label: 'My Appraisal', to: '/my-appraisal', icon: <AssignmentIcon fontSize="small" />, badgeColor: '#8b5cf6' },
      { label: 'Pending Actions', to: '/appraisals/pending', icon: <AssignmentTurnedInIcon fontSize="small" />, badgeColor: '#ef4444' },
    ];
    sections.push({ label: 'PERFORMANCE', items: performanceItems });

    if (hasPermission('HR_PORTAL_ACCESS')) {
      sections.push({
        label: 'HR PORTAL',
        items: [{ label: 'Enter HR Portal', to: '/hr', icon: <AdminPanelSettingsIcon fontSize="small" />, badgeColor: '#14b8a6' }],
      });
    }

    if (hasPermission('DEPLOYMENT_TRIGGER')) {
      sections.push({
        label: 'DEVELOPER TOOLS',
        items: [{ label: 'Push / Deploy', to: '/developer', icon: <RocketLaunchIcon fontSize="small" />, badgeColor: '#6366f1' }],
      });
    }
  }

  function isItemActive(to: string): boolean {
    if (location.pathname === to) return true;
    if (to === '/staff' && /^\/staff\/\d+$/.test(location.pathname)) return true;
    return false;
  }

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'US';

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname === '/academic-portal') return 'Academic Staff Portal';
    if (location.pathname === '/dean') return 'Dean Governance Portal';
    if (location.pathname === '/hod') return 'Head of Department (HoD) Portal';
    if (location.pathname === '/hou') return 'Head of Unit (HoU) Staff Appraisal Engine';
    if (location.pathname === '/leave') return 'Leave Management';
    if (location.pathname === '/career') return 'Career Progression';
    if (location.pathname === '/promotions/review') return 'Promotion Review';
    if (location.pathname === '/developer') return 'Developer Tools';
    if (/^\/promotions\/\d+$/.test(location.pathname)) return 'Promotion Application';
    if (location.pathname === '/staff/me') return 'My Profile';
    if (location.pathname === '/staff') return 'Staff Directory';
    if (location.pathname === '/organization') return 'Organization Chart';
    if (location.pathname === '/admin/users') return 'Staff Registration & Users';
    if (location.pathname === '/hr') return 'HR Services Portal';
    return 'UniService System';
  };

  const drawerContent = (
    <Stack sx={{ height: '100%', bgcolor: '#17103a', color: '#ffffff' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: stepUpActive
              ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
              : 'linear-gradient(135deg, #7c3aed 0%, #d946ef 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.5)',
          }}
        >
          <SchoolIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: -0.5, lineHeight: 1.1 }}>
            UNISERVICE
          </Typography>
          <Typography variant="caption" sx={{ color: stepUpActive ? '#6ee7b7' : '#a78bfa', fontSize: '10px', fontWeight: 700, letterSpacing: 0.5 }}>
            {stepUpActive ? 'HR SERVICES ACTIVE' : 'ENTERPRISE UHCM'}
          </Typography>
        </Box>
      </Box>

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        {sections.map((section) => (
          <Box key={section.label} sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 1.5,
                mb: 1,
                color: stepUpActive ? '#6ee7b7' : '#94a3b8',
                fontWeight: 800,
                letterSpacing: '0.08em',
                fontSize: '10px',
              }}
            >
              {section.label}
            </Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const active = isItemActive(item.to);
                return (
                  <ListItemButton
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    sx={{
                      mb: 0.6,
                      borderRadius: '12px',
                      py: 1,
                      px: 1.5,
                      background: active
                        ? stepUpActive
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                        : 'transparent',
                      color: active ? '#ffffff' : '#cbd5e1',
                      boxShadow: active ? '0 6px 18px rgba(124, 58, 237, 0.45)' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: active
                          ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                          : 'rgba(255, 255, 255, 0.06)',
                        color: '#ffffff',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 34,
                        color: active ? '#ffffff' : item.badgeColor || '#a78bfa',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { fontSize: 13.5, fontWeight: active ? 700 : 500 } }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* User Profile Card Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', bgcolor: stepUpActive ? '#064e3b' : '#241a54' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 38, height: 38, bgcolor: stepUpActive ? '#059669' : '#7c3aed', fontSize: 14, fontWeight: 700, border: '2px solid rgba(255,255,255,0.2)' }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#ffffff' }} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" sx={{ color: stepUpActive ? '#6ee7b7' : '#a78bfa', fontWeight: 600 }} noWrap>
              {stepUpActive ? 'HR Officer Active' : (user?.roles ?? [])[0] ? formatRoleLabel((user?.roles ?? [])[0]) : 'Staff'}
            </Typography>
          </Box>

          {stepUpActive ? (
            <Tooltip title="Exit HR Services">
              <IconButton size="small" onClick={handleExitHrServices} sx={{ color: '#f59e0b', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.15)' } }} aria-label="Exit HR Services">
                <ExitToAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Log out">
              <IconButton size="small" onClick={handleLogout} sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }} aria-label="Log out">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Stack>
  );

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', minHeight: '100vh' }}>
      {/* Top Header Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          background: stepUpActive
            ? 'linear-gradient(90deg, #047857 0%, #059669 100%)'
            : 'linear-gradient(90deg, #1e40af 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.15)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen((v) => !v)}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.2rem', letterSpacing: -0.3 }}>
              {getPageTitle()}
            </Typography>
            {stepUpActive && (
              <Chip
                label="HR Portal Active"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 800, fontSize: '11px' }}
              />
            )}
          </Stack>

          {/* Search Bar & Date Widget */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <TextField
              placeholder="Search staff, requests, units..."
              size="small"
              sx={{
                display: { xs: 'none', md: 'block' },
                width: 280,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderRadius: '20px',
                  '& fieldset': { border: 'none' },
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.22)' },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1,
                  fontSize: '13px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#ffffff', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Date Pill Widget */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.6,
                borderRadius: '20px',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 14 }} />
              {formattedDate}
            </Box>

            {stepUpActive && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ExitToAppIcon />}
                onClick={handleExitHrServices}
                sx={{
                  bgcolor: '#ef4444',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '20px',
                  px: 2,
                  '&:hover': { bgcolor: '#dc2626' },
                }}
              >
                Exit HR Services
              </Button>
            )}

            <NotificationBell />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 'none' },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2.5, sm: 4 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: '#f1f5f9',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
