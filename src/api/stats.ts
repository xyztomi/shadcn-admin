import { useQuery } from '@tanstack/react-query'
import { useDepartmentStore } from '@/stores/department-store'
import { api } from './client'

export interface OverviewStats {
  contacts: {
    total: number
    viufinder: number
    viufinder_xp: number
    untagged: number
  }
  agents: {
    total: number
    online: number
    available: number
    in_shift: number
  }
  total_contacts?: number
  active_conversations?: number
  messages_today?: number
  unassigned_contacts?: number
  online_agents?: number
  avg_response_time?: number
}

export interface AgentStats {
  id: number
  username: string
  full_name: string
  department: string
  role: string
  is_online: boolean
  is_available: boolean
  department_contacts: number
  resolved_today?: number
  avg_response_time?: number
  shift: {
    id: number
    name: string
    start_time: string
    end_time: string
  } | null
  is_in_shift: boolean
}

export function useOverviewStats() {
  const { selectedDepartment } = useDepartmentStore()

  return useQuery({
    queryKey: ['stats', 'overview', selectedDepartment],
    queryFn: async (): Promise<OverviewStats> => {
      const params = new URLSearchParams()
      if (selectedDepartment) {
        params.append('department', selectedDepartment)
      }
      const response = await api.get(`/stats/overview?${params.toString()}`)
      return response.data
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}

export function useAgentStats() {
  const { selectedDepartment } = useDepartmentStore()

  return useQuery({
    queryKey: ['stats', 'agents', selectedDepartment],
    queryFn: async (): Promise<AgentStats[]> => {
      const params = new URLSearchParams()
      if (selectedDepartment) {
        params.append('department', selectedDepartment)
      }
      const response = await api.get(`/stats/agents?${params.toString()}`)
      return response.data
    },
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}

// Personal stats for agent dashboard
export interface MyStats {
  agent: {
    id: number
    username: string
    full_name: string
    department: string
    role: string
    is_online: boolean
    is_available: boolean
    shift_id: number | null
  }
  shift: {
    id: number
    name: string
    start_time: string
    end_time: string
    is_active: boolean
  } | null
  is_in_shift: boolean
  current_active_shift: {
    id: number
    name: string
    start_time: string
    end_time: string
  } | null
  today: {
    conversations: number
    resolved: number
    messages_sent: number
  }
  week: {
    conversations: number
    resolved: number
    avg_response_time: number | null
  }
  current: {
    active_conversations: number
    department_queue: number
    department_contacts: number
  }
  all_time: {
    total_conversations: number
    total_resolved: number
    total_messages_sent: number
    avg_rating: number | null
  }
}

export function useMyStats() {
  return useQuery({
    queryKey: ['stats', 'me'],
    queryFn: async (): Promise<MyStats> => {
      const response = await api.get('/stats/me')
      return response.data
    },
    refetchInterval: 30 * 1000,
  })
}

// Get stats for a specific agent (admin only)
export function useAgentDashboard(agentId: number | string) {
  return useQuery({
    queryKey: ['stats', 'agent', agentId],
    queryFn: async (): Promise<MyStats> => {
      const response = await api.get(`/stats/agent/${agentId}`)
      return response.data
    },
    refetchInterval: 30 * 1000,
    enabled: !!agentId,
  })
}
