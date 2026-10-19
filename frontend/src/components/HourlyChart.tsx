import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyRecord, HourlyRecord } from '../api/types'
import { DAY_ALL } from '../constants'

interface HourlyChartProps {
  data: HourlyRecord[]
  /** Días disponibles para el desplegable (serie diaria del paciente). */
  days: DailyRecord[]
  /** Día seleccionado o DAY_ALL ("todas las jornadas"). */
  day: string
  onDayChange: (day: string) => void
}

/**
 * Patrón horario agregado: en qué franjas del día concentra el paciente el consumo.
 * Útil para el psicólogo/ neumólogo para detectar hábitos (mañana, noche, etc.).
 * La línea morada (eje derecho) muestra la nicotina estimada por hora (0,057 mg/puff).
 * Desplegable para ver todas las jornadas o solo un día concreto.
 */
export function HourlyChart({ data, days, day, onDayChange }: HourlyChartProps) {
  const allDays = day === DAY_ALL

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1">Patrón horario del consumo</Typography>
          <FormControl size="small" sx={{ minWidth: 210 }}>
            <InputLabel id="hourly-day-label">Día</InputLabel>
            <Select
              labelId="hourly-day-label"
              value={day}
              label="Día"
              onChange={(e) => onDayChange(e.target.value)}
            >
              <MenuItem value={DAY_ALL}>Todas las jornadas</MenuItem>
              {days.map((d) => (
                <MenuItem key={d.date} value={d.date}>
                  {d.date} - {d.puff_count} puffs
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {allDays
            ? 'Puffs acumulados por hora del día (todas las jornadas) y su equivalencia en nicotina.'
            : `Puffs por hora del día ${day} y su equivalencia en nicotina (0,057 mg por puff).`}
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11 }}
              tickFormatter={(h: number) => `${h}h`}
            />
            <YAxis yAxisId="puffs" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="nicotina"
              orientation="right"
              tick={{ fontSize: 11 }}
              width={56}
              label={{
                value: 'mg',
                position: 'insideTopRight',
                offset: 4,
                fontSize: 11,
                fill: '#7b1fa2',
              }}
            />
            <Tooltip labelFormatter={(h) => `${h}:00`} />
            <Legend />
            <Bar
              yAxisId="puffs"
              dataKey="puffs"
              name="Puffs"
              fill="#00897b"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="nicotina"
              dataKey="nicotine_mg"
              name="Nicotina (mg)"
              stroke="#7b1fa2"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
