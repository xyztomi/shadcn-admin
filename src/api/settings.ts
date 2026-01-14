import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

export interface WebhookSettingsResponse {
  callback_url: string | null
  updated_at: string | null
}

export interface UpdateWebhookPayload {
  callback_url: string
}

export function useWebhookSettings() {
  return useQuery({
    queryKey: ['settings', 'webhook'],
    queryFn: async (): Promise<WebhookSettingsResponse> => {
      const response = await api.get('/settings/webhook')
      return response.data
    },
  })
}

export function useUpdateWebhookSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateWebhookPayload) => {
      const response = await api.put('/settings/webhook', payload)
      return response.data as WebhookSettingsResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'webhook'] })
    },
  })
}
