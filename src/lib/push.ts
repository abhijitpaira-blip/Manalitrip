// Real push notifications for the trip site, built on the browser's native
// Web Push API plus two Supabase Edge Functions already deployed to this
// project: trip-push-subscribe and trip-push-notify. No Firebase involved.

const SUPABASE_FUNCTIONS_URL = 'https://suhitvaqwvqowlwuqvpc.supabase.co/functions/v1'
const VAPID_PUBLIC_KEY = 'BEftanAz1bZOKvpIGMM2tdqzsr3HBcFSrHMB9uFR3ovJuy4K9iAubJ20K1OJthQIt2RgRn0UdSSfIZOdNruv1Ys'
const SUBSCRIBE_SECRET = '44400beb357d387c675e446d57188b56'
const NOTIFY_SECRET = '350d8b1deefda72b8c4ea8543c0011fe'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

type EnableResult = { ok: true } | { ok: false; reason: string }

// memberId must be a lowercase, no-space slug: abhijit, maitrayee, ariyan,
// rakesh, sumona, arannya, rajesh, chaitrayee, tanishka, bikash, susoma, litchamp
export async function enableTripNotifications(memberId: string): Promise<EnableResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'not-supported' }
  }
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, reason: 'denied' }

    const registration = await navigator.serviceWorker.register('/service-worker.js')
    await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/trip-push-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member: memberId, subscription: subscription.toJSON(), secret: SUBSCRIBE_SECRET }),
    })
    const data = await res.json().catch(() => ({}))
    return data.ok ? { ok: true } : { ok: false, reason: data.error || 'server-error' }
  } catch (error) {
    return { ok: false, reason: String(error) }
  }
}

type NotifyOptions = { title: string; body: string; excludeMemberId?: string; memberId?: string }

// Fire-and-forget — never let a notification failure block the chat/action itself.
export async function notifyTrip({ title, body, excludeMemberId, memberId }: NotifyOptions): Promise<void> {
  try {
    await fetch(`${SUPABASE_FUNCTIONS_URL}/trip-push-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, excludeMember: excludeMemberId, member: memberId, secret: NOTIFY_SECRET }),
    })
  } catch {
    // Notifications are a nice-to-have — silently ignore failures.
  }
}
