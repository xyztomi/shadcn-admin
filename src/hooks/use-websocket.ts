import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { unreadStore } from '@/stores/unread-store'
import { websocketStore } from '@/stores/websocket-store'

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
  // If VITE_API_URL is set, use it for WebSocket connection
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    // Convert http(s):// to ws(s)://
    const wsUrl = apiUrl.replace(/^http/, 'ws')
    return `${wsUrl}/ws?token=${token}`
  }

  // In production without VITE_API_URL, use the same host as the app
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

// Store all event handlers - each component that calls useWebSocket gets its handler added here
const eventHandlers = new Set<WSEventHandler>()

export function useWebSocket(onEvent?: WSEventHandler) {
  const onEventRef = useRef(onEvent)
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)

  // Create a stable wrapper that always calls the latest handler
  const stableHandlerRef = useRef<WSEventHandler | null>(null)
  if (!stableHandlerRef.current && onEvent) {
    // Create a wrapper function that reads from the ref
    stableHandlerRef.current = (event: WebSocketEvent) => {
      onEventRef.current?.(event)
    }
  }

  // Keep refs updated
  onEventRef.current = onEvent
  queryClientRef.current = queryClient

  const connect = useCallback(() => {
    const token = useAuthStore.getState().auth.accessToken
    if (!token) return

    // Don't create multiple connections
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      return
    }

    // Clean up existing connection
    if (globalWs) {
      globalWs.close()
      globalWs = null
    }

    const wsUrl = getWebSocketUrl(token)
    globalWs = new WebSocket(wsUrl)

    globalWs.onopen = () => {
      // Clear any pending reconnect
      if (globalReconnectTimeout) {
        clearTimeout(globalReconnectTimeout)
        globalReconnectTimeout = null
      }
      // Update connection status
      websocketStore.setConnected(true)
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

            // Instantly update unread store for inbound messages
            if (msgEvent.message?.direction === 'inbound') {
              unreadStore.incrementUnread(msgEvent.wa_id)
            }
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

        // Call ALL registered event handlers (not just one)
        for (const handler of eventHandlers) {
          try {
            handler(data)
          } catch {
            // Ignore handler errors
          }
        }
      } catch {
        // Invalid JSON, ignore
      }
    }

    globalWs.onerror = () => {
      // Error handling - will trigger onclose
    }

    globalWs.onclose = () => {
      globalWs = null
      // Update connection status
      websocketStore.setConnected(false)
      // Attempt to reconnect after 5 seconds if still have token
      const token = useAuthStore.getState().auth.accessToken
      if (token && !globalReconnectTimeout && connectionCount > 0) {
        globalReconnectTimeout = setTimeout(() => {
          globalReconnectTimeout = null
          connect()
        }, 5000)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // No dependencies - connect reads from refs and store

  // Connect on mount - use ref to track if component is still mounted
  useEffect(() => {
    let isMounted = true
    connectionCount++

    // Register this component's event handler (using stable wrapper)
    const handler = stableHandlerRef.current
    if (handler) {
      eventHandlers.add(handler)
    }

    // Delay connection to let StrictMode double-mount settle
    // StrictMode: mount -> unmount -> mount happens synchronously
    // So by the time setTimeout fires, we know the final mount state
    const connectTimeout = setTimeout(() => {
      if (isMounted && connectionCount > 0) {
        connect()
      }
    }, 100)

    return () => {
      isMounted = false
      connectionCount--
      clearTimeout(connectTimeout)

      // Remove this component's event handler
      if (handler) {
        eventHandlers.delete(handler)
      }

      // Only close WebSocket when no components are using it
      // Use setTimeout to allow for StrictMode remount
      setTimeout(() => {
        if (connectionCount === 0 && globalWs) {
          if (globalReconnectTimeout) {
            clearTimeout(globalReconnectTimeout)
            globalReconnectTimeout = null
          }
          globalWs.close()
          globalWs = null
        }
      }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - singleton pattern handles reconnects

  const send = useCallback((data: unknown) => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify(data))
    }
  }, [])

  return { send }
}
