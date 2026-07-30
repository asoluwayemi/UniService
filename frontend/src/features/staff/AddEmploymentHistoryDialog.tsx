import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, Stack, TextField } from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { AddEmploymentHistoryPayload } from './types';

interface AddEmploymentHistoryDialogProps {
  open: boolean;
  staffProfileId: number;
  onClose: () => void;
  onAdded: () => void;
}

export function AddEmploymentHistoryDialog({ open, staffProfileId, onClose, onAdded }: AddEmploymentHistoryDialogProps) {
  const [organization, setOrganization] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: AddEmploymentHistoryPayload = {
        organization,
        positionTitle,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description: description || undefined,
      };
      await httpClient.post(`/api/staff/${staffProfileId}/employment-history`, payload);
      onAdded();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not add this employment history entry.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = organization.trim() !== '' && positionTitle.trim() !== '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} required fullWidth />
          <TextField label="Position Title" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} required fullWidth />
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
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
