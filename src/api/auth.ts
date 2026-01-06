import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// Types matching backend
export interface Agent {
  id: number
  username: string
  email: string
  full_name: string
  role: 'superuser' | 'admin' | 'agent'
  department: 'viufinder' | 'viufinder_xp'
  is_online: boolean
  is_available: boolean
  is_active: boolean
  active_chats: number
  max_chats: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

// Login mutation
export function useLogin() {
  return useMutation({
    mutationFn: async (
      credentials: LoginCredentials
    ): Promise<LoginResponse> => {
      const response = await api.post('/auth/login', credentials)
      return response.data
    },
  })
}

// Get current agent
export function useCurrentAgent() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<Agent> => {
      const response = await api.get('/auth/me')
      return response.data
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Pick<Agent, 'full_name' | 'email'>>) => {
      const response = await api.patch('/auth/me', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      current_password: string
      new_password: string
    }) => {
      const response = await api.post('/auth/change-password', data)
      return response.data
    },
  })
}
