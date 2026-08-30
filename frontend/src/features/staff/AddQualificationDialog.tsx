import { useState, type ChangeEvent } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, Stack, TextField, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { httpClient } from '../../app/httpClient';
import type { AddQualificationPayload } from './types';

interface AddQualificationDialogProps {
  open: boolean;
  /** When omitted, adds to the current user's own profile via the self-service endpoint. */
  staffProfileId?: number;
  onClose: () => void;
  onAdded: () => void;
}

export function AddQualificationDialog({ open, staffProfileId, onClose, onAdded }: AddQualificationDialogProps) {
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [yearObtained, setYearObtained] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await httpClient.post<{ fileUrl: string }>('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocumentUrl(res.data.fileUrl);
    } catch {
      setError('Failed to upload the proof document.');
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: AddQualificationPayload = {
        degree,
        institution,
        fieldOfStudy: fieldOfStudy || undefined,
        yearObtained: yearObtained ? Number(yearObtained) : undefined,
        documentUrl: documentUrl || undefined,
      };
      const endpoint = staffProfileId ? `/api/staff/${staffProfileId}/qualifications` : '/api/staff/me/qualifications';
      await httpClient.post(endpoint, payload);
      onAdded();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not add this qualification.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = degree.trim() !== '' && institution.trim() !== '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Degree" value={degree} onChange={(e) => setDegree(e.target.value)} required fullWidth />
          <TextField label="Field of Study" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} fullWidth />
          <TextField label="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} required fullWidth />
          <TextField
            label="Year Obtained"
            type="number"
            value={yearObtained}
            onChange={(e) => setYearObtained(e.target.value)}
            fullWidth
          />

          <Box sx={{ p: 2, border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', bgcolor: '#f8fafc' }}>
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={uploadingFile}>
              {uploadingFile ? 'Uploading…' : 'Upload Certificate / Proof Document'}
              <input type="file" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} />
            </Button>
            {documentUrl && (
              <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1, fontWeight: 700 }}>
                Document attached
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting || !canSubmit}>
          {submitting ? 'Adding…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
