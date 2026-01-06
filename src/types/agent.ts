export enum AgentRole {
  SUPERUSER = 'superuser',
  ADMIN = 'admin',
  AGENT = 'agent',
}

export enum AgentDepartment {
  VIUFINDER = 'viufinder',
  VIUFINDER_XP = 'viufinder_xp',
}

export interface Agent {
  id: number
  username: string
  email: string | null
  full_name: string
  role: AgentRole
  department: AgentDepartment
  is_online: boolean
  is_available: boolean
  is_active: boolean
  active_chats: number
  max_chats: number
  created_at: string
  updated_at: string
}
