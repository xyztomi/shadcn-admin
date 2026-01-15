export enum AgentRole {
  SUPERUSER = 'superuser',
  ADMIN = 'admin',
  AGENT = 'agent',
}

export enum AgentDepartment {
  VIUFINDER = 'viufinder',
  VIUFINDER_XP = 'viufinder_xp',
}

export enum AgentCity {
  JAKARTA = 'jakarta',
  BANDUNG = 'bandung',
  SURABAYA = 'surabaya',
  MEDAN = 'medan',
  SEMARANG = 'semarang',
  MAKASSAR = 'makassar',
  PALEMBANG = 'palembang',
  TANGERANG = 'tangerang',
  DEPOK = 'depok',
  BEKASI = 'bekasi',
  ALL = 'all',
}

export interface Agent {
  id: number
  username: string
  full_name: string
  role: AgentRole
  department: AgentDepartment
  city: AgentCity
  is_online: boolean
  is_available: boolean
  is_active: boolean
  shift_id: number | null
  shift_name: string | null
  created_at: string
  updated_at: string
}
