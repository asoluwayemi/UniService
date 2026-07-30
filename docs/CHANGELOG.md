# Changelog

## Sprint 3
- Added the Staff Profile & Records module (`staff` package): staff profiles, academic
  qualifications, employment history, bank details, contract status
- Realigned RBAC to the university's 7-role model: SUPER_ADMIN/HR_DIRECTOR/REGISTRAR/LECTURER
  renamed to SYSTEM_ADMIN/HR_ADMIN/HOD_DEAN/ACADEMIC_STAFF, plus new FINANCE_OFFICER,
  NON_ACADEMIC_STAFF, and AUDITOR roles with permissions re-mapped to match each role's
  real-world responsibility

## Sprint 1.2
- Added AuthService interface
- Added JWT properties class
- Added SecurityConfig placeholder
- Added frontend auth service
