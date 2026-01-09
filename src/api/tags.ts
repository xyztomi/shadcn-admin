import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tag, TagWithCount } from '@/types'
import { api } from './client'

// ==================== Query Keys ====================
export const tagsKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsKeys.all, 'list'] as const,
  list: (params?: { skip?: number; limit?: number }) =>
    [...tagsKeys.lists(), params] as const,
  contact: (waId: string) => [...tagsKeys.all, 'contact', waId] as const,
}

// ==================== Types ====================
interface CreateTagPayload {
  name: string
  color?: string
}

interface UpdateTagPayload {
  name?: string
  color?: string
}

// ==================== Queries ====================

/**
 * Fetch all tags with contact count
 */
export function useTags(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: tagsKeys.list(params),
    queryFn: async () => {
      const response = await api.get<TagWithCount[]>('/tags', {
        params,
      })
      return response.data
    },
  })
}

/**
 * Fetch tags for a specific contact
 */
export function useContactTags(waId: string | undefined) {
  return useQuery({
    queryKey: tagsKeys.contact(waId!),
    queryFn: async () => {
      const response = await api.get<Tag[]>(`/tags/contact/${waId}`)
      return response.data
    },
    enabled: !!waId,
  })
}

// ==================== Mutations ====================

/**
 * Create a new tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateTagPayload) => {
      const response = await api.post<Tag>('/tags', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.all })
    },
  })
}

/**
 * Update a tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateTagPayload & { id: number }) => {
      const response = await api.put<Tag>(`/tags/${id}`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.all })
    },
  })
}

/**
 * Delete a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tags/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.all })
    },
  })
}

/**
 * Add tag to a contact
 */
export function useAddTagToContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ waId, tagId }: { waId: string; tagId: number }) => {
      const response = await api.post<Tag[]>(
        `/tags/contact/${waId}/add/${tagId}`
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagsKeys.contact(variables.waId),
      })
      queryClient.invalidateQueries({ queryKey: tagsKeys.lists() })
    },
  })
}

/**
 * Remove tag from a contact
 */
export function useRemoveTagFromContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ waId, tagId }: { waId: string; tagId: number }) => {
      const response = await api.delete<Tag[]>(
        `/tags/contact/${waId}/remove/${tagId}`
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagsKeys.contact(variables.waId),
      })
      queryClient.invalidateQueries({ queryKey: tagsKeys.lists() })
    },
  })
}

/**
 * Update all tags for a contact (replace)
 */
export function useUpdateContactTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      waId,
      tagIds,
    }: {
      waId: string
      tagIds: number[]
    }) => {
      const response = await api.put<Tag[]>(`/tags/contact/${waId}`, {
        tag_ids: tagIds,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagsKeys.contact(variables.waId),
      })
      queryClient.invalidateQueries({ queryKey: tagsKeys.lists() })
    },
  })
}
