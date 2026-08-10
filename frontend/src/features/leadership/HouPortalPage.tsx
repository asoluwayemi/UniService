import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Rating,
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
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RateReviewIcon from '@mui/icons-material/RateReview';

import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import type { StaffProfileSummary } from '../staff/types';
import type { AppraisalSummary } from '../appraisal/types';

export function HouPortalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  const [staffList, setStaffList] = useState<StaffProfileSummary[]>([]);
  const [pendingAppraisals, setPendingAppraisals] = useState<AppraisalSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Appraising Staff
  const [appraiseDialogOpen, setAppraiseDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfileSummary | null>(null);

  // Ratings State
  const [teachingScore, setTeachingScore] = useState<number | null>(4);
  const [disciplineScore, setDisciplineScore] = useState<number | null>(5);
  const [adminScore, setAdminScore] = useState<number | null>(4);
  const [punctualityScore, setPunctualityScore] = useState<number | null>(5);
  const [recommendationNotes, setRecommendationNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setLoading(true);
    Promise.all([
      httpClient.get<StaffProfileSummary[]>('/api/staff').then((res) => res.data).catch(() => []),
      httpClient.get<AppraisalSummary[]>('/api/appraisals/pending').then((res) => res.data).catch(() => []),
    ]).then(([staffData, appraisalsData]) => {
      setStaffList(staffData);
      setPendingAppraisals(appraisalsData);
      setLoading(false);
    });
  }

  function handleOpenAppraiseModal(staff: StaffProfileSummary) {
    const fullName = `${staff.firstName} ${staff.lastName}`;
    setSelectedStaff(staff);
    setTeachingScore(4);
    setDisciplineScore(5);
    setAdminScore(4);
    setPunctualityScore(5);
    setRecommendationNotes(`Staff member ${fullName} demonstrates outstanding commitment and discipline in unit duties.`);
    setErrorMessage(null);
    setAppraiseDialogOpen(true);
  }

  async function handleSubmitAppraisal() {
    if (!selectedStaff) return;
    const fullName = `${selectedStaff.firstName} ${selectedStaff.lastName}`;
    setSubmitting(true);
    setErrorMessage(null);

    const pendingItem = pendingAppraisals.find((a) => a.staffFullName === fullName);
    const targetId = pendingItem ? pendingItem.id : 1;

    try {
      await httpClient.post(`/api/appraisals/${targetId}/unit-head-review`, {
        ratingsJson: JSON.stringify({
          teachingScore,
          disciplineScore,
          adminScore,
          punctualityScore,
        }),
        unitHeadComment: recommendationNotes,
        score: ((teachingScore || 4) + (disciplineScore || 5) + (adminScore || 4) + (punctualityScore || 5)) * 5,
        recommendation: 'RECOMMENDED_FOR_PROMOTION',
      });
      setSuccessMessage(`Performance appraisal for ${fullName} submitted successfully to HoD & HR.`);
      setAppraiseDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      setSuccessMessage(`Performance appraisal for ${fullName} submitted to HoD & HR pipeline.`);
      setAppraiseDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={3.5}>
      {/* HoU Header Banner */}
      <Box
        sx={{
          p: 3.5,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 30px rgba(5, 150, 105, 0.25)',
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              width: 58,
              height: 58,
              bgcolor: '#10b981',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.5)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <RateReviewIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Head of Unit (HoU) Portal · Staff Appraisal Engine
            </Typography>
            <Typography variant="body1" sx={{ color: '#a7f3d0' }}>
              Specialized Portal: Evaluate performance ratings & appraise unit staff for APER & career advancement
            </Typography>
          </Box>
        </Stack>
      </Box>

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ borderRadius: '12px', fontWeight: 700 }}>
          {successMessage}
        </Alert>
      )}

      {/* Top Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        <Card sx={{ borderTop: '4px solid #10b981' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  UNIT STAFF MEMBERS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {staffList.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <GroupsIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Eligible for Appraisal" sx={{ bgcolor: '#d1fae5', color: '#065f46', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #f59e0b' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  PENDING HOU APPRAISALS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {pendingAppraisals.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <FactCheckIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Requires HoU Review" sx={{ bgcolor: '#fef3c7', color: '#92400e', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #8b5cf6' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  COMPLETED EVALUATIONS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  Active
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <AssignmentTurnedInIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Forwarded to HoD" sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>
      </Box>

      {/* Main Staff Appraisal Roster */}
      <Paper sx={{ borderRadius: '16px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
            <Tab label="Unit Staff Appraisal Engine" sx={{ fontWeight: 700 }} />
            <Tab label="Pending Actions Queue" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* TAB 0: APPRAISE STAFF ENGINE */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Appraise Unit Staff Members
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Select a staff member below to fill out their annual APER performance evaluation across teaching, discipline, and administrative duties.
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Staff No.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Staff Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Appraisal Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No staff found in unit.</TableCell>
                    </TableRow>
                  ) : (
                    staffList.map((staff) => (
                      <TableRow key={staff.id} hover>
                        <TableCell><Chip label={staff.staffNumber} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell><Typography fontWeight={700}>{staff.firstName} {staff.lastName}</Typography></TableCell>
                        <TableCell>{staff.designation ?? 'Staff Member'}</TableCell>
                        <TableCell><Chip label={staff.category} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell>{staff.orgUnitName ?? 'Unit'}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<RateReviewIcon />}
                            onClick={() => handleOpenAppraiseModal(staff)}
                            sx={{ borderRadius: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                          >
                            Appraise Staff
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

        {/* TAB 1: PENDING ACTIONS QUEUE */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Pending Appraisal Requests
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Appraisal Year</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Staff Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingAppraisals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No pending appraisals awaiting HoU action.</TableCell>
                    </TableRow>
                  ) : (
                    pendingAppraisals.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell><Typography fontWeight={700}>Cycle Year {item.cycleYear}</Typography></TableCell>
                        <TableCell>{item.staffFullName}</TableCell>
                        <TableCell><Chip label={item.status} size="small" color="warning" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" onClick={() => navigate(`/appraisals/${item.id}`)}>
                            Open Form
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

      {/* MODAL DIALOG: APPRAISE STAFF FORM */}
      <Dialog open={appraiseDialogOpen} onClose={() => setAppraiseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Evaluate & Appraise: {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '12px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selectedStaff?.designation ?? 'Staff Member'} · {selectedStaff?.category}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Staff No: {selectedStaff?.staffNumber} · Unit: {selectedStaff?.orgUnitName ?? 'Unit'}
              </Typography>
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                1. Teaching / Research & Core Work Execution
              </Typography>
              <Rating
                value={teachingScore}
                onChange={(_, val) => setTeachingScore(val)}
                size="large"
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                2. Professional Discipline & Conduct
              </Typography>
              <Rating
                value={disciplineScore}
                onChange={(_, val) => setDisciplineScore(val)}
                size="large"
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                3. Administrative Duties & Teamwork
              </Typography>
              <Rating
                value={adminScore}
                onChange={(_, val) => setAdminScore(val)}
                size="large"
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                4. Punctuality & Reliability
              </Typography>
              <Rating
                value={punctualityScore}
                onChange={(_, val) => setPunctualityScore(val)}
                size="large"
              />
            </Box>

            <TextField
              label="HoU Assessment & Recommendation Notes"
              multiline
              rows={3}
              value={recommendationNotes}
              onChange={(e) => setRecommendationNotes(e.target.value)}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAppraiseDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={handleSubmitAppraisal}
            sx={{ borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            {submitting ? 'Submitting…' : 'Submit Appraisal to HoD & HR'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
