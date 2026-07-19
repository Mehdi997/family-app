/**
 * Page des revenus / salaires
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, IconButton, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Chip, Alert, alpha, useTheme,
} from '@mui/material';
import { Edit, Delete, TrendingUp, Person } from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney, formatShortDate } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingScreen from '../components/common/LoadingScreen';

const types = [
  { value: 'salary', label: 'Salaire' }, { value: 'bonus', label: 'Prime' },
  { value: 'freelance', label: 'Freelance' }, { value: 'rental', label: 'Location' },
  { value: 'other', label: 'Autre' },
];

const IncomesPage = () => {
  const theme = useTheme();
  const [data, setData] = useState({ incomes: [], monthlyTotal: 0, yearlyTotal: 0, byMember: [] });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ label: '', amount: '', type: 'salary', frequency: 'monthly', date: new Date().toISOString().split('T')[0], notes: '' });
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get('/incomes');
      setData(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleOpen = (income = null) => {
    if (income) {
      setEditId(income.id);
      setForm({ label: income.label, amount: income.amount, type: income.type, frequency: income.frequency, date: income.date?.split('T')[0], notes: income.notes || '' });
    } else {
      setEditId(null);
      setForm({ label: '', amount: '', type: 'salary', frequency: 'monthly', date: new Date().toISOString().split('T')[0], notes: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editId) await api.put(`/incomes/${editId}`, form);
      else await api.post('/incomes', form);
      setDialogOpen(false);
      fetch();
    } catch (err) { setError(err.response?.data?.message || 'Erreur.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await api.delete(`/incomes/${id}`);
    fetch();
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Revenus & Salaires" action={() => handleOpen()} actionLabel="Ajouter un revenu" />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Revenu mensuel" value={formatMoney(data.monthlyTotal)} icon={<TrendingUp />} color="success" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Revenu annuel" value={formatMoney(data.yearlyTotal)} icon={<TrendingUp />} color="info" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>Par membre</Typography>
              {data.byMember.map(m => (
                <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">{m.first_name} {m.last_name}</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatMoney(m.total)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Date</TableCell><TableCell>Libellé</TableCell><TableCell>Type</TableCell>
              <TableCell>Membre</TableCell><TableCell align="right">Montant</TableCell><TableCell align="center">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {data.incomes.map((inc) => (
                <TableRow key={inc.id} hover>
                  <TableCell>{formatShortDate(inc.date)}</TableCell>
                  <TableCell><Typography fontWeight={500}>{inc.label}</Typography></TableCell>
                  <TableCell><Chip label={types.find(t => t.value === inc.type)?.label || inc.type} size="small" /></TableCell>
                  <TableCell>{inc.first_name} {inc.last_name}</TableCell>
                  <TableCell align="right"><Typography fontWeight={700} color="success.main">{formatMoney(inc.amount)}</Typography></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(inc)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(inc.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Modifier' : 'Nouveau revenu'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Libellé" fullWidth required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Montant (DA)" type="number" fullWidth required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} label="Type">
                  {types.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Date" type="date" fullWidth required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Fréquence</InputLabel>
                <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} label="Fréquence">
                  <MenuItem value="monthly">Mensuel</MenuItem><MenuItem value="annual">Annuel</MenuItem><MenuItem value="one_time">Unique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit}>{editId ? 'Modifier' : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncomesPage;
