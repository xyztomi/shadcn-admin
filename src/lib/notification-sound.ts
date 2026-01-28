// Notification sound utility
// Plays a ringtone when new messages arrive

// Cache the audio element for faster playback
let cachedAudio: HTMLAudioElement | null = null
const SOUND_URL = '/sounds/notification.mp3'

// Preload the audio file for instant playback
function preloadAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  if (!cachedAudio) {
    cachedAudio = new Audio(SOUND_URL)
    cachedAudio.preload = 'auto'
  }
  return cachedAudio
}

// Try to preload on module load
if (typeof window !== 'undefined') {
  preloadAudio()
}

export function playNotificationSound(volume: number = 0.5): void {
  try {
    // First try to play the MP3 file
    const audio = preloadAudio()
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.currentTime = 0 // Reset to start
      audio.play().catch(() => {
        // If MP3 fails, fallback to Web Audio API
        playFallbackSound(volume)
      })
    } else {
      playFallbackSound(volume)
    }
  } catch {
    // Fallback to synthesized sound
    playFallbackSound(volume)
  }
}

// Fallback: synthesized notification sound using Web Audio API
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

function playFallbackSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext()

    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime
    const clampedVolume = Math.max(0, Math.min(1, volume))

    // Create three separate oscillators for distinct tones (like a ringtone)
    const frequencies = [587.33, 783.99, 987.77] // D5, G5, B5
    const durations = [0.12, 0.12, 0.16] // Each note duration
    let startTime = now

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, startTime)

      // Volume envelope for each note - attack, sustain, release
      const noteStart = startTime
      const noteDuration = durations[index]
      const attackTime = 0.01
      const releaseTime = 0.03

      gainNode.gain.setValueAtTime(0, noteStart)
      gainNode.gain.linearRampToValueAtTime(
        clampedVolume * 0.5,
        noteStart + attackTime
      )
      gainNode.gain.setValueAtTime(
        clampedVolume * 0.5,
        noteStart + noteDuration - releaseTime
      )
      gainNode.gain.linearRampToValueAtTime(0, noteStart + noteDuration)

      oscillator.start(noteStart)
      oscillator.stop(noteStart + noteDuration)

      startTime += noteDuration
    })
  } catch {
    // Audio not supported or blocked - fail silently
  }
}

// Test function to play sound on demand (useful for settings page)
export function testNotificationSound(volume: number = 0.5): void {
  playNotificationSound(volume)
}
