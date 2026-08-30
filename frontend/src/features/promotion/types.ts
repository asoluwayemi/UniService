export type PromotionApplicationStatus =
  | 'SUBMITTED'
  | 'DOCUMENTS_PENDING'
  | 'DOCUMENTS_VERIFIED'
  | 'EXAM_SCHEDULED'
  | 'ORAL_INTERVIEW_SCHEDULED'
  | 'RECOMMENDED'
  | 'APPROVED'
  | 'GAZETTED'
  | 'REJECTED';

export interface PromotionSummary {
  id: number;
  staffProfileId: number;
  staffFullName: string;
  staffNumber: string;
  currentGradeLevel: number;
  requestedGradeLevel: number;
  status: PromotionApplicationStatus;
}

export interface PromotionApplication {
  id: number;
  staffProfileId: number;
  staffFullName: string;
  staffNumber: string;
  currentGradeLevel: number;
  requestedGradeLevel: number;
  eligibilityDate: string;
  status: PromotionApplicationStatus;
  staffStatement: string | null;
  reviewerComment: string | null;
  reviewedByUsername: string | null;
  reviewedAt: string | null;
  examScheduledDate: string | null;
  interviewScheduledDate: string | null;
  createdAt: string;
}

export const STATUS_LABELS: Record<PromotionApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  DOCUMENTS_PENDING: 'Documents Pending',
  DOCUMENTS_VERIFIED: 'Documents Verified',
  EXAM_SCHEDULED: 'Exam Scheduled',
  ORAL_INTERVIEW_SCHEDULED: 'Oral Interview Scheduled',
  RECOMMENDED: 'Recommended',
  APPROVED: 'Approved',
  GAZETTED: 'Gazetted',
  REJECTED: 'Rejected',
};
