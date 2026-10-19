import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  color?: string
}

/** Tarjeta de indicador clínico compacto para el resumen del paciente. */
export function KpiCard({ title, value, subtitle, icon, color }: KpiCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: color ?? 'primary.main',
              color: 'white',
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
