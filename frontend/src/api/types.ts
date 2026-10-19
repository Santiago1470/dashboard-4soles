// Tipos que reflejan las respuestas de la API FastAPI (backend/app/main.py)

export interface HealthInfo {
  status: string
  files: string[]
  skipped: string[]
  rows: number
  users: number
  data_dir: string
  server_time: string
}

export interface UserInfo {
  user_id: string
  events: number
  days: number
  first_date: string
  last_date: string
  sources: string[]
}

export interface UserSummary {
  user_id: string
  total_puffs: number
  days: number
  avg_puffs_per_day: number
  days_within_limit: number
  days_over_limit: number
  pct_days_within_limit: number
  last_date: string
  last_day_puffs: number
  last_day_limit: number | null
  last_day_within: boolean
  trend_last7_pct: number | null
  /** Nicotina total estimada: puffs * 0,057 mg */
  total_nicotine_mg: number | null
  /** Nicotina media diaria estimada (mg) */
  avg_nicotine_mg_per_day: number | null
  /** Nicotina estimada del último día con registros (mg) */
  last_day_nicotine_mg: number | null
  date_range: { start: string; end: string }
}

export interface DailyRecord {
  date: string
  puff_count: number
  daily_limit: number | null
  within_count: number
  over_count: number
  pct_within: number
  within_day: boolean
  /** Nicotina consumida ese día (mg): puff_count * 0,057 */
  nicotine_mg: number | null
  /** Equivalente en nicotina del límite diario (mg) */
  nicotine_limit_mg: number | null
}

export interface HourlyRecord {
  hour: number
  puffs: number
  /** Nicotina consumida en esa hora (mg): puffs * 0,057 */
  nicotine_mg: number | null
}

export interface PuffRecord {
  timestamp: string | null
  date: string
  puff_number: number | null
  daily_limit: number | null
  within_limit: boolean | null
  source: string
  /** Nicotina consumida por este puff (mg): 0,057 */
  nicotine_mg: number | null
  /** Nicotina acumulada del día hasta este puff (mg) */
  nicotine_mg_cumulative: number | null
}

/** Especificaciones del dispositivo de referencia (Muss Mármol 700). */
export interface DeviceInfo {
  model: string
  liquid_ml: number
  nicotine_concentration_mg_ml: number
  total_nicotine_mg: number
  max_puffs: number
  nicotine_mg_per_puff: number
}
