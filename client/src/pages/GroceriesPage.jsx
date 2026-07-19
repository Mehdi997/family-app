/**
 * Page des courses
 * Listes de courses avec articles cochables
 */
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Checkbox,
  List, ListItem, ListItemText, ListItemIcon, Chip, LinearProgress,
  FormControl, InputLabel, Select, MenuItem, Alert, alpha, useTheme,
} from '@mui/material';
import { Add, Delete, ShoppingCart, Edit, CheckCircle } from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney, formatShortDate } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const GroceriesPage = () => {
  const theme = useTheme();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'weekly', budget: '', store: '', date: new Date().toISOString().split('T')[0] });
  const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unit: '', estimatedPrice: '', category: '' });

  const fetch = async () => {
    try {
      const { data } = await api.get('/groceries');
      setLists(data.lists);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const fetchItems = async (listId) => {
    const { data } = await api.get(`/groceries/${listId}`);
    setSelectedList(data.list);
    setItems(data.items);
  };

  const handleCreate = async () => {
    await api.post('/groceries', form);
    setDialogOpen(false);
    fetch();
  };

  const handleAddItem = async () => {
    await api.post(`/groceries/${selectedList.id}/items`, itemForm);
    setItemDialogOpen(false);
    fetchItems(selectedList.id);
  };

  const handleToggleItem = async (item) => {
    await api.put(`/groceries/items/${item.id}/toggle`, { actualPrice: item.estimated_price });
    fetchItems(selectedList.id);
  };

  const handleDeleteItem = async (itemId) => {
    await api.delete(`/groceries/items/${itemId}`);
    fetchItems(selectedList.id);
  };

  const handleDeleteList = async (id) => {
    if (!window.confirm('Supprimer cette liste ?')) return;
    await api.delete(`/groceries/${id}`);
    if (selectedList?.id === id) { setSelectedList(null); setItems([]); }
    fetch();
  };

  if (loading) return <LoadingScreen />;

  const estimatedTotal = items.reduce((sum, i) => sum + (i.estimated_price || 0) * (i.quantity || 1), 0);
  const actualTotal = items.filter(i => i.is_checked).reduce((sum, i) => sum + (i.actual_price || i.estimated_price || 0) * (i.quantity || 1), 0);
  const checkedCount = items.filter(i => i.is_checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <Box>
      <PageHeader title="Courses" action={() => setDialogOpen(true)} actionLabel="Nouvelle liste" />

      <Grid container spacing={2.5}>
        {/* Listes */}
        <Grid item xs={12} md={4}>
          {lists.length === 0 ? (
            <EmptyState title="Aucune liste" action={() => setDialogOpen(true)} />
          ) : (
            lists.map((list) => (
              <Card key={list.id} sx={{
                mb: 1.5, cursor: 'pointer',
                border: selectedList?.id === list.id ? `2px solid ${theme.palette.primary.main}` : undefined,
              }} onClick={() => fetchItems(list.id)}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography fontWeight={600}>{list.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatShortDate(list.date)} • {list.stats?.total_items || 0} articles
                      </Typography>
                    </Box>
                    <Box>
                      <Chip label={list.type === 'weekly' ? 'Semaine' : 'Mois'} size="small" />
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {list.budget && (
                    <Typography variant="caption" color="text.secondary">Budget : {formatMoney(list.budget)}</Typography>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Grid>

        {/* Articles */}
        <Grid item xs={12} md={8}>
          {selectedList ? (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedList.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {checkedCount}/{items.length} articles • Estimé : {formatMoney(estimatedTotal)} • Réel : {formatMoney(actualTotal)}
                    </Typography>
                  </Box>
                  <Button startIcon={<Add />} variant="contained" size="small" onClick={() => { setItemForm({ name: '', quantity: 1, unit: '', estimatedPrice: '', category: '' }); setItemDialogOpen(true); }}>
                    Article
                  </Button>
                </Box>

                <LinearProgress variant="determinate" value={progress}
                  sx={{ mb: 2, height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': { borderRadius: 4 } }} />

                <List disablePadding>
                  {items.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{
                      py: 0.5, borderBottom: `1px solid ${theme.palette.divider}`,
                      opacity: item.is_checked ? 0.5 : 1,
                    }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox size="small" checked={item.is_checked} onChange={() => handleToggleItem(item)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography sx={{ textDecoration: item.is_checked ? 'line-through' : 'none' }}>{item.name}</Typography>}
                        secondary={`${item.quantity} ${item.unit || ''} ${item.category ? '• ' + item.category : ''}`}
                      />
                      <Typography variant="body2" fontWeight={600} sx={{ mr: 1 }}>
                        {formatMoney(item.estimated_price)}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">Sélectionnez une liste pour voir les articles</Typography>
            </CardContent></Card>
          )}
        </Grid>
      </Grid>

      {/* Dialog nouvelle liste */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nouvelle liste</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Nom" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} label="Type">
                  <MenuItem value="weekly">Semaine</MenuItem><MenuItem value="monthly">Mois</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Budget (DA)" type="number" fullWidth value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Magasin" fullWidth value={form.store} onChange={(e) => setForm({ ...form, store: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Date" type="date" fullWidth value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Créer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog nouvel article */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Nouvel article</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Nom" fullWidth required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField label="Quantité" type="number" fullWidth value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField label="Unité" fullWidth placeholder="kg, L..." value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField label="Prix (DA)" type="number" fullWidth value={itemForm.estimatedPrice} onChange={(e) => setItemForm({ ...itemForm, estimatedPrice: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Catégorie" fullWidth value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setItemDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddItem}>Ajouter</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroceriesPage;
