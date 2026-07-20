import { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Badge, Avatar,
  Box, Menu, MenuItem, Divider, ListItemIcon, useTheme, InputBase, alpha,
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, DarkMode, LightMode,
  Logout, Person, Settings, Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import api from '../../api/axios';

const Topbar = ({ onMenuClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications?unreadOnly=true&limit=1');
        setUnreadCount(data.unreadCount || 0);
      } catch { /* silently fail */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(20px)', borderBottom: `1px solid ${theme.palette.divider}`, color: 'text.primary',
    }}>
      <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, px: { xs: 1.5, sm: 3 }, minHeight: { xs: 56, sm: 64 } }}>
        <IconButton onClick={onMenuClick} edge="start" sx={{ display: { md: 'none' }, mr: { xs: 0.5, sm: 1 } }}>
          <MenuIcon />
        </IconButton>

        {/* Barre globale masquée sur mobile pour ne pas écraser les icônes */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1,
          bgcolor: alpha(theme.palette.text.primary, 0.04),
          borderRadius: 3, px: 2, py: 0.5, flex: 1, maxWidth: 350, border: '1px solid transparent',
          '&:focus-within': { borderColor: theme.palette.primary.main }, transition: 'border 0.2s',
        }}>
          <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
          <InputBase placeholder="Rechercher..." sx={{ flex: 1, fontSize: 14 }} />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary', p: { xs: 1, sm: 1.25 } }}>
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>

          <IconButton onClick={() => navigate('/notifications')} sx={{ color: 'text.secondary', p: { xs: 1, sm: 1.25 } }}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5, ml: { xs: 0, sm: 0.5 } }}>
            <Avatar src={user?.avatar ? `http://localhost:5000${user.avatar}` : undefined}
              sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, bgcolor: 'primary.main', fontSize: { xs: 12, sm: 14 }, fontWeight: 700 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { width: 220, mt: 1, borderRadius: 3 } }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{user?.firstName} {user?.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}><ListItemIcon><Person fontSize="small" /></ListItemIcon>Profil</MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}><ListItemIcon><Settings fontSize="small" /></ListItemIcon>Paramètres</MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}><ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Déconnexion</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
export default Topbar;