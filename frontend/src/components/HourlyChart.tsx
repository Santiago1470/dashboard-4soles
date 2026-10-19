import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HourlyRecord } from '../api/types'

interface HourlyChartProps {
  data: HourlyRecord[]
}

/**
 * Patrón horario agregado: en qué franjas del día concentra el paciente el consumo.
 * Útil para el psicólogo/ neumólogo para detectar hábitos (mañana, noche, etc.).
 */
export function HourlyChart({ data }: HourlyChartProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Patrón horario del consumo
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Puffs acumulados por hora del día (todas las jornadas).
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11 }}
              tickFormatter={(h: number) => `${h}h`}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={(h) => `${h}:00`} />
            <Bar dataKey="puffs" name="Puffs" fill="#00897b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
