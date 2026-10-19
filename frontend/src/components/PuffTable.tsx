import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { PuffRecord } from '../api/types'
import { DAY_ALL } from '../constants'

interface PuffTableProps {
  data: PuffRecord[]
  day: string
}

/** Formatea un valor en mg de nicotina con notación española (coma decimal). */
const fmtMg = (mg: number | null | undefined) =>
  mg === null || mg === undefined
    ? '—'
    : mg.toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

/** Timeline detallada de puffs de un día concreto (marca si excedió el límite). */
export function PuffTable({ data, day }: PuffTableProps) {
  const allDays = day === DAY_ALL

  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {allDays ? 'Timeline de todos los días' : `Timeline del día ${day}`}
          </Typography>
          <Alert severity="info">No hay puffs registrados para este día.</Alert>
        </CardContent>
      </Card>
    )
  }

  const dayMg = data.reduce((acc, p) => acc + (p.nicotine_mg ?? 0), 0)

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {allDays
            ? `Timeline de todos los días (${data.length} puffs · ${fmtMg(dayMg)} mg de nicotina)`
            : `Timeline del día ${day} (${data.length} puffs · ${fmtMg(dayMg)} mg de nicotina)`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Equivalencia: 0,057 mg de nicotina por cada puff (Muss Mármol 700 · 40 mg / 700 puffs)
          {allDays ? '; el acumulado se reinicia cada día.' : '.'}
        </Typography>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {allDays && <TableCell>Fecha</TableCell>}
                <TableCell>Hora (UTC)</TableCell>
                <TableCell align="right"># Puff</TableCell>
                <TableCell align="right">Límite</TableCell>
                <TableCell align="right">Nicotina (mg)</TableCell>
                <TableCell align="right">Nicotina acum. (mg)</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Origen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((p, i) => (
                <TableRow key={i} hover>
                  {allDays && <TableCell>{p.date}</TableCell>}
                  <TableCell>
                    {p.timestamp
                      ? new Date(p.timestamp).toLocaleTimeString('es-ES', { hour12: false })
                      : '—'}
                  </TableCell>
                  <TableCell align="right">{p.puff_number ?? '—'}</TableCell>
                  <TableCell align="right">{p.daily_limit ?? '—'}</TableCell>
                  <TableCell align="right">{fmtMg(p.nicotine_mg)}</TableCell>
                  <TableCell align="right">{fmtMg(p.nicotine_mg_cumulative)}</TableCell>
                  <TableCell align="center">
                    {p.within_limit === null ? (
                      <Chip size="small" label="N/D" />
                    ) : p.within_limit ? (
                      <Chip size="small" color="success" label="Dentro" />
                    ) : (
                      <Chip size="small" color="error" label="Excedido" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box component="span" sx={{ textTransform: 'capitalize' }}>
                      {p.source === 'watch' ? 'reloj' : p.source}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
