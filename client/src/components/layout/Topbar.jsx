/**
 * Barre supérieure
 * Contient le menu burger, la recherche, les notifications, le thème et le profil
 */
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

  // Charger le nombre de notifications non lues
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications?unreadOnly=true&limit=1');
        setUnreadCount(data.unreadCount || 0);
      } catch { /* silently fail */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Toutes les minutes
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton onClick={onMenuClick} edge="start" sx={{ display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        {/* Barre de recherche */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          bgcolor: alpha(theme.palette.text.primary, 0.04),
          borderRadius: 3, px: 2, py: 0.5, flex: 1, maxWidth: 400,
          border: `1px solid transparent`,
          '&:focus-within': { borderColor: theme.palette.primary.main },
          transition: 'border 0.2s',
        }}>
          <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
          <InputBase
            placeholder="Rechercher..."
            sx={{ flex: 1, fontSize: 14 }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Actions */}
        <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>

        <IconButton onClick={() => navigate('/notifications')} sx={{ color: 'text.secondary' }}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <Notifications />
          </Badge>
        </IconButton>

        {/* Menu profil */}
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Avatar
            src={user?.avatar ? `http://localhost:5000${user.avatar}` : undefined}
            sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13 }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { width: 220, mt: 1, borderRadius: 3 } }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            Profil
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            Paramètres
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            Déconnexion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
