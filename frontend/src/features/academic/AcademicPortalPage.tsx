import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
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
  Tooltip,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import GroupsIcon from '@mui/icons-material/Groups';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { useAuth } from '../../app/AuthContext';
import { httpClient } from '../../app/httpClient';
import type { StaffProfile } from '../staff/types';

interface AcademicCourse {
  id: number;
  courseCode: string;
  title: string;
  level: string;
  creditUnits: number;
  enrolledStudentsCount: number;
  semester: string;
  syllabusUrl?: string;
}

interface AcademicPublication {
  id: number;
  title: string;
  journalPublisher: string;
  yearPublished: number;
  doiIsbn?: string;
  category: 'JOURNAL' | 'CONFERENCE' | 'BOOK' | 'PATENT';
  impactFactor: number;
  documentUrl?: string;
}

interface AcademicSupervision {
  id: number;
  studentName: string;
  matricNumber: string;
  programme: 'PHD' | 'MSC' | 'MPHIL' | 'RESIDENCY';
  researchTopic: string;
  stage: string;
}

interface AcademicDataResponse {
  courses: AcademicCourse[];
  publications: AcademicPublication[];
  supervisions: AcademicSupervision[];
}

export function AcademicPortalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [publications, setPublications] = useState<AcademicPublication[]>([]);
  const [supervisions, setSupervisions] = useState<AcademicSupervision[]>([]);

  // Dialog States
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [openPubDialog, setOpenPubDialog] = useState(false);
  const [openSupervisionDialog, setOpenSupervisionDialog] = useState(false);

  // Form States
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseLevel, setCourseLevel] = useState('400 Level');
  const [creditUnits, setCreditUnits] = useState(3);
  const [enrolledCount, setEnrolledCount] = useState(50);
  const [semester, setSemester] = useState('First Semester 2025/2026');

  const [pubTitle, setPubTitle] = useState('');
  const [pubJournal, setPubJournal] = useState('');
  const [pubYear, setPubYear] = useState(2026);
  const [pubDoi, setPubDoi] = useState('');
  const [pubCategory, setPubCategory] = useState<'JOURNAL' | 'CONFERENCE' | 'BOOK' | 'PATENT'>('JOURNAL');
  const [pubImpactFactor, setPubImpactFactor] = useState(2.5);
  const [pubDocUrl, setPubDocUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [programme, setProgramme] = useState<'PHD' | 'MSC' | 'MPHIL' | 'RESIDENCY'>('PHD');
  const [researchTopic, setResearchTopic] = useState('');
  const [stage, setStage] = useState('Data Analysis & Dissertation Writing');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      httpClient.get<StaffProfile>('/api/staff/me').then((res) => res.data).catch(() => null),
      httpClient.get<AcademicDataResponse>('/api/academic/mine').then((res) => res.data).catch(() => null),
    ])
      .then(([profile, data]) => {
        setStaffProfile(profile);
        if (data) {
          setCourses(data.courses || []);
          setPublications(data.publications || []);
          setSupervisions(data.supervisions || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await httpClient.post<{ fileUrl: string }>('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPubDocUrl(res.data.fileUrl);
    } catch {
      setErrorMsg('Failed to upload manuscript file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddCourse = async () => {
    try {
      await httpClient.post('/api/academic/courses', {
        courseCode,
        title: courseTitle,
        level: courseLevel,
        creditUnits,
        enrolledStudentsCount: enrolledCount,
        semester,
      });
      setOpenCourseDialog(false);
      resetCourseForm();
      loadData();
    } catch (err: unknown) {
      setErrorMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add course.');
    }
  };

  const handleAddPublication = async () => {
    try {
      await httpClient.post('/api/academic/publications', {
        title: pubTitle,
        journalPublisher: pubJournal,
        yearPublished: pubYear,
        doiIsbn: pubDoi,
        category: pubCategory,
        impactFactor: pubImpactFactor,
        documentUrl: pubDocUrl,
      });
      setOpenPubDialog(false);
      resetPubForm();
      loadData();
    } catch (err: unknown) {
      setErrorMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add publication.');
    }
  };

  const handleAddSupervision = async () => {
    try {
      await httpClient.post('/api/academic/supervisions', {
        studentName,
        matricNumber,
        programme,
        researchTopic,
        stage,
      });
      setOpenSupervisionDialog(false);
      resetSupervisionForm();
      loadData();
    } catch (err: unknown) {
      setErrorMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add supervision record.');
    }
  };

  const handleDeleteCourse = async (id: number) => {
    try {
      await httpClient.delete(`/api/academic/courses/${id}`);
      loadData();
    } catch {
      // ignore
    }
  };

  const handleDeletePublication = async (id: number) => {
    try {
      await httpClient.delete(`/api/academic/publications/${id}`);
      loadData();
    } catch {
      // ignore
    }
  };

  const resetCourseForm = () => {
    setCourseCode('');
    setCourseTitle('');
    setCreditUnits(3);
    setEnrolledCount(50);
  };

  const resetPubForm = () => {
    setPubTitle('');
    setPubJournal('');
    setPubDoi('');
    setPubDocUrl('');
  };

  const resetSupervisionForm = () => {
    setStudentName('');
    setMatricNumber('');
    setResearchTopic('');
  };

  const designation = staffProfile?.designation ?? 'Academic Staff Member';
  const orgUnitName = staffProfile?.orgUnitName ?? 'Faculty of Basic Medical Sciences';
  const totalStudents = courses.reduce((acc, c) => acc + c.enrolledStudentsCount, 0);
  const totalUnits = courses.reduce((acc, c) => acc + c.creditUnits, 0);

  return (
    <Stack spacing={3.5}>
      {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>}

      {/* Header Banner */}
      <Box
        sx={{
          p: 3.5,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 30px rgba(30, 27, 75, 0.3)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#6366f1',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.5)',
                border: '3px solid rgba(255,255,255,0.2)',
              }}
            >
              <SchoolIcon sx={{ fontSize: 36 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                Academic Staff Portal
              </Typography>
              <Typography variant="body1" sx={{ color: '#c7d2fe', fontWeight: 600 }}>
                {user?.firstName} {user?.lastName} · {designation}
              </Typography>
              <Typography variant="caption" sx={{ color: '#a5b4fc', fontWeight: 500 }}>
                {orgUnitName} · University Academic & Research Ecosystem
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<TrendingUpIcon />}
              onClick={() => navigate('/career')}
              sx={{
                bgcolor: '#6366f1',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '10px',
                px: 2.5,
                '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              Promotion & APER
            </Button>
            <Button
              variant="outlined"
              startIcon={<BeachAccessIcon />}
              onClick={() => navigate('/leave')}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 700,
                borderRadius: '10px',
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Academic Leave
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Top Academic Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <Card sx={{ borderTop: '4px solid #6366f1' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  TEACHING LOAD
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {courses.length} Courses
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                <MenuBookIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label={`${totalUnits} Credit Units / ${totalStudents} Students`} sx={{ bgcolor: '#e0e7ff', color: '#3730a3', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #0284c7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  PUBLICATIONS & BOOKS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {publications.length} Papers
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <AutoStoriesIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Scopus / Web of Science Indexed" sx={{ bgcolor: '#e0f2fe', color: '#075985', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #10b981' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  SUPERVISION
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {supervisions.length} Candidates
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <GroupsIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="Ph.D / M.Sc / Residency Students" sx={{ bgcolor: '#d1fae5', color: '#065f46', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>

        <Card sx={{ borderTop: '4px solid #f59e0b' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  SABBATICAL ELIGIBILITY
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  Eligible
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <FlightTakeoffIcon />
              </Avatar>
            </Stack>
            <Chip size="small" label="6 Years Continuous Service" sx={{ bgcolor: '#fef3c7', color: '#92400e', mt: 1.5, fontWeight: 700 }} />
          </CardContent>
        </Card>
      </Box>

      {/* Main Feature Tabs */}
      <Paper sx={{ borderRadius: '16px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
            <Tab label="Teaching & Course Allocation" sx={{ fontWeight: 700 }} />
            <Tab label="Research & Publications" sx={{ fontWeight: 700 }} />
            <Tab label="Postgraduate Supervision" sx={{ fontWeight: 700 }} />
            <Tab label="Academic APER & Readiness" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* TAB 0: TEACHING & COURSES */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Allocated Teaching Courses & Credit Loads ({courses.length})
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCourseDialog(true)}>
                Add Course
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Course Code</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Course Title</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Level</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Credit Units</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Enrolled Students</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Semester</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No courses allocated yet.</TableCell>
                      </TableRow>
                    ) : (
                      courses.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell><Chip label={c.courseCode} size="small" color="primary" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell><Typography fontWeight={700}>{c.title}</Typography></TableCell>
                          <TableCell>{c.level}</TableCell>
                          <TableCell><Typography fontWeight={700}>{c.creditUnits} Units</Typography></TableCell>
                          <TableCell><Chip label={`${c.enrolledStudentsCount} Students`} size="small" color="info" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell>{c.semester}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete Course">
                              <IconButton size="small" color="error" onClick={() => handleDeleteCourse(c.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 1: RESEARCH & PUBLICATIONS */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Published Articles, Books & Manuscripts ({publications.length})
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenPubDialog(true)}>
                Add Publication & Upload PDF
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Publication Title</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Journal / Publisher</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>DOI / Reference</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Impact Factor</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {publications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No publication records found.</TableCell>
                      </TableRow>
                    ) : (
                      publications.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell><Chip label={p.category} size="small" color={p.category === 'JOURNAL' ? 'success' : 'secondary'} sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell>
                            <Typography fontWeight={700}>{p.title}</Typography>
                            {p.documentUrl && (
                              <Chip
                                size="small"
                                icon={<InsertDriveFileIcon sx={{ fontSize: 14 }} />}
                                label="Attached Manuscript"
                                component="a"
                                href={p.documentUrl}
                                target="_blank"
                                clickable
                                color="primary"
                                variant="outlined"
                                sx={{ mt: 0.5, fontSize: '10px' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{p.journalPublisher}</TableCell>
                          <TableCell>{p.yearPublished}</TableCell>
                          <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: '4px' }}>{p.doiIsbn || 'N/A'}</Typography></TableCell>
                          <TableCell><Chip label={`IF: ${p.impactFactor}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete Record">
                              <IconButton size="small" color="error" onClick={() => handleDeletePublication(p.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 2: POSTGRADUATE SUPERVISION */}
        {tabIndex === 2 && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Assigned Postgraduate Supervisees & Dissertation Progress ({supervisions.length})
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenSupervisionDialog(true)}>
                Assign Supervisee
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Matric No.</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Programme</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Research Topic</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Current Stage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supervisions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No supervisee records found.</TableCell>
                      </TableRow>
                    ) : (
                      supervisions.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell><Chip label={s.matricNumber} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell><Typography fontWeight={700}>{s.studentName}</Typography></TableCell>
                          <TableCell><Chip label={s.programme} size="small" color="secondary" sx={{ fontWeight: 700 }} /></TableCell>
                          <TableCell sx={{ maxWidth: 320 }}>{s.researchTopic}</TableCell>
                          <TableCell><Chip label={s.stage} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 3: APER & ACADEMIC PROMOTION READINESS */}
        {tabIndex === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Academic APER Scoring & Promotion Readiness
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Quantitative assessment across Teaching (30%), Research Publications (50%), and University/Community Service (20%).
            </Typography>

            <Stack spacing={3}>
              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight={700}>Teaching & Pedagogy Evaluation</Typography>
                  <Typography fontWeight={800} color="primary">28 / 30 Points (93%)</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={93} color="primary" sx={{ height: 10, borderRadius: 5 }} />
              </Box>

              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight={700}>Research Publications & Impact</Typography>
                  <Typography fontWeight={800} color="success">44 / 50 Points (88%)</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={88} color="success" sx={{ height: 10, borderRadius: 5 }} />
              </Box>

              <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight={700}>University & Community Service</Typography>
                  <Typography fontWeight={800} color="secondary">18 / 20 Points (90%)</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={90} color="secondary" sx={{ height: 10, borderRadius: 5 }} />
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2, borderTop: '1px solid #e2e8f0' }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Total Cumulative APER Score: 90 / 100</Typography>
                  <Typography variant="body2" color="text.secondary">Status: Qualified for Professorial Review / Promotion Application</Typography>
                </Box>
                <Button variant="contained" color="success" size="large" onClick={() => navigate('/career')} sx={{ fontWeight: 700, borderRadius: '10px' }}>
                  Submit Promotion Dossier
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Dialog for Adding Course */}
      <Dialog open={openCourseDialog} onClose={() => setOpenCourseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Allocate New Academic Course</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Course Code (e.g. PATH 401)" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} fullWidth />
            <TextField label="Course Title" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Level" value={courseLevel} onChange={(e) => setCourseLevel(e.target.value)} fullWidth />
              <TextField label="Credit Units" type="number" value={creditUnits} onChange={(e) => setCreditUnits(Number(e.target.value))} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Enrolled Students" type="number" value={enrolledCount} onChange={(e) => setEnrolledCount(Number(e.target.value))} fullWidth />
              <TextField label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCourseDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCourse} disabled={!courseCode || !courseTitle}>Save Course</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Adding Publication & Upload */}
      <Dialog open={openPubDialog} onClose={() => setOpenPubDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Research Publication & Upload Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Publication Title" value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} fullWidth />
            <TextField label="Journal or Publisher Name" value={pubJournal} onChange={(e) => setPubJournal(e.target.value)} fullWidth />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={pubCategory} label="Category" onChange={(e) => setPubCategory(e.target.value as any)}>
                  <MenuItem value="JOURNAL">Journal Article</MenuItem>
                  <MenuItem value="CONFERENCE">Conference Paper</MenuItem>
                  <MenuItem value="BOOK">Book / Monograph</MenuItem>
                  <MenuItem value="PATENT">Patent</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Year Published" type="number" value={pubYear} onChange={(e) => setPubYear(Number(e.target.value))} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="DOI / ISBN Reference" value={pubDoi} onChange={(e) => setPubDoi(e.target.value)} fullWidth />
              <TextField label="Impact Factor" type="number" value={pubImpactFactor} onChange={(e) => setPubImpactFactor(Number(e.target.value))} fullWidth />
            </Stack>

            {/* Document Upload Button */}
            <Box sx={{ p: 2, border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', bgcolor: '#f8fafc' }}>
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={uploadingFile}>
                {uploadingFile ? 'Uploading File…' : 'Upload Manuscript / PDF'}
                <input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
              </Button>
              {pubDocUrl && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1, fontWeight: 700 }}>
                  Attached: {pubDocUrl}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenPubDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPublication} disabled={!pubTitle || !pubJournal}>Save Publication</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Adding Supervision */}
      <Dialog open={openSupervisionDialog} onClose={() => setOpenSupervisionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Postgraduate Supervisee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Student Full Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Matriculation / Reg No." value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Programme</InputLabel>
                <Select value={programme} label="Programme" onChange={(e) => setProgramme(e.target.value as any)}>
                  <MenuItem value="PHD">Ph.D</MenuItem>
                  <MenuItem value="MSC">M.Sc</MenuItem>
                  <MenuItem value="MPHIL">M.Phil</MenuItem>
                  <MenuItem value="RESIDENCY">Residency</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Research / Dissertation Topic" value={researchTopic} multiline rows={2} onChange={(e) => setResearchTopic(e.target.value)} fullWidth />
            <TextField label="Current Stage" value={stage} onChange={(e) => setStage(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenSupervisionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSupervision} disabled={!studentName || !matricNumber || !researchTopic}>Save Supervisee</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
