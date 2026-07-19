/**
 * Page des dépenses
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, IconButton, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Chip, InputAdornment,
  Alert, TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Search, FilterList } from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney, formatShortDate } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ label: '', amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', notes: '' });
  const [error, setError] = useState('');

  const fetchExpenses = useCallback(async () => {
    try {
      const { data } = await api.get('/expenses', {
        params: { search, category: categoryFilter || undefined, page: pagination.page + 1, limit: pagination.rowsPerPage },
      });
      setExpenses(data.expenses);
      setTotal(data.total);
      setPagination(p => ({ ...p, total: data.pagination.total }));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, categoryFilter, pagination.page, pagination.rowsPerPage]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => {
    api.get('/settings').then(({ data }) => setCategories(data.categories.filter(c => c.type === 'expense'))).catch(() => {});
  }, []);

  const handleOpen = (expense = null) => {
    if (expense) {
      setEditId(expense.id);
      setForm({ label: expense.label, amount: expense.amount, date: expense.date?.split('T')[0], categoryId: expense.category_id || '', notes: expense.notes || '' });
    } else {
      setEditId(null);
      setForm({ label: '', amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', notes: '' });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/expenses/${editId}`, form);
      } else {
        await api.post('/expenses', form);
      }
      setDialogOpen(false);
      fetchExpenses();
    } catch (err) { setError(err.response?.data?.message || 'Erreur.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Dépenses" subtitle={`Total filtré : ${formatMoney(total)}`} action={() => handleOpen()} actionLabel="Nouvelle dépense">
        <TextField size="small" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 200 }} />
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Catégorie</InputLabel>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="Catégorie">
            <MenuItem value="">Toutes</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
      </PageHeader>

      {expenses.length === 0 ? (
        <EmptyState title="Aucune dépense" action={() => handleOpen()} actionLabel="Ajouter" />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Libellé</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Par</TableCell>
                  <TableCell align="right">Montant</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id} hover>
                    <TableCell>{formatShortDate(exp.date)}</TableCell>
                    <TableCell><Typography fontWeight={500}>{exp.label}</Typography></TableCell>
                    <TableCell>
                      {exp.category_name && (
                        <Chip label={exp.category_name} size="small"
                          sx={{ bgcolor: `${exp.category_color}20`, color: exp.category_color, fontWeight: 500 }} />
                      )}
                    </TableCell>
                    <TableCell>{exp.first_name} {exp.last_name}</TableCell>
                    <TableCell align="right"><Typography fontWeight={700}>{formatMoney(exp.amount)}</Typography></TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpen(exp)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(exp.id)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={pagination.total} page={pagination.page}
            onPageChange={(e, p) => setPagination({ ...pagination, page: p })}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={(e) => setPagination({ ...pagination, rowsPerPage: parseInt(e.target.value), page: 0 })}
            labelRowsPerPage="Par page"
          />
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Modifier' : 'Nouvelle dépense'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Libellé" fullWidth required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Montant (DA)" type="number" fullWidth required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Date" type="date" fullWidth required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Catégorie</InputLabel>
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} label="Catégorie">
                  <MenuItem value="">Aucune</MenuItem>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
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

export default ExpensesPage;
