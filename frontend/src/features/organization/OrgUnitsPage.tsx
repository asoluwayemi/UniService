import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { useAuth } from '../../app/AuthContext';
import { OrgTree } from './OrgTree';
import { ProposeChangeDialog, type ProposeMode } from './ProposeChangeDialog';
import type { OrgUnit } from './types';

export function OrgUnitsPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('ORG_WRITE');

  const [units, setUnits] = useState<OrgUnit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ mode: ProposeMode; unit?: OrgUnit } | null>(null);

  const load = useCallback(() => {
    httpClient
      .get<OrgUnit[]>('/api/org/units')
      .then((res) => setUnits(res.data))
      .catch(() => setError('Could not load organization units.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handlePropose(mode: 'create-child' | 'update' | 'archive', unit?: OrgUnit) {
    setDialog({ mode, unit });
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Organization</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!units && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {units && (
        <Card>
          <CardContent>
            <OrgTree
              units={units}
              canWrite={canWrite}
              onPropose={handlePropose}
              onProposeRoot={() => setDialog({ mode: 'create-root' })}
            />
          </CardContent>
        </Card>
      )}

      {dialog && (
        <ProposeChangeDialog
          open
          mode={dialog.mode === 'create-child' && dialog.unit ? 'create-child' : dialog.mode}
          parentUnit={dialog.mode === 'create-child' ? dialog.unit : undefined}
          targetUnit={dialog.mode === 'update' || dialog.mode === 'archive' ? dialog.unit : undefined}
          onClose={() => setDialog(null)}
          onSubmitted={load}
        />
      )}
    </Stack>
  );
}
