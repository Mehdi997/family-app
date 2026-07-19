/**
 * Page des économies / enveloppes
 */
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  LinearProgress, Chip, Alert, alpha, useTheme,
} from '@mui/material';
import { Edit, Delete, Add, Remove, Savings, TrendingUp } from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import LoadingScreen from '../components/common/LoadingScreen';

const SavingsPage = () => {
  const theme = useTheme();
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transDialogOpen, setTransDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedSaving, setSelectedSaving] = useState(null);
  const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '', icon: 'Savings', color: '#6366F1', notes: '' });
  const [transForm, setTransForm] = useState({ amount: '', type: 'deposit', date: new Date().toISOString().split('T')[0], notes: '' });

  const fetch = async () => {
    try {
      const { data } = await api.get('/savings');
      setSavings(data.savings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleOpen = (saving = null) => {
    if (saving) {
      setEditId(saving.id);
      setForm({ name: saving.name, targetAmount: saving.target_amount, deadline: saving.deadline?.split('T')[0] || '', icon: saving.icon, color: saving.color, notes: saving.notes || '' });
    } else {
      setEditId(null);
      setForm({ name: '', targetAmount: '', deadline: '', icon: 'Savings', color: '#6366F1', notes: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editId) await api.put(`/savings/${editId}`, form);
      else await api.post('/savings', form);
      setDialogOpen(false);
      fetch();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await api.delete(`/savings/${id}`);
    fetch();
  };

  const handleTransaction = async () => {
    try {
      await api.post(`/savings/${selectedSaving.id}/transaction`, transForm);
      setTransDialogOpen(false);
      fetch();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Économies" subtitle="Gérez vos enveloppes d'épargne" action={() => handleOpen()} actionLabel="Nouvelle enveloppe" />

      <Grid container spacing={2.5}>
        {savings.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.id}>
            <Card sx={{
              position: 'relative', overflow: 'hidden',
              '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: s.color || 'primary.main' },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(s.color || '#6366F1', 0.1) }}>
                      <Savings sx={{ color: s.color || 'primary.main' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>{s.name}</Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpen(s)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}><Delete fontSize="small" /></IconButton>
                  </Box>
                </Box>

                <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
                  {formatMoney(s.current_amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  sur {formatMoney(s.target_amount)}
                </Typography>

                <LinearProgress
                  variant="determinate" value={s.progress}
                  sx={{ my: 2, height: 8, borderRadius: 4, bgcolor: alpha(s.color || '#6366F1', 0.1),
                    '& .MuiLinearProgress-bar': { bgcolor: s.color || 'primary.main', borderRadius: 4 } }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">{Math.round(s.progress)}%</Typography>
                  <Typography variant="caption" color="text.secondary">Reste : {formatMoney(s.remaining)}</Typography>
                </Box>

                {s.monthlyNeeded > 0 && (
                  <Chip label={`${formatMoney(s.monthlyNeeded)} / mois`} size="small" icon={<TrendingUp />}
                    sx={{ bgcolor: alpha(s.color || '#6366F1', 0.1), color: s.color, fontWeight: 600, mt: 1 }} />
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" variant="contained" startIcon={<Add />} fullWidth
                    sx={{ bgcolor: s.color }}
                    onClick={() => { setSelectedSaving(s); setTransForm({ ...transForm, type: 'deposit' }); setTransDialogOpen(true); }}>
                    Dépôt
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<Remove />} fullWidth
                    onClick={() => { setSelectedSaving(s); setTransForm({ ...transForm, type: 'withdrawal' }); setTransDialogOpen(true); }}>
                    Retrait
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog enveloppe */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Modifier' : 'Nouvelle enveloppe'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}><TextField label="Nom" fullWidth required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField label="Couleur" type="color" fullWidth value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Objectif (DA)" type="number" fullWidth value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Date limite" type="date" fullWidth value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit}>{editId ? 'Modifier' : 'Créer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog transaction */}
      <Dialog open={transDialogOpen} onClose={() => setTransDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>
          {transForm.type === 'deposit' ? 'Dépôt' : 'Retrait'} - {selectedSaving?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Montant (DA)" type="number" fullWidth required value={transForm.amount} onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Date" type="date" fullWidth value={transForm.date} onChange={(e) => setTransForm({ ...transForm, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth value={transForm.notes} onChange={(e) => setTransForm({ ...transForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleTransaction}>Valider</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavingsPage;
