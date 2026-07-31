import { useAuth } from '../../app/AuthContext';
import { AdminDashboardHome } from './AdminDashboardHome';
import { AcademicStaffDashboard } from './AcademicStaffDashboard';
import { NonAcademicStaffDashboard } from './NonAcademicStaffDashboard';

export function DashboardHome() {
  const { user, hasPermission } = useAuth();

  if (!user) return null;

  const isManagement =
    hasPermission('STAFF_READ') ||
    hasPermission('STAFF_READ_SUBTREE') ||
    hasPermission('ORG_READ') ||
    hasPermission('ORG_READ_SUBTREE') ||
    hasPermission('USER_MANAGE') ||
    hasPermission('HR_USER_MANAGE');
  if (isManagement) {
    return <AdminDashboardHome />;
  }

  if (user.roles.includes('NON_ACADEMIC_STAFF')) {
    return <NonAcademicStaffDashboard />;
  }

  return <AcademicStaffDashboard />;
}
