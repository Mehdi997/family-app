/**
 * Page planning des repas
 */
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Chip, FormControl, InputLabel, Select, MenuItem, useTheme, alpha,
} from '@mui/material';
import { Add, Delete, Edit, Restaurant, ShoppingCart } from '@mui/icons-material';
import api from '../api/axios';
import { translateMealType } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import LoadingScreen from '../components/common/LoadingScreen';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealColors = { breakfast: '#FF9800', lunch: '#4CAF50', dinner: '#2196F3', snack: '#E91E63' };

const MealsPage = () => {
  const theme = useTheme();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: '', mealType: 'lunch', name: '', ingredients: '', notes: '' });
  const [editId, setEditId] = useState(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
  });

  const fetch = async () => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    try {
      const { data } = await api.get('/meals', {
        params: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      });
      setMeals(data.meals);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [weekStart]);

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const handleOpen = (date, mealType, meal = null) => {
    if (meal) {
      setEditId(meal.id);
      setForm({ date: meal.date?.split('T')[0], mealType: meal.meal_type, name: meal.name, ingredients: meal.ingredients || '', notes: meal.notes || '' });
    } else {
      setEditId(null);
      setForm({ date: date.toISOString().split('T')[0], mealType, name: '', ingredients: '', notes: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = { ...form, ingredients: form.ingredients ? form.ingredients.split('\n').map(i => ({ name: i.trim() })).filter(i => i.name) : [] };
    if (editId) await api.put(`/meals/${editId}`, payload);
    else await api.post('/meals', payload);
    setDialogOpen(false);
    fetch();
  };

  const handleDelete = async (id) => {
    await api.delete(`/meals/${id}`);
    fetch();
  };

  const handleGenerateGrocery = async () => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    try {
      await api.post('/meals/generate-grocery', { startDate: weekStart, endDate: end.toISOString().split('T')[0] });
      alert('Liste de courses générée !');
    } catch (err) { console.error(err); }
  };

  const changeWeek = (offset) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Planning des repas" subtitle="Planifiez vos repas de la semaine">
        <Button variant="outlined" startIcon={<ShoppingCart />} onClick={handleGenerateGrocery}>
          Générer la liste de courses
        </Button>
      </PageHeader>

      {/* Navigation semaine */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button onClick={() => changeWeek(-1)}>← Semaine précédente</Button>
        <Typography fontWeight={700}>
          Semaine du {new Date(weekStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </Typography>
        <Button onClick={() => changeWeek(1)}>Semaine suivante →</Button>
      </Box>

      {/* Grille */}
      <Grid container spacing={1.5}>
        {daysOfWeek.map((day, di) => {
          const dateStr = day.toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <Grid item xs={12} sm={6} md={12 / 7 * 2} lg={12 / 7} key={di} sx={{ minWidth: 160 }}>
              <Card sx={{ border: isToday ? `2px solid ${theme.palette.primary.main}` : undefined, height: '100%' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} textAlign="center"
                    sx={{ color: isToday ? 'primary.main' : 'text.primary', mb: 1 }}>
                    {dayNames[di]}
                    <br />
                    <Typography variant="caption" component="span">{day.getDate()}/{day.getMonth() + 1}</Typography>
                  </Typography>

                  {mealTypes.map(type => {
                    const meal = meals.find(m => m.date?.split('T')[0] === dateStr && m.meal_type === type);
                    return (
                      <Box key={type} sx={{
                        mb: 0.5, p: 0.75, borderRadius: 1.5, cursor: 'pointer',
                        bgcolor: meal ? alpha(mealColors[type], 0.1) : 'transparent',
                        border: `1px solid ${meal ? alpha(mealColors[type], 0.3) : theme.palette.divider}`,
                        '&:hover': { bgcolor: alpha(mealColors[type], 0.15) },
                        transition: 'all 0.2s',
                      }} onClick={() => handleOpen(day, type, meal)}>
                        <Typography variant="caption" sx={{ color: mealColors[type], fontWeight: 600 }}>
                          {translateMealType(type)}
                        </Typography>
                        {meal ? (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" noWrap sx={{ flex: 1 }}>{meal.name}</Typography>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(meal.id); }}>
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">+</Typography>
                        )}
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Modifier' : 'Ajouter un repas'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField label="Date" type="date" fullWidth value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })} label="Type">
                  {mealTypes.map(t => <MenuItem key={t} value={t}>{translateMealType(t)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField label="Plat" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Ingrédients (un par ligne)" fullWidth multiline rows={3} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
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

export default MealsPage;
