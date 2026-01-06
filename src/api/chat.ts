import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query'
import {
  type Message,
  MessageDirection,
  MessageType,
  MessageStatus,
} from '@/types'
import { api } from './client'

// Re-export for convenience
export type { Message }
export { MessageDirection, MessageType, MessageStatus }

export interface ConversationResponse {
  messages: Message[]
  has_more: boolean
}

// Get conversation history with cursor-based pagination
export function useConversation(waId: string, limit = 50) {
  return useInfiniteQuery<
    ConversationResponse,
    Error,
    InfiniteData<ConversationResponse>,
    (string | number)[],
    string | undefined
  >({
    queryKey: ['conversation', waId, limit],
    queryFn: async ({ pageParam }): Promise<ConversationResponse> => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (pageParam) {
        params.append('before_id', String(pageParam))
      }
      const response = await api.get(`/chat/${waId}?${params.toString()}`)
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.messages.length === 0) {
        return undefined
      }
      // Return the ID of the oldest message to load older messages
      return String(lastPage.messages[lastPage.messages.length - 1].id)
    },
    enabled: !!waId,
    // Poll every 5 seconds as fallback when WebSocket isn't working
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
}

// Send a message
export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ waId, text }: { waId: string; text: string }) => {
      const response = await api.post(`/chat/${waId}/send`, { text })
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', variables.waId],
      })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

// Mark messages as read
export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waId: string) => {
      const response = await api.post(`/chat/${waId}/mark-read`)
      return response.data
    },
    onSuccess: (_data, waId) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', waId] })
    },
  })
}

// Get unread count for a contact
export function useUnreadCount(waId: string) {
  return useQuery({
    queryKey: ['unread', waId],
    queryFn: async (): Promise<{ count: number }> => {
      const response = await api.get(`/chat/${waId}/unread`)
      return response.data
    },
    enabled: !!waId,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}
