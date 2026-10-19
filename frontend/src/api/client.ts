import type {
  DailyRecord,
  DeviceInfo,
  HealthInfo,
  HourlyRecord,
  PuffRecord,
  UserInfo,
  UserSummary,
} from './types'

// En desarrollo, Vite hace proxy de /api -> http://127.0.0.1:8000 (ver vite.config.ts)
const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => get<HealthInfo>('/health'),
  device: () => get<DeviceInfo>('/device'),
  users: () => get<UserInfo[]>('/users'),
  summary: (userId: string) => get<UserSummary>(`/users/${userId}/summary`),
  daily: (userId: string) => get<DailyRecord[]>(`/users/${userId}/daily`),
  hourly: (userId: string) => get<HourlyRecord[]>(`/users/${userId}/hourly`),
  puffs: (userId: string, day?: string) =>
    get<PuffRecord[]>(`/users/${userId}/puffs${day ? `?day=${day}` : ''}`),
}
