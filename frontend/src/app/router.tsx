import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardLayout } from '../features/dashboard/DashboardLayout';
import { DashboardHome } from '../features/dashboard/DashboardHome';
import { ChangePasswordPage } from '../features/account/ChangePasswordPage';
import { UsersPage } from '../features/admin/UsersPage';
import { OrgUnitsPage } from '../features/organization/OrgUnitsPage';
import { MyRequestsPage } from '../features/organization/MyRequestsPage';
import { ApprovalsPage } from '../features/organization/ApprovalsPage';
import { StaffDirectoryPage } from '../features/staff/StaffDirectoryPage';
import { StaffProfileDetailPage } from '../features/staff/StaffProfileDetailPage';
import { MyProfilePage } from '../features/staff/MyProfilePage';
import { AppraisalCyclesPage } from '../features/appraisal/AppraisalCyclesPage';
import { MyAppraisalPage } from '../features/appraisal/MyAppraisalPage';
import { PendingAppraisalActionsPage } from '../features/appraisal/PendingAppraisalActionsPage';
import { AppraisalDetailPage } from '../features/appraisal/AppraisalDetailPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/account/password" element={<ChangePasswordPage />} />
        <Route path="/staff/me" element={<MyProfilePage />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredPermission="STAFF_READ">
              <StaffDirectoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <ProtectedRoute requiredPermission="STAFF_READ">
              <StaffProfileDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="SYSTEM_ADMIN">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute requiredPermission="ORG_READ">
              <OrgUnitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/my-requests"
          element={
            <ProtectedRoute requiredPermission="ORG_WRITE">
              <MyRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/approvals"
          element={
            <ProtectedRoute requiredRole="SYSTEM_ADMIN">
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/my-appraisal" element={<MyAppraisalPage />} />
        <Route path="/appraisals/pending" element={<PendingAppraisalActionsPage />} />
        <Route path="/appraisals/:id" element={<AppraisalDetailPage />} />
        <Route
          path="/appraisal-cycles"
          element={
            <ProtectedRoute requiredPermission="APPRAISAL_MANAGE">
              <AppraisalCyclesPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
