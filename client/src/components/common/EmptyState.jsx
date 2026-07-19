/**
 * État vide réutilisable
 */
import { Box, Typography, Button } from '@mui/material';
import { InboxOutlined, Add } from '@mui/icons-material';

const EmptyState = ({ icon, title, description, action, actionLabel }) => {
  return (
    <Box sx={{
      textAlign: 'center', py: 8, px: 3,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <Box sx={{
        width: 80, height: 80, borderRadius: '50%',
        bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center',
        mb: 3,
      }}>
        {icon || <InboxOutlined sx={{ fontSize: 40, color: 'text.secondary' }} />}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title || 'Aucun élément'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        {description || 'Commencez par ajouter votre premier élément.'}
      </Typography>
      {action && (
        <Button variant="contained" startIcon={<Add />} onClick={action}>
          {actionLabel || 'Ajouter'}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
