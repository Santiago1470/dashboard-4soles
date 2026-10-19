import { useMemo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyRecord } from '../api/types'

interface ComplianceChartProps {
  data: DailyRecord[]
}

/**
 * % de puffs dentro del límite por día (calidad de adherencia al plan).
 * La línea de referencia al 100% ayuda a ver rápidamente los días críticos.
 */
export function ComplianceChart({ data }: ComplianceChartProps) {
  const chartData = useMemo(
    () => data.map((d) => ({ date: d.date.slice(5), pct: d.pct_within })),
    [data],
  )

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Adherencia al límite (% dentro del límite)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Porcentaje de puffs del día que respetaron el límite diario.
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Dentro del límite']} />
            <ReferenceLine y={100} stroke="#2e7d32" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="pct"
              name="% dentro del límite"
              stroke="#2e7d32"
              fill="#2e7d32"
              fillOpacity={0.25}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
