import { corsHeaders } from '../_shared/cors.ts'

const itinerary = [
  ['Day 1', 'Shimla pick-up and hotel transfer', 'Mall Road'],
  ['Day 2', 'Shimla local and Kufri sightseeing', 'The Ridge, Christ Church, Lakkar Bazaar, Kufri Himalayan Nature Park'],
  ['Day 3', 'Shimla to Manali', 'Kullu Valley, Sundernagar Lake, Pandoh Dam'],
  ['Day 4', 'Solang Valley and Atal Tunnel', 'Solang Valley, Atal Tunnel, Sissu'],
  ['Day 5', 'Manali to Kasol stay', 'Old Manali, Hadimba Devi Temple, Vashisht Temple'],
  ['Day 6', 'Kasol to Amritsar transfer', 'Manikaran Sahib, Kasol'],
  ['Day 7', 'Amritsar local sightseeing', 'Golden Temple, Wagah Border, Partition Museum'],
  ['Day 8', 'Amritsar drop', 'Jallianwala Bagh, Durgiana Temple, Gobindgarh Fort'],
]
const quotes = ['A beautiful journey begins with one shared plan.', 'The best views are waiting for the whole family.', 'Every day closer is one day nearer to our mountain story.', 'Pack a little excitement with your breakfast today.']

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const today = new Date()
    const start = new Date('2026-10-16T00:00:00Z')
    const days = Math.ceil((start.getTime() - today.getTime()) / 86400000)
    const index = days > 0 ? 0 : Math.min(7, Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000)))
    const plan = itinerary[index]
    const message = days > 0
      ? `🏔️ Himachal Family Trip 2026\n\nGood morning, family! Only ${days} days to go. ${quotes[days % quotes.length]}\n\nNext plan: ${plan[0]} — ${plan[1]}\nPlaces: ${plan[2]}\nSuggested start: 8:00 AM. Please check medicines, warm layers, water and snacks.\n\nPlease reply “Ready” after checking your family preparations.`
      : `❤️ HIMACHAL JOURNEY STARTS TODAY!\n\nGood morning, family! Wishing everyone a very happy journey. Today we begin together.\n\nToday's plan: ${plan[0]} — ${plan[1]}\nPlaces: ${plan[2]}\nPlease be ready, carry your essentials, and travel safely together.`
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
    if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are not configured')
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: message }) })
    if (!response.ok) throw new Error(`Telegram returned ${response.status}`)
    return json({ delivered: true, daysRemaining: days, plan: plan[1] })
  } catch (error) {
    return json({ delivered: false, error: error instanceof Error ? error.message : 'Daily notification failed' }, 400)
  }
})

function json(body: Record<string, unknown>, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
