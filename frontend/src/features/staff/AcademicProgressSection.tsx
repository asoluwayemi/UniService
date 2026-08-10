import { useEffect, useState, type ChangeEvent } from 'react';
import {
  Alert,
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
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { httpClient } from '../../app/httpClient';

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

interface AcademicProgressSectionProps {
  staffProfileId: number;
  isMine?: boolean;
}

export function AcademicProgressSection({ staffProfileId, isMine = false }: AcademicProgressSectionProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [publications, setPublications] = useState<AcademicPublication[]>([]);
  const [supervisions, setSupervisions] = useState<AcademicSupervision[]>([]);

  // Dialog States
  const [openPubDialog, setOpenPubDialog] = useState(false);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [openSupervisionDialog, setOpenSupervisionDialog] = useState(false);

  // Form States
  const [pubTitle, setPubTitle] = useState('');
  const [pubJournal, setPubJournal] = useState('');
  const [pubYear, setPubYear] = useState(2026);
  const [pubDoi, setPubDoi] = useState('');
  const [pubCategory, setPubCategory] = useState<'JOURNAL' | 'CONFERENCE' | 'BOOK' | 'PATENT'>('JOURNAL');
  const [pubImpactFactor, setPubImpactFactor] = useState(2.5);
  const [pubDocUrl, setPubDocUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseLevel, setCourseLevel] = useState('400 Level');
  const [creditUnits, setCreditUnits] = useState(3);
  const [enrolledCount, setEnrolledCount] = useState(50);
  const [semester, setSemester] = useState('First Semester 2025/2026');

  const [studentName, setStudentName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [programme, setProgramme] = useState<'PHD' | 'MSC' | 'MPHIL' | 'RESIDENCY'>('PHD');
  const [researchTopic, setResearchTopic] = useState('');
  const [stage, setStage] = useState('Data Analysis & Dissertation Writing');

  const loadData = () => {
    setLoading(true);
    const endpoint = isMine ? '/api/academic/mine' : `/api/academic/staff/${staffProfileId}`;
    httpClient
      .get<AcademicDataResponse>(endpoint)
      .then((res) => {
        setCourses(res.data.courses || []);
        setPublications(res.data.publications || []);
        setSupervisions(res.data.supervisions || []);
      })
      .catch(() => setErrorMsg('Failed to load academic records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [staffProfileId, isMine]);

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
      setPubTitle('');
      setPubJournal('');
      setPubDoi('');
      setPubDocUrl('');
      loadData();
    } catch {
      setErrorMsg('Failed to save publication.');
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
      setCourseCode('');
      setCourseTitle('');
      loadData();
    } catch {
      setErrorMsg('Failed to save course.');
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
      setStudentName('');
      setMatricNumber('');
      setResearchTopic('');
      loadData();
    } catch {
      setErrorMsg('Failed to save supervision.');
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

  const handleDeleteCourse = async (id: number) => {
    try {
      await httpClient.delete(`/api/academic/courses/${id}`);
      loadData();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>}

      {/* Publications & Research Papers */}
      <Card sx={{ borderLeft: '5px solid #0284c7' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AutoStoriesIcon sx={{ color: '#0284c7' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Research Publications, Papers & Studies ({publications.length})
              </Typography>
            </Stack>
            {isMine && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenPubDialog(true)}>
                Add Paper / Upload Manuscript
              </Button>
            )}
          </Stack>

          {publications.length === 0 ? (
            <Typography color="text.secondary">No research publications recorded yet.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Title & Document</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Journal / Publisher</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>DOI / ISBN</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Impact Factor</TableCell>
                    {isMine && <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {publications.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Chip label={p.category} size="small" color={p.category === 'JOURNAL' ? 'success' : 'secondary'} sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell>
                        <Typography fontWeight={700} variant="body2">{p.title}</Typography>
                        {p.documentUrl && (
                          <Chip
                            size="small"
                            icon={<InsertDriveFileIcon sx={{ fontSize: 13 }} />}
                            label="Manuscript PDF Attached"
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
                      <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{p.doiIsbn || 'N/A'}</Typography></TableCell>
                      <TableCell><Chip label={`IF: ${p.impactFactor}`} size="small" color="info" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                      {isMine && (
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleDeletePublication(p.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Teaching Load & Courses */}
      <Card sx={{ borderLeft: '5px solid #6366f1' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <MenuBookIcon sx={{ color: '#6366f1' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Teaching Load & Course Allocations ({courses.length})
              </Typography>
            </Stack>
            {isMine && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenCourseDialog(true)}>
                Add Course
              </Button>
            )}
          </Stack>

          {courses.length === 0 ? (
            <Typography color="text.secondary">No courses assigned yet.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Level</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Credit Units</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Enrolled</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Semester</TableCell>
                    {isMine && <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell><Chip label={c.courseCode} size="small" color="primary" sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell><Typography fontWeight={700} variant="body2">{c.title}</Typography></TableCell>
                      <TableCell>{c.level}</TableCell>
                      <TableCell><Typography fontWeight={700}>{c.creditUnits} Units</Typography></TableCell>
                      <TableCell><Chip label={`${c.enrolledStudentsCount} Students`} size="small" color="info" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell>{c.semester}</TableCell>
                      {isMine && (
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleDeleteCourse(c.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Postgraduate Supervision Roster */}
      <Card sx={{ borderLeft: '5px solid #10b981' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GroupsIcon sx={{ color: '#10b981' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Postgraduate Student Supervision ({supervisions.length})
              </Typography>
            </Stack>
            {isMine && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenSupervisionDialog(true)}>
                Add Supervisee
              </Button>
            )}
          </Stack>

          {supervisions.length === 0 ? (
            <Typography color="text.secondary">No supervisees assigned yet.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Matric No.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Programme</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Research Topic</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Stage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supervisions.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell><Chip label={s.matricNumber} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell><Typography fontWeight={700} variant="body2">{s.studentName}</Typography></TableCell>
                      <TableCell><Chip label={s.programme} size="small" color="secondary" sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell>{s.researchTopic}</TableCell>
                      <TableCell><Chip label={s.stage} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Adding Publication & Upload */}
      <Dialog open={openPubDialog} onClose={() => setOpenPubDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Research Paper & Upload Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Publication / Paper Title" value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} fullWidth />
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
                {uploadingFile ? 'Uploading File…' : 'Upload Manuscript / PDF File'}
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

      {/* Dialog for Adding Course */}
      <Dialog open={openCourseDialog} onClose={() => setOpenCourseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Teaching Course</DialogTitle>
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

      {/* Dialog for Adding Supervisee */}
      <Dialog open={openSupervisionDialog} onClose={() => setOpenSupervisionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Postgraduate Supervisee</DialogTitle>
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
