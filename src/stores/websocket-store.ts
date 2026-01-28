// Hook to use in components
import { useSyncExternalStore } from 'react'

// WebSocket connection status store
// Used to conditionally disable polling when WebSocket is connected

type Listener = () => void

interface WebSocketState {
  isConnected: boolean
}

let state: WebSocketState = {
  isConnected: false,
}

const listeners = new Set<Listener>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export const websocketStore = {
  setConnected: (connected: boolean) => {
    if (state.isConnected !== connected) {
      state = { ...state, isConnected: connected }
      emitChange()
    }
  },

  getSnapshot: (): WebSocketState => state,

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  // For SSR
  getServerSnapshot: (): WebSocketState => ({ isConnected: false }),
}

export function useWebSocketStatus() {
  return useSyncExternalStore(
    websocketStore.subscribe,
    websocketStore.getSnapshot,
    websocketStore.getServerSnapshot
  )
}
