/**
 * Sidebar rétractable
 * Navigation principale de l'application
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Box, Typography, Avatar, Divider, Tooltip,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  Dashboard, Receipt, ShoppingCart, DirectionsCar,
  AccountBalanceWallet, Savings, Restaurant,
  CalendarMonth, Notifications, Description,
  Settings, ChevronLeft, ChevronRight, TrendingUp,
  MonetizationOn, FamilyRestroom,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED = 72;

const menuItems = [
  { text: 'Tableau de bord', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Factures', icon: <Receipt />, path: '/bills' },
  { text: 'Dépenses', icon: <MonetizationOn />, path: '/expenses' },
  { text: 'Revenus', icon: <TrendingUp />, path: '/incomes' },
  { text: 'Économies', icon: <Savings />, path: '/savings' },
  { text: 'Courses', icon: <ShoppingCart />, path: '/groceries' },
  { text: 'Repas', icon: <Restaurant />, path: '/meals' },
  { text: 'Véhicules', icon: <DirectionsCar />, path: '/vehicles' },
  { text: 'Calendrier', icon: <CalendarMonth />, path: '/calendar' },
  { text: 'Documents', icon: <Description />, path: '/documents' },
  { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
  { text: 'Paramètres', icon: <Settings />, path: '/settings' },
];

const Sidebar = ({ open, onToggle, mobileOpen, onMobileClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) onMobileClose();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo / Header */}
      <Box sx={{
        p: 2, display: 'flex', alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        minHeight: 64,
      }}>
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FamilyRestroom sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={800} color="primary" noWrap>
              FamilyApp
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton onClick={onToggle} size="small">
            {open ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 1, px: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Tooltip key={item.path} title={!open ? item.text : ''} placement="right">
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 44,
                  justifyContent: open ? 'initial' : 'center',
                  mb: 0.3,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 0, mr: open ? 2 : 0,
                  justifyContent: 'center', color: isActive ? 'primary.main' : 'text.secondary',
                }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Profil */}
      <Box sx={{
        p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
        cursor: 'pointer', justifyContent: open ? 'flex-start' : 'center',
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
        borderRadius: 2, mx: 1, mb: 1,
      }}
        onClick={() => handleNavigation('/profile')}
      >
        <Avatar
          src={user?.avatar ? `http://localhost:5000${user.avatar}` : undefined}
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </Avatar>
        {open && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role === 'chef' ? 'Chef de famille' : user?.role}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  // Mobile : Drawer temporaire
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Desktop : Drawer permanent rétractable
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
          overflowX: 'hidden',
          bgcolor: 'background.paper',
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
