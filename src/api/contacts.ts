import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Contact, ServiceTag } from '@/types'
import { api } from './client'

// Re-export for convenience
export type { Contact }
export { ServiceTag }

export interface ContactFilters {
  service_tag?: ServiceTag
  assigned_agent_id?: number
  is_active?: boolean
  unassigned?: boolean
  limit?: number
  offset?: number
}

// List contacts with filters
export function useContacts(filters?: ContactFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })
  }

  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: async (): Promise<Contact[]> => {
      const response = await api.get(`/contacts?${params.toString()}`)
      return response.data
    },
    // Poll every 10 seconds as fallback when WebSocket isn't working
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  })
}

// Get single contact by wa_id
export function useContact(waId: string) {
  return useQuery({
    queryKey: ['contacts', waId],
    queryFn: async (): Promise<Contact> => {
      const response = await api.get(`/contacts/${waId}`)
      return response.data
    },
    enabled: !!waId,
  })
}

// Update contact
export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      waId,
      data,
    }: {
      waId: string
      data: Partial<Pick<Contact, 'name' | 'notes' | 'is_active'>>
    }) => {
      const response = await api.patch(`/contacts/${waId}`, data)
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.waId] })
    },
  })
}

// Assign contact to agent
export function useAssignContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      waId,
      agentId,
    }: {
      waId: string
      agentId: number
    }) => {
      const response = await api.post(`/contacts/${waId}/assign`, {
        agent_id: agentId,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

// Unassign contact
export function useUnassignContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waId: string) => {
      const response = await api.post(`/contacts/${waId}/unassign`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

// Tag contact with service
export function useTagContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      waId,
      serviceTag,
    }: {
      waId: string
      serviceTag: ServiceTag
    }) => {
      const response = await api.post(`/contacts/${waId}/tag`, {
        service_tag: serviceTag,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
