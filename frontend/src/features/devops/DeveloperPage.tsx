import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { httpClient } from '../../app/httpClient';
import type { DeploymentRun, DeploymentRunType } from './types';

const GITHUB_URL = 'https://github.com/asoluwayemi/UniService';
const POLL_INTERVAL_MS = 3000;

function statusColor(status: string): 'default' | 'success' | 'error' | 'warning' {
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED') return 'error';
  if (status === 'RUNNING') return 'warning';
  return 'default';
}

function RunCard({
  title,
  icon,
  run,
  onTrigger,
  triggerLabel,
  confirmMessage,
}: {
  title: string;
  icon: React.ReactNode;
  run: DeploymentRun | null;
  onTrigger: () => Promise<void>;
  triggerLabel: string;
  confirmMessage: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = run?.status === 'RUNNING';

  async function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    try {
      await onTrigger();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not start this run.');
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {icon}
            <Typography variant="h6">{title}</Typography>
          </Stack>
          <Button variant="contained" disabled={running} onClick={() => setConfirmOpen(true)}>
            {running ? 'Running…' : triggerLabel}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {run ? (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={run.status} color={statusColor(run.status)} />
              <Typography variant="body2" color="text.secondary">
                by {run.triggeredByUsername} · {new Date(run.startedAt).toLocaleString()}
              </Typography>
            </Stack>
            {run.output && (
              <Box
                component="pre"
                sx={{
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  p: 2,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  maxHeight: 240,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {run.output}
              </Box>
            )}
          </Stack>
        ) : (
          <Typography color="text.secondary">No runs yet.</Typography>
        )}
      </CardContent>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{triggerLabel}?</DialogTitle>
        <DialogContent>
          <Typography>{confirmMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export function DeveloperPage() {
  const [pushRun, setPushRun] = useState<DeploymentRun | null>(null);
  const [deployRun, setDeployRun] = useState<DeploymentRun | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(() => {
    httpClient.get<DeploymentRun | null>('/api/devops/push/latest').then((r) => setPushRun(r.data)).catch(() => undefined);
    httpClient.get<DeploymentRun | null>('/api/devops/deploy/latest').then((r) => setDeployRun(r.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const anyRunning = pushRun?.status === 'RUNNING' || deployRun?.status === 'RUNNING';
    if (anyRunning && !pollRef.current) {
      pollRef.current = setInterval(loadStatus, POLL_INTERVAL_MS);
    } else if (!anyRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [pushRun, deployRun, loadStatus]);

  async function trigger(type: DeploymentRunType) {
    const endpoint = type === 'PUSH' ? '/api/devops/push' : '/api/devops/deploy';
    const res = await httpClient.post<DeploymentRun>(endpoint);
    if (type === 'PUSH') setPushRun(res.data);
    else setDeployRun(res.data);
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Developer Tools</Typography>
        <Button
          variant="outlined"
          startIcon={<GitHubIcon />}
          component="a"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on GitHub
        </Button>
      </Stack>

      <RunCard
        title="Push to GitHub"
        icon={<CloudUploadIcon color="primary" />}
        run={pushRun}
        onTrigger={() => trigger('PUSH')}
        triggerLabel="Push"
        confirmMessage="This pushes the current branch to origin on GitHub. Continue?"
      />

      <RunCard
        title="Deploy"
        icon={<RocketLaunchIcon color="secondary" />}
        run={deployRun}
        onTrigger={() => trigger('DEPLOY')}
        triggerLabel="Deploy"
        confirmMessage="This pulls the latest pushed code and restarts the live service. Continue?"
      />
    </Stack>
  );
}
