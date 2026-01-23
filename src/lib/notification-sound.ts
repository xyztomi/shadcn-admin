// Notification sound utility using Web Audio API
// Creates a pleasant notification sound without needing an external audio file

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )()
  }
  return audioContext
}

export function playNotificationSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext()

    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // Create oscillator for the main tone
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Pleasant notification sound - two quick ascending tones
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now) // A5
    oscillator.frequency.setValueAtTime(1108.73, now + 0.1) // C#6

    // Volume envelope
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.02)
    gainNode.gain.linearRampToValueAtTime(volume * 0.2, now + 0.1)
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.12)
    gainNode.gain.linearRampToValueAtTime(0, now + 0.25)

    oscillator.start(now)
    oscillator.stop(now + 0.25)
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

// Alternative: Use a pre-made notification sound file
export function playNotificationSoundFile(
  volume: number = 0.5,
  soundUrl: string = '/sounds/notification.mp3'
): void {
  try {
    const audio = new Audio(soundUrl)
    audio.volume = Math.max(0, Math.min(1, volume))
    audio.play().catch(() => {
      // Autoplay blocked - fail silently
    })
  } catch {
    // Audio not supported - fail silently
  }
}
