import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useNotificationStore } from '@/stores/notification-store'
import { playNotificationSound } from '@/lib/notification-sound'

export function NotificationsForm() {
  const {
    browserNotificationsEnabled,
    toastNotificationsEnabled,
    soundEnabled,
    soundVolume,
    notifyOnNewMessage,
    notifyOnlyWhenHidden,
    setBrowserNotifications,
    setToastNotifications,
    setSoundEnabled,
    setSoundVolume,
    setNotifyOnNewMessage,
    setNotifyOnlyWhenHidden,
  } = useNotificationStore()

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  )

  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications are not supported.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setBrowserPermission(permission)
      if (permission === 'granted') {
        toast.success('Browser notifications enabled!')
        setBrowserNotifications(true)
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.')
        setBrowserNotifications(false)
      }
    } catch {
      toast.error('Failed to request notification permission.')
    }
  }, [setBrowserNotifications])

  const testSound = useCallback(() => {
    playNotificationSound(soundVolume)
  }, [soundVolume])

  const testNotification = useCallback(() => {
    toast.info('Test Notification', {
      description: 'This is what a new message notification looks like!',
      duration: 5000,
    })
    if (soundEnabled) {
      playNotificationSound(soundVolume)
    }
  }, [soundEnabled, soundVolume])

  return (
    <div className='space-y-6'>
      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {notifyOnNewMessage ? (
              <Bell className='h-5 w-5' />
            ) : (
              <BellOff className='h-5 w-5' />
            )}
            Notifications
          </CardTitle>
          <CardDescription>
            Get notified when new WhatsApp messages arrive
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='notify-new'>Enable notifications</Label>
              <p className='text-sm text-muted-foreground'>
                Receive alerts for new incoming messages
              </p>
            </div>
            <Switch
              id='notify-new'
              checked={notifyOnNewMessage}
              onCheckedChange={setNotifyOnNewMessage}
            />
          </div>

          {notifyOnNewMessage && (
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='notify-hidden'>Only when tab is hidden</Label>
                <p className='text-sm text-muted-foreground'>
                  Don&apos;t show notifications while you&apos;re actively using the app
                </p>
              </div>
              <Switch
                id='notify-hidden'
                checked={notifyOnlyWhenHidden}
                onCheckedChange={setNotifyOnlyWhenHidden}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Toast popups that appear within the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='toast-enabled'>Show toast notifications</Label>
              <p className='text-sm text-muted-foreground'>
                Display popup alerts in the corner of the screen
              </p>
            </div>
            <Switch
              id='toast-enabled'
              checked={toastNotificationsEnabled}
              onCheckedChange={setToastNotifications}
              disabled={!notifyOnNewMessage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Browser Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Notifications</CardTitle>
          <CardDescription>
            Desktop notifications that appear even when the tab is hidden
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='browser-enabled'>Enable browser notifications</Label>
              <p className='text-sm text-muted-foreground'>
                Get notified even when the browser tab is in the background
              </p>
            </div>
            <Switch
              id='browser-enabled'
              checked={browserNotificationsEnabled && browserPermission === 'granted'}
              onCheckedChange={setBrowserNotifications}
              disabled={!notifyOnNewMessage || browserPermission !== 'granted'}
            />
          </div>

          {browserPermission !== 'granted' && (
            <div className='rounded-lg border border-dashed p-4'>
              <p className='text-sm text-muted-foreground mb-3'>
                {browserPermission === 'denied'
                  ? 'Browser notifications are blocked. Please enable them in your browser settings.'
                  : 'Allow browser notifications to receive alerts when the tab is hidden.'}
              </p>
              {browserPermission === 'default' && (
                <Button onClick={requestBrowserPermission} variant='outline' size='sm'>
                  <Bell className='mr-2 h-4 w-4' />
                  Enable Browser Notifications
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {soundEnabled ? (
              <Volume2 className='h-5 w-5' />
            ) : (
              <VolumeX className='h-5 w-5' />
            )}
            Sound
          </CardTitle>
          <CardDescription>
            Play a sound when new messages arrive
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='sound-enabled'>Notification sound</Label>
              <p className='text-sm text-muted-foreground'>
                Play an audio alert for new messages
              </p>
            </div>
            <Switch
              id='sound-enabled'
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              disabled={!notifyOnNewMessage}
            />
          </div>

          {soundEnabled && notifyOnNewMessage && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label>Volume</Label>
                <span className='text-sm text-muted-foreground'>
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <VolumeX className='h-4 w-4 text-muted-foreground' />
                <Slider
                  value={[soundVolume]}
                  onValueChange={([value]) => setSoundVolume(value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className='flex-1'
                />
                <Volume2 className='h-4 w-4 text-muted-foreground' />
              </div>
              <Button onClick={testSound} variant='outline' size='sm'>
                Test Sound
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Button */}
      <div className='flex justify-end'>
        <Button onClick={testNotification} disabled={!notifyOnNewMessage}>
          <Bell className='mr-2 h-4 w-4' />
          Send Test Notification
        </Button>
      </div>
    </div>
  )
}
