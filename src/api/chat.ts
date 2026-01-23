import { useSyncExternalStore } from 'react'
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
import { useDepartmentStore } from '@/stores/department-store'
import { unreadStore } from '@/stores/unread-store'
import { api } from './client'

// Re-export for convenience
export type { Message }
export { MessageDirection, MessageType, MessageStatus }

export interface ConversationResponse {
  messages: Message[]
  has_more: boolean
}

export interface UnreadSummary {
  total_unread_messages: number
  contacts_with_unread: number
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
    onSuccess: (data, waId) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', waId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-summary'] })

      // Instantly update unread store
      const markedCount = data?.marked_read ?? 1
      if (markedCount > 0) {
        unreadStore.decrementUnread(markedCount)
      }
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

// Delete chat history (admin only)
export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (waId: string) => {
      await api.delete(`/chat/${waId}`)
    },
    onSuccess: (_data, waId) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', waId] })
    },
  })
}

// Aggregated unread counts for nav badge + notifications
// Uses useSyncExternalStore for instant WebSocket updates + REST API for sync
export function useUnreadSummary() {
  const { selectedDepartment } = useDepartmentStore()

  // REST API query to sync the store periodically
  useQuery({
    queryKey: ['chat', 'unread-summary', selectedDepartment],
    queryFn: async (): Promise<UnreadSummary> => {
      const params = new URLSearchParams()
      if (selectedDepartment && selectedDepartment !== 'all') {
        params.append('department', selectedDepartment)
      }

      const queryString = params.toString()
      const response = await api.get(
        `/chat/unread-summary${queryString ? `?${queryString}` : ''}`
      )
      // Sync the external store with REST data
      unreadStore.syncFromApi(response.data)
      return response.data
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })

  // Subscribe to real-time store updates (instant WebSocket changes)
  const snapshot = useSyncExternalStore(
    unreadStore.subscribe,
    unreadStore.getSnapshot,
    unreadStore.getServerSnapshot
  )

  return {
    data: {
      total_unread_messages: snapshot.totalUnreadMessages,
      contacts_with_unread: snapshot.contactsWithUnread,
    } as UnreadSummary,
  }
}
