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
  is_online: boolean
  is_available: boolean
  department_contacts: number
  resolved_today?: number
  avg_response_time?: number
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
