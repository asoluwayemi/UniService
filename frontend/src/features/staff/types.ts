export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StaffCategory = 'ACADEMIC' | 'NON_ACADEMIC';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'ADJUNCT';
export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'SEPARATED';

export interface AcademicQualification {
  id: number;
  degree: string;
  fieldOfStudy: string | null;
  institution: string;
  yearObtained: number | null;
}

export interface EmploymentHistoryEntry {
  id: number;
  organization: string;
  positionTitle: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface StaffProfileSummary {
  id: number;
  staffNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  category: StaffCategory;
  designation: string | null;
  orgUnitId: number | null;
  orgUnitName: string | null;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
}

export interface StaffProfile {
  id: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  staffNumber: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  phone: string | null;
  address: string | null;
  nationality: string | null;
  category: StaffCategory;
  designation: string | null;
  orgUnitId: number | null;
  orgUnitName: string | null;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  dateOfHire: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  dateOfFirstAppointment: string | null;
  dateAppointedToPresentPost: string | null;
  scheduleOfDuties: string | null;
  presentScaleAndSalary: string | null;
  dateOfNextIncrement: string | null;
  lastPromotionDate: string | null;
  completedAppraisalsSincePromotion: number;
  eligibleForPromotion: boolean;
  qualifications: AcademicQualification[];
  employmentHistory: EmploymentHistoryEntry[];
}

export interface EligibleUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles: string[];
}

export interface CreateStaffProfilePayload {
  userId: number;
  staffNumber: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  address?: string;
  nationality?: string;
  category: StaffCategory;
  designation?: string;
  orgUnitId?: number;
  employmentType: EmploymentType;
  dateOfHire: string;
  contractStartDate?: string;
  contractEndDate?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  dateOfFirstAppointment?: string;
  dateAppointedToPresentPost?: string;
  scheduleOfDuties?: string;
  presentScaleAndSalary?: string;
  dateOfNextIncrement?: string;
  lastPromotionDate?: string;
}

export interface AddQualificationPayload {
  degree: string;
  fieldOfStudy?: string;
  institution: string;
  yearObtained?: number;
}

export interface AddEmploymentHistoryPayload {
  organization: string;
  positionTitle: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}
