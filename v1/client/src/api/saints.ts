import { get, post, ApiError } from './client'
import type { Saint, SaintCreate, SaintWithStats, AdminStats, CheckInResponse, ReportData } from './types'

export async function searchSaint(firstName: string, lastName: string): Promise<Saint | null> {
  try {
    return await get<Saint>('/saints/search', {
      first_name: firstName,
      last_name: lastName,
    })
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export async function registerSaint(data: SaintCreate): Promise<Saint> {
  return post<Saint>('/saints/register', data)
}

export async function checkInSaint(saintId: string): Promise<CheckInResponse> {
  return post<CheckInResponse>('/saints/checkin', { saint_id: saintId })
}

export async function listSaints(): Promise<Saint[]> {
  return get<Saint[]>('/saints')
}

export async function getSaint(id: string): Promise<SaintWithStats> {
  return get<SaintWithStats>(`/saints/${id}`)
}

export async function getAdminStats(): Promise<AdminStats> {
  return get<AdminStats>('/admin/stats')
}

export async function getReportData(period: 'weekly' | 'monthly' | 'all'): Promise<ReportData> {
  return get<ReportData>('/admin/report', { period })
}
