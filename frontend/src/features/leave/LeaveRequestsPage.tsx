import { useEffect, useState, type ReactNode } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography
} from '@mui/material';
import { httpClient } from '../../app/httpClient';

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface LeaveRequest {
  id: number;
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  reviewerName: string | null;
  reviewerComment: string | null;
  handoverOfficerId: number | null;
  handoverOfficerName: string | null;
  handoverNotes: string | null;
  handoverStatus: string;
  resumptionDate: string | null;
  resumptionNotes: string | null;
  resumptionStatus: string;
  allowanceEligible: boolean;
  allowanceHandoffStatus: string;
  allowanceAmount: number | null;
}

interface LeaveBalance {
  gradeLevel: number;
  annualEntitlementDays: number;
  usedDaysThisYear: number;
  remainingDaysThisYear: number;
}

interface StaffMember {
  id: number;
  userId: number;
  fullName: string;
  staffIdNumber: string;
}

const TYPES = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE', 'STUDY', 'UNPAID', 'OTHER'];

export function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [pending, setPending] = useState<LeaveRequest[]>([]);
  const [handovers, setHandovers] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [handoverOfficerId, setHandoverOfficerId] = useState<string>('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [requestAllowance, setRequestAllowance] = useState(false);

  const [resumptionDialogOpen, setResumptionDialogOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
  const [resumptionDate, setResumptionDate] = useState('');
  const [resumptionNotes, setResumptionNotes] = useState('');

  const load = () => {
    httpClient.get<LeaveBalance>('/api/leave-requests/balance').then((r) => setBalance(r.data)).catch(() => {});
    httpClient.get<LeaveRequest[]>('/api/leave-requests/mine').then((r) => setRequests(r.data)).catch(() => setError('Could not load your leave requests.'));
    httpClient.get<LeaveRequest[]>('/api/leave-requests/pending').then((r) => setPending(r.data)).catch(() => setPending([]));
    httpClient.get<LeaveRequest[]>('/api/leave-requests/handovers').then((r) => setHandovers(r.data)).catch(() => setHandovers([]));
    httpClient.get<any[]>('/api/staff-profiles').then((r) => {
      const formatted = r.data.map((s) => ({
        id: s.id,
        userId: s.userId || s.user?.id,
        fullName: s.fullName || (s.user ? `${s.user.firstName} ${s.user.lastName}` : s.staffIdNumber),
        staffIdNumber: s.staffIdNumber
      })).filter((s) => s.userId);
      setStaffList(formatted);
    }).catch(() => {});
  };

  useEffect(load, []);

  const submit = async () => {
    try {
      await httpClient.post('/api/leave-requests', {
        leaveType,
        startDate,
        endDate,
        reason,
        handoverOfficerId: handoverOfficerId ? Number(handoverOfficerId) : null,
        handoverNotes,
        requestAllowance
      });
      setOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setHandoverOfficerId('');
      setHandoverNotes('');
      setRequestAllowance(false);
      load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Could not submit leave request.');
    }
  };

  const acceptHandover = async (id: number) => {
    try {
      await httpClient.post(`/api/leave-requests/${id}/handover/accept`);
      load();
    } catch {
      setError('Could not accept handover request.');
    }
  };

  const submitResumption = async () => {
    if (!selectedLeaveId) return;
    try {
      await httpClient.post(`/api/leave-requests/${selectedLeaveId}/resumption`, {
        resumptionDate,
        resumptionNotes
      });
      setResumptionDialogOpen(false);
      setSelectedLeaveId(null);
      setResumptionDate('');
      setResumptionNotes('');
      load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Could not submit resumption certificate.');
    }
  };

  const confirmResumption = async (id: number) => {
    try {
      await httpClient.post(`/api/leave-requests/${id}/resumption/confirm`);
      load();
    } catch {
      setError('Could not confirm resumption certificate.');
    }
  };

  const review = async (id: number, action: 'approve' | 'reject') => {
    const comment = window.prompt(action === 'approve' ? 'Approval note (optional)' : 'Reason for rejection (optional)') ?? '';
    try {
      await httpClient.post(`/api/leave-requests/${id}/${action}`, { comment });
      load();
    } catch {
      setError('Could not review this leave request.');
    }
  };

  const cancel = async (id: number) => {
    try {
      await httpClient.post(`/api/leave-requests/${id}/cancel`);
      load();
    } catch {
      setError('Could not cancel this leave request.');
    }
  };

  const statusChip = (status: LeaveStatus) => (
    <Chip
      size="small"
      label={status}
      color={status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : status === 'PENDING' ? 'warning' : 'default'}
    />
  );

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4">Leave Management</Typography>
          <Typography color="text.secondary">
            Grade-based leave entitlement, handover delegation, resumption certificates, and allowance processing.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>Request Leave</Button>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Grade-Based Balance Dashboard Cards */}
      {balance && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Grade Level</Typography>
              <Typography variant="h5">GL {balance.gradeLevel}</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Annual Entitlement</Typography>
              <Typography variant="h5" color="primary">{balance.annualEntitlementDays} Days</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Days Used This Year</Typography>
              <Typography variant="h5" color="warning.main">{balance.usedDaysThisYear} Days</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Remaining Days</Typography>
              <Typography variant="h5" color="success.main">{balance.remainingDaysThisYear} Days</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Handovers assigned to logged-in user */}
      {handovers.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: '#fbfcfd', border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" gutterBottom>Handover Delegations Assigned to You</Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Leave Period</TableCell>
                  <TableCell>Handover Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {handovers.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.staffName}</TableCell>
                    <TableCell>{h.startDate} – {h.endDate}</TableCell>
                    <TableCell>{h.handoverNotes || '—'}</TableCell>
                    <TableCell><Chip size="small" label={h.handoverStatus} color={h.handoverStatus === 'ACCEPTED' ? 'success' : 'warning'} /></TableCell>
                    <TableCell>
                      {h.handoverStatus === 'PENDING' && (
                        <Button size="small" variant="outlined" color="primary" onClick={() => acceptHandover(h.id)}>
                          Accept Handover
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* User's own leave requests */}
      <Typography variant="h6">My Leave Requests</Typography>
      <RequestTable
        requests={requests}
        statusChip={statusChip}
        action={(r) => (
          <Stack direction="row" spacing={1}>
            {r.status === 'PENDING' && (
              <Button size="small" color="error" onClick={() => cancel(r.id)}>Cancel</Button>
            )}
            {r.status === 'APPROVED' && r.resumptionStatus === 'NOT_RESUMED' && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setSelectedLeaveId(r.id);
                  setResumptionDate(new Date().toISOString().split('T')[0]);
                  setResumptionDialogOpen(true);
                }}
              >
                Submit Resumption
              </Button>
            )}
          </Stack>
        )}
        empty="You have not submitted any leave requests."
      />

      {/* Pending Reviews for HoD/Supervisor */}
      {pending.length > 0 && (
        <>
          <Typography variant="h6">Awaiting Your Approval / Review</Typography>
          <RequestTable
            requests={pending}
            statusChip={statusChip}
            action={(r) => (
              <Stack direction="row" spacing={1}>
                {r.resumptionStatus === 'PENDING_CONFIRMATION' ? (
                  <Button size="small" variant="contained" color="secondary" onClick={() => confirmResumption(r.id)}>
                    Confirm Resumption
                  </Button>
                ) : (
                  <>
                    <Button size="small" color="success" variant="outlined" onClick={() => review(r.id, 'approve')}>Approve</Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => review(r.id, 'reject')}>Reject</Button>
                  </>
                )}
              </Stack>
            )}
            empty=""
          />
        </>
      )}

      {/* Request Leave Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Submit Leave Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Leave type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              {TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type.replace('_', ' ')}</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                label="End date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <TextField
              select
              label="Handover Officer (Optional)"
              value={handoverOfficerId}
              onChange={(e) => setHandoverOfficerId(e.target.value)}
              helperText="Select a staff member to take over duties during your leave"
            >
              <MenuItem value="">None</MenuItem>
              {staffList.map((s) => (
                <MenuItem key={s.id} value={s.userId}>
                  {s.fullName} ({s.staffIdNumber})
                </MenuItem>
              ))}
            </TextField>

            {handoverOfficerId && (
              <TextField
                label="Handover Duty Notes"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                multiline
                minRows={2}
                placeholder="Details of pending tasks or responsibilities handed over..."
              />
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={requestAllowance}
                  onChange={(e) => setRequestAllowance(e.target.checked)}
                />
              }
              label="Request Annual Leave Transport Allowance Handoff to Payroll"
            />

            <TextField
              label="Reason for Leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              minRows={3}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!startDate || !endDate || !reason.trim()} onClick={submit}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resumption Certificate Modal */}
      <Dialog open={resumptionDialogOpen} onClose={() => setResumptionDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Submit Resumption Certificate</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Resumption Date"
              type="date"
              value={resumptionDate}
              onChange={(e) => setResumptionDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Resumption Remarks / Handover Return Notes"
              value={resumptionNotes}
              onChange={(e) => setResumptionNotes(e.target.value)}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResumptionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" disabled={!resumptionDate} onClick={submitResumption}>
            Submit Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function RequestTable({
  requests,
  statusChip,
  action,
  empty
}: {
  requests: LeaveRequest[];
  statusChip: (status: LeaveStatus) => ReactNode;
  action: (request: LeaveRequest) => ReactNode;
  empty: string;
}) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Staff</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Dates & Days</TableCell>
            <TableCell>Handover Officer</TableCell>
            <TableCell>Allowance Handoff</TableCell>
            <TableCell>Resumption</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">{empty}</TableCell>
            </TableRow>
          ) : (
            requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.staffName}</TableCell>
                <TableCell>{r.leaveType}</TableCell>
                <TableCell>
                  <Typography variant="body2">{r.startDate} – {r.endDate}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.numberOfDays} Days</Typography>
                </TableCell>
                <TableCell>
                  {r.handoverOfficerName ? (
                    <Box>
                      <Typography variant="body2">{r.handoverOfficerName}</Typography>
                      <Chip size="small" label={r.handoverStatus} color={r.handoverStatus === 'ACCEPTED' ? 'success' : 'default'} />
                    </Box>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {r.allowanceEligible ? (
                    <Chip size="small" label={r.allowanceHandoffStatus} color={(r.allowanceHandoffStatus ?? '').includes('PROCESSED') ? 'success' : 'info'} />
                  ) : 'None'}
                </TableCell>
                <TableCell>
                  {r.resumptionStatus !== 'NOT_RESUMED' ? (
                    <Chip size="small" label={r.resumptionStatus} color={r.resumptionStatus === 'CONFIRMED' ? 'success' : 'warning'} />
                  ) : 'Not Resumed'}
                </TableCell>
                <TableCell>{statusChip(r.status)}</TableCell>
                <TableCell>{action(r)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
