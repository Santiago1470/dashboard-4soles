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
}

export interface HourlyRecord {
  hour: number
  puffs: number
}

export interface PuffRecord {
  timestamp: string | null
  date: string
  puff_number: number | null
  daily_limit: number | null
  within_limit: boolean | null
  source: string
}
