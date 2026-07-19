/**
 * Page Tableau de bord
 * Affichage des KPIs, graphiques et aperçus
 */
import { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip, List,
  ListItem, ListItemText, ListItemIcon, Avatar, alpha, useTheme,
} from '@mui/material';
import {
  TrendingDown, TrendingUp, AccountBalanceWallet, Savings,
  Receipt, Warning, DirectionsCar, ShoppingCart, CalendarMonth,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { formatMoney, formatShortDate, translateStatus, statusColor, monthNames } from '../utils/format';
import StatCard from '../components/common/StatCard';
import LoadingScreen from '../components/common/LoadingScreen';

const CHART_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

const DashboardPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setData(data);
      } catch (error) {
        console.error('Erreur dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingScreen />;
  if (!data) return <Typography>Erreur de chargement.</Typography>;

  const { summary, upcomingBills, overdueBills, upcomingInsurance, upcomingOilChanges,
    expensesByCategory, monthlyEvolution, monthlyIncomeEvolution, savingsEnvelopes } = data;

  // Préparer données graphiques
  const pieData = expensesByCategory.map((c, i) => ({
    name: c.name || 'Non catégorisé',
    value: parseFloat(c.total),
    color: c.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Fusionner évolution revenus/dépenses
  const monthsSet = new Set([
    ...monthlyEvolution.map(m => m.month),
    ...monthlyIncomeEvolution.map(m => m.month),
  ]);
  const evolutionData = Array.from(monthsSet).sort().map(month => {
    const exp = monthlyEvolution.find(m => m.month === month);
    const inc = monthlyIncomeEvolution.find(m => m.month === month);
    const [y, m] = month.split('-');
    return {
      month: monthNames[parseInt(m) - 1]?.slice(0, 3) || month,
      expenses: parseFloat(exp?.total || 0),
      income: parseFloat(inc?.total || 0),
    };
  });

  return (
    <Box>
      {/* Salutation */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          Bonjour, {user?.firstName} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Voici l'aperçu financier de votre famille
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Dépenses du mois"
            value={formatMoney(summary.monthlyExpenses)}
            icon={<TrendingDown />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenus du mois"
            value={formatMoney(summary.monthlyIncome)}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reste disponible"
            value={formatMoney(summary.available)}
            icon={<AccountBalanceWallet />}
            color={summary.available >= 0 ? 'info' : 'error'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Économies totales"
            value={formatMoney(summary.totalSavings)}
            subtitle={`Objectif : ${formatMoney(summary.targetSavings)}`}
            icon={<Savings />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Évolution mensuelle */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Revenus vs Dépenses
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" stroke={theme.palette.text.secondary} fontSize={12} />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 12,
                    }}
                    formatter={(v) => formatMoney(v)}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Revenus" stroke="#10B981"
                    fillOpacity={1} fill="url(#gradIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#EF4444"
                    fillOpacity={1} fill="url(#gradExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition par catégorie */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Dépenses par catégorie
              </Typography>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={5} dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucune dépense ce mois
                  </Typography>
                </Box>
              )}
              {/* Légende */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {pieData.slice(0, 5).map((item, i) => (
                  <Chip
                    key={i} size="small" label={item.name}
                    sx={{ bgcolor: alpha(item.color, 0.1), color: item.color, fontWeight: 500, fontSize: 11 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Listes */}
      <Grid container spacing={2.5}>
        {/* Prochaines factures */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Receipt sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700}>Prochaines factures</Typography>
              </Box>
              <List disablePadding>
                {upcomingBills.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Aucune facture à venir
                  </Typography>
                )}
                {upcomingBills.map((bill) => (
                  <ListItem key={bill.id} disablePadding sx={{
                    py: 1, borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': { borderBottom: 'none' },
                  }}>
                    <ListItemText
                      primary={bill.name}
                      secondary={formatShortDate(bill.due_date)}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                      secondaryTypographyProps={{ fontSize: 12 }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {formatMoney(bill.amount)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Factures en retard */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning sx={{ color: 'error.main' }} />
                <Typography variant="h6" fontWeight={700}>En retard</Typography>
                {overdueBills.length > 0 && (
                  <Chip label={overdueBills.length} size="small" color="error" />
                )}
              </Box>
              <List disablePadding>
                {overdueBills.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    ✅ Aucune facture en retard
                  </Typography>
                )}
                {overdueBills.map((bill) => (
                  <ListItem key={bill.id} disablePadding sx={{
                    py: 1, borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': { borderBottom: 'none' },
                  }}>
                    <ListItemText
                      primary={bill.name}
                      secondary={`Depuis le ${formatShortDate(bill.due_date)}`}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: 'error.main' }}
                    />
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      {formatMoney(bill.amount)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Économies */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Savings sx={{ color: 'warning.main' }} />
                <Typography variant="h6" fontWeight={700}>Enveloppes</Typography>
              </Box>
              <List disablePadding>
                {savingsEnvelopes.map((env) => {
                  const progress = env.target_amount > 0
                    ? Math.min(100, (env.current_amount / env.target_amount) * 100)
                    : 0;
                  return (
                    <ListItem key={env.id} disablePadding sx={{
                      py: 1, borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:last-child': { borderBottom: 'none' },
                    }}>
                      <ListItemText
                        primary={env.name}
                        secondary={
                          <Box sx={{
                            mt: 0.5, height: 6, borderRadius: 3,
                            bgcolor: alpha(env.color || '#6366F1', 0.15), overflow: 'hidden',
                          }}>
                            <Box sx={{
                              height: '100%', borderRadius: 3,
                              bgcolor: env.color || '#6366F1',
                              width: `${progress}%`,
                              transition: 'width 0.5s ease',
                            }} />
                          </Box>
                        }
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                      />
                      <Typography variant="caption" fontWeight={600} sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                        {Math.round(progress)}%
                      </Typography>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Assurances */}
        {upcomingInsurance.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <DirectionsCar sx={{ color: 'info.main' }} />
                  <Typography variant="h6" fontWeight={700}>Assurances</Typography>
                </Box>
                <List disablePadding>
                  {upcomingInsurance.map((ins) => (
                    <ListItem key={ins.id} disablePadding sx={{ py: 1 }}>
                      <ListItemText
                        primary={`${ins.brand} ${ins.model} - ${ins.plate}`}
                        secondary={`Expire le ${formatShortDate(ins.end_date)}`}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {formatMoney(ins.annual_amount)}/an
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Vidanges urgentes */}
        {upcomingOilChanges.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Warning sx={{ color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight={700}>Vidanges à prévoir</Typography>
                </Box>
                <List disablePadding>
                  {upcomingOilChanges.map((v) => (
                    <ListItem key={v.vehicleId} disablePadding sx={{ py: 1 }}>
                      <ListItemText
                        primary={`${v.brand} ${v.model}`}
                        secondary={`${v.remainingKm} km restants`}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                        secondaryTypographyProps={{ color: v.urgent ? 'error.main' : 'text.secondary' }}
                      />
                      <Chip
                        label={v.urgent ? 'Urgent' : 'Bientôt'}
                        size="small"
                        color={v.urgent ? 'error' : 'warning'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
