import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Contact, ServiceTag } from '@/types'
import { useDepartmentStore } from '@/stores/department-store'
import { api } from './client'

// Re-export for convenience
export type { Contact }
export { ServiceTag }

export interface ContactFilters {
  service_tag?: ServiceTag
  is_active?: boolean
  limit?: number
  offset?: number
}

// List contacts with filters (auto-filtered by selected department)
export function useContacts(filters?: ContactFilters) {
  const { selectedDepartment } = useDepartmentStore()

  const params = new URLSearchParams()

  // Add department filter
  if (selectedDepartment) {
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
    queryKey: ['contacts', selectedDepartment, filters],
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
      data: Partial<
        Pick<
          Contact,
          'name' | 'notes' | 'is_active' | 'service_tag' | 'booth_tag'
        >
      >
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

// Remove service tag from contact
export function useRemoveServiceTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waId: string) => {
      const response = await api.delete(`/contacts/${waId}/tag`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

// Delete contact (admin only)
export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waId: string) => {
      await api.delete(`/contacts/${waId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
