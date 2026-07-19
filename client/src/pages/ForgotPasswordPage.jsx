/**
 * Page mot de passe oublié
 */
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Link, useTheme,
} from '@mui/material';
import { LockReset, FamilyRestroom } from '@mui/icons-material';
import api from '../api/axios';

const ForgotPasswordPage = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
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
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'primary.main',
          }}>
            <LockReset sx={{ color: '#fff', fontSize: 28 }} />
          </Box>

          <Typography variant="h5" fontWeight={800} gutterBottom>
            Mot de passe oublié
          </Typography>

          {sent ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Si cet email existe, un lien de réinitialisation a été envoyé.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Entrez votre email pour recevoir un lien de réinitialisation
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Email" type="email" fullWidth required
                  value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }}
                />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
              </form>
            </>
          )}

          <Typography variant="body2" sx={{ mt: 3 }}>
            <Link component={RouterLink} to="/login" underline="hover">
              ← Retour à la connexion
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPasswordPage;
