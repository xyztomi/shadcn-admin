import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'

type WebSocketEventType =
  | 'connected'
  | 'contact_update'
  | 'new_message'
  | 'message_status'
  | 'message_status_update'
  | 'agent_assigned'
  | 'typing'
  | 'pong'

interface WebSocketEvent {
  type: WebSocketEventType
  data?: unknown
  wa_id?: string
  message?: NewMessagePayload
  // Direct fields for message_status_update events
  message_id?: number
  wa_message_id?: string
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp?: string
  error?: string
}

interface NewMessagePayload {
  id: number | string
  content?: string
  direction: 'inbound' | 'outbound'
  timestamp?: string
  created_at?: string
  sender_name?: string
  service_tag?: string
  is_bot?: boolean
}

interface NewMessageEvent extends WebSocketEvent {
  type: 'new_message'
  wa_id: string
  message: NewMessagePayload
}

export type { WebSocketEvent, NewMessageEvent }

interface MessageStatusEvent {
  type: 'message_status'
  data: {
    wa_id: string
    message_id: number
    status: 'sent' | 'delivered' | 'read' | 'failed'
  }
}

// New format from backend webhooks
interface MessageStatusUpdateEvent {
  type: 'message_status_update'
  message_id: number
  wa_message_id: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  error?: string
}

interface AgentAssignedEvent {
  type: 'agent_assigned'
  data: {
    wa_id: string
    agent_id: number | null
    agent_name: string | null
  }
}

type WSEventHandler = (event: WebSocketEvent) => void

// Connect directly to backend WebSocket (bypasses Vite proxy issues)
function getWebSocketUrl(token: string): string {
  // In production, use the same host as the app
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws?token=${token}`
  }
  // In development, connect directly to backend to avoid proxy issues
  return `ws://localhost:8000/ws?token=${token}`
}

// Singleton WebSocket manager to prevent multiple connections
let globalWs: WebSocket | null = null
let globalReconnectTimeout: NodeJS.Timeout | null = null
let connectionCount = 0

export function useWebSocket(onEvent?: WSEventHandler) {
  const onEventRef = useRef(onEvent)
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)
  const { auth } = useAuthStore()

  // Keep refs updated
  onEventRef.current = onEvent
  queryClientRef.current = queryClient

  const connect = useCallback(() => {
    if (!auth.accessToken) return

    // Don't create multiple connections
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      return
    }

    // Clean up existing connection
    if (globalWs) {
      globalWs.close()
      globalWs = null
    }

    const wsUrl = getWebSocketUrl(auth.accessToken)
    globalWs = new WebSocket(wsUrl)

    globalWs.onopen = () => {
      // Clear any pending reconnect
      if (globalReconnectTimeout) {
        clearTimeout(globalReconnectTimeout)
        globalReconnectTimeout = null
      }
    }

    globalWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketEvent
        const qc = queryClientRef.current

        // Handle different event types
        switch (data.type) {
          case 'new_message': {
            const msgEvent = data as NewMessageEvent
            // Invalidate conversation and contacts queries
            qc.invalidateQueries({
              queryKey: ['conversation', msgEvent.wa_id],
            })
            qc.invalidateQueries({ queryKey: ['contacts'] })
            qc.invalidateQueries({ queryKey: ['chat', 'unread-summary'] })
            break
          }
          case 'message_status': {
            const statusEvent = data as MessageStatusEvent
            qc.invalidateQueries({
              queryKey: ['conversation', statusEvent.data.wa_id],
            })
            break
          }
          case 'message_status_update': {
            // New format from WhatsApp webhooks - update cache optimistically
            const statusUpdateEvent =
              data as unknown as MessageStatusUpdateEvent
            const { message_id, status, error } = statusUpdateEvent

            // Update all conversation caches that might contain this message
            qc.setQueriesData<{
              pages: Array<{
                messages: Array<{
                  id: string | number
                  status: string
                  error?: string
                }>
              }>
            }>({ queryKey: ['conversation'] }, (oldData) => {
              if (!oldData) return oldData
              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  messages: page.messages.map((msg) =>
                    String(msg.id) === String(message_id)
                      ? { ...msg, status, error }
                      : msg
                  ),
                })),
              }
            })
            break
          }
          case 'agent_assigned': {
            const assignEvent = data as AgentAssignedEvent
            qc.invalidateQueries({
              queryKey: ['contacts', assignEvent.data.wa_id],
            })
            qc.invalidateQueries({ queryKey: ['contacts'] })
            qc.invalidateQueries({ queryKey: ['stats'] })
            break
          }
        }

        // Call custom handler if provided
        onEventRef.current?.(data)
      } catch {
        // Invalid JSON, ignore
      }
    }

    globalWs.onerror = () => {
      // Error handling - will trigger onclose
    }

    globalWs.onclose = () => {
      globalWs = null
      // Attempt to reconnect after 5 seconds if still have token
      const token = useAuthStore.getState().auth.accessToken
      if (token && !globalReconnectTimeout && connectionCount > 0) {
        globalReconnectTimeout = setTimeout(() => {
          globalReconnectTimeout = null
          connect()
        }, 5000)
      }
    }
  }, [auth.accessToken])

  useEffect(() => {
    connectionCount++
    connect()

    return () => {
      connectionCount--
      // Only close WebSocket when no components are using it
      if (connectionCount === 0) {
        if (globalReconnectTimeout) {
          clearTimeout(globalReconnectTimeout)
          globalReconnectTimeout = null
        }
        if (globalWs) {
          globalWs.close()
          globalWs = null
        }
      }
    }
  }, [connect])

  const send = useCallback((data: unknown) => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify(data))
    }
  }, [])

  return { send }
}
