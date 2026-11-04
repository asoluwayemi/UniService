export type VaultCategory =
  | 'CONTRACT'
  | 'APPOINTMENT_LETTER'
  | 'CERTIFICATE'
  | 'ID_DOCUMENT'
  | 'MEDICAL'
  | 'DISCIPLINARY'
  | 'OTHER';

export const VAULT_CATEGORIES: { value: VaultCategory; label: string }[] = [
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'APPOINTMENT_LETTER', label: 'Appointment letter' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'ID_DOCUMENT', label: 'ID document' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'DISCIPLINARY', label: 'Disciplinary' },
  { value: 'OTHER', label: 'Other' },
];

export interface VaultDocument {
  id: number;
  ownerUsername: string;
  ownerName: string;
  category: VaultCategory;
  title: string;
  description: string | null;
  filename: string;
  contentType: string | null;
  sizeBytes: number;
  expiresOn: string | null;
  daysToExpiry: number | null;
  visibleToOwner: boolean;
  uploadedBy: string;
  uploadedAt: string;
}

export interface StaffLookup {
  userId: number;
  username: string;
  fullName: string;
  email: string;
}
