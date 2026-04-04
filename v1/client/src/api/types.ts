export interface Saint {
  id: string
  first_name: string
  last_name: string
  email: string | null
  gender: boolean
  phone_number: string | null
  student: boolean
  occupation: string | null
  residence: string | null
  university: string | null
  institution_location: string | null
  first_time: boolean
  whatsApp_group_consent: boolean
  consent_to_share_info: boolean
  created_at: string
  updated_at: string
}

export interface SaintCreate {
  first_name: string
  last_name: string
  email: string | null
  gender: boolean
  phone_number: string | null
  student: boolean
  occupation: string | null
  residence: string | null
  university: string | null
  institution_location: string | null
  first_time: boolean
  whatsApp_group_consent: boolean
  consent_to_share_info: boolean
}

export interface SaintWithStats extends Saint {
  attendance_count: number
  last_seen: string | null
}

export interface AttendanceTrend {
  date: string
  count: number
}

export interface NewTodaySaint {
  id: string
  first_name: string
  last_name: string
  occupation: string | null
  university: string | null
  student: boolean
}

export interface AdminStats {
  total_registered: number
  today_checkins: number
  this_month: number
  avg_attendance: number
  attendance_trend: AttendanceTrend[]
  new_today: NewTodaySaint[]
}

export interface CheckInResponse {
  saint_id: string
  service_date: string
  already_checked_in: boolean
}

export interface Admin {
  id: string
  name: string
  email: string
  is_super_admin: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  admin_id: string
  admin_name: string
  admin_email: string
  is_super_admin: boolean
}

export interface AttendanceLogEntry {
  date: string
  count: number
  new_visitors: number
}

export interface ReportData {
  total_registered: number
  today_checkins: number
  this_month: number
  whatsapp_count: number
  avg_attendance: number
  male_count: number
  female_count: number
  student_count: number
  professional_count: number
  first_time_today: number
  attendance_log: AttendanceLogEntry[]
}
