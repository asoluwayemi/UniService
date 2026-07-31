import { useState, type ReactNode } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
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
import { useAuth } from '../../app/AuthContext';
import { NotificationBell } from '../../components/NotificationBell';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
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
  const { user, hasRole, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const sections: NavSection[] = [
    { label: 'Overview', items: [{ label: 'Dashboard', to: '/dashboard', icon: <DashboardIcon fontSize="small" /> }] },
    {
      label: 'Self Service',
      items: [
        { label: 'My Profile', to: '/staff/me', icon: <PersonIcon fontSize="small" /> },
        { label: 'My Account', to: '/account/password', icon: <LockIcon fontSize="small" /> },
      ],
    },
  ];

  const performanceItems: NavItem[] = [
    { label: 'My Appraisal', to: '/my-appraisal', icon: <AssignmentIcon fontSize="small" /> },
    { label: 'Appraisals Awaiting My Action', to: '/appraisals/pending', icon: <AssignmentTurnedInIcon fontSize="small" /> },
  ];
  if (hasPermission('APPRAISAL_MANAGE'))
    performanceItems.push({ label: 'Appraisal Cycles', to: '/appraisal-cycles', icon: <EventNoteIcon fontSize="small" /> });
  sections.push({ label: 'Performance', items: performanceItems });

  const adminItems: NavItem[] = [];
  if (hasRole('SYSTEM_ADMIN')) adminItems.push({ label: 'Manage Users', to: '/admin/users', icon: <GroupIcon fontSize="small" /> });
  if (adminItems.length > 0) sections.push({ label: 'Administration', items: adminItems });

  if (hasPermission('HR_PORTAL_ACCESS')) {
    const hrPortalItems: NavItem[] = [{ label: 'HR Portal', to: '/hr', icon: <AdminPanelSettingsIcon fontSize="small" /> }];

    // The sub-links only appear once step-up is actually complete -- before that, the only
    // way in is the "HR Portal" link above, which walks the user through enrollment/step-up.
    const stepUpActive = !!user?.hrStepUpExpiresAt && new Date(user.hrStepUpExpiresAt) > new Date();
    if (stepUpActive) {
      if (hasPermission('STAFF_READ')) hrPortalItems.push({ label: 'Staff Directory', to: '/staff', icon: <BadgeIcon fontSize="small" /> });
      if (hasPermission('ORG_READ')) hrPortalItems.push({ label: 'Organization', to: '/organization', icon: <AccountTreeIcon fontSize="small" /> });
      if (hasPermission('ORG_WRITE'))
        hrPortalItems.push({ label: 'My Requests', to: '/organization/my-requests', icon: <PlaylistAddCheckIcon fontSize="small" /> });
      if (hasRole('SYSTEM_ADMIN')) hrPortalItems.push({ label: 'Approvals', to: '/organization/approvals', icon: <FactCheckIcon fontSize="small" /> });
    }

    sections.push({ label: 'HR Portal', items: hrPortalItems });
  }

  function isItemActive(to: string): boolean {
    if (location.pathname === to) return true;
    if (to === '/staff' && /^\/staff\/\d+$/.test(location.pathname)) return true;
    return false;
  }

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';

  const drawerContent = (
    <Stack sx={{ height: '100%' }}>
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.01em' }}>
          UniService
        </Typography>
      </Toolbar>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pb: 1 }}>
        {sections.map((section) => (
          <Box key={section.label} sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 1.5,
                mb: 0.5,
                color: 'text.secondary',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
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
                    selected={active}
                    onClick={() => setMobileOpen(false)}
                    sx={{ mb: 0.25 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { fontSize: 14, fontWeight: active ? 600 : 500 } }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.roles[0] ? formatRoleLabel(user.roles[0]) : ''}
            </Typography>
          </Box>
          <Tooltip title="Log out">
            <IconButton size="small" onClick={handleLogout} aria-label="Log out">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" color="inherit" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((v) => !v)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main', display: { sm: 'none' } }}>
            UniService
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
          <NotificationBell />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
