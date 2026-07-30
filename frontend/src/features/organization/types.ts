export type OrgUnitType = 'COLLEGE' | 'FACULTY' | 'DEPARTMENT' | 'UNIT';
export type OrgUnitStatus = 'ACTIVE' | 'ARCHIVED';
export type ChangeRequestAction = 'CREATE' | 'UPDATE' | 'ARCHIVE';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OrgUnit {
  id: number;
  name: string;
  code: string;
  type: OrgUnitType;
  parentId: number | null;
  headId: number | null;
  headName: string | null;
  status: OrgUnitStatus;
}

export interface ChangeRequest {
  id: number;
  action: ChangeRequestAction;
  targetOrgUnitId: number | null;
  targetOrgUnitName: string | null;
  proposedName: string | null;
  proposedCode: string | null;
  proposedType: OrgUnitType | null;
  proposedParentId: number | null;
  proposedParentName: string | null;
  proposedHeadId: number | null;
  proposedHeadName: string | null;
  status: ChangeRequestStatus;
  requestedByUsername: string;
  reviewedByUsername: string | null;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface AssignableHead {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles: string[];
}

export interface SubmitChangeRequestPayload {
  action: ChangeRequestAction;
  targetOrgUnitId?: number;
  proposedName?: string;
  proposedCode?: string;
  proposedType?: OrgUnitType;
  proposedParentId?: number;
  proposedHeadId?: number;
}
