import { useMemo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyRecord } from '../api/types'

interface DailyPuffsChartProps {
  data: DailyRecord[]
}

/**
 * Puffs por día vs. límite diario configurado.
 * - Barras: puffs totales del día
 * - Línea: daily_limit vigente ese día
 */
export function DailyPuffsChart({ data }: DailyPuffsChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date.slice(5), // MM-DD para el eje
        puffs: d.puff_count,
        limite: d.daily_limit,
        fuera: d.over_count,
      })),
    [data],
  )

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Consumo diario vs. límite
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Cada barra es un día registrado; la línea marca el límite terapéutico configurado.
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="puffs" name="Puffs" fill="#1565c0" radius={[4, 4, 0, 0]} />
            <Line
              dataKey="limite"
              name="Límite diario"
              stroke="#ef6c00"
              strokeWidth={2}
              dot={false}
              type="stepAfter"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
