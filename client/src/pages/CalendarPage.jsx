/**
 * Page Calendrier
 * Vue mensuelle de tous les événements
 */
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, IconButton, useTheme, alpha,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import api from '../api/axios';
import { formatMoney, monthNames } from '../utils/format';
import LoadingScreen from '../components/common/LoadingScreen';

const typeColors = { bill: '#6366F1', insurance: '#10B981', grocery: '#F59E0B', meal: '#EC4899', rent: '#8B5CF6' };
const typeLabels = { bill: 'Facture', insurance: 'Assurance', grocery: 'Courses', meal: 'Repas', rent: 'Loyer' };

const CalendarPage = () => {
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try { const { data } = await api.get('/calendar', { params: { month, year } }); setEvents(data.events); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [month, year]);

  const changeMonth = (offset) => {
    let m = month + offset;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  // Construire le calendrier
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Lundi = 0
  const daysInMonth = lastDay.getDate();

  const weeks = [];
  let currentWeek = new Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) { while (currentWeek.length < 7) currentWeek.push(null); weeks.push(currentWeek); }

  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date?.startsWith(dateStr));
  };

  if (loading) return <LoadingScreen />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Calendrier</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => changeMonth(-1)}><ChevronLeft /></IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ minWidth: 180, textAlign: 'center' }}>
            {monthNames[month - 1]} {year}
          </Typography>
          <IconButton onClick={() => changeMonth(1)}><ChevronRight /></IconButton>
        </Box>
      </Box>

      {/* Légende */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(typeLabels).map(([key, label]) => (
          <Chip key={key} label={label} size="small"
            sx={{ bgcolor: alpha(typeColors[key], 0.1), color: typeColors[key], fontWeight: 600 }} />
        ))}
      </Box>

      {/* Calendrier */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Noms des jours */}
          <Grid container>
            {dayNames.map(d => (
              <Grid item xs={12 / 7} key={d} sx={{ p: 1, textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">{d}</Typography>
              </Grid>
            ))}
          </Grid>

          {/* Semaines */}
          {weeks.map((week, wi) => (
            <Grid container key={wi}>
              {week.map((day, di) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <Grid item xs={12 / 7} key={di} sx={{
                    minHeight: 90, p: 0.5, borderBottom: `1px solid ${theme.palette.divider}`,
                    borderRight: di < 6 ? `1px solid ${theme.palette.divider}` : 'none',
                    bgcolor: isToday(day) ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  }}>
                    {day && (
                      <>
                        <Typography variant="body2" fontWeight={isToday(day) ? 700 : 400}
                          sx={{
                            width: 24, height: 24, lineHeight: '24px', textAlign: 'center', borderRadius: '50%',
                            bgcolor: isToday(day) ? 'primary.main' : 'transparent',
                            color: isToday(day) ? '#fff' : 'text.primary', fontSize: 12, mb: 0.5,
                          }}>
                          {day}
                        </Typography>
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <Box key={i} sx={{
                            px: 0.5, py: 0.25, mb: 0.25, borderRadius: 1,
                            bgcolor: alpha(typeColors[e.type] || '#666', 0.1),
                            borderLeft: `3px solid ${typeColors[e.type] || '#666'}`,
                          }}>
                            <Typography variant="caption" noWrap sx={{ fontSize: 10, fontWeight: 500 }}>
                              {e.title}
                            </Typography>
                          </Box>
                        ))}
                        {dayEvents.length > 3 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                            +{dayEvents.length - 3} autres
                          </Typography>
                        )}
                      </>
                    )}
                  </Grid>
                );
              })}
            </Grid>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalendarPage;
