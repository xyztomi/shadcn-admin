import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

export type MediaAssetType = 'image' | 'document'

export interface MediaAsset {
  id: number
  name: string
  description: string | null
  asset_type: MediaAssetType
  filename: string
  mime_type: string
  file_size: number
  file_url: string
  category: string | null
  created_by_agent_id: number
  created_at: string
  is_active: boolean
}

export interface MediaAssetFilters {
  asset_type?: MediaAssetType
  category?: string
  active_only?: boolean
}

// List all media assets
export function useMediaAssets(filters?: MediaAssetFilters) {
  const params = new URLSearchParams()
  if (filters?.asset_type) params.append('asset_type', filters.asset_type)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.active_only !== undefined)
    params.append('active_only', String(filters.active_only))

  return useQuery({
    queryKey: ['media-assets', filters],
    queryFn: async (): Promise<MediaAsset[]> => {
      const response = await api.get(`/media-assets?${params.toString()}`)
      return response.data
    },
  })
}

// Get categories
export function useMediaAssetCategories() {
  return useQuery({
    queryKey: ['media-assets', 'categories'],
    queryFn: async (): Promise<string[]> => {
      const response = await api.get('/media-assets/categories')
      return response.data
    },
  })
}

// Upload media asset (admin only)
export function useUploadMediaAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      file: File
      name: string
      description?: string
      category?: string
    }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)
      if (data.category) formData.append('category', data.category)

      const response = await api.post('/media-assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data as MediaAsset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['media-assets'],
        refetchType: 'all',
      })
    },
  })
}

// Update media asset (admin only)
export function useUpdateMediaAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: Partial<
        Pick<MediaAsset, 'name' | 'description' | 'category' | 'is_active'>
      >
    }) => {
      const response = await api.patch(`/media-assets/${id}`, data)
      return response.data as MediaAsset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['media-assets'],
        refetchType: 'all',
      })
    },
  })
}

// Delete media asset (admin only)
export function useDeleteMediaAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/media-assets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['media-assets'],
        refetchType: 'all',
      })
    },
  })
}

// Send media message
export function useSendMediaMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      waId,
      mediaAssetId,
      caption,
    }: {
      waId: string
      mediaAssetId: number
      caption?: string
    }) => {
      const response = await api.post(`/chat/${waId}/send-media`, {
        media_asset_id: mediaAssetId,
        caption,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', variables.waId],
      })
    },
  })
}
