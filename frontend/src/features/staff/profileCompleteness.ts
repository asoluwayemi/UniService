import type { StaffProfile } from './types';

const TRACKED_FIELDS: (keyof StaffProfile)[] = [
  'phone',
  'address',
  'dateOfBirth',
  'gender',
  'nationality',
  'bankName',
  'bankAccountNumber',
  'emergencyContactName',
  'emergencyContactPhone',
];

export function profileCompleteness(profile: StaffProfile): { percent: number; missing: string[] } {
  const missingLabels: Record<string, string> = {
    phone: 'Phone',
    address: 'Address',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    nationality: 'Nationality',
    bankName: 'Bank Name',
    bankAccountNumber: 'Bank Account Number',
    emergencyContactName: 'Emergency Contact',
    emergencyContactPhone: 'Emergency Contact Phone',
  };

  const filled = TRACKED_FIELDS.filter((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
  const missing = TRACKED_FIELDS.filter((f) => !filled.includes(f)).map((f) => missingLabels[f]);

  return {
    percent: Math.round((filled.length / TRACKED_FIELDS.length) * 100),
    missing,
  };
}
