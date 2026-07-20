import { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, InputAdornment, Alert, Tabs, Tab, alpha, useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Pause, PlayArrow, Payment, Search, Receipt, FilterList, History } from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney, formatShortDate, translateFrequency, translateStatus, statusColor } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const frequencies = [
  { value: 'weekly', label: 'Hebdomadaire' }, { value: 'biweekly', label: 'Toutes les 2 semaines' },
  { value: 'monthly', label: 'Mensuelle' }, { value: 'bimonthly', label: 'Tous les 2 mois' },
  { value: 'quarterly', label: 'Trimestrielle' }, { value: 'semiannual', label: 'Semestrielle' },
  { value: 'annual', label: 'Annuelle' }, { value: 'custom', label: 'Personnalisée' },
];

const emptyForm = {
  name: '', categoryId: '', organism: '', holder: '', clientNumber: '',
  amount: '', frequency: 'monthly', customDays: '', startDate: new Date().toISOString().split('T')[0],
  endDate: '', notes: '', notify30: true, notify15: true, notify7: true, notify3: true, notify1: true,
};

const BillsPage = () => {
  const theme = useTheme();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  const fetchBills = useCallback(async () => {
    try {
      const params = { search };
      if (statusFilter === 'active') params.status = 'active';
      if (statusFilter === 'suspended') params.status = 'suspended';
      const { data } = await api.get('/bills', { params });
      setBills(data.bills);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setCategories(data.categories.filter(c => c.type === 'bill'))).catch(() => {});
  }, []);

  const handleOpen = (bill = null) => {
    if (bill) {
      setEditId(bill.id);
      setForm({
        name: bill.name, categoryId: bill.category_id || '', organism: bill.organism || '',
        holder: bill.holder || '', clientNumber: bill.client_number || '', amount: bill.amount,
        frequency: bill.frequency, customDays: bill.custom_days || '',
        startDate: bill.start_date?.split('T')[0] || '', endDate: bill.end_date?.split('T')[0] || '',
        notes: bill.notes || '', notify30: bill.notify_30, notify15: bill.notify_15,
        notify7: bill.notify_7, notify3: bill.notify_3, notify1: bill.notify_1,
      });
    } else { setEditId(null); setForm(emptyForm); }
    setError(''); setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editId) await api.put(`/bills/${editId}`, form);
      else await api.post('/bills', form);
      setDialogOpen(false); fetchBills();
    } catch (err) { setError(err.response?.data?.message || 'Erreur.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    await api.delete(`/bills/${id}`); fetchBills();
  };

  const handleToggle = async (id) => { await api.put(`/bills/${id}/toggle`); fetchBills(); };

  const handleViewDetail = async (bill) => {
    setSelectedBill(bill);
    const { data } = await api.get(`/bills/${bill.id}/payments`);
    setPayments(data.payments); setDetailOpen(true);
  };

  const handleOpenPay = (bill) => { setSelectedBill(bill); setPayDialogOpen(true); };

  const handlePay = async (paymentData) => {
    await api.post(`/bills/${selectedBill.id}/pay`, paymentData);
    setPayDialogOpen(false); fetchBills();
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Factures" subtitle={`${bills.length} facture(s)`} action={() => handleOpen()} actionLabel="Nouvelle facture">
        <TextField size="small" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <FormControl size="small">
          <InputLabel>Statut</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Statut">
            <MenuItem value="all">Toutes</MenuItem><MenuItem value="active">Actives</MenuItem><MenuItem value="suspended">Suspendues</MenuItem>
          </Select>
        </FormControl>
      </PageHeader>

      {bills.length === 0 ? (
        <EmptyState title="Aucune facture" description="Commencez par ajouter vos factures" action={() => handleOpen()} actionLabel="Ajouter une facture" />
      ) : (
        <Grid container spacing={2}>
          {bills.map((bill) => (
            <Grid item xs={12} sm={6} md={4} key={bill.id}>
              <Card sx={{
                opacity: bill.is_active ? 1 : 0.65, border: `1px solid ${bill.is_active ? theme.palette.divider : theme.palette.warning.main}`,
                borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] },
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>{bill.name}</Typography>
                      {bill.organism && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{bill.organism}</Typography>}
                    </Box>
                    <Chip label={bill.is_active ? 'Active' : 'Suspendue'} size="small" color={bill.is_active ? 'success' : 'warning'}
                      variant={bill.is_active ? 'filled' : 'outlined'} sx={{ flexShrink: 0, fontWeight: 600 }} />
                  </Box>

                  <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mb: 1.5, fontSize: { xs: '1.35rem', sm: '1.5rem' } }}>
                    {formatMoney(bill.amount)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={translateFrequency(bill.frequency)} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                    {bill.holder && <Chip label={bill.holder} size="small" sx={{ fontSize: '0.75rem' }} />}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
                    <IconButton size="small" onClick={() => handleViewDetail(bill)} title="Historique"><History fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleToggle(bill.id)} title={bill.is_active ? 'Suspendre' : 'Réactiver'} color={bill.is_active ? 'warning' : 'success'}>
                      {bill.is_active ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpen(bill)} title="Modifier" color="info"><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(bill.id)} title="Supprimer" color="error"><Delete fontSize="small" /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? '✏️ Modifier la facture' : '➕ Nouvelle facture'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Nom de la facture *" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Catégorie</InputLabel>
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} label="Catégorie">
                  <MenuItem value="">Aucune</MenuItem>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Organisme" fullWidth value={form.organism} onChange={(e) => setForm({ ...form, organism: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Titulaire" fullWidth value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="N° de Client / Contrat" fullWidth value={form.clientNumber} onChange={(e) => setForm({ ...form, clientNumber: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Montant estimé (DA) *" type="number" fullWidth required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Fréquence</InputLabel>
                <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} label="Fréquence">
                  {frequencies.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {form.frequency === 'custom' && (
              <Grid item xs={12} sm={6}><TextField label="Nombre de jours" type="number" fullWidth value={form.customDays} onChange={(e) => setForm({ ...form, customDays: e.target.value })} /></Grid>
            )}
            <Grid item xs={12} sm={6}><TextField label="Date de début *" type="date" fullWidth required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Date de fin (optionnel)" type="date" fullWidth value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 1 }}>Rappels de notification par email & application</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControlLabel control={<Switch checked={form.notify30} onChange={(e) => setForm({ ...form, notify30: e.target.checked })} />} label="30j" />
                <FormControlLabel control={<Switch checked={form.notify15} onChange={(e) => setForm({ ...form, notify15: e.target.checked })} />} label="15j" />
                <FormControlLabel control={<Switch checked={form.notify7} onChange={(e) => setForm({ ...form, notify7: e.target.checked })} />} label="7j" />
                <FormControlLabel control={<Switch checked={form.notify3} onChange={(e) => setForm({ ...form, notify3: e.target.checked })} />} label="3j" />
                <FormControlLabel control={<Switch checked={form.notify1} onChange={(e) => setForm({ ...form, notify1: e.target.checked })} />} label="1j" />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ px: 3 }}>{editId ? 'Mettre à jour' : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Détails / Historique */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>📊 Historique des paiements : {selectedBill?.name}</DialogTitle>
        <DialogContent dividers>
          {payments.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}><Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} /><Typography color="text.secondary">Aucun paiement enregistré</Typography></Box>
          ) : (
            <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Date d'échéance</TableCell><TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell>Date de paiement</TableCell><TableCell>Mode</TableCell></TableRow></TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatShortDate(p.due_date)}</TableCell>
                    <TableCell fontWeight={600}>{formatMoney(p.amount)}</TableCell>
                    <TableCell><Chip label={translateStatus(p.status)} size="small" color={statusColor(p.status)} /></TableCell>
                    <TableCell>{p.paid_date ? formatShortDate(p.paid_date) : '-'}</TableCell>
                    <TableCell>{p.payment_method || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
          <Button variant="contained" startIcon={<Payment />} onClick={() => { setDetailOpen(false); handleOpenPay(selectedBill); }}>Enregistrer un paiement</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default BillsPage;