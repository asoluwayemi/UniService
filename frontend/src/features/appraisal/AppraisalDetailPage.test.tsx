import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AppraisalDetailPage } from './AppraisalDetailPage';
import { httpClient } from '../../app/httpClient';
import type { AppraisalForm } from './types';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;

function baseForm(overrides: Partial<AppraisalForm> = {}): AppraisalForm {
  return {
    id: 1,
    cycleId: 1,
    cycleYear: 2026,
    staffProfileId: 1,
    staffFullName: 'Jane Doe',
    staffNumber: 'STAFF-0001',
    status: 'STAFF_DRAFT',
    scheduleOfDuties: null,
    ratingQualityOfWork: null,
    ratingKnowledgeOfWork: null,
    ratingPerformanceUnderStress: null,
    ratingInitiative: null,
    ratingAdaptability: null,
    ratingResourcefulness: null,
    ratingTeamSpirit: null,
    ratingJobPresence: null,
    ratingAdministrativeAbility: null,
    ratingAttitudeToWork: null,
    ratingKnowledgeOfIct: null,
    ratingPunctuality: null,
    ratingAppearance: null,
    loyaltyToInstitution: null,
    overallGrading: null,
    coursesAttended: null,
    trainingNeeds: null,
    promotability: null,
    promotabilityComments: null,
    longTermPotentials: null,
    generalRemarks: null,
    servedUnderReportingOfficerYears: null,
    numberOfQueries: null,
    pendingDisciplinaryAction: null,
    concludedDisciplinaryAction: null,
    unitHeadId: null,
    unitHeadName: null,
    unitHeadPost: null,
    unitHeadSignedAt: null,
    staffComments: null,
    staffCommentedAt: null,
    departmentHeadComments: null,
    departmentHeadId: null,
    departmentHeadName: null,
    departmentHeadSignedAt: null,
    sickLeaves: [],
    viewerIsOwner: false,
    viewerIsUnitHead: false,
    viewerIsDepartmentHead: false,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/appraisals/1']}>
      <Routes>
        <Route path="/appraisals/:id" element={<AppraisalDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppraisalDetailPage', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('lets the owning staff edit schedule of duties during STAFF_DRAFT', async () => {
    mockedGet.mockResolvedValueOnce({ data: baseForm({ status: 'STAFF_DRAFT', viewerIsOwner: true }) });

    renderPage();

    expect(await screen.findByLabelText('Schedule of Duties')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit to Head of Unit' })).toBeInTheDocument();
  });

  it('shows read-only biodata when the viewer is not the owner during STAFF_DRAFT', async () => {
    mockedGet.mockResolvedValueOnce({
      data: baseForm({ status: 'STAFF_DRAFT', viewerIsOwner: false, scheduleOfDuties: 'Teach CS101' }),
    });

    renderPage();

    expect(await screen.findByText('Teach CS101')).toBeInTheDocument();
    expect(screen.queryByLabelText('Schedule of Duties')).not.toBeInTheDocument();
  });

  it('lets the resolved unit head submit a review during AWAITING_UNIT_HEAD', async () => {
    mockedGet.mockResolvedValueOnce({ data: baseForm({ status: 'AWAITING_UNIT_HEAD', viewerIsUnitHead: true }) });

    renderPage();

    expect(await screen.findByText('Quality of Work')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
  });

  it('shows a waiting placeholder for a non-actor during AWAITING_UNIT_HEAD', async () => {
    mockedGet.mockResolvedValueOnce({ data: baseForm({ status: 'AWAITING_UNIT_HEAD', viewerIsUnitHead: false }) });

    renderPage();

    expect(await screen.findByText('Awaiting Head of Unit review.')).toBeInTheDocument();
  });

  it('lets staff submit a counter-comment during AWAITING_STAFF_COUNTER_COMMENT', async () => {
    mockedGet.mockResolvedValueOnce({
      data: baseForm({ status: 'AWAITING_STAFF_COUNTER_COMMENT', viewerIsOwner: true }),
    });

    renderPage();

    expect(await screen.findByLabelText('Your Comments')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Your Comments'), 'Agreed');

    mockedPost.mockResolvedValueOnce({ data: {} });
    mockedGet.mockResolvedValueOnce({
      data: baseForm({ status: 'AWAITING_DEPARTMENT_HEAD', viewerIsOwner: true, staffComments: 'Agreed' }),
    });
    await userEvent.click(screen.getByRole('button', { name: 'Submit Comments' }));

    expect(mockedPost).toHaveBeenCalledWith('/api/appraisals/1/staff-counter-comment', { staffComments: 'Agreed' });
  });

  it('shows completed appraisal read-only for a viewer with blanket access', async () => {
    mockedGet.mockResolvedValueOnce({
      data: baseForm({
        status: 'COMPLETED',
        overallGrading: 'VERY_GOOD',
        staffComments: 'Looks fair',
        departmentHeadComments: 'Approved',
        departmentHeadName: 'Dr. Head',
      }),
    });

    renderPage();

    expect(await screen.findByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Looks fair')).toBeInTheDocument();
    expect(screen.getByText(/Signed by Dr\. Head/)).toBeInTheDocument();
  });
});
