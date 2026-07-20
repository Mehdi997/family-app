import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

const PageHeader = ({ title, subtitle, action, actionLabel, actionIcon, children }) => {
  return (
    <Box sx={{
      display: 'flex', flexDirection: { xs: 'column', md: 'row' },
      justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' },
      mb: 3, gap: 2,
    }}>
      <Box>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>

      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5,
        alignItems: { xs: 'stretch', sm: 'center' }, width: { xs: '100%', md: 'auto' },
      }}>
        <Box sx={{
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, flex: 1,
          '& .MuiFormControl-root, & .MuiTextField-root': { width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }
        }}>
          {children}
        </Box>
        {action && (
          <Button variant="contained" startIcon={actionIcon || <Add />} onClick={action}
            sx={{ borderRadius: 3, py: { xs: 1, sm: 0.75 }, whiteSpace: 'nowrap' }}>
            {actionLabel || 'Ajouter'}
          </Button>
        )}
      </Box>
    </Box>
  );
};
export default PageHeader;