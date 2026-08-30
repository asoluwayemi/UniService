export type DeploymentRunType = 'PUSH' | 'DEPLOY';
export type DeploymentRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface DeploymentRun {
  id: number;
  runType: DeploymentRunType;
  status: DeploymentRunStatus;
  triggeredByUsername: string;
  output: string | null;
  startedAt: string;
  finishedAt: string | null;
}
