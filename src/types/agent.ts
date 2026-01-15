export enum AgentRole {
  SUPERUSER = 'superuser',
  ADMIN = 'admin',
  AGENT = 'agent',
}

export enum AgentDepartment {
  VIUFINDER = 'viufinder',
  VIUFINDER_XP = 'viufinder_xp',
}

export enum AgentBooth {
  KING_PADEL_KEMANG = 'king_padel_kemang',
  KYZN_KUNINGAN = 'kyzn_kuningan',
  MR_PADEL_CIPETE = 'mr_padel_cipete',
  OTHER = 'other',
  ALL = 'all',
}

export interface Agent {
  id: number
  username: string
  full_name: string
  role: AgentRole
  department: AgentDepartment
  booth: AgentBooth
  is_online: boolean
  is_available: boolean
  is_active: boolean
  shift_id: number | null
  shift_name: string | null
  created_at: string
  updated_at: string
}
