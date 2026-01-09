export interface Shift {
  id: number
  name: string
  description: string | null
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShiftWithAgentCount extends Shift {
  agent_count: number
}
