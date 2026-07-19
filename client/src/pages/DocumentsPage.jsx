/**
 * Page des documents
 */
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, IconButton, Chip, InputAdornment,
  useTheme, alpha,
} from '@mui/material';
import { Upload, Delete, Search, Description, Download, PictureAsPdf, Image } from '@mui/icons-material';
import api from '../api/axios';
import { formatShortDate } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const docTypes = [
  { value: 'invoice', label: 'Facture' }, { value: 'receipt', label: 'Reçu' },
  { value: 'warranty', label: 'Garantie' }, { value: 'contract', label: 'Contrat' },
  { value: 'insurance', label: 'Assurance' }, { value: 'other', label: 'Autre' },
];

const DocumentsPage = () => {
  const theme = useTheme();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'other', tags: '', notes: '' });
  const [file, setFile] = useState(null);

  const fetch = async () => {
    try {
      const { data } = await api.get('/documents', { params: { search, type: typeFilter || undefined } });
      setDocuments(data.documents);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, typeFilter]);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', form.name || file.name);
    formData.append('type', form.type);
    formData.append('tags', form.tags);
    formData.append('notes', form.notes);
    await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setDialogOpen(false);
    setFile(null);
    fetch();
  };

  const handleDelete = async (id) => { if (!window.confirm('Supprimer ?')) return; await api.delete(`/documents/${id}`); fetch(); };

  const getIcon = (mime) => {
    if (mime?.startsWith('image')) return <Image sx={{ color: '#4CAF50' }} />;
    if (mime === 'application/pdf') return <PictureAsPdf sx={{ color: '#F44336' }} />;
    return <Description sx={{ color: '#2196F3' }} />;
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Documents" subtitle={`${documents.length} document(s)`} action={() => { setForm({ name: '', type: 'other', tags: '', notes: '' }); setFile(null); setDialogOpen(true); }} actionLabel="Uploader" actionIcon={<Upload />}>
        <TextField size="small" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 200 }} />
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type">
            <MenuItem value="">Tous</MenuItem>
            {docTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </Select>
        </FormControl>
      </PageHeader>

      {documents.length === 0 ? (
        <EmptyState title="Aucun document" description="Uploadez vos factures, reçus et contrats" action={() => setDialogOpen(true)} actionLabel="Uploader" />
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      {getIcon(doc.mime_type)}
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{doc.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatShortDate(doc.created_at)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={docTypes.find(t => t.value === doc.type)?.label || doc.type} size="small" />
                    {doc.tags && doc.tags.split(',').map((t, i) => <Chip key={i} label={t.trim()} size="small" variant="outlined" />)}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <IconButton size="small" href={`http://localhost:5000${doc.file_path}`} target="_blank"><Download fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}><Delete fontSize="small" /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Uploader un document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth startIcon={<Upload />}
                sx={{ py: 3, borderStyle: 'dashed' }}>
                {file ? file.name : 'Choisir un fichier'}
                <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} accept="image/*,.pdf,.doc,.docx" />
              </Button>
            </Grid>
            <Grid item xs={12}><TextField label="Nom" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} label="Type">
                  {docTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField label="Tags (séparés par des virgules)" fullWidth value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!file}>Uploader</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;
