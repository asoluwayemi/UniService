export interface AttendanceRecord {
  id: number;
  username: string;
  fullName: string;
  workDate: string;
  clockIn: string;
  clockOut: string | null;
  late: boolean;
  minutesWorked: number | null;
}

export interface AttendanceSummary {
  month: string;
  daysPresent: number;
  daysLate: number;
  totalMinutesWorked: number;
  records: AttendanceRecord[];
}
