import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Checkbox,
  List, ListItem, ListItemText, ListItemIcon, Chip, LinearProgress,
  FormControl, InputLabel, Select, MenuItem, Alert, alpha, useTheme,
} from '@mui/material';
import { Add, Delete, ShoppingCart, Edit, ContentCopy } from '@mui/icons-material';
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
  const [editingItem, setEditingItem] = useState(null);
  const [quickItemName, setQuickItemName] = useState('');
  const [form, setForm] = useState({ name: '', type: 'weekly', budget: '', store: '', date: new Date().toISOString().split('T')[0] });
  const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unit: '', estimatedPrice: '', category: '' });

  const fetch = async () => {
    try {
      const { data } = await api.get('/groceries');
      setLists(data.lists);
      if (selectedList) {
        const found = data.lists.find(l => l.id === selectedList.id);
        if (found) setSelectedList(found);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const fetchItems = async (listId) => {
    try {
      const { data } = await api.get(`/groceries/${listId}`);
      setSelectedList(data.list);
      setItems(data.items);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    await api.post('/groceries', form);
    setDialogOpen(false);
    fetch();
  };

  const handleDuplicateList = async (id, e) => {
    if (e) e.stopPropagation();
    await api.post(`/groceries/${id}/duplicate`);
    fetch();
  };

  const handleQuickAddItem = async (e) => {
    e.preventDefault();
    if (!quickItemName.trim() || !selectedList) return;
    try {
      await api.post(`/groceries/${selectedList.id}/items`, {
        name: quickItemName.trim(),
        quantity: 1,
        estimatedPrice: 0,
        unit: '',
        category: ''
      });
      setQuickItemName('');
      fetchItems(selectedList.id);
      fetch();
    } catch (err) { console.error(err); }
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      quantity: item.quantity || 1,
      unit: item.unit || '',
      estimatedPrice: item.estimated_price || '',
      category: item.category || ''
    });
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (editingItem) {
      await api.put(`/groceries/items/${editingItem.id}`, {
        name: itemForm.name,
        quantity: itemForm.quantity,
        unit: itemForm.unit,
        estimatedPrice: itemForm.estimatedPrice,
        actualPrice: editingItem.actual_price,
        category: itemForm.category,
        isChecked: editingItem.is_checked
      });
    } else {
      await api.post(`/groceries/${selectedList.id}/items`, itemForm);
    }
    setItemDialogOpen(false);
    setEditingItem(null);
    fetchItems(selectedList.id);
    fetch();
  };

  const handleToggleItem = async (item) => {
    await api.put(`/groceries/items/${item.id}/toggle`, { actualPrice: item.estimated_price });
    fetchItems(selectedList.id);
    fetch();
  };

  const handleDeleteItem = async (itemId) => {
    await api.delete(`/groceries/items/${itemId}`);
    fetchItems(selectedList.id);
    fetch();
  };

  const handleDeleteList = async (id, e) => {
    if (e) e.stopPropagation();
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
      <PageHeader title="Courses & To-Do List" action={() => setDialogOpen(true)} actionLabel="Nouvelle liste" />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          {lists.length === 0 ? (
            <EmptyState title="Aucune liste de courses" action={() => setDialogOpen(true)} />
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip label={list.type === 'weekly' ? 'Semaine' : 'Mois'} size="small" />
                      <IconButton size="small" color="primary" title="Dupliquer (copier) cette liste" onClick={(e) => handleDuplicateList(list.id, e)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" title="Supprimer" onClick={(e) => handleDeleteList(list.id, e)}>
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

        <Grid item xs={12} md={8}>
          {selectedList ? (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedList.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {checkedCount}/{items.length} articles • Total estimé : {formatMoney(estimatedTotal)} • Dépensé : {formatMoney(actualTotal)}
                    </Typography>
                  </Box>
                  <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => { setEditingItem(null); setItemForm({ name: '', quantity: 1, unit: '', estimatedPrice: '', category: '' }); setItemDialogOpen(true); }}>
                    Article détaillé
                  </Button>
                </Box>

                <form onSubmit={handleQuickAddItem} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="⚡ Saisie rapide To-Do : tapez un aliment (ex: Pâtes, Tomates, Lait...) et appuyez sur Entrée ↵"
                    value={quickItemName}
                    onChange={(e) => setQuickItemName(e.target.value)}
                  />
                  <Button type="submit" variant="contained" sx={{ minWidth: 100, fontWeight: 'bold' }}>
                    Ajouter ↵
                  </Button>
                </form>

                <LinearProgress variant="determinate" value={progress}
                  sx={{ mb: 2, height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': { borderRadius: 4 } }} />

                <List disablePadding>
                  {items.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{
                      py: 0.75, borderBottom: `1px solid ${theme.palette.divider}`,
                      opacity: item.is_checked ? 0.55 : 1,
                    }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox size="small" checked={item.is_checked} onChange={() => handleToggleItem(item)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography fontWeight={item.is_checked ? 400 : 600} sx={{ textDecoration: item.is_checked ? 'line-through' : 'none', fontSize: 16 }}>{item.name}</Typography>}
                        secondary={
                          (item.quantity > 1 || item.unit || item.category || item.estimated_price > 0) ? (
                            `${item.quantity > 1 ? item.quantity : ''} ${item.unit || ''} ${item.category ? '• ' + item.category : ''} ${item.estimated_price > 0 ? '• Prix: ' + formatMoney(item.estimated_price) : ''}`
                          ) : null
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.estimated_price > 0 && (
                          <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ mr: 1.5 }}>
                            {formatMoney((item.estimated_price || 0) * (item.quantity || 1))}
                          </Typography>
                        )}
                        <IconButton size="small" color="info" title="Ajouter/Modifier la quantité et le prix" onClick={() => handleOpenEditItem(item)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" title="Supprimer cet article" onClick={() => handleDeleteItem(item.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary" fontWeight={500}>Sélectionnez une liste à gauche ou créez-en une nouvelle</Typography>
            </CardContent></Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nouvelle liste</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Nom" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Courses de la semaine, Supermarché..." /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} label="Type">
                  <MenuItem value="weekly">Semaine</MenuItem><MenuItem value="monthly">Mois</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Budget (DA)" type="number" fullWidth value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Facultatif" /></Grid>
            <Grid item xs={6}><TextField label="Magasin / Lieu" fullWidth value={form.store} onChange={(e) => setForm({ ...form, store: e.target.value })} placeholder="Ex: UNO, Marché..." /></Grid>
            <Grid item xs={6}><TextField label="Date" type="date" fullWidth value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={itemDialogOpen} onClose={() => { setItemDialogOpen(false); setEditingItem(null); }} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editingItem ? '✏️ Modifier quantité & prix' : 'Nouvel article détaillé'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Nom de l'article *" fullWidth required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Quantité" type="number" fullWidth value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Unité" fullWidth placeholder="kg, L, boîtes..." value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Prix unitaire (DA)" type="number" fullWidth value={itemForm.estimatedPrice} onChange={(e) => setItemForm({ ...itemForm, estimatedPrice: e.target.value })} placeholder="Saisissez le prix quand vous voulez !" /></Grid>
            <Grid item xs={12}><TextField label="Catégorie" fullWidth value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Ex: Fruits, Viande, Entretien..." /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setItemDialogOpen(false); setEditingItem(null); }}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveItem}>{editingItem ? 'Enregistrer le prix' : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroceriesPage;