export type PostingStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type ApplicationStage = 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';

export interface JobPosting {
  id: number;
  title: string;
  department: string;
  category: 'ACADEMIC' | 'NON_ACADEMIC';
  description: string;
  status: PostingStatus;
  closingDate: string | null;
  applicationCount: number;
}

export interface JobApplication {
  id: number;
  postingId: number;
  applicantName: string;
  email: string;
  phone: string | null;
  coverNote: string | null;
  stage: ApplicationStage;
  stageNote: string | null;
  appliedAt: string;
  allowedNext: ApplicationStage[];
}
