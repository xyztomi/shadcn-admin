import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// WhatsApp Message Template types based on Meta API
export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
  }
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
  }>
}

export interface MessageTemplate {
  id: string
  name: string
  language: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  components: TemplateComponent[]
  created_at: string
  updated_at: string
}

export interface CreateTemplatePayload {
  name: string
  language: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  components: TemplateComponent[]
}

export interface UpdateTemplatePayload {
  components: TemplateComponent[]
}

// Fetch all templates
export function useTemplates() {
  return useQuery<MessageTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/templates')
      return response.data
    },
  })
}

// Fetch single template
export function useTemplate(id: string) {
  return useQuery<MessageTemplate>({
    queryKey: ['templates', id],
    queryFn: async () => {
      const response = await api.get(`/templates/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Create template (admin only)
export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTemplatePayload) => {
      const response = await api.post('/templates', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// Update template (admin only)
export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateTemplatePayload
    }) => {
      const response = await api.patch(`/templates/${id}`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// Delete template (admin only)
export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/templates/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// Sync templates from WhatsApp Business API (admin only)
export function useSyncTemplates() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/templates/sync')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
