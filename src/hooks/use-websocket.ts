import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'

type WebSocketEventType =
  | 'new_message'
  | 'message_status'
  | 'agent_assigned'
  | 'typing'

interface WebSocketEvent {
  type: WebSocketEventType
  data: unknown
}

interface NewMessageEvent {
  type: 'new_message'
  data: {
    wa_id: string
    message: {
      id: number
      content: string
      direction: 'inbound' | 'outbound'
      timestamp: string
    }
  }
}

interface MessageStatusEvent {
  type: 'message_status'
  data: {
    wa_id: string
    message_id: number
    status: 'sent' | 'delivered' | 'read' | 'failed'
  }
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

// Use relative URL for WebSocket so Vite proxy handles it in dev
function getWebSocketUrl(token: string): string {
  if (import.meta.env.PROD) {
    return `ws://localhost:8000/ws?token=${token}`
  }
  // In dev, use relative URL through Vite proxy
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws?token=${token}`
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
              queryKey: ['conversation', msgEvent.data.wa_id],
            })
            qc.invalidateQueries({ queryKey: ['contacts'] })
            break
          }
          case 'message_status': {
            const statusEvent = data as MessageStatusEvent
            qc.invalidateQueries({
              queryKey: ['conversation', statusEvent.data.wa_id],
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
