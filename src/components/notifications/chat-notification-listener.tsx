import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useWebSocket, type WebSocketEvent, type NewMessageEvent } from '@/hooks/use-websocket'

const NOTIFICATION_PROMPT_STORAGE_KEY = 'wa-crm-browser-notifications'
const MAX_PREVIEW_LENGTH = 120

function truncate(text: string): string {
  if (text.length <= MAX_PREVIEW_LENGTH) {
    return text
  }
  return `${text.slice(0, MAX_PREVIEW_LENGTH - 3)}...`
}

function getMessagePreview(message: NewMessageEvent['message']): string {
  const content = message.content?.trim()
  if (content && content.length > 0) {
    return truncate(content)
  }
  return 'Open the chat to view the new message.'
}

export function ChatNotificationListener() {
  const router = useRouter()
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => {
    if (typeof document === 'undefined') {
      return true
    }
    return document.visibilityState === 'visible'
  })
  const promptIssuedRef = useRef(false)

  const isNotificationsSupported = useMemo(
    () => typeof window !== 'undefined' && 'Notification' in window,
    []
  )

  const requestBrowserPermission = useCallback(async () => {
    if (!isNotificationsSupported || !window.Notification) {
      toast.error('Browser notifications are not supported here.')
      return
    }

    try {
      const permission = await window.Notification.requestPermission()
      if (permission === 'granted') {
        toast.success('Desktop notifications enabled.')
      } else if (permission === 'denied') {
        toast.error('Notifications blocked in your browser settings.')
      }
    } catch {
      toast.error('Unable to request browser notifications.')
    }
  }, [isNotificationsSupported])

  useEffect(() => {
    if (!isNotificationsSupported || !window.Notification) return

    const alreadyPrompted = window.localStorage?.getItem(
      NOTIFICATION_PROMPT_STORAGE_KEY
    )
    if (
      window.Notification.permission === 'default' &&
      !alreadyPrompted &&
      !promptIssuedRef.current
    ) {
      promptIssuedRef.current = true
      window.localStorage?.setItem(NOTIFICATION_PROMPT_STORAGE_KEY, 'true')
      toast('Enable browser notifications', {
        description: 'Get push alerts for new chats (works when tab is hidden).',
        action: {
          label: 'Enable',
          onClick: () => requestBrowserPermission(),
        },
      })
    }
  }, [isNotificationsSupported, requestBrowserPermission])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const showBrowserNotification = useCallback(
    (title: string, body: string, waId: string) => {
      if (!isNotificationsSupported || !window.Notification) return
      if (window.Notification.permission !== 'granted') return

      const notification = new window.Notification(title, {
        body,
        icon: '/images/favicon.png',
        tag: `chat-${waId}`,
      })

      notification.onclick = () => {
        window.focus()
        router.navigate({ to: '/chats' })
        notification.close()
      }
    },
    [isNotificationsSupported, router]
  )

  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      if (event.type !== 'new_message') return
      const payload = event as NewMessageEvent
      if (!payload.message || payload.message.direction !== 'inbound') return

      const senderName = payload.message.sender_name || 'New WhatsApp message'
      const preview = getMessagePreview(payload.message)

      toast.info(senderName, {
        description: preview,
        action: {
          label: 'Open chat',
          onClick: () => router.navigate({ to: '/chats' }),
        },
        duration: 6000,
      })

      if (!isDocumentVisible) {
        showBrowserNotification(senderName, preview, payload.wa_id)
      }
    },
    [isDocumentVisible, router, showBrowserNotification]
  )

  useWebSocket(handleWebSocketEvent)

  return null
}
