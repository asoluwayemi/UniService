import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { httpClient } from '../../app/httpClient';
import { downloadVaultDocument, formatSize } from './download';
import { ExpiryChip } from './MyDocumentsPage';
import { VAULT_CATEGORIES, type StaffLookup, type VaultCategory, type VaultDocument } from './types';

const EMPTY_FORM = { category: 'CONTRACT' as VaultCategory, title: '', description: '', expiresOn: '', visibleToOwner: true };

function DocumentRows({ docs, showOwner, onDownload, onDelete }: {
  docs: VaultDocument[];
  showOwner?: boolean;
  onDownload: (d: VaultDocument) => void;
  onDelete?: (d: VaultDocument) => void;
}) {
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {showOwner && <TableCell>Staff</TableCell>}
            <TableCell>Document</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Expires</TableCell>
            <TableCell>Visibility</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {docs.map((d) => (
            <TableRow key={d.id} hover>
              {showOwner && <TableCell>{d.ownerName || d.ownerUsername}</TableCell>}
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
              <TableCell>{d.visibleToOwner ? 'Shared with staff' : 'HR only'}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => onDownload(d)}>
                  Download
                </Button>
                {onDelete && (
                  <Button size="small" color="error" onClick={() => onDelete(d)}>
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {docs.length === 0 && (
            <TableRow>
              <TableCell colSpan={showOwner ? 6 : 5} align="center">
                No documents.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

export function DocumentVaultPage() {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [staff, setStaff] = useState<StaffLookup | null>(null);
  const [docs, setDocs] = useState<VaultDocument[]>([]);
  const [expiring, setExpiring] = useState<VaultDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<VaultDocument | null>(null);

  const loadDocs = useCallback(async (userId: number) => {
    const res = await httpClient.get<VaultDocument[]>(`/api/vault/staff/${userId}`);
    setDocs(res.data);
  }, []);

  useEffect(() => {
    if (tab !== 1) return;
    httpClient
      .get<VaultDocument[]>('/api/vault/expiring', { params: { days: 60 } })
      .then((res) => setExpiring(res.data))
      .catch(() => setError('Failed to load expiring documents.'));
  }, [tab]);

  async function find() {
    setError(null);
    try {
      const res = await httpClient.get<StaffLookup>('/api/vault/lookup', { params: { email } });
      setStaff(res.data);
      await loadDocs(res.data.userId);
    } catch {
      setStaff(null);
      setDocs([]);
      setError('No staff account was found with that email.');
    }
  }

  async function upload() {
    if (!staff || !file) return;
    setError(null);
    const body = new FormData();
    body.append('file', file);
    body.append('category', form.category);
    body.append('title', form.title);
    if (form.description) body.append('description', form.description);
    if (form.expiresOn) body.append('expiresOn', form.expiresOn);
    body.append('visibleToOwner', String(form.visibleToOwner));
    try {
      await httpClient.post(`/api/vault/staff/${staff.userId}`, body);
      setUploadOpen(false);
      setFile(null);
      setForm(EMPTY_FORM);
      await loadDocs(staff.userId);
    } catch {
      setError('Upload failed. Use a PDF, PNG, JPG or Word file under 10MB.');
    }
  }

  async function remove(d: VaultDocument) {
    setDeleting(null);
    try {
      await httpClient.delete(`/api/vault/documents/${d.id}`);
      if (staff) await loadDocs(staff.userId);
    } catch {
      setError('Could not delete that document.');
    }
  }

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
        Document Vault
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Contracts, certificates and other staff records. Every access to another person's file is audited.
      </Typography>

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Staff records" />
        <Tab label="Expiring soon" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tab === 0 && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField size="small" label="Staff email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ minWidth: 280 }} />
            <Button variant="contained" disabled={!email.trim()} onClick={() => void find()}>
              Find
            </Button>
          </Stack>
          {staff && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  {staff.fullName} <Typography component="span" color="text.secondary">({staff.email})</Typography>
                </Typography>
                <Button variant="outlined" onClick={() => setUploadOpen(true)}>
                  Upload document
                </Button>
              </Stack>
              <DocumentRows docs={docs} onDownload={(d) => void download(d)} onDelete={setDeleting} />
            </>
          )}
        </>
      )}

      {tab === 1 && <DocumentRows docs={expiring} showOwner onDownload={(d) => void download(d)} />}

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload for {staff?.fullName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button variant="outlined" component="label">
              {file ? file.name : 'Choose file (PDF, PNG, JPG, Word, max 10MB)'}
              <input
                hidden
                type="file"
                aria-label="File"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as VaultCategory })}>
              {VAULT_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField
              label="Expires on"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.expiresOn}
              onChange={(e) => setForm({ ...form, expiresOn: e.target.value })}
            />
            <FormControlLabel
              control={<Checkbox checked={form.visibleToOwner} onChange={(e) => setForm({ ...form, visibleToOwner: e.target.checked })} />}
              label="Visible to the staff member"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!file || !form.title.trim()} onClick={() => void upload()}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete document?</DialogTitle>
        <DialogContent>
          <Typography>"{deleting?.title}" and its file will be permanently removed.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleting && void remove(deleting)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
