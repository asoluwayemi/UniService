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
import SchoolIcon from '@mui/icons-material/School';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupsIcon from '@mui/icons-material/Groups';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import type { StaffProfile, StaffProfileSummary } from '../staff/types';
import type { OrgUnit } from '../organization/types';

interface DeanLeaveItem {
  id: number;
  staffName?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export function DeanPortalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [staffList, setStaffList] = useState<StaffProfileSummary[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<DeanLeaveItem[]>([]);
  const [facultyName, setFacultyName] = useState<string>('Faculty Governance');

  useEffect(() => {
    Promise.all([
      httpClient.get<StaffProfile>('/api/staff/me').then((res) => res.data).catch(() => null),
      httpClient.get<OrgUnit[]>('/api/org/units').then((res) => res.data).catch(() => []),
      httpClient.get<StaffProfileSummary[]>('/api/staff').then((res) => res.data).catch(() => []),
      httpClient.get<DeanLeaveItem[]>('/api/leave-requests/pending').then((res) => res.data).catch(() => []),
    ]).then(([myProfile, unitsData, staffData, leavesData]) => {
      setOrgUnits(unitsData);

      if (myProfile?.orgUnitName) {
        setFacultyName(myProfile.orgUnitName);
      }

      // Scope to Dean's Faculty
      const myOrgId = myProfile?.orgUnitId;
      if (myOrgId) {
        const facultyDepts = unitsData.filter((u) => u.parentId === myOrgId || u.id === myOrgId);
        const facultyDeptIds = new Set(facultyDepts.map((d) => d.id));
        const scopedStaff = staffData.filter(
          (s) => s.orgUnitId != null && (s.orgUnitId === myOrgId || facultyDeptIds.has(s.orgUnitId))
        );
        setStaffList(scopedStaff.length > 0 ? scopedStaff : staffData);
      } else {
        setStaffList(staffData);
      }

      setPendingLeaves(leavesData);
    });
  }, []);

  const departments = orgUnits.filter((u) => u.type === 'DEPARTMENT' && u.status === 'ACTIVE');
  const units = orgUnits.filter((u) => u.type === 'UNIT' && u.status === 'ACTIVE');
  const hodsCount = departments.filter((d) => d.headName != null).length;

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
      {/* Dean Header Banner */}
      <Box
        sx={{
          p: 3.5,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #17103a 0%, #312e81 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 30px rgba(23, 16, 58, 0.25)',
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              width: 58,
              height: 58,
              bgcolor: '#7c3aed',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.5)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <SchoolIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Dean Portal · {facultyName}
            </Typography>
            <Typography variant="body1" sx={{ color: '#c7d2fe' }}>
              Faculty Leadership: Management of departmental requests, HoD appointments & faculty staff
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Dean Top Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <Card sx={{ borderTop: '4px solid #8b5cf6' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  DEPARTMENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {departments.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <ApartmentIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label={`${hodsCount} Appointed HoDs`} sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #0284c7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  FACULTY UNITS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {units.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <AccountTreeIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Operational Units" sx={{ bgcolor: '#e0f2fe', color: '#075985', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #10b981' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  FACULTY STAFF
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {staffList.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <GroupsIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Faculty Workforce" sx={{ bgcolor: '#d1fae5', color: '#065f46', mt: 1.5, fontWeight: 700 }} />
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
            <Chip size="small" label="Faculty Endorsement" sx={{ bgcolor: '#fef3c7', color: '#92400e', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>
      </Box>

      {/* Dean Navigation Tabs */}
      <Paper sx={{ borderRadius: '16px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
            <Tab label="Managed Departments & HoDs" sx={{ fontWeight: 700 }} />
            <Tab label="Faculty Staff Directory" sx={{ fontWeight: 700 }} />
            <Tab label="Faculty Leave Approvals" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* TAB 0: DEPARTMENTS & HODS */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Departments under Dean Governance
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Department Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Appointed HoD</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Parent Unit/Faculty</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No active departments found.</TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => {
                      const parentUnit = orgUnits.find((p) => p.id === dept.parentId);
                      return (
                        <TableRow key={dept.id} hover>
                          <TableCell><Chip label={dept.code} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell><Typography fontWeight={700}>{dept.name}</Typography></TableCell>
                          <TableCell>
                            {dept.headName ? (
                              <Chip label={dept.headName} size="small" color="primary" sx={{ fontWeight: 700 }} />
                            ) : (
                              <Chip label="Vacant HoD Post" size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                            )}
                          </TableCell>
                          <TableCell>{parentUnit ? parentUnit.name : facultyName}</TableCell>
                          <TableCell><Chip label={dept.status} size="small" color="success" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => navigate('/organization')}>
                              View Structure
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

        {/* TAB 1: FACULTY STAFF DIRECTORY */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Faculty Staff Members ({filteredStaff.length})
              </Typography>
              <TextField
                placeholder="Search staff by name or number..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 300 }}
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
                    <TableCell sx={{ fontWeight: 800 }}>Department / Unit</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Profile</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No staff found under your faculty.</TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff) => (
                      <TableRow key={staff.id} hover>
                        <TableCell><Chip label={staff.staffNumber} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell><Typography fontWeight={700}>{staff.firstName} {staff.lastName}</Typography></TableCell>
                        <TableCell>{staff.designation ?? 'Staff Member'}</TableCell>
                        <TableCell><Chip label={staff.category} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell>{staff.orgUnitName ?? facultyName}</TableCell>
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

        {/* TAB 2: FACULTY LEAVE APPROVALS */}
        {tabIndex === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Faculty Leave Requests Pending Endorsement
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Staff Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>End Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingLeaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No pending leave requests requiring review.</TableCell>
                    </TableRow>
                  ) : (
                    pendingLeaves.map((req) => (
                      <TableRow key={req.id} hover>
                        <TableCell><Typography fontWeight={700}>{req.staffName ?? 'Faculty Staff'}</Typography></TableCell>
                        <TableCell>{req.leaveType ?? 'ANNUAL'}</TableCell>
                        <TableCell>{req.startDate ?? '2026-08-10'}</TableCell>
                        <TableCell>{req.endDate ?? '2026-09-10'}</TableCell>
                        <TableCell><Chip label={req.status ?? 'PENDING'} size="small" color="warning" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" color="primary" onClick={() => navigate('/leave')}>
                            Review Leave
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
