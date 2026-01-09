import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Agent, type Contact, AgentRole, AgentDepartment } from '@/types'
import { api } from './client'

// Re-export for convenience
export type { Agent }
export { AgentRole, AgentDepartment }

export interface AgentFilters {
  department?: AgentDepartment
  is_available?: boolean
  is_online?: boolean
  shift_id?: number
}

export interface CreateAgentPayload {
  username: string
  password: string
  full_name: string
  email?: string
  role: AgentRole
  department: AgentDepartment
  max_chats?: number
  shift_id?: number | null
}

export interface UpdateAgentPayload {
  full_name?: string
  email?: string
  password?: string
  role?: AgentRole
  department?: AgentDepartment
  max_chats?: number
  shift_id?: number | null
}

// List agents with filters
export function useAgents(filters?: AgentFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })
  }

  return useQuery({
    queryKey: ['agents', filters],
    queryFn: async (): Promise<Agent[]> => {
      const response = await api.get(`/agents?${params.toString()}`)
      return response.data
    },
  })
}

// Get single agent
export function useAgent(agentId: number) {
  return useQuery({
    queryKey: ['agents', agentId],
    queryFn: async (): Promise<Agent> => {
      const response = await api.get(`/agents/${agentId}`)
      return response.data
    },
    enabled: !!agentId,
  })
}

// Create agent (admin only)
export function useCreateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAgentPayload) => {
      const response = await api.post('/agents', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

// Update agent
export function useUpdateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      agentId,
      data,
    }: {
      agentId: number
      data: UpdateAgentPayload
    }) => {
      const response = await api.patch(`/agents/${agentId}`, data)
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agents', variables.agentId] })
    },
  })
}

// Update agent status (online/available)
export function useUpdateAgentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      agentId,
      data,
    }: {
      agentId: number
      data: { is_online?: boolean; is_available?: boolean }
    }) => {
      const response = await api.patch(`/agents/${agentId}/status`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// Delete agent (admin only)
export function useDeleteAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (agentId: number) => {
      await api.delete(`/agents/${agentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

// Get agent's assigned contacts
export function useAgentContacts(agentId: number) {
  return useQuery({
    queryKey: ['agents', agentId, 'contacts'],
    queryFn: async (): Promise<Contact[]> => {
      const response = await api.get(`/agents/${agentId}/contacts`)
      return response.data
    },
    enabled: !!agentId,
  })
}
