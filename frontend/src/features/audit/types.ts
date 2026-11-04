export interface AuditEntry {
  id: number;
  actor: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
}

export interface AuditPage {
  items: AuditEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
