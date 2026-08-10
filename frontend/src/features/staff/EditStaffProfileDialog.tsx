import { useState } from 'react';
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
import type { EmploymentStatus, EmploymentType, StaffCategory, StaffProfile } from './types';

interface EditStaffProfileDialogProps {
  open: boolean;
  profile: StaffProfile;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: StaffCategory[] = ['ACADEMIC', 'NON_ACADEMIC'];
const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'ADJUNCT'];
const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'SEPARATED'];

export function EditStaffProfileDialog({ open, profile, onClose, onSaved }: EditStaffProfileDialogProps) {
  const [category, setCategory] = useState<StaffCategory>(profile.category);
  const [designation, setDesignation] = useState(profile.designation ?? '');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(profile.employmentType);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>(profile.employmentStatus);
  const [dateOfHire, setDateOfHire] = useState(profile.dateOfHire);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [dateOfFirstAppointment, setDateOfFirstAppointment] = useState(profile.dateOfFirstAppointment ?? '');
  const [dateAppointedToPresentPost, setDateAppointedToPresentPost] = useState(profile.dateAppointedToPresentPost ?? '');
  const [scheduleOfDuties, setScheduleOfDuties] = useState(profile.scheduleOfDuties ?? '');
  const [presentScaleAndSalary, setPresentScaleAndSalary] = useState(profile.presentScaleAndSalary ?? '');
  const [dateOfNextIncrement, setDateOfNextIncrement] = useState(profile.dateOfNextIncrement ?? '');
  const [lastPromotionDate, setLastPromotionDate] = useState(profile.lastPromotionDate ?? '');
  const [promotionDueDate, setPromotionDueDate] = useState(profile.promotionDueDate ?? '');
  const [gradeLevel, setGradeLevel] = useState(profile.gradeLevel?.toString() ?? '');
  const [gradeStep, setGradeStep] = useState(profile.gradeStep?.toString() ?? '');
  const [cadre, setCadre] = useState(profile.cadre ?? '');
  const [ippisNumber, setIppisNumber] = useState(profile.ippisNumber ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await httpClient.put(`/api/staff/${profile.id}`, {
        category,
        designation: designation || undefined,
        employmentType,
        employmentStatus,
        dateOfHire,
        phone: phone || undefined,
        address: address || undefined,
        dateOfFirstAppointment: dateOfFirstAppointment || undefined,
        dateAppointedToPresentPost: dateAppointedToPresentPost || undefined,
        scheduleOfDuties: scheduleOfDuties || undefined,
        presentScaleAndSalary: presentScaleAndSalary || undefined,
        dateOfNextIncrement: dateOfNextIncrement || undefined,
        lastPromotionDate: lastPromotionDate || undefined,
        promotionDueDate: promotionDueDate || undefined,
        gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
        gradeStep: gradeStep ? Number(gradeStep) : undefined,
        cadre: cadre || undefined,
        ippisNumber: ippisNumber || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save these changes.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
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
            select
            label="Employment Status"
            value={employmentStatus}
            onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
            fullWidth
          >
            {EMPLOYMENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
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
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
          <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
          <TextField
            label="Date of First Appointment"
            type="date"
            value={dateOfFirstAppointment}
            onChange={(e) => setDateOfFirstAppointment(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Date Appointed to Present Post"
            type="date"
            value={dateAppointedToPresentPost}
            onChange={(e) => setDateAppointedToPresentPost(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Schedule of Duties"
            value={scheduleOfDuties}
            onChange={(e) => setScheduleOfDuties(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <TextField
            label="Present Scale and Salary"
            value={presentScaleAndSalary}
            onChange={(e) => setPresentScaleAndSalary(e.target.value)}
            fullWidth
          />
          <TextField
            label="Date of Next Increment"
            type="date"
            value={dateOfNextIncrement}
            onChange={(e) => setDateOfNextIncrement(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Last Promotion Date"
            type="date"
            value={lastPromotionDate}
            onChange={(e) => setLastPromotionDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Promotion Review Due"
            type="date"
            value={promotionDueDate}
            onChange={(e) => setPromotionDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField label="Grade Level" type="number" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} fullWidth />
          <TextField label="Grade Step" type="number" value={gradeStep} onChange={(e) => setGradeStep(e.target.value)} fullWidth />
          <TextField label="Cadre" value={cadre} onChange={(e) => setCadre(e.target.value)} fullWidth />
          <TextField label="IPPIS Number" value={ippisNumber} onChange={(e) => setIppisNumber(e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
