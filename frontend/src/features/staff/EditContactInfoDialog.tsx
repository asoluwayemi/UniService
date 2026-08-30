import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { Gender, StaffProfile, UpdateContactInfoPayload } from './types';

interface EditContactInfoDialogProps {
  open: boolean;
  profile: StaffProfile;
  onClose: () => void;
  onSaved: () => void;
}

export function EditContactInfoDialog({ open, profile, onClose, onSaved }: EditContactInfoDialogProps) {
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ?? '');
  const [gender, setGender] = useState<Gender | ''>(profile.gender ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [nationality, setNationality] = useState(profile.nationality ?? '');
  const [emergencyContactName, setEmergencyContactName] = useState(profile.emergencyContactName ?? '');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(
    profile.emergencyContactRelationship ?? '',
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile.emergencyContactPhone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: UpdateContactInfoPayload = {
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        address: address || undefined,
        nationality: nationality || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactRelationship: emergencyContactRelationship || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
      };
      await httpClient.patch('/api/staff/me', payload);
      onSaved();
    } catch {
      setError('Could not save your contact information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Edit Contact Information</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
          <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth multiline rows={2} />
          <TextField label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} fullWidth />

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Emergency Contact
          </Typography>
          <TextField
            label="Full Name"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Relationship"
              value={emergencyContactRelationship}
              onChange={(e) => setEmergencyContactRelationship(e.target.value)}
              fullWidth
            />
            <TextField
              label="Phone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
