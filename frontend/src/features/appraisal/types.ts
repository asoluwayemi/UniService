export type AppraisalCycleStatus = 'OPEN' | 'CLOSED';

export type AppraisalStatus =
  | 'STAFF_DRAFT'
  | 'AWAITING_UNIT_HEAD'
  | 'AWAITING_STAFF_COUNTER_COMMENT'
  | 'AWAITING_DEPARTMENT_HEAD'
  | 'COMPLETED';

export type OverallGrading = 'OUTSTANDING' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'SATISFACTORY' | 'FAIR' | 'POOR';

export type Promotability = 'WELL_FITTED' | 'FITTED' | 'NOT_FITTED';

export interface AppraisalCycle {
  id: number;
  year: number;
  status: AppraisalCycleStatus;
}

export interface AppraisalSickLeave {
  id: number;
  fromDate: string | null;
  toDate: string | null;
  numberOfDays: number | null;
}

export interface AppraisalSummary {
  id: number;
  cycleYear: number;
  staffProfileId: number;
  staffFullName: string;
  status: AppraisalStatus;
}

export const RATING_KEYS = [
  'ratingQualityOfWork',
  'ratingKnowledgeOfWork',
  'ratingPerformanceUnderStress',
  'ratingInitiative',
  'ratingAdaptability',
  'ratingResourcefulness',
  'ratingTeamSpirit',
  'ratingJobPresence',
  'ratingAdministrativeAbility',
  'ratingAttitudeToWork',
  'ratingKnowledgeOfIct',
  'ratingPunctuality',
  'ratingAppearance',
] as const;

export type RatingKey = (typeof RATING_KEYS)[number];

export const RATING_LABELS: Record<RatingKey, string> = {
  ratingQualityOfWork: 'Quality of Work',
  ratingKnowledgeOfWork: 'Knowledge of Work',
  ratingPerformanceUnderStress: 'Performance Under Stress',
  ratingInitiative: 'Initiative',
  ratingAdaptability: 'Adaptability',
  ratingResourcefulness: 'Resourcefulness',
  ratingTeamSpirit: 'Team Spirit',
  ratingJobPresence: 'Job Presence',
  ratingAdministrativeAbility: 'Administrative Ability',
  ratingAttitudeToWork: 'Attitude to Work',
  ratingKnowledgeOfIct: 'Knowledge of ICT',
  ratingPunctuality: 'Punctuality',
  ratingAppearance: 'Appearance at Work/Mode of Dressing',
};

export type RatingValues = Record<RatingKey, number | null>;

export interface AppraisalForm extends RatingValues {
  id: number;
  cycleId: number;
  cycleYear: number;
  staffProfileId: number;
  staffFullName: string;
  staffNumber: string;
  status: AppraisalStatus;

  scheduleOfDuties: string | null;

  loyaltyToInstitution: string | null;
  overallGrading: OverallGrading | null;
  coursesAttended: string | null;
  trainingNeeds: string | null;
  promotability: Promotability | null;
  promotabilityComments: string | null;
  longTermPotentials: string | null;
  generalRemarks: string | null;
  servedUnderReportingOfficerYears: number | null;
  numberOfQueries: number | null;
  pendingDisciplinaryAction: string | null;
  concludedDisciplinaryAction: string | null;
  unitHeadId: number | null;
  unitHeadName: string | null;
  unitHeadPost: string | null;
  unitHeadSignedAt: string | null;

  staffComments: string | null;
  staffCommentedAt: string | null;

  departmentHeadComments: string | null;
  departmentHeadId: number | null;
  departmentHeadName: string | null;
  departmentHeadSignedAt: string | null;

  sickLeaves: AppraisalSickLeave[];

  viewerIsOwner: boolean;
  viewerIsUnitHead: boolean;
  viewerIsDepartmentHead: boolean;
}

export interface StaffSubmitBiodataPayload {
  scheduleOfDuties?: string;
}

export interface SickLeaveEntryPayload {
  fromDate?: string;
  toDate?: string;
  numberOfDays?: number;
}

export interface UnitHeadReviewPayload extends RatingValues {
  loyaltyToInstitution?: string;
  overallGrading: OverallGrading;
  coursesAttended?: string;
  trainingNeeds?: string;
  promotability: Promotability;
  promotabilityComments?: string;
  longTermPotentials?: string;
  generalRemarks?: string;
  servedUnderReportingOfficerYears?: number;
  numberOfQueries?: number;
  pendingDisciplinaryAction?: string;
  concludedDisciplinaryAction?: string;
  unitHeadPost?: string;
  sickLeaves: SickLeaveEntryPayload[];
}

export interface StaffCounterCommentPayload {
  staffComments?: string;
}

export interface DepartmentHeadSignPayload {
  departmentHeadComments?: string;
}
