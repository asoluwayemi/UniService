import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { httpClient } from '../../app/httpClient';
import { BarList, ChartCard, ColumnChart, StatTile, VIZ_STYLES, humanize } from './charts';
import type { AnalyticsData, Bucket } from './types';

const human = (buckets: Bucket[]) => buckets.map((b) => ({ label: humanize(b.label), value: b.value }));

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

const compactMoney = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 });

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await httpClient.get<AnalyticsData>('/api/analytics');
      setData(res.data);
      setError(null);
    } catch {
      setError('Failed to load analytics.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const history = data?.payroll?.history ?? [];
  const latestPay = history.length > 0 ? history[history.length - 1] : undefined;
  const att = data?.attendance;

  return (
    <Box className="viz-root">
      <style>{VIZ_STYLES}</style>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          Analytics
        </Typography>
        <Button startIcon={<RefreshIcon />} onClick={() => void load()}>
          Refresh
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        A live picture of the workforce. You only see the sections your role allows.
        {data && ` Updated ${new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <StatTile label="Staff" value={data.staff.total.toLocaleString()} hint={`${data.staff.active.toLocaleString()} active`} />
            <StatTile label="Pending leave" value={data.leave.pending.toLocaleString()} hint="awaiting review" />
            {data.recruitment && <StatTile label="Open vacancies" value={data.recruitment.openPostings.toLocaleString()} />}
            {att && (
              <StatTile
                label="Present today"
                value={att.presentToday.toLocaleString()}
                hint={`${att.activeStaff > 0 ? Math.round((att.presentToday / att.activeStaff) * 100) : 0}% of active · ${att.lateToday} late`}
              />
            )}
            {latestPay && <StatTile label={`Net pay ${latestPay.period}`} value={compactMoney.format(latestPay.totalNet)} hint={`${latestPay.staffCount} staff`} />}
            {data.onboardingInProgress && <StatTile label="Onboarding" value={data.onboardingInProgress.value.toLocaleString()} hint="in progress" />}
            {data.expiringDocuments && <StatTile label="Documents expiring" value={data.expiringDocuments.value.toLocaleString()} hint="within 60 days" />}
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <ChartCard title="Headcount by department" subtitle="Largest departments" valueHeader="Staff" data={data.staff.byDepartment}>
              <BarList data={data.staff.byDepartment} />
            </ChartCard>
            <ChartCard title="Employment status" valueHeader="Staff" data={human(data.staff.byStatus)}>
              <BarList data={human(data.staff.byStatus)} />
            </ChartCard>
            <ChartCard title="Staff category" valueHeader="Staff" data={human(data.staff.byCategory)}>
              <BarList data={human(data.staff.byCategory)} />
            </ChartCard>
            <ChartCard title="Leave requests" subtitle="All time, by status" valueHeader="Requests" data={human(data.leave.byStatus)}>
              <BarList data={human(data.leave.byStatus)} emptyText="No leave requests yet." />
            </ChartCard>
            {data.recruitment && (
              <ChartCard title="Recruitment pipeline" subtitle="Applicants by stage" valueHeader="Applicants" data={human(data.recruitment.pipeline)}>
                <BarList data={human(data.recruitment.pipeline)} emptyText="No applicants yet." />
              </ChartCard>
            )}
            {att && (
              <ChartCard
                title="Attendance, last 14 days"
                subtitle="Staff who clocked in each day"
                valueHeader="Present"
                data={att.last14Days.map((d) => ({ label: shortDate(d.date), value: d.present }))}
              >
                <ColumnChart
                  label="Staff present per day over the last 14 days"
                  data={att.last14Days.map((d) => ({ key: d.date, label: shortDate(d.date), value: d.present }))}
                  xLabel={(i, d) => (i === 0 || i === 6 || i === 13 ? d.label : '')}
                />
              </ChartCard>
            )}
            {data.payroll && (
              <ChartCard
                title="Net payroll by month"
                subtitle="Published runs"
                valueHeader="Net pay"
                data={data.payroll.history.map((p) => ({ label: p.period, value: p.totalNet }))}
              >
                {data.payroll.history.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'var(--viz-text-2)' }}>
                    No payroll has been published yet.
                  </Typography>
                ) : (
                  <ColumnChart
                    label="Net payroll for each published month"
                    data={data.payroll.history.map((p) => ({ key: p.period, label: p.period, value: p.totalNet }))}
                    xLabel={(_, d) => d.label}
                    format={(n) => compactMoney.format(n)}
                  />
                )}
              </ChartCard>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
}

