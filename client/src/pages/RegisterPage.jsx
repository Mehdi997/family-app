/**
 * Page d'inscription
 */
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  IconButton, InputAdornment, Alert, Link, Grid, useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, FamilyRestroom } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    confirmPassword: '', phone: '', familyName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }
    if (form.password.length < 6) {
      return setError('Le mot de passe doit contenir au moins 6 caractères.');
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)'
        : 'linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 100%)',
      p: 2,
    }}>
      <Card sx={{ maxWidth: 520, width: '100%', border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}>
              <FamilyRestroom sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={800}>Créer un compte</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Gérez les finances de votre famille en toute simplicité
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Prénom" fullWidth required value={form.firstName} onChange={handleChange('firstName')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Nom" fullWidth required value={form.lastName} onChange={handleChange('lastName')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Nom de famille (foyer)" fullWidth required value={form.familyName} onChange={handleChange('familyName')}
                  helperText="Ex: Famille Benali" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email" type="email" fullWidth required value={form.email} onChange={handleChange('email')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Téléphone" fullWidth value={form.phone} onChange={handleChange('phone')} placeholder="05XX XX XX XX" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Mot de passe" type={showPassword ? 'text' : 'password'} fullWidth required
                  value={form.password} onChange={handleChange('password')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Confirmer le mot de passe" type="password" fullWidth required
                  value={form.confirmPassword} onChange={handleChange('confirmPassword')} />
              </Grid>
            </Grid>

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{
                mt: 3, py: 1.5, fontSize: 16,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
            Déjà un compte ?{' '}
            <Link component={RouterLink} to="/login" fontWeight={600} underline="hover">
              Se connecter
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
