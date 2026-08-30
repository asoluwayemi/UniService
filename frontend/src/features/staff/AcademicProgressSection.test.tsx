import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AcademicProgressSection } from './AcademicProgressSection';
import { httpClient } from '../../app/httpClient';

vi.mock('../../app/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = httpClient.get as Mock;
const mockedPost = httpClient.post as Mock;
const mockedDelete = httpClient.delete as Mock;

const data = {
  courses: [{ id: 1, courseCode: 'CS101', title: 'Intro to CS', level: '100L', creditUnits: 3, enrolledStudentsCount: 50, semester: 'First' }],
  publications: [{ id: 2, title: 'A Study', journalPublisher: 'Nature', yearPublished: 2026, category: 'JOURNAL', impactFactor: 3.2 }],
  supervisions: [{ id: 3, studentName: 'John Smith', matricNumber: 'MAT001', programme: 'PHD', researchTopic: 'AI', stage: 'Writing' }],
};

describe('AcademicProgressSection', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedDelete.mockReset();
  });

  it('loads data from /api/academic/mine when isMine is true', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<AcademicProgressSection staffProfileId={1} isMine />);

    expect(await screen.findByText('Intro to CS')).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith('/api/academic/mine');
  });

  it('loads data from /api/academic/staff/{id} when viewing someone else', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<AcademicProgressSection staffProfileId={9} isMine={false} />);

    await screen.findByText('Intro to CS');
    expect(mockedGet).toHaveBeenCalledWith('/api/academic/staff/9');
  });

  it('renders all three sections with their record counts', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<AcademicProgressSection staffProfileId={1} isMine />);

    expect(await screen.findByText(/Research Publications, Papers & Studies \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Teaching Load & Course Allocations \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Postgraduate Student Supervision \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('adds a course', async () => {
    mockedGet.mockResolvedValue({ data: { courses: [], publications: [], supervisions: [] } });
    mockedPost.mockResolvedValueOnce({ data: {} });

    render(<AcademicProgressSection staffProfileId={1} isMine />);

    await screen.findByText('No courses assigned yet.');
    await userEvent.click(screen.getByRole('button', { name: 'Add Course' }));

    await userEvent.type(screen.getByLabelText(/Course Code/), 'MTH201');
    await userEvent.type(screen.getByLabelText('Course Title'), 'Calculus II');
    await userEvent.click(screen.getByRole('button', { name: 'Save Course' }));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/api/academic/courses', expect.objectContaining({
        courseCode: 'MTH201',
        title: 'Calculus II',
      })),
    );
  });

  it('deletes a publication', async () => {
    mockedGet.mockResolvedValueOnce({ data }).mockResolvedValueOnce({ data: { ...data, publications: [] } });
    mockedDelete.mockResolvedValueOnce({ data: {} });

    render(<AcademicProgressSection staffProfileId={1} isMine />);

    await screen.findByText('A Study');
    const deleteButtons = screen.getAllByRole('button').filter((b) => b.querySelector('svg[data-testid="DeleteIcon"]'));
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('/api/academic/publications/2'));
  });

  it('does not offer supervision deletion (add-only)', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<AcademicProgressSection staffProfileId={1} isMine />);

    await screen.findByText('John Smith');
    expect(screen.getByRole('button', { name: 'Add Supervisee' })).toBeInTheDocument();
  });

  it('hides add/delete actions when not isMine', async () => {
    mockedGet.mockResolvedValueOnce({ data });

    render(<AcademicProgressSection staffProfileId={9} isMine={false} />);

    await screen.findByText('Intro to CS');
    expect(screen.queryByRole('button', { name: /Add/ })).not.toBeInTheDocument();
  });
});
