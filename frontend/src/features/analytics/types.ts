export interface Bucket {
  label: string;
  value: number;
}

export interface AnalyticsData {
  generatedAt: string;
  staff: { total: number; active: number; byCategory: Bucket[]; byStatus: Bucket[]; byDepartment: Bucket[] };
  leave: { pending: number; byStatus: Bucket[] };
  recruitment: { openPostings: number; pipeline: Bucket[] } | null;
  payroll: { history: { period: string; totalGross: number; totalNet: number; staffCount: number }[] } | null;
  attendance: {
    activeStaff: number;
    presentToday: number;
    lateToday: number;
    last14Days: { date: string; present: number; late: number }[];
  } | null;
  expiringDocuments: { value: number } | null;
  onboardingInProgress: { value: number } | null;
}
