/**
 * Real-time unread message store using useSyncExternalStore pattern.
 * This provides instant updates via WebSocket while syncing with REST API.
 */

type UnreadState = {
  totalUnreadMessages: number
  contactsWithUnread: number
}

type Listener = () => void

let state: UnreadState = {
  totalUnreadMessages: 0,
  contactsWithUnread: 0,
}

const listeners = new Set<Listener>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export const unreadStore = {
  /** Subscribe to state changes */
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Get current snapshot */
  getSnapshot(): UnreadState {
    return state
  },

  /** Server snapshot for SSR */
  getServerSnapshot(): UnreadState {
    return { totalUnreadMessages: 0, contactsWithUnread: 0 }
  },

  /** Sync state from REST API response */
  syncFromApi(data: {
    total_unread_messages: number
    contacts_with_unread: number
  }) {
    state = {
      totalUnreadMessages: data.total_unread_messages,
      contactsWithUnread: data.contacts_with_unread,
    }
    emitChange()
  },

  /** Increment unread count when new inbound message arrives via WebSocket */
  incrementUnread(_waId: string) {
    // Simple increment - the REST API will correct any drift on next sync
    state = {
      totalUnreadMessages: state.totalUnreadMessages + 1,
      // We don't know if this is a new contact or existing, so we optimistically add 1
      // The REST sync will correct this if needed
      contactsWithUnread: state.contactsWithUnread + 1,
    }
    emitChange()
  },

  /** Decrement unread count when messages are marked as read */
  decrementUnread(count: number) {
    state = {
      totalUnreadMessages: Math.max(0, state.totalUnreadMessages - count),
      contactsWithUnread: Math.max(0, state.contactsWithUnread - 1),
    }
    emitChange()
  },

  /** Reset to zero (e.g., on logout) */
  reset() {
    state = { totalUnreadMessages: 0, contactsWithUnread: 0 }
    emitChange()
  },
}
