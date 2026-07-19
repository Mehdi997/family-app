/**
 * Écran de chargement
 */
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message }) => {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 2,
    }}>
      <CircularProgress size={44} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        {message || 'Chargement...'}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
