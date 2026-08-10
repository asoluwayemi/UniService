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
import { TotpEnrollPage } from '../features/hr/TotpEnrollPage';
import { HrStepUpPage } from '../features/hr/HrStepUpPage';
import { HrPortalHome } from '../features/hr/HrPortalHome';
import { LeaveRequestsPage } from '../features/leave/LeaveRequestsPage';
import { CareerProgressionPage } from '../features/promotion/CareerProgressionPage';

import { DeanPortalPage } from '../features/leadership/DeanPortalPage';
import { HodPortalPage } from '../features/leadership/HodPortalPage';
import { HouPortalPage } from '../features/leadership/HouPortalPage';
import { AcademicPortalPage } from '../features/academic/AcademicPortalPage';

import { ProtectedRoute } from '../components/ProtectedRoute';
import { RequireHrStepUp } from '../components/RequireHrStepUp';

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
        <Route path="/academic-portal" element={<AcademicPortalPage />} />
        <Route path="/leave" element={<LeaveRequestsPage />} />
        <Route path="/career" element={<CareerProgressionPage />} />

        {/* Academic Leadership Portals */}
        <Route path="/dean" element={<DeanPortalPage />} />
        <Route path="/hod" element={<HodPortalPage />} />
        <Route path="/hou" element={<HouPortalPage />} />

        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredPermission="STAFF_READ">
              <RequireHrStepUp>
                <StaffDirectoryPage />
              </RequireHrStepUp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <ProtectedRoute requiredPermission="STAFF_READ">
              <RequireHrStepUp>
                <StaffProfileDetailPage />
              </RequireHrStepUp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredPermission="HR_USER_MANAGE">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute requiredPermission="ORG_READ">
              <RequireHrStepUp>
                <OrgUnitsPage />
              </RequireHrStepUp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/my-requests"
          element={
            <ProtectedRoute requiredPermission="ORG_WRITE">
              <RequireHrStepUp>
                <MyRequestsPage />
              </RequireHrStepUp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/approvals"
          element={
            <ProtectedRoute requiredRole="SYSTEM_ADMIN">
              <RequireHrStepUp>
                <ApprovalsPage />
              </RequireHrStepUp>
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
        <Route
          path="/hr"
          element={
            <ProtectedRoute requiredPermission="HR_PORTAL_ACCESS">
              <RequireHrStepUp>
                <HrPortalHome />
              </RequireHrStepUp>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/totp/enroll"
          element={
            <ProtectedRoute requiredPermission="HR_PORTAL_ACCESS">
              <TotpEnrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/step-up"
          element={
            <ProtectedRoute requiredPermission="HR_PORTAL_ACCESS">
              <HrStepUpPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
