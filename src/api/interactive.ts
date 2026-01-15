import { useMutation } from '@tanstack/react-query'
import { api } from './client'

export type InteractiveMessageType = 'buttons' | 'section_list'

export interface ButtonItem {
  title: string
  callback_data: string
}

export interface SectionRowItem {
  title: string
  callback_data: string
  description?: string
}

export interface SectionItem {
  title: string
  rows: SectionRowItem[]
}

export interface SendInteractiveMessagePayload {
  recipient: string
  message_type: InteractiveMessageType
  text: string
  header?: string
  footer?: string
  // For buttons type (max 3)
  buttons?: ButtonItem[]
  // For section_list type
  button_title?: string
  sections?: SectionItem[]
}

export interface SendInteractiveMessageResponse {
  success: boolean
  message_id?: string
  error?: string
}

// Send interactive message
export function useSendInteractiveMessage() {
  return useMutation({
    mutationFn: async (
      payload: SendInteractiveMessagePayload
    ): Promise<SendInteractiveMessageResponse> => {
      const response = await api.post('/interactive/send', payload)
      return response.data
    },
  })
}
