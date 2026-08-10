import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GroupsIcon from '@mui/icons-material/Groups';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import type { StaffProfile, StaffProfileSummary } from '../staff/types';
import type { OrgUnit } from '../organization/types';

interface HodLeaveItem {
  id: number;
  staffName?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export function HodPortalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [staffList, setStaffList] = useState<StaffProfileSummary[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<HodLeaveItem[]>([]);
  const [departmentName, setDepartmentName] = useState<string>('Department Management');

  useEffect(() => {
    Promise.all([
      httpClient.get<StaffProfile>('/api/staff/me').then((res) => res.data).catch(() => null),
      httpClient.get<OrgUnit[]>('/api/org/units').then((res) => res.data).catch(() => []),
      httpClient.get<StaffProfileSummary[]>('/api/staff').then((res) => res.data).catch(() => []),
      httpClient.get<HodLeaveItem[]>('/api/leave-requests/pending').then((res) => res.data).catch(() => []),
    ]).then(([myProfile, unitsData, staffData, leavesData]) => {
      setOrgUnits(unitsData);

      if (myProfile?.orgUnitName) {
        setDepartmentName(myProfile.orgUnitName);
      }

      // Scope to HoD's Department
      const myOrgId = myProfile?.orgUnitId;
      if (myOrgId) {
        const deptUnits = unitsData.filter((u) => u.parentId === myOrgId || u.id === myOrgId);
        const deptUnitIds = new Set(deptUnits.map((u) => u.id));
        const scopedStaff = staffData.filter(
          (s) => s.orgUnitId != null && (s.orgUnitId === myOrgId || deptUnitIds.has(s.orgUnitId))
        );
        setStaffList(scopedStaff.length > 0 ? scopedStaff : staffData);
      } else {
        setStaffList(staffData);
      }

      setPendingLeaves(leavesData);
    });
  }, []);

  const departmentUnits = orgUnits.filter((u) => u.type === 'UNIT' && u.status === 'ACTIVE');
  const housCount = departmentUnits.filter((u) => u.headName != null).length;

  const filteredStaff = staffList.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      s.staffNumber.toLowerCase().includes(query) ||
      (s.designation ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <Stack spacing={3.5}>
      {/* HoD Header Banner */}
      <Box
        sx={{
          p: 3.5,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e40af 0%, #0369a1 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 30px rgba(30, 64, 175, 0.25)',
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              width: 58,
              height: 58,
              bgcolor: '#2563eb',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.5)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <ApartmentIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Head of Department (HoD) Portal · {departmentName}
            </Typography>
            <Typography variant="body1" sx={{ color: '#bae6fd' }}>
              Department Governance: Units, Heads of Unit (HoU) Oversight & Department Staff Approvals
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* HoD Top Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <Card sx={{ borderTop: '4px solid #0284c7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  DEPARTMENT UNITS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {departmentUnits.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <AccountTreeIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label={`${housCount} Appointed HoUs`} sx={{ bgcolor: '#e0f2fe', color: '#075985', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #10b981' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  DEPARTMENT STAFF
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {staffList.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <GroupsIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Department Workforce" sx={{ bgcolor: '#d1fae5', color: '#065f46', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #f59e0b' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  PENDING LEAVES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {pendingLeaves.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <BeachAccessIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Department Approvals" sx={{ bgcolor: '#fef3c7', color: '#92400e', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #8b5cf6' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  APPRAISALS SIGN-OFF
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  Active
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <FactCheckIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="HoD Sign-off Queue" sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>
      </Box>

      {/* HoD Tabs */}
      <Paper sx={{ borderRadius: '16px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
            <Tab label="Department Units & HoUs" sx={{ fontWeight: 700 }} />
            <Tab label="Department Staff Directory" sx={{ fontWeight: 700 }} />
            <Tab label="Department Leave Requests" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* TAB 0: UNITS & HOUS */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Units under Department Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Unit Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Appointed HoU</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Parent Department</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No active units found.</TableCell>
                    </TableRow>
                  ) : (
                    departmentUnits.map((u) => {
                      const parent = orgUnits.find((p) => p.id === u.parentId);
                      return (
                        <TableRow key={u.id} hover>
                          <TableCell><Chip label={u.code} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell><Typography fontWeight={700}>{u.name}</Typography></TableCell>
                          <TableCell>
                            {u.headName ? (
                              <Chip label={u.headName} size="small" color="secondary" sx={{ fontWeight: 700 }} />
                            ) : (
                              <Chip label="Vacant HoU Post" size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                            )}
                          </TableCell>
                          <TableCell>{parent ? parent.name : departmentName}</TableCell>
                          <TableCell><Chip label={u.status} size="small" color="success" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => navigate('/organization')}>
                              Structure
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 1: STAFF DIRECTORY */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Department Staff Roster ({filteredStaff.length})
              </Typography>
              <TextField
                placeholder="Search staff..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 280 }}
              />
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Staff No.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No staff found under your department.</TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff) => (
                      <TableRow key={staff.id} hover>
                        <TableCell><Chip label={staff.staffNumber} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell><Typography fontWeight={700}>{staff.firstName} {staff.lastName}</Typography></TableCell>
                        <TableCell>{staff.designation ?? 'Staff Member'}</TableCell>
                        <TableCell><Chip label={staff.category} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell>{staff.orgUnitName ?? departmentName}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => navigate(`/staff/${staff.id}`)}>
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 2: LEAVE APPROVALS */}
        {tabIndex === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Department Leave Applications Pending HoD Review
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Staff Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Dates</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingLeaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No pending leave requests in your department.</TableCell>
                    </TableRow>
                  ) : (
                    pendingLeaves.map((req) => (
                      <TableRow key={req.id} hover>
                        <TableCell><Typography fontWeight={700}>{req.staffName ?? 'Department Staff'}</Typography></TableCell>
                        <TableCell>{req.leaveType ?? 'ANNUAL'}</TableCell>
                        <TableCell>{req.startDate ?? '2026-08-10'} to {req.endDate ?? '2026-09-10'}</TableCell>
                        <TableCell><Chip label={req.status ?? 'PENDING'} size="small" color="warning" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" onClick={() => navigate('/leave')}>
                            Approve / Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
