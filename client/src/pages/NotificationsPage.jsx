/**
 * Page des notifications
 */
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Button, Chip, alpha, useTheme,
} from '@mui/material';
import { Receipt, Warning, Security, OilBarrel, Savings, Delete, DoneAll, Circle } from '@mui/icons-material';
import api from '../api/axios';
import { formatShortDate } from '../utils/format';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';

const typeIcons = {
  bill_due: <Receipt />, bill_overdue: <Warning />, insurance_expiring: <Security />,
  oil_change: <OilBarrel />, budget_exceeded: <Warning />, saving_goal: <Savings />, general: <Circle />,
};

const typeColors = {
  bill_due: '#6366F1', bill_overdue: '#EF4444', insurance_expiring: '#F59E0B',
  oil_change: '#3B82F6', budget_exceeded: '#EF4444', saving_goal: '#10B981', general: '#64748B',
};

const NotificationsPage = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const markAsRead = async (id) => { await api.put(`/notifications/${id}/read`); fetch(); };
  const markAllAsRead = async () => { await api.put('/notifications/read-all'); fetch(); };
  const handleDelete = async (id) => { await api.delete(`/notifications/${id}`); fetch(); };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      <PageHeader title="Notifications" subtitle={`${unreadCount} non lue(s)`}>
        {unreadCount > 0 && (
          <Button startIcon={<DoneAll />} onClick={markAllAsRead}>Tout marquer comme lu</Button>
        )}
      </PageHeader>

      {notifications.length === 0 ? (
        <EmptyState title="Aucune notification" description="Vous êtes à jour !" />
      ) : (
        <Card>
          <List disablePadding>
            {notifications.map((n) => (
              <ListItem key={n.id} sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: n.is_read ? 'transparent' : alpha(theme.palette.primary.main, 0.03),
                cursor: 'pointer',
              }} onClick={() => !n.is_read && markAsRead(n.id)}>
                <ListItemIcon>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(typeColors[n.type] || '#666', 0.1), color: typeColors[n.type],
                  }}>
                    {typeIcons[n.type] || <Circle />}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography fontWeight={n.is_read ? 400 : 700}>{n.title}</Typography>}
                  secondary={<><Typography variant="caption" display="block">{n.message}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatShortDate(n.created_at)}</Typography></>}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {!n.is_read && <Chip label="Nouveau" size="small" color="primary" />}
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
};

export default NotificationsPage;
