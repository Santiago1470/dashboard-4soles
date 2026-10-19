import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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
import type { HourlyRecord } from '../api/types'

interface HourlyChartProps {
  data: HourlyRecord[]
}

/**
 * Patrón horario agregado: en qué franjas del día concentra el paciente el consumo.
 * Útil para el psicólogo/ neumólogo para detectar hábitos (mañana, noche, etc.).
 * La línea morada (eje derecho) muestra la nicotina estimada por hora (0,057 mg/puff).
 */
export function HourlyChart({ data }: HourlyChartProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Patrón horario del consumo
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Puffs acumulados por hora del día (todas las jornadas) y su equivalencia en nicotina.
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
