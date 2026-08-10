import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';

import { httpClient } from '../../app/httpClient';
import type { StaffProfile } from './types';

interface AcademicDataResponse {
  courses: Array<{ id: number; courseCode: string; title: string; level: string; creditUnits: number; enrolledStudentsCount: number; semester: string }>;
  publications: Array<{ id: number; title: string; journalPublisher: string; yearPublished: number; doiIsbn?: string; category: string; impactFactor: number }>;
  supervisions: Array<{ id: number; studentName: string; matricNumber: string; programme: string; researchTopic: string; stage: string }>;
}

interface NonAcademicDataResponse {
  trainings: Array<{ id: number; title: string; organizer: string; yearAttended: number; certificateNumber?: string }>;
  projects: Array<{ id: number; projectTitle: string; role: string; description?: string; status: string }>;
}

interface GenerateCvModalProps {
  open: boolean;
  profile: StaffProfile;
  onClose: () => void;
}

export function GenerateCvModal({ open, profile, onClose }: GenerateCvModalProps) {
  const [loading, setLoading] = useState(true);
  const [academicData, setAcademicData] = useState<AcademicDataResponse | null>(null);
  const [nonAcademicData, setNonAcademicData] = useState<NonAcademicDataResponse | null>(null);

  const isAcademic = profile.category === 'ACADEMIC';

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    if (isAcademic) {
      httpClient
        .get<AcademicDataResponse>(`/api/academic/staff/${profile.id}`)
        .then((res) => setAcademicData(res.data))
        .catch(() => null)
        .finally(() => setLoading(false));
    } else {
      httpClient
        .get<NonAcademicDataResponse>(`/api/non-academic/staff/${profile.id}`)
        .then((res) => setNonAcademicData(res.data))
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [open, profile.id, isAcademic]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '@media print': {
          position: 'static',
          '& .MuiDialog-paper': {
            boxShadow: 'none !important',
            border: 'none !important',
            margin: '0 !important',
            maxWidth: '100% !important',
            width: '100% !important',
            maxHeight: 'none !important',
            overflow: 'visible !important',
            padding: '0 !important',
          },
          '& .MuiBackdrop-root': {
            display: 'none !important',
          },
          '& .no-print': {
            display: 'none !important',
          },
        },
      }}
    >
      <DialogActions
        className="no-print"
        sx={{
          p: 2,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          justify: 'space-between',
          '@media print': { display: 'none !important' },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <SchoolIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Generated Institutional Curriculum Vitae (CV)
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ fontWeight: 700 }}>
            Print / Export PDF CV
          </Button>
          <Button variant="outlined" startIcon={<CloseIcon />} onClick={onClose}>
            Close
          </Button>
        </Stack>
      </DialogActions>

      <DialogContent sx={{ p: 4, '@media print': { p: 0, overflow: 'visible !important' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper
            elevation={0}
            id="printable-cv"
            sx={{
              p: 4,
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              fontFamily: 'serif',
              color: '#0f172a',
              '@media print': {
                border: 'none !important',
                p: 0,
                boxShadow: 'none !important',
              },
            }}
          >
            {/* Header / University Letterhead */}
            <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '3px double #1e293b' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                UNIVERSITY ACADEMIC & ADMINISTRATIVE SERVICES
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155', mt: 0.5 }}>
                CURRICULUM VITAE (CV)
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                Format for Appointment, Promotion & Institutional Records
              </Typography>
            </Box>

            {/* SECTION 1: PERSONAL & OFFICIAL DATA */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
              A. PERSONAL & INSTITUTIONAL DATA
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3, fontSize: '14px' }}>
              <Box><Typography component="span" fontWeight={700}>Full Name: </Typography>{profile.firstName} {profile.lastName}</Box>
              <Box><Typography component="span" fontWeight={700}>Staff File Number: </Typography>{profile.staffNumber}</Box>
              <Box><Typography component="span" fontWeight={700}>Current Designation: </Typography>{profile.designation}</Box>
              <Box><Typography component="span" fontWeight={700}>Staff Category: </Typography>{profile.category}</Box>
              <Box><Typography component="span" fontWeight={700}>Faculty / Department: </Typography>{profile.orgUnitName || 'N/A'}</Box>
              <Box><Typography component="span" fontWeight={700}>Grade Level & Step: </Typography>GL {profile.gradeLevel} / Step {profile.gradeStep}</Box>
              <Box><Typography component="span" fontWeight={700}>Date of First Appointment: </Typography>{profile.dateOfFirstAppointment || profile.dateOfHire || 'N/A'}</Box>
              <Box><Typography component="span" fontWeight={700}>Date of Present Appointment: </Typography>{profile.dateAppointedToPresentPost || 'N/A'}</Box>
              <Box><Typography component="span" fontWeight={700}>Email / Username: </Typography>{profile.email}</Box>
              <Box><Typography component="span" fontWeight={700}>Phone Number: </Typography>{profile.phone || 'N/A'}</Box>
            </Box>

            {/* SECTION 2: ACADEMIC QUALIFICATIONS */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
              B. ACADEMIC & PROFESSIONAL QUALIFICATIONS
            </Typography>

            <Box sx={{ mb: 3 }}>
              {profile.qualifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nil</Typography>
              ) : (
                <Stack spacing={1}>
                  {profile.qualifications.map((q, idx) => (
                    <Typography key={q.id} variant="body2" sx={{ fontSize: '14px' }}>
                      {idx + 1}. <strong>{q.degree}</strong> ({q.fieldOfStudy || 'General'}) — {q.institution} ({q.yearObtained || 'N/A'})
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>

            {/* SECTION 3: EMPLOYMENT & CADRE HISTORY */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
              C. WORK EXPERIENCE & EMPLOYMENT HISTORY
            </Typography>

            <Box sx={{ mb: 3 }}>
              {profile.employmentHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nil</Typography>
              ) : (
                <Stack spacing={1}>
                  {profile.employmentHistory.map((h, idx) => (
                    <Typography key={h.id} variant="body2" sx={{ fontSize: '14px' }}>
                      {idx + 1}. <strong>{h.positionTitle}</strong> — {h.organization} [{h.startDate || 'N/A'} to {h.endDate || 'Present'}]
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>

            {/* SECTION 4: CATEGORY SPECIFIC (ACADEMIC vs NON-ACADEMIC) */}
            {isAcademic ? (
              <>
                {/* D. RESEARCH & PUBLICATIONS */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
                  D. SCHOLARLY PUBLICATIONS & RESEARCH PAPERS
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {!academicData?.publications || academicData.publications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Nil</Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {academicData.publications.map((p, idx) => (
                        <Box key={p.id} sx={{ fontSize: '14px' }}>
                          <Typography variant="body2" fontWeight={700}>
                            {idx + 1}. {p.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.journalPublisher} ({p.yearPublished}) · Category: {p.category} · DOI: {p.doiIsbn || 'N/A'} · Impact Factor: {p.impactFactor}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* E. TEACHING & COURSES */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
                  E. TEACHING LOAD & COURSES ALLOCATED
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {!academicData?.courses || academicData.courses.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Nil</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {academicData.courses.map((c, idx) => (
                        <Typography key={c.id} variant="body2" sx={{ fontSize: '14px' }}>
                          {idx + 1}. <strong>{c.courseCode}</strong>: {c.title} ({c.level}) — {c.creditUnits} Credit Units ({c.enrolledStudentsCount} Students)
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* F. POSTGRADUATE SUPERVISION */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
                  F. POSTGRADUATE STUDENT SUPERVISION
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {!academicData?.supervisions || academicData.supervisions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Nil</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {academicData.supervisions.map((s, idx) => (
                        <Typography key={s.id} variant="body2" sx={{ fontSize: '14px' }}>
                          {idx + 1}. <strong>{s.studentName}</strong> ({s.programme} - {s.matricNumber}) — Topic: "{s.researchTopic}" [{s.stage}]
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>
              </>
            ) : (
              <>
                {/* D. SCHEDULE OF ADMINISTRATIVE DUTIES */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
                  D. SCHEDULE OF ADMINISTRATIVE & TECHNICAL DUTIES
                </Typography>
                <Box sx={{ mb: 3, fontSize: '14px' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {profile.scheduleOfDuties && profile.scheduleOfDuties.trim().length > 0
                      ? profile.scheduleOfDuties
                      : 'Oversight of departmental registry operations, administrative committee secretarial support, records processing, and institutional workflow management.'}
                  </Typography>
                </Box>

                {/* E. WORKSHOPS & CERTIFICATIONS */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
                  E. PROFESSIONAL WORKSHOPS & CERTIFICATIONS
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {!nonAcademicData?.trainings || nonAcademicData.trainings.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Nil</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {nonAcademicData.trainings.map((t, idx) => (
                        <Typography key={t.id} variant="body2" sx={{ fontSize: '14px' }}>
                          {idx + 1}. <strong>{t.title}</strong> — Organized by {t.organizer} ({t.yearAttended}) {t.certificateNumber ? `[Cert No: ${t.certificateNumber}]` : ''}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* F. ADMINISTRATIVE PROJECTS */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, bgcolor: '#f1f5f9', p: 1, borderLeft: '4px solid #1e293b' }}>
                  F. ADMINISTRATIVE PROJECTS & OPERATIONS MANAGED
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {!nonAcademicData?.projects || nonAcademicData.projects.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Nil</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {nonAcademicData.projects.map((pr, idx) => (
                        <Typography key={pr.id} variant="body2" sx={{ fontSize: '14px' }}>
                          {idx + 1}. <strong>{pr.projectTitle}</strong> (Role: {pr.role}) — {pr.description || 'Completed institutional project.'}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>
              </>
            )}

            {/* ATTESTATION */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mt: 4, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Verified & Generated via UniService ERP
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', borderTop: '1px solid #94a3b8', pt: 1, width: 200 }}>
                <Typography variant="caption" fontWeight={700}>
                  Signature of Staff Member
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
}
