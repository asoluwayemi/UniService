export interface PayrollRun {
  id: number;
  period: string;
  status: 'DRAFT' | 'PUBLISHED';
  staffCount: number;
  skippedCount: number;
  totalGross: number;
  totalNet: number;
  generatedBy: string | null;
  publishedAt: string | null;
}

export interface Payslip {
  id: number;
  period: string;
  staffNumber: string | null;
  fullName: string;
  gradeLevel: number;
  basic: number;
  housing: number;
  transport: number;
  gross: number;
  pension: number;
  tax: number;
  net: number;
  bankName: string | null;
  accountLast4: string | null;
}
