import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import type { AppraisalSummary } from './types';

export function PendingAppraisalActionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppraisalSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    httpClient
      .get<AppraisalSummary[]>('/api/appraisals/pending')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load pending appraisal actions.'));
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Appraisals Awaiting My Action</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!items && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {items && items.length === 0 && <Typography color="text.secondary">Nothing awaiting your action.</Typography>}

      {items && items.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.staffFullName}</TableCell>
                  <TableCell>{item.cycleYear}</TableCell>
                  <TableCell>
                    <Chip label={item.status} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => navigate(`/appraisals/${item.id}`)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
