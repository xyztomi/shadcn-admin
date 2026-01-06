import { useQuery } from '@tanstack/react-query'
import { api } from './client'

export interface OverviewStats {
  total_contacts: number
  active_conversations: number
  messages_today: number
  avg_response_time: number
  unassigned_contacts: number
  online_agents: number
}

export interface AgentStats {
  id: number
  username: string
  full_name: string
  department: string
  active_chats: number
  resolved_today: number
  avg_response_time: number
  is_online: boolean
  is_available: boolean
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: async (): Promise<OverviewStats> => {
      const response = await api.get('/stats/overview')
      return response.data
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}

export function useAgentStats() {
  return useQuery({
    queryKey: ['stats', 'agents'],
    queryFn: async (): Promise<AgentStats[]> => {
      const response = await api.get('/stats/agents')
      return response.data
    },
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}
