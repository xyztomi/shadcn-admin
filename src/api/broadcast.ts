import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Broadcast,
  BroadcastPreview,
  BroadcastRecipient,
  BroadcastStatus,
  BroadcastTargetType,
} from '@/types'
import { api } from './client'

// ==================== Query Keys ====================
export const broadcastKeys = {
  all: ['broadcasts'] as const,
  lists: () => [...broadcastKeys.all, 'list'] as const,
  list: (params?: {
    status?: BroadcastStatus
    skip?: number
    limit?: number
  }) => [...broadcastKeys.lists(), params] as const,
  detail: (id: number) => [...broadcastKeys.all, 'detail', id] as const,
  preview: (id: number) => [...broadcastKeys.all, 'preview', id] as const,
  recipients: (id: number, params?: { status?: string }) =>
    [...broadcastKeys.all, 'recipients', id, params] as const,
}

// ==================== Types ====================
interface CreateBroadcastPayload {
  name: string
  message: string
  target_type: BroadcastTargetType
  tag_ids?: number[]
  contact_ids?: number[]
}

interface UpdateBroadcastPayload {
  name?: string
  message?: string
  target_type?: BroadcastTargetType
  tag_ids?: number[]
  contact_ids?: number[]
}

// ==================== Queries ====================

/**
 * Fetch all broadcasts
 */
export function useBroadcasts(params?: {
  status?: BroadcastStatus
  skip?: number
  limit?: number
}) {
  return useQuery({
    queryKey: broadcastKeys.list(params),
    queryFn: async () => {
      const response = await api.get<Broadcast[]>('/broadcasts', { params })
      return response.data
    },
  })
}

/**
 * Fetch a single broadcast
 */
export function useBroadcast(id: number | undefined) {
  return useQuery({
    queryKey: broadcastKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<Broadcast>(`/broadcasts/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Preview broadcast recipients
 */
export function useBroadcastPreview(
  id: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: broadcastKeys.preview(id),
    queryFn: async () => {
      const response = await api.post<BroadcastPreview>(
        `/broadcasts/${id}/preview`
      )
      return response.data
    },
    enabled: options?.enabled !== false && !!id,
  })
}

/**
 * Fetch broadcast recipients
 */
export function useBroadcastRecipients(
  id: number | undefined,
  params?: { status?: string; skip?: number; limit?: number }
) {
  return useQuery({
    queryKey: broadcastKeys.recipients(id!, params),
    queryFn: async () => {
      const response = await api.get<BroadcastRecipient[]>(
        `/broadcasts/${id}/recipients`,
        { params }
      )
      return response.data
    },
    enabled: !!id,
  })
}

// ==================== Mutations ====================

/**
 * Create a new broadcast
 */
export function useCreateBroadcast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateBroadcastPayload) => {
      const response = await api.post<Broadcast>('/broadcasts', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: broadcastKeys.all })
    },
  })
}

/**
 * Update a broadcast
 */
export function useUpdateBroadcast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateBroadcastPayload & { id: number }) => {
      const response = await api.put<Broadcast>(`/broadcasts/${id}`, payload)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: broadcastKeys.all })
      queryClient.invalidateQueries({
        queryKey: broadcastKeys.detail(variables.id),
      })
    },
  })
}

/**
 * Delete a broadcast
 */
export function useDeleteBroadcast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/broadcasts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: broadcastKeys.all })
    },
  })
}

/**
 * Send a broadcast
 */
export function useSendBroadcast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<Broadcast>(`/broadcasts/${id}/send`)
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: broadcastKeys.all })
      queryClient.invalidateQueries({ queryKey: broadcastKeys.detail(id) })
    },
  })
}
