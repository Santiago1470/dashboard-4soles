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

interface PuffTableProps {
  data: PuffRecord[]
  day: string
}

/** Timeline detallada de puffs de un día concreto (marca si excedió el límite). */
export function PuffTable({ data, day }: PuffTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Timeline del día {day}
          </Typography>
          <Alert severity="info">No hay puffs registrados para este día.</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Timeline del día {day} ({data.length} puffs)
        </Typography>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Hora (UTC)</TableCell>
                <TableCell align="right"># Puff</TableCell>
                <TableCell align="right">Límite</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Origen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((p, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    {p.timestamp
                      ? new Date(p.timestamp).toLocaleTimeString('es-ES', { hour12: false })
                      : '—'}
                  </TableCell>
                  <TableCell align="right">{p.puff_number ?? '—'}</TableCell>
                  <TableCell align="right">{p.daily_limit ?? '—'}</TableCell>
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
