import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Switch, FormControlLabel, Tabs, Tab, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Divider, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, Alert, useTheme,
} from '@mui/material';
import { Edit, Delete, Add, Person, Palette, Notifications, Category } from '@mui/icons-material';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import PageHeader from '../components/common/PageHeader';
import LoadingScreen from '../components/common/LoadingScreen';

const SettingsPage = () => {
  const theme = useTheme();
  const { user, isChef } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [family, setFamily] = useState({});
  const [loading, setLoading] = useState(true);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', icon: '', color: '#6366F1' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'autre' });
  const [message, setMessage] = useState('');

  const fetch = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings);
      setCategories(data.categories);
      setMembers(data.members);
      setFamily(data.family);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSaveSettings = async () => {
    try {
      await api.put('/settings', settings);
      setMessage('Paramètres sauvegardés !');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { console.error(err); }
  };

  const handleTestEmail = async () => {
    try {
      setMessage('📧 Envoi de l\'email de test en cours...');
      const { data } = await api.post('/settings/test-email');
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'email.');
    }
  };

  const handleAddCategory = async () => {
    await api.post('/settings/categories', catForm);
    setCatDialogOpen(false);
    fetch();
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    await api.delete(`/settings/categories/${id}`);
    fetch();
  };

  const handleInvite = async () => {
    try {
      const { data } = await api.post('/auth/invite', inviteForm);
      setMessage(`Invitation envoyée ! Token : ${data.inviteToken}`);
      setInviteDialogOpen(false);
    } catch (err) { setMessage(err.response?.data?.message || 'Erreur.'); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Paramètres" />
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<Palette />} label="Général" iconPosition="start" />
        <Tab icon={<Category />} label="Catégories" iconPosition="start" />
        <Tab icon={<Person />} label="Membres" iconPosition="start" />
        <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Apparence</Typography>
                <FormControlLabel
                  control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
                  label="Mode sombre"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Famille</Typography>
                <Typography variant="body2">Nom : <strong>{family?.name}</strong></Typography>
                <Typography variant="body2">Code : <strong>{family?.code}</strong></Typography>
                <Typography variant="body2">Devise : <strong>{settings?.currency || 'DA'}</strong></Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Budget</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField label="Budget hebdomadaire (DA)" type="number" fullWidth
                      value={settings.weekly_budget || ''} onChange={(e) => setSettings({ ...settings, weekly_budget: e.target.value })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Budget mensuel (DA)" type="number" fullWidth
                      value={settings.monthly_budget || ''} onChange={(e) => setSettings({ ...settings, monthly_budget: e.target.value })} />
                  </Grid>
                </Grid>
                <Button variant="contained" sx={{ mt: 2 }} onClick={handleSaveSettings}>Sauvegarder</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Catégories</Typography>
              <Button startIcon={<Add />} variant="contained" size="small"
                onClick={() => { setCatForm({ name: '', type: 'expense', icon: '', color: '#6366F1' }); setCatDialogOpen(true); }}>
                Ajouter
              </Button>
            </Box>
            {['expense', 'income', 'bill', 'grocery', 'saving'].map(type => (
              <Box key={type} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {type === 'expense' ? 'Dépenses' : type === 'income' ? 'Revenus' : type === 'bill' ? 'Factures' : type === 'grocery' ? 'Courses' : 'Économies'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {categories.filter(c => c.type === type).map(c => (
                    <Chip key={c.id} label={c.name}
                      sx={{ bgcolor: `${c.color}20`, color: c.color, fontWeight: 500 }}
                      onDelete={!c.is_default ? () => handleDeleteCategory(c.id) : undefined} />
                  ))}
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Membres de la famille</Typography>
              {isChef && <Button startIcon={<Add />} variant="contained" size="small" onClick={() => setInviteDialogOpen(true)}>Inviter</Button>}
            </Box>
            <List>
              {members.map(m => (
                <ListItem key={m.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{m.first_name?.[0]}{m.last_name?.[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={`${m.first_name} ${m.last_name}`} secondary={`${m.email} • ${m.role}`} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Notifications par Email & Application</Typography>
            <FormControlLabel
              control={<Switch checked={settings.notifications_enabled !== false}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })} />}
              label="Activer les alertes automatiques"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Lorsqu'activées, vous recevrez automatiquement les alertes des échéances de factures et de salaires par email.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleSaveSettings}>
                Sauvegarder
              </Button>
              <Button variant="outlined" color="primary" onClick={handleTestEmail}>
                📧 Tester l'envoi d'un email maintenant
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={catDialogOpen} onClose={() => setCatDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Nouvelle catégorie</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Nom" fullWidth required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></Grid>
            <Grid item xs={8}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })} label="Type">
                  <MenuItem value="expense">Dépense</MenuItem><MenuItem value="income">Revenu</MenuItem>
                  <MenuItem value="bill">Facture</MenuItem><MenuItem value="grocery">Courses</MenuItem><MenuItem value="saving">Économie</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField label="Couleur" type="color" fullWidth value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCatDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddCategory}>Ajouter</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Inviter un membre</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Email" type="email" fullWidth required value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Rôle</InputLabel>
                <Select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} label="Rôle">
                  <MenuItem value="conjoint">Conjoint(e)</MenuItem><MenuItem value="enfant">Enfant</MenuItem><MenuItem value="autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleInvite}>Inviter</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;