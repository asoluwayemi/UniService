export type OnboardingStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OnboardingTask {
  id: number;
  title: string;
  ownerTeam: string;
  done: boolean;
  doneAt: string | null;
  doneBy: string | null;
}

export interface OnboardingCase {
  id: number;
  newHireName: string;
  email: string;
  position: string;
  department: string;
  startDate: string;
  status: OnboardingStatus;
  applicationId: number | null;
  linkedUsername: string | null;
  profileReady: boolean;
  payrollReady: boolean;
  tasksDone: number;
  tasksTotal: number;
  tasks: OnboardingTask[];
}
