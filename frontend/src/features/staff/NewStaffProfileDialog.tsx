import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { CreateStaffProfilePayload, EligibleUser, StaffCategory, EmploymentType } from './types';

interface NewStaffProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES: StaffCategory[] = ['ACADEMIC', 'NON_ACADEMIC'];
const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'ADJUNCT'];

export function NewStaffProfileDialog({ open, onClose, onCreated }: NewStaffProfileDialogProps) {
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [userId, setUserId] = useState('');
  const [staffNumber, setStaffNumber] = useState('');
  const [category, setCategory] = useState<StaffCategory>('ACADEMIC');
  const [designation, setDesignation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [dateOfHire, setDateOfHire] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    httpClient
      .get<EligibleUser[]>('/api/staff/eligible-users')
      .then((res) => setEligibleUsers(res.data))
      .catch(() => setEligibleUsers([]));
  }, [open]);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateStaffProfilePayload = {
        userId: Number(userId),
        staffNumber,
        category,
        designation: designation || undefined,
        employmentType,
        dateOfHire,
      };
      await httpClient.post('/api/staff', payload);
      onCreated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create this staff profile.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = userId !== '' && staffNumber.trim() !== '' && dateOfHire !== '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label="User" value={userId} onChange={(e) => setUserId(e.target.value)} required fullWidth>
            {eligibleUsers.length === 0 && (
              <MenuItem value="" disabled>
                <em>No eligible users</em>
              </MenuItem>
            )}
            {eligibleUsers.map((u) => (
              <MenuItem key={u.id} value={String(u.id)}>
                {u.firstName} {u.lastName} ({u.username})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Staff Number"
            value={staffNumber}
            onChange={(e) => setStaffNumber(e.target.value)}
            required
            fullWidth
          />
          <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value as StaffCategory)} fullWidth>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} fullWidth />
          <TextField
            select
            label="Employment Type"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
            fullWidth
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Date of Hire"
            type="date"
            value={dateOfHire}
            onChange={(e) => setDateOfHire(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting || !canSubmit}>
          {submitting ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
