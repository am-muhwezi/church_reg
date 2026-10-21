import { del, get, post, put } from './client'

export type ServiceType = 'thursday' | 'sunday'

export interface Center {
  id: string
  name: string
  kind: 'residential' | 'institution'
  is_main: boolean
}

export interface MyCenter {
  center: Center | null
  is_super_admin: boolean
}

export interface ServiceReportInput {
  center_id?: string | null
  service_date: string
  service_type: ServiceType
  service_number: number
  venue: string
  male: number
  female: number
  children: number
  serving_team: number
  first_timers: number
  new_converts: number
}

export interface ServiceReport extends Omit<ServiceReportInput, 'center_id'> {
  id: string
  center_id: string
  center_name: string
  total_attendance: number
}

export interface WeeklyService {
  heading: string
  center: string
  service_date: string
  service_type: ServiceType
  service_number: number
  venue: string
  male: number
  female: number
  children: number
  total_attendance: number
  serving_team: number
  first_timers: number
  new_converts: number
}

export interface WeeklyReport {
  center: string
  week_start: string
  week_end: string
  services: WeeklyService[]
  totals: Record<'male' | 'female' | 'children' | 'total_attendance' | 'serving_team' | 'first_timers' | 'new_converts', number>
}

export interface TypeStats {
  average: number | null
  previous_average: number | null
  variance: number | null
  frequency: number
  expected: number
  percent: number
}

export interface CenterStats {
  center: string
  kind: string
  is_main: boolean
  first_timers: number
  serving_team: number
  new_converts: number
  male: number
  female: number
  children: number
  thursday: TypeStats
  sunday: TypeStats
}

export interface Peak {
  label: string
  value: number
  date: string | null
}

export interface PeriodReport {
  period: { kind: 'month' | 'quarter'; label: string; start: string; end: string; previous_label: string }
  kpis: { new_converts: number; first_timers: number; thursday_attendance: number | null; sunday_attendance: number | null }
  main_center: string | null
  trend: {
    labels: string[]
    series: Record<ServiceType, (number | null)[]>
    peaks: Record<ServiceType, Peak | null>
  }
  centers: CenterStats[]
  history: { month: string; label: string; attendance: number }[]
  service_count: number
  has_data: boolean
}

export interface AdminCenterLink {
  admin_id: string
  center_id: string
}

export const listCenters = () => get<Center[]>('/service-reports/centers')
export const getMyCenter = () => get<MyCenter>('/service-reports/me')
export const listAssignments = () => get<AdminCenterLink[]>('/service-reports/assignments')
export const assignCenter = (adminId: string, centerId: string | null) =>
  put(`/service-reports/assignments/${adminId}`, { center_id: centerId })

export const createServiceReport = (data: ServiceReportInput) => post<ServiceReport>('/service-reports', data)
export const listServiceReports = (params: Record<string, string> = {}) =>
  get<ServiceReport[]>('/service-reports', params)
export const deleteServiceReport = (id: string) => del(`/service-reports/${id}`)

export const getWeeklyReport = (weekStart: string, centerId?: string) =>
  get<WeeklyReport>('/service-reports/weekly', { week_start: weekStart, ...(centerId ? { center_id: centerId } : {}) })
export const getMonthlyReport = (month: string) => get<PeriodReport>('/service-reports/monthly', { month })
export const getQuarterlyReport = (quarter: string) => get<PeriodReport>('/service-reports/quarterly', { quarter })
