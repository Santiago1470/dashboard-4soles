import { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import SmokefreeIcon from '@mui/icons-material/Smokefree'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import PercentIcon from '@mui/icons-material/Percent'
import ScienceIcon from '@mui/icons-material/Science'

import { api } from './api/client'
import type { DailyRecord, DeviceInfo, HourlyRecord, PuffRecord, UserInfo, UserSummary } from './api/types'
import { ComplianceChart } from './components/ComplianceChart'
import { DailyPuffsChart } from './components/DailyPuffsChart'
import { HourlyChart } from './components/HourlyChart'
import { KpiCard } from './components/KpiCard'
import { PuffTable } from './components/PuffTable'
import { DAY_ALL } from './constants'

export default function App() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [summary, setSummary] = useState<UserSummary | null>(null)
  const [daily, setDaily] = useState<DailyRecord[]>([])
  const [hourly, setHourly] = useState<HourlyRecord[]>([])
  const [puffs, setPuffs] = useState<PuffRecord[]>([])
  const [selectedDay, setSelectedDay] = useState<string>(DAY_ALL)
  const [hourlyDay, setHourlyDay] = useState<string>(DAY_ALL)
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Especificaciones del dispositivo (equivalencia de nicotina por puff)
  useEffect(() => {
    api
      .device()
      .then(setDevice)
      .catch(() => setDevice(null))
  }, [])

  // Carga inicial: lista de usuarios del backend
  useEffect(() => {
    api
      .users()
      .then((list) => {
        setUsers(list)
        if (list.length > 0) setSelectedUser(list[0].user_id)
        else setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // Cambia de paciente -> recarga sus datos
  useEffect(() => {
    if (!selectedUser) return
    setLoading(true)
    setError(null)
    setHourlyDay(DAY_ALL) // el grafico horario vuelve a "todas las jornadas"
    Promise.all([api.summary(selectedUser), api.daily(selectedUser)])
      .then(([s, d]) => {
        setSummary(s)
        setDaily(d)
        // Selecciona por defecto el ultimo dia con registros
        const last = d.length > 0 ? d[d.length - 1].date : ''
        setSelectedDay(last)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedUser])

  // Cambia el dia de la timeline -> carga detalle de puffs ("todos" = sin filtro)
  useEffect(() => {
    if (!selectedUser || !selectedDay) return
    api
      .puffs(selectedUser, selectedDay === DAY_ALL ? undefined : selectedDay)
      .then(setPuffs)
      .catch((e: Error) => setError(e.message))
  }, [selectedUser, selectedDay])

  // Cambia el dia del grafico horario (o "todas las jornadas") -> recarga la serie
  useEffect(() => {
    if (!selectedUser) return
    api
      .hourly(selectedUser, hourlyDay === DAY_ALL ? undefined : hourlyDay)
      .then(setHourly)
      .catch((e: Error) => setError(e.message))
  }, [selectedUser, hourlyDay])

  const shortId = (id: string) => `${id.slice(0, 8)}...`


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <SmokefreeIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            4Soles - Dashboard Clinico
          </Typography>
          {device && (
            <Chip
              label={`${device.model} · ${device.nicotine_concentration_mg_ml} mg/ml · ${device.nicotine_mg_per_puff} mg/puff`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mr: 1 }}
            />
          )}
          {summary && (
            <Chip
              label={`Ultimo registro: ${summary.last_date}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        {/* Selector de paciente */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel id="user-select-label">Paciente</InputLabel>
            <Select
              labelId="user-select-label"
              value={selectedUser}
              label="Paciente"
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map((u) => (
                <MenuItem key={u.user_id} value={u.user_id}>
                  {shortId(u.user_id)} - {u.days} dias - {u.events} puffs
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {summary && (
            <Typography variant="body2" color="text.secondary">
              Periodo: {summary.date_range.start} a {summary.date_range.end}
            </Typography>
          )}
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error cargando datos: {error}
          </Typography>
        )}

        {summary && (
          <>
            {/* KPIs (15 columnas en md para que quepan 5 tarjetas en una fila) */}
            <Grid container spacing={2} sx={{ mb: 3 }} columns={{ xs: 12, sm: 12, md: 15 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                  title="Total de puffs"
                  value={summary.total_puffs}
                  subtitle={`en ${summary.days} dias registrados`}
                  icon={<WhatshotIcon />}
                  color="#1565c0"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                  title="Promedio diario"
                  value={summary.avg_puffs_per_day}
                  subtitle="puffs por dia"
                  icon={<CalendarTodayIcon />}
                  color="#00897b"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                  title="Dias dentro del limite"
                  value={`${summary.pct_days_within_limit}%`}
                  subtitle={`${summary.days_within_limit} de ${summary.days} dias`}
                  icon={<PercentIcon />}
                  color="#2e7d32"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                  title="Tendencia (7 dias)"
                  value={
                    summary.trend_last7_pct === null
                      ? '--'
                      : `${summary.trend_last7_pct > 0 ? '+' : ''}${summary.trend_last7_pct}%`
                  }
                  subtitle="vs. 7 dias previos"
                  icon={<TrendingDownIcon />}
                  color={
                    summary.trend_last7_pct !== null && summary.trend_last7_pct <= 0
                      ? '#2e7d32'
                      : '#ef6c00'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <KpiCard
                  title="Nicotina total"
                  value={`${summary.total_nicotine_mg ?? '—'} mg`}
                  subtitle="0,057 mg por puff"
                  icon={<ScienceIcon />}
                  color="#f9a825"
                />
              </Grid>
            </Grid>

            {/* Resumen de nicotina estimada (puffs × 0,057 mg) */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Nicotina consumida estimada:{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {summary.total_nicotine_mg ?? '—'} mg
              </Box>{' '}
              (promedio {summary.avg_nicotine_mg_per_day ?? '—'} mg/día · último día{' '}
              {summary.last_day_nicotine_mg ?? '—'} mg) · cálculo: puffs ×{' '}
              {device?.nicotine_mg_per_puff ?? 0.057} mg/puff
              {device
                ? ` · ${device.model}: ${device.total_nicotine_mg} mg en ${device.max_puffs} puffs`
                : ''}
            </Typography>

            {/* Grafico principal diario */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={12}>
                <DailyPuffsChart data={daily} />
              </Grid>
            </Grid>

            {/* Graficos secundarios */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <HourlyChart
                  data={hourly}
                  days={daily}
                  day={hourlyDay}
                  onDayChange={setHourlyDay}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ComplianceChart data={daily} />
              </Grid>
            </Grid>

            {/* Selector de dia + timeline */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="day-select-label">Dia a inspeccionar</InputLabel>
                <Select
                  labelId="day-select-label"
                  value={selectedDay}
                  label="Dia a inspeccionar"
                  onChange={(e) => setSelectedDay(e.target.value)}
                >
                  {daily.map((d) => (
                    <MenuItem key={d.date} value={d.date}>
                      {d.date} - {d.puff_count} puffs
                      {d.nicotine_mg !== null ? ` · ${d.nicotine_mg} mg nicotina` : ''}
                      {d.daily_limit !== null ? ` / lim. ${d.daily_limit}` : ''}
                    </MenuItem>
                  ))}
                  <MenuItem value={DAY_ALL}>Todos los días (todos los registros)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <PuffTable data={puffs} day={selectedDay} />
          </>
        )}

        {!loading && !error && users.length === 0 && (
          <Typography color="text.secondary">
            No se encontraron pacientes. Anade archivos CSV a la carpeta{' '}
            <code>backend/data</code> y recarga la pagina.
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4 }}>
          Prototipo con datos locales (CSV). Sin conexion a base de datos ni servicios externos.
        </Typography>
      </Container>
    </Box>
  )
}

