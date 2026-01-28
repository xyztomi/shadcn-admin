import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Contact, ServiceTag, BoothTag } from '@/types'
import { useDepartmentStore } from '@/stores/department-store'
import { api } from './client'

// Re-export for convenience
export type { Contact }
export { ServiceTag, BoothTag }

export interface ContactFilters {
  service_tag?: ServiceTag
  booth_tag?: BoothTag
  tag_id?: number
  is_active?: boolean
  is_resolved?: boolean
  limit?: number
  offset?: number
}

export interface CreateContactData {
  name: string
  phone_number: string
  booth_tag?: BoothTag | null
  service_tag?: ServiceTag | null
  notes?: string | null
}

// Create a new contact
export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      const response = await api.post('/contacts', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
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

// Resolve contact conversation
export function useResolveContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waId: string) => {
      const response = await api.post(`/contacts/${waId}/resolve`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

// Unresolve (reopen) contact conversation
export function useUnresolveContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waId: string) => {
      const response = await api.post(`/contacts/${waId}/unresolve`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
