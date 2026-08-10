import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, Chip, IconButton, InputAdornment, Stack, TextField,
  Typography
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SecurityIcon from '@mui/icons-material/Security';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { useAuth } from '../../../app/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string>('academic');

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      setError('Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  }

  const portals = [
    {
      id: 'academic',
      title: 'Academic & Faculty Portal',
      subtitle: 'Faculty rosters, research grants & grade submissions',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      icon: <SchoolIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
    },
    {
      id: 'hr',
      title: 'HR & Talent Operations',
      subtitle: 'Staff onboarding, APER evaluations, & promotions',
      gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
      icon: <PeopleAltIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
    },
    {
      id: 'leadership',
      title: 'Executive Leadership & Deans',
      subtitle: 'University-wide metrics, org chart & governance',
      gradient: 'linear-gradient(135deg, #d946ef 0%, #e11d48 100%)',
      icon: <WorkspacePremiumIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
    },
    {
      id: 'audit',
      title: 'Audit & RBAC Security',
      subtitle: 'Real-time compliance, permission matrices & logs',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
      icon: <SecurityIcon sx={{ fontSize: 26, color: '#ffffff' }} />,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#0b0f19', color: '#ffffff', overflow: 'hidden' }}>
      {/* LEFT HERO & COLOURFUL PORTALS PANEL (60% width desktop) */}
      <Box
        sx={{
          flex: { xs: '0 0 100%', md: '0 0 58%', lg: '0 0 62%' },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justify: 'space-between',
          p: { md: 5, lg: 7 },
          position: 'relative',
          background: 'radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.25) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(217, 70, 239, 0.2) 0%, transparent 45%), #090d16',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Brand Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            }}
          >
            <SchoolIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
              UniService
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontWeight: 500 }}>
              ENTERPRISE UHCM PLATFORM
            </Typography>
          </Box>
          <Chip
            size="small"
            icon={<VerifiedUserIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
            label="SYSTEM OPERATIONAL"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
              fontSize: '11px',
              ml: 'auto !important',
            }}
          />
        </Stack>

        {/* Hero Title & Intro */}
        <Box sx={{ my: 'auto', py: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: -1,
              lineHeight: 1.2,
              mb: 2,
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Unified Higher Education Human Capital & Governance
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 620, mb: 4, fontSize: '1.05rem', lineHeight: 1.6 }}>
            Select your functional portal below to explore university workforce operations, promotion workflows, leave allowances, and administrative analytics.
          </Typography>

          {/* Colourful Portals Showcase */}
          <Stack spacing={2}>
            {portals.map((portal) => {
              const isSelected = selectedPortal === portal.id;
              return (
                <Card
                  key={portal.id}
                  onClick={() => setSelectedPortal(portal.id)}
                  sx={{
                    cursor: 'pointer',
                    p: 2.2,
                    borderRadius: '16px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
                    transition: 'all 0.3s ease',
                    transform: isSelected ? 'translateX(8px)' : 'none',
                    boxShadow: isSelected ? '0 12px 32px rgba(0,0,0,0.3)' : 'none',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: portal.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                      }}
                    >
                      {portal.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                        {portal.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem', mt: 0.3 }}>
                        {portal.subtitle}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ color: isSelected ? '#ffffff' : '#64748b', transition: 'transform 0.2s', transform: isSelected ? 'translateX(4px)' : 'none' }} />
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </Box>

        {/* Footer */}
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          © {new Date().getFullYear()} UniService Enterprise UHCM System. All rights reserved. Protected by 256-bit AES & Multi-Factor Authentication.
        </Typography>
      </Box>

      {/* RIGHT AUTH CARD FORM PANEL (40% width desktop) */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 42%', lg: '0 0 38%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5, md: 6 },
          bgcolor: '#ffffff',
          color: '#0f172a',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile Header Logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', spacing: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <SchoolIcon sx={{ color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              UniService
            </Typography>
          </Box>

          <Stack spacing={1} sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
              Sign In
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
              Access your institutional account and university portals.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                fullWidth
                sx={{
                  py: 1.6,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                    boxShadow: '0 12px 28px rgba(79, 70, 229, 0.45)',
                  },
                }}
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          {/* Security Notice */}
          <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <LockOutlinedIcon sx={{ fontSize: 14 }} /> Protected by JWT Authorization & TLS 1.3
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
