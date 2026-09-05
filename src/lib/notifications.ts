import { supabase } from './supabase'

export type NotificationChannel = 'whatsapp' | 'telegram' | 'mock'

export const readinessMessage = `🏔️ Himachal Family Trip 2026\n\nGood morning everyone! Our tour preparation has started. Please check your packing list, confirm your medicines and assigned items, and suggest any food or travel requirements in the trip app.\n\nTrip: Shimla → Manali → Kasol → Amritsar\nDates: 16–23 October 2026\n\nPlease reply with “Ready” after checking your family’s preparations. We will review every reply together.`

export function getShareUrl(channel: 'whatsapp' | 'telegram') {
  const encoded = encodeURIComponent(readinessMessage)
  return channel === 'telegram' ? `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encoded}` : `https://wa.me/?text=${encoded}`
}

export async function notifyGroup(message: string, channel: NotificationChannel = 'mock') {
  if (channel === 'mock') return { delivered: false, mode: 'mock' as const }
  if (!supabase) {
    const encoded = encodeURIComponent(message)
    const url = channel === 'telegram' ? `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encoded}` : `https://wa.me/?text=${encoded}`
    window.open(url, '_blank', 'noopener,noreferrer')
    return { delivered: false, mode: channel }
  }
  const { data, error } = await supabase.functions.invoke('notify-group', { body: { channel, message } })
  if (error) throw error
  return data as { delivered: boolean; mode: NotificationChannel }
}
