/**
 * En-tête de page réutilisable
 */
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

const PageHeader = ({ title, subtitle, action, actionLabel, actionIcon, children }) => {
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      mb: 3, flexWrap: 'wrap', gap: 2,
    }}>
      <Box>
        <Typography variant="h4" fontWeight={800}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {children}
        {action && (
          <Button
            variant="contained"
            startIcon={actionIcon || <Add />}
            onClick={action}
            sx={{ borderRadius: 3 }}
          >
            {actionLabel || 'Ajouter'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
