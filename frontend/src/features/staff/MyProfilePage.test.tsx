import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MyProfilePage } from './MyProfilePage';
import { httpClient } from '../../app/httpClient';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedDelete = httpClient.delete as Mock;

const profile = {
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
  qualifications: [{ id: 5, degree: 'PhD', fieldOfStudy: 'CS', institution: 'MIT', yearObtained: 2020, documentUrl: null }],
  employmentHistory: [],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <MyProfilePage />
    </MemoryRouter>,
  );
}

describe('MyProfilePage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedDelete.mockReset();
  });

  it('deletes a qualification via the self-service endpoint, not the HR-only one', async () => {
    mockedGet.mockResolvedValue({ data: profile });
    mockedDelete.mockResolvedValueOnce({ data: {} });

    renderPage();

    const deleteButton = await screen.findByRole('button', { name: 'Remove PhD qualification' });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith('/api/staff/me/qualifications/5');
    });
  });

  it('opens the contact info edit dialog', async () => {
    mockedGet.mockResolvedValue({ data: profile });

    renderPage();

    await screen.findByText('My Staff Profile');
    await userEvent.click(screen.getByRole('button', { name: /edit contact info/i }));

    expect(await screen.findByText('Edit Contact Information')).toBeInTheDocument();
  });

  it('shows the profile completeness indicator', async () => {
    mockedGet.mockResolvedValue({ data: profile });

    renderPage();

    expect(await screen.findByText('Profile Completeness')).toBeInTheDocument();
  });
});
