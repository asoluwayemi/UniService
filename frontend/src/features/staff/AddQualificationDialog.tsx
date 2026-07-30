import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, Stack, TextField } from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { AddQualificationPayload } from './types';

interface AddQualificationDialogProps {
  open: boolean;
  staffProfileId: number;
  onClose: () => void;
  onAdded: () => void;
}

export function AddQualificationDialog({ open, staffProfileId, onClose, onAdded }: AddQualificationDialogProps) {
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [yearObtained, setYearObtained] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: AddQualificationPayload = {
        degree,
        institution,
        fieldOfStudy: fieldOfStudy || undefined,
        yearObtained: yearObtained ? Number(yearObtained) : undefined,
      };
      await httpClient.post(`/api/staff/${staffProfileId}/qualifications`, payload);
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
