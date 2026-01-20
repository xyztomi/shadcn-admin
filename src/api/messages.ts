import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSentiment } from '@/types'
import { api } from './client'

export { MessageSentiment }

// === Types ===

export interface SentimentUpdate {
  sentiment: MessageSentiment
}

export interface SentimentResponse {
  id: number
  sentiment: MessageSentiment | null
  sentiment_tagged_by: number | null
  sentiment_tagged_at: string | null
}

export interface BulkSentimentUpdate {
  message_ids: number[]
  sentiment: MessageSentiment
}

export interface BulkUpdateResult {
  updated_count: number
  message_ids: number[]
}

export interface SentimentStats {
  total_tagged: number
  by_sentiment: Record<string, number>
  complaint_rate: number
}

// === API Functions ===

/** Tag a single message with sentiment */
export async function tagMessageSentiment(
  messageId: number,
  sentiment: MessageSentiment
): Promise<SentimentResponse> {
  const response = await api.patch(`/messages/${messageId}/sentiment`, {
    sentiment,
  })
  return response.data
}

/** Remove sentiment tag from a message */
export async function removeMessageSentiment(
  messageId: number
): Promise<SentimentResponse> {
  const response = await api.delete(`/messages/${messageId}/sentiment`)
  return response.data
}

/** Bulk tag multiple messages with the same sentiment */
export async function bulkTagSentiment(
  data: BulkSentimentUpdate
): Promise<BulkUpdateResult> {
  const response = await api.post('/messages/sentiment/bulk', data)
  return response.data
}

/** Get sentiment statistics */
export async function getSentimentStats(params?: {
  contact_id?: number
  agent_id?: number
}): Promise<SentimentStats> {
  const response = await api.get('/messages/sentiments/stats', { params })
  return response.data
}

// === Hooks ===

/** Hook to tag a message with sentiment */
export function useTagMessageSentiment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      messageId,
      sentiment,
    }: {
      messageId: number
      sentiment: MessageSentiment
    }) => tagMessageSentiment(messageId, sentiment),
    onSuccess: () => {
      // Invalidate conversation queries to refresh message list
      queryClient.invalidateQueries({ queryKey: ['conversation'] })
    },
  })
}

/** Hook to remove sentiment from a message */
export function useRemoveMessageSentiment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: number) => removeMessageSentiment(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] })
    },
  })
}

/** Hook to bulk tag messages */
export function useBulkTagSentiment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkTagSentiment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] })
    },
  })
}
