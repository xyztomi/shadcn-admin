import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationSettings {
  // Browser notifications
  browserNotificationsEnabled: boolean
  // In-app toast notifications
  toastNotificationsEnabled: boolean
  // Sound notifications
  soundEnabled: boolean
  soundVolume: number // 0-1
  // What to notify about
  notifyOnNewMessage: boolean
  notifyOnlyWhenHidden: boolean
}

interface NotificationState extends NotificationSettings {
  // Actions
  setBrowserNotifications: (enabled: boolean) => void
  setToastNotifications: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setSoundVolume: (volume: number) => void
  setNotifyOnNewMessage: (enabled: boolean) => void
  setNotifyOnlyWhenHidden: (enabled: boolean) => void
  // Helper to check if we should notify
  shouldNotify: (isDocumentVisible: boolean) => boolean
}

const defaultSettings: NotificationSettings = {
  browserNotificationsEnabled: true,
  toastNotificationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  notifyOnNewMessage: true,
  notifyOnlyWhenHidden: false,
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setBrowserNotifications: (enabled) =>
        set({ browserNotificationsEnabled: enabled }),

      setToastNotifications: (enabled) =>
        set({ toastNotificationsEnabled: enabled }),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      setSoundVolume: (volume) =>
        set({ soundVolume: Math.max(0, Math.min(1, volume)) }),

      setNotifyOnNewMessage: (enabled) => set({ notifyOnNewMessage: enabled }),

      setNotifyOnlyWhenHidden: (enabled) =>
        set({ notifyOnlyWhenHidden: enabled }),

      shouldNotify: (isDocumentVisible) => {
        const state = get()
        if (!state.notifyOnNewMessage) return false
        if (state.notifyOnlyWhenHidden && isDocumentVisible) return false
        return true
      },
    }),
    {
      name: 'wa-crm-notification-settings',
    }
  )
)
