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
 * - Línea naranja: daily_limit vigente ese día
 * - Línea morada (eje derecho): nicotina estimada del día (puffs × 0,057 mg)
 */
export function DailyPuffsChart({ data }: DailyPuffsChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date.slice(5), // MM-DD para el eje
        puffs: d.puff_count,
        nicotina: d.nicotine_mg,
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
          Cada barra es un día registrado; la línea naranja marca el límite terapéutico y la línea
          morada la nicotina estimada (0,057 mg por puff).
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
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
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="puffs"
              dataKey="puffs"
              name="Puffs"
              fill="#1565c0"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="puffs"
              dataKey="limite"
              name="Límite diario (puffs)"
              stroke="#ef6c00"
              strokeWidth={2}
              dot={false}
              type="stepAfter"
            />
            <Line
              yAxisId="nicotina"
              dataKey="nicotina"
              name="Nicotina (mg)"
              stroke="#7b1fa2"
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
