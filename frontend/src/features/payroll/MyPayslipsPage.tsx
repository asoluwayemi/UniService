import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import { httpClient } from '../../app/httpClient';
import { formatMoney } from './money';
import type { Payslip } from './types';

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography fontWeight={strong ? 700 : 400}>{label}</Typography>
      <Typography fontWeight={strong ? 700 : 400}>{formatMoney(value)}</Typography>
    </Stack>
  );
}

export function MyPayslipsPage() {
  const [slips, setSlips] = useState<Payslip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    httpClient
      .get<Payslip[]>('/api/payroll/payslips/mine')
      .then((res) => setSlips(res.data))
      .catch(() => setError('Failed to load your payslips.'));
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Payslips
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Payslips appear here once Finance publishes a month's payroll.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {slips && slips.length === 0 && <Alert severity="info">No payslips published yet.</Alert>}

      {slips?.map((s, i) => (
        <Accordion key={s.id} defaultExpanded={i === 0} variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={3} sx={{ width: '100%', pr: 2 }} justifyContent="space-between">
              <Typography fontWeight={600}>{s.period}</Typography>
              <Typography color="text.secondary">Net {formatMoney(s.net)}</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {s.fullName} · {s.staffNumber ?? 'No staff no.'} · Grade level {s.gradeLevel}
            </Typography>
            <Line label="Basic salary" value={s.basic} />
            <Line label="Housing allowance" value={s.housing} />
            <Line label="Transport allowance" value={s.transport} />
            <Divider />
            <Line label="Gross pay" value={s.gross} strong />
            <Line label="Pension" value={-s.pension} />
            <Line label="Tax" value={-s.tax} />
            <Divider />
            <Line label="Net pay" value={s.net} strong />
            {s.bankName && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Paid to {s.bankName}
                {s.accountLast4 ? ` ····${s.accountLast4}` : ''}
              </Typography>
            )}
            <Button startIcon={<PrintIcon />} sx={{ mt: 1 }} onClick={() => window.print()}>
              Print
            </Button>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
