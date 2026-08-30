import { describe, expect, it } from 'vitest';
import { profileCompleteness } from './profileCompleteness';
import type { StaffProfile } from './types';

function baseProfile(overrides: Partial<StaffProfile> = {}): StaffProfile {
  return {
    id: 1,
    userId: 1,
    username: 'jdoe',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jdoe@uniservice.local',
    staffNumber: 'STAFF-0001',
    dateOfBirth: null,
    gender: null,
    phone: null,
    address: null,
    nationality: null,
    category: 'ACADEMIC',
    designation: 'Lecturer',
    orgUnitId: null,
    orgUnitName: null,
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    dateOfHire: '2024-01-15',
    contractStartDate: null,
    contractEndDate: null,
    bankName: null,
    bankAccountName: null,
    bankAccountNumber: null,
    dateOfFirstAppointment: null,
    dateAppointedToPresentPost: null,
    scheduleOfDuties: null,
    presentScaleAndSalary: null,
    dateOfNextIncrement: null,
    lastPromotionDate: null,
    promotionDueDate: null,
    gradeLevel: null,
    gradeStep: null,
    cadre: null,
    ippisNumber: null,
    nin: null,
    tin: null,
    emergencyContactName: null,
    emergencyContactRelationship: null,
    emergencyContactPhone: null,
    completedAppraisalsSincePromotion: 0,
    eligibleForPromotion: false,
    qualifications: [],
    employmentHistory: [],
    ...overrides,
  };
}

describe('profileCompleteness', () => {
  it('is 0% when none of the tracked fields are filled', () => {
    const result = profileCompleteness(baseProfile());

    expect(result.percent).toBe(0);
    expect(result.missing).toContain('Phone');
    expect(result.missing).toContain('Emergency Contact');
  });

  it('is 100% when every tracked field is filled', () => {
    const result = profileCompleteness(
      baseProfile({
        phone: '08000000000',
        address: '1 University Road',
        dateOfBirth: '1990-01-01',
        gender: 'FEMALE',
        nationality: 'Nigerian',
        bankName: 'First Bank',
        bankAccountNumber: '0123456789',
        emergencyContactName: 'John Doe',
        emergencyContactPhone: '08011111111',
      }),
    );

    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it('reports partial completeness proportionally', () => {
    const result = profileCompleteness(baseProfile({ phone: '08000000000', address: '1 University Road' }));

    expect(result.percent).toBeGreaterThan(0);
    expect(result.percent).toBeLessThan(100);
    expect(result.missing).not.toContain('Phone');
    expect(result.missing).toContain('Nationality');
  });
});
