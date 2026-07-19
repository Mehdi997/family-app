/**
 * Page profil utilisateur
 */
import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Avatar, Divider, Alert, useTheme,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('phone', form.phone);
      if (avatar) formData.append('avatar', avatar);
      await updateProfile(formData);
      setMessage('Profil mis à jour !');
      setError('');
    } catch (err) { setError(err.response?.data?.message || 'Erreur.'); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setError('Les mots de passe ne correspondent pas.');
    try {
      await api.put('/auth/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setMessage('Mot de passe modifié !');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
    } catch (err) { setError(err.response?.data?.message || 'Erreur.'); }
  };

  return (
    <Box>
      <PageHeader title="Mon profil" />
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                src={user?.avatar ? `http://localhost:5000${user.avatar}` : undefined}
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2, fontSize: 36, bgcolor: 'primary.main' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Button variant="outlined" component="label" startIcon={<PhotoCamera />} size="small">
                Changer la photo
                <input type="file" hidden accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} />
              </Button>
              {avatar && <Typography variant="caption" display="block" sx={{ mt: 1 }}>{avatar.name}</Typography>}
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2"><strong>Rôle :</strong> {user?.role === 'chef' ? 'Chef de famille' : user?.role}</Typography>
              <Typography variant="body2"><strong>Famille :</strong> {user?.familyName}</Typography>
              <Typography variant="body2"><strong>Code :</strong> {user?.familyCode}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Informations personnelles</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Prénom" fullWidth value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField label="Nom" fullWidth value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Grid>
                <Grid item xs={12}><TextField label="Email" fullWidth value={user?.email || ''} disabled /></Grid>
                <Grid item xs={12}><TextField label="Téléphone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
              </Grid>
              <Button variant="contained" sx={{ mt: 2 }} onClick={handleUpdateProfile}>Sauvegarder</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Changer le mot de passe</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField label="Mot de passe actuel" type="password" fullWidth value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField label="Nouveau mot de passe" type="password" fullWidth value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField label="Confirmer" type="password" fullWidth value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></Grid>
              </Grid>
              <Button variant="contained" sx={{ mt: 2 }} onClick={handleChangePassword}>Changer</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
