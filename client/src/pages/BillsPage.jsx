/**
 * Page de gestion des factures
 * CRUD complet avec filtres, recherche et historique
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, InputAdornment, Alert, Tabs, Tab, alpha, useTheme,
} from '@mui/material';
import {
  Add, Edit, Delete, Pause, PlayArrow, Payment, Search,
  Receipt, FilterList, History,
} from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney, formatShortDate, translateFrequency, translateStatus, statusColor } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const frequencies = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Toutes les 2 semaines' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'bimonthly', label: 'Tous les 2 mois' },
  { value: 'quarterly', label: 'Trimestrielle' },
  { value: 'semiannual', label: 'Semestrielle' },
  { value: 'annual', label: 'Annuelle' },
  { value: 'custom', label: 'Personnalisée' },
];

const emptyForm = {
  name: '', categoryId: '', organism: '', holder: '', clientNumber: '',
  amount: '', frequency: 'monthly', customDays: '', startDate: new Date().toISOString().split('T')[0],
  endDate: '', notes: '',
  notify30: true, notify15: true, notify7: true, notify3: true, notify1: true,
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setCategories(data.categories.filter(c => c.type === 'bill'));
    }).catch(() => {});
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
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/bills/${editId}`, form);
      } else {
        await api.post('/bills', form);
      }
      setDialogOpen(false);
      fetchBills();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    await api.delete(`/bills/${id}`);
    fetchBills();
  };

  const handleToggle = async (id) => {
    await api.put(`/bills/${id}/toggle`);
    fetchBills();
  };

  const handleViewDetail = async (bill) => {
    setSelectedBill(bill);
    const { data } = await api.get(`/bills/${bill.id}`);
    setPayments(data.payments);
    setDetailOpen(true);
  };

  const handlePay = async (payment) => {
    try {
      await api.post(`/bills/${selectedBill.id}/pay`, {
        paymentId: payment?.id,
        paidDate: new Date().toISOString().split('T')[0],
        amount: payment?.amount || selectedBill.amount,
      });
      const { data } = await api.get(`/bills/${selectedBill.id}`);
      setPayments(data.payments);
      fetchBills();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader
        title="Factures"
        subtitle={`${bills.length} facture(s)`}
        action={() => handleOpen()}
        actionLabel="Nouvelle facture"
      >
        <TextField
          size="small" placeholder="Rechercher..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 220 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Statut">
            <MenuItem value="all">Toutes</MenuItem>
            <MenuItem value="active">Actives</MenuItem>
            <MenuItem value="suspended">Suspendues</MenuItem>
          </Select>
        </FormControl>
      </PageHeader>

      {bills.length === 0 ? (
        <EmptyState
          title="Aucune facture"
          description="Commencez par ajouter vos factures (Sonelgaz, SEAAL, Internet...)"
          action={() => handleOpen()}
          actionLabel="Ajouter une facture"
        />
      ) : (
        <Grid container spacing={2}>
          {bills.map((bill) => (
            <Grid item xs={12} sm={6} md={4} key={bill.id}>
              <Card sx={{
                opacity: bill.is_active ? 1 : 0.6,
                border: `1px solid ${bill.is_active ? theme.palette.divider : theme.palette.warning.main}`,
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{bill.name}</Typography>
                      {bill.organism && (
                        <Typography variant="caption" color="text.secondary">{bill.organism}</Typography>
                      )}
                    </Box>
                    <Chip
                      label={bill.is_active ? 'Active' : 'Suspendue'}
                      size="small"
                      color={bill.is_active ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mb: 1 }}>
                    {formatMoney(bill.amount)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={translateFrequency(bill.frequency)} size="small" variant="outlined" />
                    {bill.holder && <Chip label={bill.holder} size="small" />}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleViewDetail(bill)} title="Historique">
                      <History fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleToggle(bill.id)} title={bill.is_active ? 'Suspendre' : 'Réactiver'}>
                      {bill.is_active ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpen(bill)} title="Modifier">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(bill.id)} title="Supprimer" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog création/modification */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {editId ? 'Modifier la facture' : 'Nouvelle facture'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Nom" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} label="Catégorie">
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Organisme" fullWidth value={form.organism} onChange={(e) => setForm({ ...form, organism: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Titulaire" fullWidth value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="N° Client" fullWidth value={form.clientNumber} onChange={(e) => setForm({ ...form, clientNumber: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Montant (DA)" type="number" fullWidth required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Fréquence</InputLabel>
                <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} label="Fréquence">
                  {frequencies.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {form.frequency === 'custom' && (
              <Grid item xs={12}><TextField label="Nombre de jours" type="number" fullWidth value={form.customDays} onChange={(e) => setForm({ ...form, customDays: e.target.value })} /></Grid>
            )}
            <Grid item xs={6}><TextField label="Date de début" type="date" fullWidth required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField label="Date de fin (opt.)" type="date" fullWidth value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Notifications avant :</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[30, 15, 7, 3, 1].map(d => (
                  <FormControlLabel key={d} control={
                    <Switch size="small" checked={form[`notify${d}`]} onChange={(e) => setForm({ ...form, [`notify${d}`]: e.target.checked })} />
                  } label={`${d} jour(s)`} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editId ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog détail / historique */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>
          Historique - {selectedBill?.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date prévue</TableCell>
                  <TableCell>Date réelle</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatShortDate(p.due_date)}</TableCell>
                    <TableCell>{p.paid_date ? formatShortDate(p.paid_date) : '-'}</TableCell>
                    <TableCell>{formatMoney(p.amount)}</TableCell>
                    <TableCell>
                      <Chip label={translateStatus(p.status)} size="small" color={statusColor(p.status)} />
                    </TableCell>
                    <TableCell>
                      {p.status !== 'paid' && (
                        <Button size="small" startIcon={<Payment />} onClick={() => handlePay(p)}>
                          Payer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillsPage;
