import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ----- Welcome Message Types -----

export interface WelcomeButton {
  title: string
  callback_data: string
}

export interface WelcomeMessageSettings {
  greeting_template: string
  footer: string
  buttons: WelcomeButton[]
  updated_at?: string | null
}

// ----- Booth Selection Types -----

export interface BoothRow {
  key: string
  title: string
  description: string
}

export interface BoothSection {
  title: string
  booths: string[]
}

export interface BoothSelectionSettings {
  header: string
  message_template: string
  footer: string
  button_title: string
  booths: BoothRow[]
  sections: BoothSection[]
  updated_at?: string | null
}

// ----- Welcome Message API -----

export function useWelcomeSettings() {
  return useQuery({
    queryKey: ['bot-handlers', 'welcome'],
    queryFn: async (): Promise<WelcomeMessageSettings> => {
      const response = await api.get('/bot-handlers/welcome')
      return response.data
    },
  })
}

export function useUpdateWelcomeSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      data: WelcomeMessageSettings
    ): Promise<WelcomeMessageSettings> => {
      const response = await api.put('/bot-handlers/welcome', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-handlers', 'welcome'] })
    },
  })
}

// ----- Booth Selection API -----

export function useBoothSettings() {
  return useQuery({
    queryKey: ['bot-handlers', 'booths'],
    queryFn: async (): Promise<BoothSelectionSettings> => {
      const response = await api.get('/bot-handlers/booths')
      return response.data
    },
  })
}

export function useUpdateBoothSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      data: BoothSelectionSettings
    ): Promise<BoothSelectionSettings> => {
      const response = await api.put('/bot-handlers/booths', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-handlers', 'booths'] })
    },
  })
}
