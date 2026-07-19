/**
 * Page des véhicules
 * Gestion véhicules, vidanges, assurances
 */
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Chip, LinearProgress, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Tabs, Tab, Alert, alpha, useTheme,
} from '@mui/material';
import { Add, Edit, Delete, DirectionsCar, OilBarrel, Security, Warning } from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney, formatShortDate } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import LoadingScreen from '../components/common/LoadingScreen';

const VehiclesPage = () => {
  const theme = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [oilDialogOpen, setOilDialogOpen] = useState(false);
  const [insDialogOpen, setInsDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [oilHistory, setOilHistory] = useState([]);
  const [insuranceHistory, setInsuranceHistory] = useState([]);
  const [detailTab, setDetailTab] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ brand: '', model: '', year: '', plate: '', oilChangeInterval: 10000, currentMileage: 0 });
  const [oilForm, setOilForm] = useState({ mileage: '', date: new Date().toISOString().split('T')[0], cost: '', garage: '' });
  const [insForm, setInsForm] = useState({ startDate: '', endDate: '', annualAmount: '', company: '', policyNumber: '' });
  const [editId, setEditId] = useState(null);

  const fetch = async () => {
    try { const { data } = await api.get('/vehicles'); setVehicles(data.vehicles); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleOpen = (v = null) => {
    if (v) { setEditId(v.id); setForm({ brand: v.brand, model: v.model, year: v.year || '', plate: v.plate || '', oilChangeInterval: v.oil_change_interval, currentMileage: v.current_mileage }); }
    else { setEditId(null); setForm({ brand: '', model: '', year: '', plate: '', oilChangeInterval: 10000, currentMileage: 0 }); }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editId) await api.put(`/vehicles/${editId}`, form);
    else await api.post('/vehicles', form);
    setDialogOpen(false); fetch();
  };

  const handleDelete = async (id) => { if (!window.confirm('Supprimer ?')) return; await api.delete(`/vehicles/${id}`); fetch(); };

  const handleViewDetail = async (v) => {
    setSelectedVehicle(v);
    const [oil, ins] = await Promise.all([api.get(`/vehicles/${v.id}/oil-changes`), api.get(`/vehicles/${v.id}/insurance`)]);
    setOilHistory(oil.data.oilChanges);
    setInsuranceHistory(ins.data.insurance);
    setDetailOpen(true);
  };

  const handleAddOilChange = async () => {
    await api.post(`/vehicles/${selectedVehicle.id}/oil-change`, oilForm);
    setOilDialogOpen(false); handleViewDetail(selectedVehicle); fetch();
  };

  const handleAddInsurance = async () => {
    await api.post(`/vehicles/${selectedVehicle.id}/insurance`, insForm);
    setInsDialogOpen(false); handleViewDetail(selectedVehicle); fetch();
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Véhicules" action={() => handleOpen()} actionLabel="Ajouter un véhicule" />

      <Grid container spacing={2.5}>
        {vehicles.map((v) => {
          const oilProgress = v.oil_change_interval > 0 ? Math.max(0, Math.min(100, ((v.oil_change_interval - v.remainingKm) / v.oil_change_interval) * 100)) : 0;
          const oilUrgent = v.remainingKm <= 1000;
          return (
            <Grid item xs={12} sm={6} md={4} key={v.id}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(v)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DirectionsCar sx={{ color: 'info.main' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>{v.brand} {v.model}</Typography>
                        <Typography variant="caption" color="text.secondary">{v.plate} {v.year ? `• ${v.year}` : ''}</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpen(v); }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}><Delete fontSize="small" /></IconButton>
                    </Box>
                  </Box>

                  {/* Vidange */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600}><OilBarrel sx={{ fontSize: 14, mr: 0.5 }} />Vidange</Typography>
                      {oilUrgent && <Chip label="Urgent" size="small" color="error" icon={<Warning />} />}
                    </Box>
                    <LinearProgress variant="determinate" value={oilProgress}
                      sx={{ height: 6, borderRadius: 3, bgcolor: alpha(oilUrgent ? '#EF4444' : '#3B82F6', 0.1),
                        '& .MuiLinearProgress-bar': { bgcolor: oilUrgent ? '#EF4444' : '#3B82F6', borderRadius: 3 } }} />
                    <Typography variant="caption" color="text.secondary">
                      {v.current_mileage?.toLocaleString()} km • {v.remainingKm > 0 ? `${v.remainingKm.toLocaleString()} km restants` : 'Vidange dépassée'}
                    </Typography>
                  </Box>

                  {/* Assurance */}
                  {v.insurance && (
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                      <Typography variant="caption" fontWeight={600}><Security sx={{ fontSize: 14, mr: 0.5 }} />Assurance</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Expire le {formatShortDate(v.insurance.end_date)} • {formatMoney(v.insurance.monthlySaving)}/mois
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialog véhicule */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editId ? 'Modifier' : 'Nouveau véhicule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField label="Marque" fullWidth required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Modèle" fullWidth required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Année" type="number" fullWidth value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Immatriculation" fullWidth value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Kilométrage actuel" type="number" fullWidth value={form.currentMileage} onChange={(e) => setForm({ ...form, currentMileage: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Intervalle vidange (km)" type="number" fullWidth value={form.oilChangeInterval} onChange={(e) => setForm({ ...form, oilChangeInterval: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit}>{editId ? 'Modifier' : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog détail véhicule */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{selectedVehicle?.brand} {selectedVehicle?.model} - Détails</DialogTitle>
        <DialogContent>
          <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2 }}>
            <Tab label="Vidanges" />
            <Tab label="Assurances" />
          </Tabs>
          {detailTab === 0 && (
            <>
              <Button startIcon={<Add />} variant="contained" size="small" sx={{ mb: 2 }}
                onClick={() => { setOilForm({ mileage: '', date: new Date().toISOString().split('T')[0], cost: '', garage: '' }); setOilDialogOpen(true); }}>
                Nouvelle vidange
              </Button>
              <TableContainer><Table size="small">
                <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Kilométrage</TableCell><TableCell>Coût</TableCell><TableCell>Garage</TableCell></TableRow></TableHead>
                <TableBody>{oilHistory.map(o => (
                  <TableRow key={o.id}><TableCell>{formatShortDate(o.date)}</TableCell><TableCell>{o.mileage?.toLocaleString()} km</TableCell><TableCell>{formatMoney(o.cost)}</TableCell><TableCell>{o.garage || '-'}</TableCell></TableRow>
                ))}</TableBody>
              </Table></TableContainer>
            </>
          )}
          {detailTab === 1 && (
            <>
              <Button startIcon={<Add />} variant="contained" size="small" sx={{ mb: 2 }}
                onClick={() => { setInsForm({ startDate: '', endDate: '', annualAmount: '', company: '', policyNumber: '' }); setInsDialogOpen(true); }}>
                Nouvelle assurance
              </Button>
              <TableContainer><Table size="small">
                <TableHead><TableRow><TableCell>Début</TableCell><TableCell>Fin</TableCell><TableCell>Montant/an</TableCell><TableCell>Compagnie</TableCell><TableCell>Épargne/mois</TableCell></TableRow></TableHead>
                <TableBody>{insuranceHistory.map(i => (
                  <TableRow key={i.id}>
                    <TableCell>{formatShortDate(i.start_date)}</TableCell><TableCell>{formatShortDate(i.end_date)}</TableCell>
                    <TableCell>{formatMoney(i.annual_amount)}</TableCell><TableCell>{i.company || '-'}</TableCell>
                    <TableCell><Chip label={formatMoney(i.monthlySaving)} size="small" color={i.isExpired ? 'error' : 'success'} /></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table></TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailOpen(false)}>Fermer</Button></DialogActions>
      </Dialog>

      {/* Dialog vidange */}
      <Dialog open={oilDialogOpen} onClose={() => setOilDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Nouvelle vidange</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Kilométrage" type="number" fullWidth required value={oilForm.mileage} onChange={(e) => setOilForm({ ...oilForm, mileage: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Date" type="date" fullWidth value={oilForm.date} onChange={(e) => setOilForm({ ...oilForm, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField label="Coût (DA)" type="number" fullWidth value={oilForm.cost} onChange={(e) => setOilForm({ ...oilForm, cost: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Garage" fullWidth value={oilForm.garage} onChange={(e) => setOilForm({ ...oilForm, garage: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOilDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddOilChange}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog assurance */}
      <Dialog open={insDialogOpen} onClose={() => setInsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nouvelle assurance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField label="Date début" type="date" fullWidth required value={insForm.startDate} onChange={(e) => setInsForm({ ...insForm, startDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField label="Date fin" type="date" fullWidth required value={insForm.endDate} onChange={(e) => setInsForm({ ...insForm, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField label="Montant annuel (DA)" type="number" fullWidth required value={insForm.annualAmount} onChange={(e) => setInsForm({ ...insForm, annualAmount: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Compagnie" fullWidth value={insForm.company} onChange={(e) => setInsForm({ ...insForm, company: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="N° Police" fullWidth value={insForm.policyNumber} onChange={(e) => setInsForm({ ...insForm, policyNumber: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInsDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddInsurance}>Ajouter</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehiclesPage;
