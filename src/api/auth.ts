import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Agent, AgentRole, AgentDepartment } from '@/types'
import { api } from './client'

// Re-export Agent type for convenience
export type { Agent }

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterPayload {
  username: string
  password: string
  full_name: string
  email?: string
  role: AgentRole
  department: AgentDepartment
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

// Register new agent (admin only)
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: RegisterPayload): Promise<Agent> => {
      const response = await api.post('/auth/register', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
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
