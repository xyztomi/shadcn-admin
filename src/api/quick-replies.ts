import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QuickReply } from '@/types'
import { api } from './client'

// ==================== Query Keys ====================
export const quickRepliesKeys = {
  all: ['quick-replies'] as const,
  lists: () => [...quickRepliesKeys.all, 'list'] as const,
  list: (params?: { skip?: number; limit?: number; category?: string }) =>
    [...quickRepliesKeys.lists(), params] as const,
  search: (query: string) =>
    [...quickRepliesKeys.all, 'search', query] as const,
  categories: () => [...quickRepliesKeys.all, 'categories'] as const,
}

// ==================== Types ====================
interface CreateQuickReplyPayload {
  title: string
  content: string
  shortcut?: string
  category?: string
  is_shared?: boolean
}

interface UpdateQuickReplyPayload {
  title?: string
  content?: string
  shortcut?: string
  category?: string
  is_shared?: boolean
}

// ==================== Queries ====================

/**
 * Fetch all quick replies
 */
export function useQuickReplies(params?: {
  skip?: number
  limit?: number
  category?: string
}) {
  return useQuery({
    queryKey: quickRepliesKeys.list(params),
    queryFn: async () => {
      const response = await api.get<QuickReply[]>('/quick-replies', {
        params,
      })
      return response.data
    },
  })
}

/**
 * Search quick replies by query (matches title, content, shortcut)
 */
export function useSearchQuickReplies(query: string) {
  return useQuery({
    queryKey: quickRepliesKeys.search(query),
    queryFn: async () => {
      const response = await api.get<QuickReply[]>(
        '/quick-replies/search',
        {
          params: { q: query },
        }
      )
      return response.data
    },
    enabled: query.length > 0,
  })
}

/**
 * Fetch all unique categories
 */
export function useQuickReplyCategories() {
  return useQuery({
    queryKey: quickRepliesKeys.categories(),
    queryFn: async () => {
      const response = await api.get<string[]>(
        '/quick-replies/categories'
      )
      return response.data
    },
  })
}

// ==================== Mutations ====================

/**
 * Create a new quick reply
 */
export function useCreateQuickReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateQuickReplyPayload) => {
      const response = await api.post<QuickReply>(
        '/quick-replies',
        payload
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quickRepliesKeys.all })
    },
  })
}

/**
 * Update a quick reply
 */
export function useUpdateQuickReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateQuickReplyPayload & { id: number }) => {
      const response = await api.put<QuickReply>(
        `/quick-replies/${id}`,
        payload
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quickRepliesKeys.all })
    },
  })
}

/**
 * Delete a quick reply
 */
export function useDeleteQuickReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quick-replies/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quickRepliesKeys.all })
    },
  })
}

/**
 * Track usage of a quick reply (increments usage count)
 */
export function useTrackQuickReplyUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<QuickReply>(
        `/quick-replies/${id}/use`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quickRepliesKeys.all })
    },
  })
}
