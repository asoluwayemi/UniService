import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

/**
 * Composed inside <ProtectedRoute>, not a prop on it, since ProtectedRoute only supports
 * one gate (role or permission) at a time. Redirects to TOTP enrollment if the user hasn't
 * set it up yet, or to the step-up code entry if they have but their elevation has expired.
 */
export function RequireHrStepUp({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  if (!user.totpEnabled) {
    return <Navigate to="/hr/totp/enroll" state={{ from: location }} replace />;
  }

  const expiresAt = user.hrStepUpExpiresAt ? new Date(user.hrStepUpExpiresAt) : null;
  if (!expiresAt || expiresAt <= new Date()) {
    return <Navigate to="/hr/step-up" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
