import { useMemo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import {
  Area,
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
import type { DailyRecord } from '../api/types'

interface DailyPuffsChartProps {
  data: DailyRecord[]
}

/**
 * Puffs por día vs. límite diario configurado.
 * - Barras con degradado: puffs totales del día
 * - Línea roja discontinua: daily_limit vigente ese día
 * - Área con degradado amarillo (eje derecho): nicotina estimada del día (puffs × 0,057 mg)
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
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Barras: puffs del día · Línea roja: límite terapéutico · Área amarilla: nicotina
          estimada (0,057 mg por puff).
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {/* Degradado de las barras de puffs */}
              <linearGradient id="gradPuffs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e88e5" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#0d47a1" stopOpacity={0.7} />
              </linearGradient>
              {/* Degradado del área de nicotina (amarillo nicotina) */}
              <linearGradient id="gradNicotina" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fdd835" stopOpacity={0.5} />
                <stop offset="70%" stopColor="#fdd835" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#fff59d" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeeee" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis
              yAxisId="puffs"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="nicotina"
              orientation="right"
              width={58}
              tick={{ fontSize: 11, fill: '#f9a825' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'nicotina (mg)',
                position: 'insideTopRight',
                offset: 6,
                fontSize: 11,
                fill: '#f9a825',
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(30,136,229,0.08)' }}
              labelFormatter={(label) => `Fecha: ${label}`}
              formatter={(value, name) => {
                if (name === 'Nicotina (mg)') return [`${Number(value).toFixed(3)} mg`, 'Nicotina']
                if (name === 'Límite diario (puffs)') return [`${value} puffs`, 'Límite diario']
                return [`${value} puffs`, 'Puffs']
              }}
            />
            <Legend iconType="circle" iconSize={9} wrapperStyle={{ paddingTop: 4 }} />
            <Area
              yAxisId="nicotina"
              type="monotone"
              dataKey="nicotina"
              name="Nicotina (mg)"
              stroke="#f9a825"
              strokeWidth={3}
              fill="url(#gradNicotina)"
              dot={{ r: 3, fill: '#fbc02d', strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
              animationDuration={900}
            />
            <Bar
              yAxisId="puffs"
              dataKey="puffs"
              name="Puffs"
              fill="url(#gradPuffs)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              animationDuration={900}
            />
            <Line
              yAxisId="puffs"
              dataKey="limite"
              name="Límite diario (puffs)"
              stroke="#c62828"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              type="stepAfter"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
