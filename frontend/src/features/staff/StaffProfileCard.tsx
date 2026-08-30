import { Card, CardContent, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import type { StaffProfile } from './types';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value && value.trim() !== '' ? value : '—'}</Typography>
    </Grid>
  );
}

export function StaffProfileCard({ profile }: { profile: StaffProfile }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack>
            <Typography variant="h5">
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography color="text.secondary">{profile.staffNumber}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip label={profile.category} color="primary" variant="outlined" />
            <Chip label={profile.employmentStatus} color={profile.employmentStatus === 'ACTIVE' ? 'success' : 'default'} />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Field label="Email" value={profile.email} />
          <Field label="Phone" value={profile.phone} />
          <Field label="Date of Birth" value={profile.dateOfBirth} />
          <Field label="Gender" value={profile.gender} />
          <Field label="Nationality" value={profile.nationality} />
          <Field label="Address" value={profile.address} />
          <Field label="Designation" value={profile.designation} />
          <Field label="Department" value={profile.orgUnitName} />
          <Field label="Employment Type" value={profile.employmentType} />
          <Field label="Date of Hire" value={profile.dateOfHire} />
          <Field label="Contract Start" value={profile.contractStartDate} />
          <Field label="Contract End" value={profile.contractEndDate} />
          <Field label="Bank Name" value={profile.bankName} />
          <Field label="Bank Account Name" value={profile.bankAccountName} />
          <Field label="Bank Account Number" value={profile.bankAccountNumber} />
          <Field label="Date of First Appointment" value={profile.dateOfFirstAppointment} />
          <Field label="Date Appointed to Present Post" value={profile.dateAppointedToPresentPost} />
          <Field label="Schedule of Duties" value={profile.scheduleOfDuties} />
          <Field label="Present Scale and Salary" value={profile.presentScaleAndSalary} />
          <Field label="Date of Next Increment" value={profile.dateOfNextIncrement} />
          <Field label="Last Promotion Date" value={profile.lastPromotionDate} />
          <Field label="Promotion Review Due" value={profile.promotionDueDate} />
          <Field label="Grade Level / Step" value={profile.gradeLevel ? `GL ${profile.gradeLevel}${profile.gradeStep ? ` / ${profile.gradeStep}` : ''}` : null} />
          <Field label="Cadre" value={profile.cadre} />
          <Field label="IPPIS Number" value={profile.ippisNumber} />
          <Field label="Emergency Contact" value={profile.emergencyContactName} />
          <Field label="Relationship" value={profile.emergencyContactRelationship} />
          <Field label="Emergency Contact Phone" value={profile.emergencyContactPhone} />
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={
              profile.eligibleForPromotion
                ? 'Eligible for promotion'
                : `${profile.completedAppraisalsSincePromotion} of 3 appraisals completed`
            }
            color={profile.eligibleForPromotion ? 'success' : 'default'}
            variant={profile.eligibleForPromotion ? 'filled' : 'outlined'}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
