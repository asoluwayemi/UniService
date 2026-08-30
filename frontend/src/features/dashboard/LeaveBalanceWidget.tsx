import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import { httpClient } from '../../app/httpClient';

interface LeaveBalance {
  gradeLevel: number;
  annualEntitlementDays: number;
  usedDaysThisYear: number;
  remainingDaysThisYear: number;
}

export function LeaveBalanceWidget() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    httpClient
      .get<LeaveBalance>('/api/leave-requests/balance')
      .then((res) => setBalance(res.data))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const usedPercent = balance ? Math.min(100, Math.round((balance.usedDaysThisYear / balance.annualEntitlementDays) * 100)) : 0;

  return (
    <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/leave')}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <BeachAccessIcon fontSize="small" color="warning" />
          <Typography variant="h6">Leave Balance</Typography>
        </Stack>

        {!balance ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>{balance.remainingDaysThisYear}</strong> of {balance.annualEntitlementDays} days remaining this
              year
            </Typography>
            <LinearProgress
              variant="determinate"
              value={usedPercent}
              color={usedPercent >= 90 ? 'error' : usedPercent >= 60 ? 'warning' : 'success'}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary">
              {balance.usedDaysThisYear} days used · Grade Level {balance.gradeLevel}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
