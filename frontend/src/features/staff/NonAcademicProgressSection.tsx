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
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { httpClient } from '../../app/httpClient';

interface NonAcademicTraining {
  id: number;
  title: string;
  organizer: string;
  yearAttended: number;
  certificateNumber?: string;
  certificateUrl?: string;
}

interface NonAcademicProject {
  id: number;
  projectTitle: string;
  role: string;
  description?: string;
  status: string;
}

interface NonAcademicDataResponse {
  trainings: NonAcademicTraining[];
  projects: NonAcademicProject[];
}

interface NonAcademicProgressSectionProps {
  staffProfileId: number;
  isMine?: boolean;
  scheduleOfDuties?: string | null;
}

export function NonAcademicProgressSection({ staffProfileId, isMine = false, scheduleOfDuties }: NonAcademicProgressSectionProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<NonAcademicTraining[]>([]);
  const [projects, setProjects] = useState<NonAcademicProject[]>([]);

  // Dialog States
  const [openTrainingDialog, setOpenTrainingDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);

  // Form States
  const [trainingTitle, setTrainingTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [yearAttended, setYearAttended] = useState(2025);
  const [certNum, setCertNum] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [projectTitle, setProjectTitle] = useState('');
  const [role, setRole] = useState('Project Lead');
  const [description, setDescription] = useState('');

  const loadData = () => {
    setLoading(true);
    const endpoint = isMine ? '/api/non-academic/mine' : `/api/non-academic/staff/${staffProfileId}`;
    httpClient
      .get<NonAcademicDataResponse>(endpoint)
      .then((res) => {
        setTrainings(res.data.trainings || []);
        setProjects(res.data.projects || []);
      })
      .catch(() => setErrorMsg('Failed to load non-academic records.'))
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
      setCertUrl(res.data.fileUrl);
    } catch {
      setErrorMsg('Failed to upload certificate file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddTraining = async () => {
    try {
      await httpClient.post('/api/non-academic/trainings', {
        title: trainingTitle,
        organizer,
        yearAttended,
        certificateNumber: certNum,
        certificateUrl: certUrl,
      });
      setOpenTrainingDialog(false);
      setTrainingTitle('');
      setOrganizer('');
      setCertNum('');
      setCertUrl('');
      loadData();
    } catch {
      setErrorMsg('Failed to save training record.');
    }
  };

  const handleAddProject = async () => {
    try {
      await httpClient.post('/api/non-academic/projects', {
        projectTitle,
        role,
        description,
        status: 'COMPLETED',
      });
      setOpenProjectDialog(false);
      setProjectTitle('');
      setDescription('');
      loadData();
    } catch {
      setErrorMsg('Failed to save administrative project.');
    }
  };

  const handleDeleteTraining = async (id: number) => {
    try {
      await httpClient.delete(`/api/non-academic/trainings/${id}`);
      loadData();
    } catch {
      // ignore
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await httpClient.delete(`/api/non-academic/projects/${id}`);
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

      {/* Schedule of Administrative & Technical Duties */}
      <Card sx={{ borderLeft: '5px solid #0d9488' }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <AssignmentIndIcon sx={{ color: '#0d9488' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Schedule of Administrative & Technical Duties
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ color: '#334155', bgcolor: '#f8fafc', p: 2, borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line' }}>
            {scheduleOfDuties && scheduleOfDuties.trim().length > 0
              ? scheduleOfDuties
              : 'Primary Administrative Duties: Oversight of institutional records, departmental budget administration, committee secretarial support, and staff welfare operations.'}
          </Typography>
        </CardContent>
      </Card>

      {/* Professional Trainings & Workshops */}
      <Card sx={{ borderLeft: '5px solid #8b5cf6' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WorkspacePremiumIcon sx={{ color: '#8b5cf6' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Professional Trainings, Workshops & Certifications ({trainings.length})
              </Typography>
            </Stack>
            {isMine && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenTrainingDialog(true)}>
                Add Workshop / Certification
              </Button>
            )}
          </Stack>

          {trainings.length === 0 ? (
            <Typography color="text.secondary">No training or certification records recorded yet.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Workshop / Training Title</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Organizing Body</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Cert No. / Attachment</TableCell>
                    {isMine && <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainings.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography fontWeight={700} variant="body2">{t.title}</Typography></TableCell>
                      <TableCell>{t.organizer}</TableCell>
                      <TableCell>{t.yearAttended}</TableCell>
                      <TableCell>
                        {t.certificateNumber && <Chip label={t.certificateNumber} size="small" variant="outlined" sx={{ mr: 1, fontWeight: 700 }} />}
                        {t.certificateUrl && (
                          <Chip
                            size="small"
                            icon={<InsertDriveFileIcon sx={{ fontSize: 13 }} />}
                            label="View Cert"
                            component="a"
                            href={t.certificateUrl}
                            target="_blank"
                            clickable
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      {isMine && (
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTraining(t.id)}>
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

      {/* Administrative Projects & Milestones */}
      <Card sx={{ borderLeft: '5px solid #ec4899' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccountTreeIcon sx={{ color: '#ec4899' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Administrative Projects & Operations Managed ({projects.length})
              </Typography>
            </Stack>
            {isMine && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenProjectDialog(true)}>
                Add Project
              </Button>
            )}
          </Stack>

          {projects.length === 0 ? (
            <Typography color="text.secondary">No administrative projects logged yet.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Project / Operational Task</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Summary</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    {isMine && <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography fontWeight={700} variant="body2">{p.projectTitle}</Typography></TableCell>
                      <TableCell><Chip label={p.role} size="small" color="primary" sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>{p.description || 'N/A'}</TableCell>
                      <TableCell><Chip label={p.status} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                      {isMine && (
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleDeleteProject(p.id)}>
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

      {/* Dialog for Adding Workshop / Certification */}
      <Dialog open={openTrainingDialog} onClose={() => setOpenTrainingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Training / Certification Record</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Training / Workshop Title" value={trainingTitle} onChange={(e) => setTrainingTitle(e.target.value)} fullWidth />
            <TextField label="Organizing Institution / Association" value={organizer} onChange={(e) => setOrganizer(e.target.value)} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Year Attended" type="number" value={yearAttended} onChange={(e) => setYearAttended(Number(e.target.value))} fullWidth />
              <TextField label="Certificate No. (Optional)" value={certNum} onChange={(e) => setCertNum(e.target.value)} fullWidth />
            </Stack>

            <Box sx={{ p: 2, border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', bgcolor: '#f8fafc' }}>
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={uploadingFile}>
                {uploadingFile ? 'Uploading…' : 'Upload Certificate PDF'}
                <input type="file" hidden accept=".pdf,.png,.jpg" onChange={handleFileUpload} />
              </Button>
              {certUrl && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1, fontWeight: 700 }}>
                  Attached: {certUrl}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenTrainingDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTraining} disabled={!trainingTitle || !organizer}>Save Record</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Adding Project */}
      <Dialog open={openProjectDialog} onClose={() => setOpenProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Administrative Project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Project Title / Operational Initiative" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} fullWidth />
            <TextField label="Your Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth />
            <TextField label="Description & Key Achievements" multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenProjectDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddProject} disabled={!projectTitle}>Save Project</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
