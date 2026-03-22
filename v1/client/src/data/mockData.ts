export interface Saint {
  id: string
  first_name: string
  last_name: string
  email: string
  gender: boolean // true = male
  student: boolean
  occupation: string
  residence: string
  first_time: boolean
  whatsApp_group_consent: boolean
  consent_to_share_info: boolean
  created_at: string
  updated_at: string
  attendance_count: number
  last_seen: string
}

export interface Admin {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin'
  created_at: string
}

export interface AttendanceRecord {
  date: string
  count: number
  new_members: number
}

export const MOCK_SAINTS: Saint[] = [
  {
    id: '1',
    first_name: 'Samuel',
    last_name: 'Mwangi',
    email: 'samuel.mwangi@example.com',
    gender: true,
    student: false,
    occupation: 'Software Engineer',
    residence: 'Kilimani, Nairobi',
    first_time: false,
    whatsApp_group_consent: true,
    consent_to_share_info: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2025-03-22T08:00:00Z',
    attendance_count: 47,
    last_seen: '2026-03-15T09:30:00Z',
  },
  {
    id: '2',
    first_name: 'Grace',
    last_name: 'Achieng',
    email: 'grace.achieng@example.com',
    gender: false,
    student: true,
    occupation: 'Student — University of Nairobi',
    residence: 'Westlands, Nairobi',
    first_time: false,
    whatsApp_group_consent: true,
    consent_to_share_info: true,
    created_at: '2024-03-02T14:00:00Z',
    updated_at: '2025-03-22T08:00:00Z',
    attendance_count: 31,
    last_seen: '2026-03-22T09:00:00Z',
  },
  {
    id: '3',
    first_name: 'Daniel',
    last_name: 'Odhiambo',
    email: 'daniel.odhiambo@example.com',
    gender: true,
    student: false,
    occupation: 'Doctor',
    residence: 'Karen, Nairobi',
    first_time: false,
    whatsApp_group_consent: false,
    consent_to_share_info: true,
    created_at: '2023-11-10T09:00:00Z',
    updated_at: '2025-02-01T08:00:00Z',
    attendance_count: 68,
    last_seen: '2026-03-08T09:30:00Z',
  },
  {
    id: '4',
    first_name: 'Faith',
    last_name: 'Kariuki',
    email: 'faith.kariuki@example.com',
    gender: false,
    student: false,
    occupation: 'Nurse',
    residence: 'Lavington, Nairobi',
    first_time: false,
    whatsApp_group_consent: true,
    consent_to_share_info: true,
    created_at: '2024-06-20T11:00:00Z',
    updated_at: '2025-03-22T08:00:00Z',
    attendance_count: 22,
    last_seen: '2026-03-22T09:00:00Z',
  },
  {
    id: '5',
    first_name: 'Joshua',
    last_name: 'Njoroge',
    email: 'joshua.njoroge@example.com',
    gender: true,
    student: true,
    occupation: 'Student — Strathmore University',
    residence: 'South B, Nairobi',
    first_time: false,
    whatsApp_group_consent: true,
    consent_to_share_info: false,
    created_at: '2025-01-08T10:30:00Z',
    updated_at: '2025-03-22T08:00:00Z',
    attendance_count: 8,
    last_seen: '2026-03-22T09:00:00Z',
  },
  {
    id: '6',
    first_name: 'Esther',
    last_name: 'Wanjiru',
    email: 'esther.wanjiru@example.com',
    gender: false,
    student: false,
    occupation: 'Accountant',
    residence: 'Parklands, Nairobi',
    first_time: false,
    whatsApp_group_consent: true,
    consent_to_share_info: true,
    created_at: '2023-08-14T09:00:00Z',
    updated_at: '2025-03-01T08:00:00Z',
    attendance_count: 91,
    last_seen: '2026-03-01T09:30:00Z',
  },
  {
    id: '7',
    first_name: 'Michael',
    last_name: 'Otieno',
    email: 'michael.otieno@example.com',
    gender: true,
    student: false,
    occupation: 'Architect',
    residence: 'Runda, Nairobi',
    first_time: true,
    whatsApp_group_consent: true,
    consent_to_share_info: true,
    created_at: '2026-03-22T09:15:00Z',
    updated_at: '2026-03-22T09:15:00Z',
    attendance_count: 1,
    last_seen: '2026-03-22T09:15:00Z',
  },
  {
    id: '8',
    first_name: 'Ruth',
    last_name: 'Kamau',
    email: 'ruth.kamau@example.com',
    gender: false,
    student: false,
    occupation: 'Lawyer',
    residence: 'Kileleshwa, Nairobi',
    first_time: false,
    whatsApp_group_consent: false,
    consent_to_share_info: true,
    created_at: '2024-02-11T10:00:00Z',
    updated_at: '2025-03-22T08:00:00Z',
    attendance_count: 39,
    last_seen: '2026-03-15T09:30:00Z',
  },
]

// Simulated "found" saint for the check-in flow
export const MOCK_FOUND_SAINT: Saint = MOCK_SAINTS[0]

export const MOCK_ADMINS: Admin[] = [
  {
    id: 'a1',
    name: 'Pastor John Kamau',
    email: 'john.kamau@manifestkenya.org',
    role: 'super_admin',
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'a2',
    name: 'Deaconess Mary Auma',
    email: 'mary.auma@manifestkenya.org',
    role: 'admin',
    created_at: '2023-06-15T00:00:00Z',
  },
  {
    id: 'a3',
    name: 'Elder James Njeru',
    email: 'james.njeru@manifestkenya.org',
    role: 'admin',
    created_at: '2024-01-20T00:00:00Z',
  },
]

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { date: '2026-03-22', count: 412, new_members: 14 },
  { date: '2026-03-15', count: 387, new_members: 9 },
  { date: '2026-03-08', count: 401, new_members: 11 },
  { date: '2026-03-01', count: 354, new_members: 7 },
  { date: '2026-02-22', count: 428, new_members: 16 },
  { date: '2026-02-15', count: 395, new_members: 8 },
  { date: '2026-02-08', count: 371, new_members: 12 },
  { date: '2026-02-01', count: 410, new_members: 10 },
]

export const MOCK_STATS = {
  total_registered: MOCK_SAINTS.length,
  today_checkins: 412,
  new_today: 14,
  this_month: 1847,
  avg_attendance: 394,
  whatsapp_consent: MOCK_SAINTS.filter((s) => s.whatsApp_group_consent).length,
}

// Mock search: returns saint if first+last name match (case-insensitive)
export function searchSaint(first: string, last: string): Saint | null {
  const found = MOCK_SAINTS.find(
    (s) =>
      s.first_name.toLowerCase() === first.trim().toLowerCase() &&
      s.last_name.toLowerCase() === last.trim().toLowerCase(),
  )
  return found ?? null
}
