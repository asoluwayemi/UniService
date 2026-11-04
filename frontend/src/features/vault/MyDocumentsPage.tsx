import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { httpClient } from '../../app/httpClient';
import { downloadVaultDocument, formatSize } from './download';
import { VAULT_CATEGORIES, type VaultDocument } from './types';

export function ExpiryChip({ doc }: { doc: VaultDocument }) {
  if (doc.daysToExpiry === null) return <>—</>;
  if (doc.daysToExpiry < 0) return <Chip size="small" color="error" label="Expired" />;
  if (doc.daysToExpiry <= 60) return <Chip size="small" color="warning" label={`${doc.daysToExpiry} days left`} />;
  return <>{doc.expiresOn}</>;
}

export function MyDocumentsPage() {
  const [docs, setDocs] = useState<VaultDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    httpClient
      .get<VaultDocument[]>('/api/vault/me')
      .then((res) => setDocs(res.data))
      .catch(() => setError('Failed to load your documents.'));
  }, []);

  async function download(d: VaultDocument) {
    try {
      await downloadVaultDocument(d.id, d.filename);
    } catch {
      setError('Could not download that document.');
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Documents
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Records HR keeps on file for you, such as your contract and appointment letter.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {docs && docs.length === 0 && <Alert severity="info">No documents on file yet.</Alert>}

      {docs && docs.length > 0 && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{d.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {d.filename} · {formatSize(d.sizeBytes)}
                    </Typography>
                  </TableCell>
                  <TableCell>{VAULT_CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category}</TableCell>
                  <TableCell>
                    <ExpiryChip doc={d} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end">
                      <Button size="small" startIcon={<DownloadIcon />} onClick={() => void download(d)}>
                        Download
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
