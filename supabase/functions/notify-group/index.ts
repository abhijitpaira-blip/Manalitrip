import { corsHeaders } from '../_shared/cors.ts'

type RequestBody = { channel: 'whatsapp' | 'telegram' | 'mock'; message: string }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { channel, message } = await request.json() as RequestBody
    if (!message?.trim()) throw new Error('Message is required')
    if (channel === 'mock') return json({ delivered: false, mode: 'mock' })

    if (channel === 'telegram') {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
      if (!token || !chatId) throw new Error('Telegram secrets are not configured')
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: message }) })
      if (!response.ok) throw new Error(`Telegram returned ${response.status}`)
      return json({ delivered: true, mode: 'telegram' })
    }

    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const recipient = Deno.env.get('WHATSAPP_RECIPIENT_NUMBER')
    if (!accessToken || !phoneNumberId || !recipient) throw new Error('WhatsApp secrets are not configured')
    const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient, type: 'text', text: { preview_url: false, body: message } }) })
    if (!response.ok) throw new Error(`WhatsApp returned ${response.status}`)
    return json({ delivered: true, mode: 'whatsapp' })
  } catch (error) {
    return json({ delivered: false, error: error instanceof Error ? error.message : 'Notification failed' }, 400)
  }
})

function json(body: Record<string, unknown>, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
