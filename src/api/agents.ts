import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type Agent,
  type Contact,
  AgentRole,
  AgentDepartment,
  AgentBooth,
} from '@/types'
import { useDepartmentStore } from '@/stores/department-store'
import { api } from './client'

// Re-export for convenience
export type { Agent }
export { AgentRole, AgentDepartment, AgentBooth }

export interface AgentFilters {
  department?: AgentDepartment
  booth?: AgentBooth
  is_available?: boolean
  is_online?: boolean
  shift_id?: number
}

export interface CreateAgentPayload {
  username: string
  password: string
  full_name: string
  role: AgentRole
  department: AgentDepartment
  booth?: AgentBooth
  shift_id?: number | null
}

export interface UpdateAgentPayload {
  full_name?: string
  password?: string
  role?: AgentRole
  department?: AgentDepartment
  booth?: AgentBooth
  shift_id?: number | null
}

// List agents with filters (auto-filtered by selected department)
export function useAgents(filters?: AgentFilters) {
  const { selectedDepartment } = useDepartmentStore()
  const params = new URLSearchParams()

  // Add department filter from store
  if (selectedDepartment && selectedDepartment !== 'all') {
    params.append('department', selectedDepartment)
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })
  }

  return useQuery({
    queryKey: ['agents', selectedDepartment, filters],
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
      queryClient.invalidateQueries({ queryKey: ['stats', 'me'] })
    },
  })
}

// Update current agent's availability (convenience hook)
export function useUpdateAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { is_available: boolean }) => {
      const response = await api.patch('/agents/me/status', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['stats', 'me'] })
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
