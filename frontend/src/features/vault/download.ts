import { httpClient } from '../../app/httpClient';

/** Downloads through the API so the auth header is sent; the file is never exposed by URL. */
export async function downloadVaultDocument(id: number, filename: string): Promise<void> {
  const res = await httpClient.get<Blob>(`/api/vault/documents/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
