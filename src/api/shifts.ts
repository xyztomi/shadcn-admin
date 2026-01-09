import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type Shift, type ShiftWithAgentCount } from '@/types'
import { api } from './client'

export type { Shift, ShiftWithAgentCount }

export interface ShiftFilters {
  is_active?: boolean
}

export interface CreateShiftPayload {
  name: string
  description?: string
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  is_active?: boolean
}

export interface UpdateShiftPayload {
  name?: string
  description?: string
  start_time?: string
  end_time?: string
  is_active?: boolean
}

// List shifts with filters
export function useShifts(filters?: ShiftFilters) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })
  }

  return useQuery({
    queryKey: ['shifts', filters],
    queryFn: async (): Promise<ShiftWithAgentCount[]> => {
      const response = await api.get(`/shifts?${params.toString()}`)
      return response.data
    },
  })
}

// Get single shift
export function useShift(shiftId: number) {
  return useQuery({
    queryKey: ['shifts', shiftId],
    queryFn: async (): Promise<ShiftWithAgentCount> => {
      const response = await api.get(`/shifts/${shiftId}`)
      return response.data
    },
    enabled: !!shiftId,
  })
}

// Create shift (admin only)
export function useCreateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateShiftPayload) => {
      const response = await api.post('/shifts', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
  })
}

// Update shift (admin only)
export function useUpdateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      shiftId,
      data,
    }: {
      shiftId: number
      data: UpdateShiftPayload
    }) => {
      const response = await api.patch(`/shifts/${shiftId}`, data)
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['shifts', variables.shiftId] })
      // Also invalidate agents since shift name might be displayed
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

// Delete shift (admin only)
export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shiftId: number) => {
      await api.delete(`/shifts/${shiftId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      // Also invalidate agents since their shift assignment might change
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

// Get current active shift
export function useCurrentActiveShift() {
  return useQuery({
    queryKey: ['shifts', 'current'],
    queryFn: async (): Promise<Shift | null> => {
      const response = await api.get('/shifts/current/active')
      return response.data
    },
  })
}
