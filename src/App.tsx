import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Bell, Camera, Check, ChevronRight, CloudSun, Download, ExternalLink, IndianRupee, MapPin, Menu, Mountain, Plus, RefreshCw, Send, ShieldCheck, Users, Utensils } from 'lucide-react'
import { checklist, families, itinerary } from './data/trip'
import { placeGuides } from './data/guides'
import { isCloudSyncReady, supabase } from './lib/supabase'
import { uploadTripPhoto } from './lib/gallery'
import { askGemini, isGeminiReady } from './lib/gemini'
import { notifyGroup } from './lib/notifications'
import { enableTripNotifications, notifyTrip } from './lib/push'
import AuthGate from './components/AuthGate'

const startDate = new Date('2026-10-16T00:00:00')
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const members = ['Abhijit', 'Maitrayee', 'Ariyan', 'Rakesh', 'Sumona', 'Arannya', 'Rajesh', 'Chaitrayee', 'Tanishka', 'Bikash', 'Susoma', 'Lit Champ']
// Matches the member ids used by the trip-push-subscribe / trip-push-notify
// Supabase Edge Functions (lowercase, no spaces).
const slugifyMember = (name: string) => name.toLowerCase().replace(/\s+/g, '')
const starterPoll = [
  { option: 'Amritsari kulcha dinner', votes: ['Rajesh', 'Sumona'] },
  { option: 'Himachali sidu and thukpa', votes: ['Maitrayee'] },
  { option: 'Simple dal, rice and vegetables', votes: [] },
]
const morningQuotes = [
  'A beautiful journey begins with one shared plan.',
  'Let the countdown turn ordinary mornings into anticipation.',
  'The best views are waiting for the whole family.',
  'Pack a little excitement with your breakfast today.',
  'Every day closer is one day nearer to our mountain story.',
]
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const placeImages: Record<string, string> = {
  'Mall Road': 'https://commons.wikimedia.org/wiki/Special:FilePath/Mall_Road_Shimla_1.jpg',
  'Lakkar Bazaar': 'https://commons.wikimedia.org/wiki/Special:FilePath/Longwood_(Shimla).jpg',
  'Sundernagar Lake': 'https://commons.wikimedia.org/wiki/Special:FilePath/Beas_river%2C_Aut_Himachal_8.jpg',
  'Sissu': 'https://commons.wikimedia.org/wiki/Special:FilePath/Top_View_of_Sissu_%2C_Lahaul.jpg',
  'Old Manali': 'https://commons.wikimedia.org/wiki/Special:FilePath/Old_Manali_2.jpg',
  'Vashisht Temple': 'https://commons.wikimedia.org/wiki/Special:FilePath/Vashisht_temple_near_manali.jpg',
  'Kasol': 'https://commons.wikimedia.org/wiki/Special:FilePath/Water_stream_in_Kasol_Parvati_Valley.jpg',
  'Jallianwala Bagh': 'https://commons.wikimedia.org/wiki/Special:FilePath/Jallianwala_Bagh_Memorial_in_Amritsar.jpg',
  'Durgiana Temple': 'https://commons.wikimedia.org/wiki/Special:FilePath/Durgiana_Temple%2C_Amritsar.jpg',
  'Gobindgarh Fort': 'https://commons.wikimedia.org/wiki/Special:FilePath/Gobindgarh_fort%2C_Amritsar%2C_Punjab%2C_India.jpg',
  'Golden Temple': 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Golden_Temple_%28Harmandir_Sahib%29_in_Amritsar%2C_India.jpg',
  'Wagah Border': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/A_crowd_of_patriotic_Indians_near_the_Wagah_Border%2C_Punjab%2C_India%2C_7_April_2023.jpg',
  'Partition Museum': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Partition_Museum%2C_Amritsar%2C_India.jpg',
  'The Ridge': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Ridge%2C_Shimla.JPG',
  'Christ Church': 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Christ_Church%2C_Shimla.jpg',
  'Kufri Himalayan Nature Park': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Goral_of_Himalayan_Nature_Park%2C_Kufri.jpg',
  'Kullu Valley': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Kullu_Valley%2C_Vashisht%2C_Manali%2C_Apples%2C_India.jpg',
  'Pandoh Dam': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Pandoh_dam_manali.jpg',
  'Solang Valley': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Solang_Valley%2C_Manali.jpg',
  'Atal Tunnel': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/PM_Narendra_Modi_stands_at_the_entrance_to_the_Atal_Tunnel_in_Rohtang.jpg',
  'Hadimba Devi Temple': 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Hidimba_Devi_Temple%2C_Dhungri_Manali_2.jpg',
  'Manikaran Sahib': 'https://upload.wikimedia.org/wikipedia/commons/d/da/Manikaran_Sahib_.jpg',
}

type DestinationInfo = { tagline: string; image: string; tags: string[]; history: string; places: string[]; bestTime: string; food: string[]; photography: string[] }

const destinationOrder = ['Shimla', 'Manali', 'Kasol', 'Amritsar']
const destinationDetails: Record<string, DestinationInfo> = {
  Shimla: {
    tagline: 'The Queen of Hills, colonial charm, pine forests and cool mountain air.',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop',
    tags: ['Mall Road', 'Jakhoo Temple', 'The Ridge'],
    history: 'Shimla was built up by the British as the summer capital of colonial India, and its Tudor-style buildings, church spires and the heritage Kalka-Shimla railway still carry that character today. The Ridge and Mall Road remain the social heart of the town, now framed by deodar and pine forest.',
    places: ['The Ridge', 'Mall Road', 'Jakhoo Temple', 'Christ Church', 'Kufri', 'Shimla State Museum'],
    bestTime: 'Mid to late October brings clear skies, cool days and crisp evenings, ideal for walking Mall Road and the Ridge before winter snow sets in. Carry a warm layer for the evenings.',
    food: ['Siddu', 'Chana Madra', 'Dham', 'Tudkiya Bhath', 'Himachali Rajma'],
    photography: ['Sunrise from The Ridge', 'Jakhoo Temple viewpoint over the valley', 'Kufri meadows', 'Christ Church facade in the golden hour'],
  },
  Manali: {
    tagline: 'Snow-capped peaks, river valleys and the gateway to the high Himalayas.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Solang_Valley%2C_Manali.jpg',
    tags: ['Solang Valley', 'Old Manali', 'Hadimba Temple'],
    history: 'Set on the Beas river in the Kullu valley, Manali has long been a crossing point toward Ladakh and Lahaul-Spiti. Old Manali keeps its quiet, orchard-lined lanes, while the centuries-old Hadimba Temple, built in 1553 around a cave shrine, reflects the valley\'s deep local traditions.',
    places: ['Solang Valley', 'Old Manali', 'Hadimba Devi Temple', 'Manu Temple', 'Mall Road', 'Vashisht hot springs', 'Atal Tunnel'],
    bestTime: 'October is post-monsoon and clear, with pleasant days and cold nights; higher points like Solang and Atal Tunnel can already see early snow, so pack warm layers.',
    food: ['Siddu', 'Thukpa', 'Momos', 'Himachali dishes', 'Old Manali cafe food'],
    photography: ['Solang Valley mountain views', 'Old Manali riverside lanes', 'Hadimba Temple in the deodar forest', 'Atal Tunnel and the Sissu road'],
  },
  Kasol: {
    tagline: 'A quiet Parvati Valley village of rivers, cafes and forest trails.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Manikaran_Sahib_.jpg',
    tags: ['Parvati River', 'Manikaran Sahib', 'Cafes'],
    history: 'Kasol grew as a stop on the backpacker trail through the Parvati Valley and today mixes that laid-back cafe culture with the older pilgrimage town of Manikaran Sahib nearby, known for its Sikh gurudwara and natural hot springs.',
    places: ['Parvati River banks', 'Manikaran Sahib', 'Village cafes', 'Chalal nature walk', 'Forest trails toward Tosh'],
    bestTime: 'October keeps the valley cool and clear with good visibility for walks along the river; evenings turn cold quickly once the sun drops behind the ridge.',
    food: ['Israeli-style cafe food', 'Momos', 'Thukpa', 'Local Himachali thali'],
    photography: ['Parvati River from the footbridges', 'Valley viewpoints above the village', 'Forest trails toward Chalal', 'Manikaran hot springs at dusk'],
  },
  Amritsar: {
    tagline: 'The spiritual heart of Punjab, home to the shining Golden Temple.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Golden_Temple_%28Harmandir_Sahib%29_in_Amritsar%2C_India.jpg',
    tags: ['Golden Temple', 'Wagah Border', 'Jallianwala Bagh'],
    history: 'Founded by the fourth Sikh Guru, Guru Ram Das, around the sacred tank at its centre, Amritsar grew around the Harmandir Sahib, the Golden Temple, completed in the early 1600s. The city also carries the weight of modern history at Jallianwala Bagh, where a 1919 massacre became a turning point in India\'s freedom movement.',
    places: ['Golden Temple (Harmandir Sahib)', 'Jallianwala Bagh', 'Wagah Border ceremony', 'Partition Museum'],
    bestTime: 'October is warm through the day and pleasant by evening, a comfortable window before Punjab\'s cold winter fog sets in; early morning is the calmest time at the Golden Temple.',
    food: ['Amritsari kulcha', 'Chole', 'Lassi', 'Amritsari fish', 'Punjabi thali'],
    photography: ['Golden Temple reflection in the Amrit Sarovar', 'The temple lit up at night', 'Heritage streets near the old city', 'The Wagah Border retreat ceremony'],
  },
}

const photoChallenges = [
  { day: 1, place: 'Shimla', prompt: 'Full family photo at Shimla' },
  { day: 2, place: 'Shimla', prompt: 'Mountain background photo' },
  { day: 3, place: 'Manali', prompt: 'Manali group photo' },
  { day: 4, place: 'Manali', prompt: 'Traditional Himachali photo' },
  { day: 5, place: 'Kasol', prompt: 'Parvati Valley photo' },
  { day: 6, place: 'Kasol', prompt: 'Adventure photo' },
  { day: 7, place: 'Amritsar', prompt: 'Golden Temple family photo' },
  { day: 8, place: 'Amritsar', prompt: 'Final trip group photo' },
]

type Memory = { id: number | string; src: string; day: number; place: string; time: string; uploader: string; caption: string; quote: string }
type GuideWithMedia = { name: string; region: string; highlights: string; bestTime: string; history: string; food: string; mapQuery: string; imageUrl: string; moment: string }
type ChatMessage = { id: number | string; member: string; text: string; time: string }
type StoredChatMessage = { id: string; member: string; text: string; created_at: string }
type Expense = { id: number | string; description: string; amount: number; paidBy: string; participants: string[]; createdAt: string }
type StoredExpense = { id: string; description: string; amount: number; paid_by_member: string | null; created_at: string; expense_participants: { member: string }[] }
type StoredPhoto = { id: string; storage_path: string; uploaded_by: string; trip_day: number | null; place: string | null; caption: string | null; created_at: string }
type Settlement = { from: string; to: string; amount: number }

type NotificationChannel = 'mock' | 'telegram' | 'whatsapp'

const starterMemories: Memory[] = [
  { id: 1, src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85', day: 1, place: 'Shimla', time: '5:30 PM', uploader: 'Abhijit', caption: 'First mountain evening', quote: 'The best journeys are shared.' },
  { id: 2, src: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=900&q=85', day: 4, place: 'Solang Valley', time: '9:15 AM', uploader: 'Maitrayee', caption: 'Crisp air, wide skies', quote: 'Collect moments, not things.' },
  { id: 3, src: 'https://images.unsplash.com/photo-1609947017136-9daf8e7e3f4d?auto=format&fit=crop&w=900&q=85', day: 7, place: 'Golden Temple', time: '6:45 AM', uploader: 'Rakesh', caption: 'A quiet golden morning', quote: 'Some places stay with us.' },
]

const starterMessages: ChatMessage[] = [
  { id: 1, member: 'Abhijit', text: 'Everyone please check the medicine and breakfast responsibilities.', time: '9:10 AM' },
  { id: 2, member: 'Maitrayee', text: 'Ready for the mountain mornings!', time: '9:16 AM' },
]
const starterExpenses: Expense[] = [
  { id: 1, description: 'Hotel advance', amount: 10000, paidBy: 'Abhijit', participants: ['Abhijit', 'Rakesh', 'Rajesh', 'Bikash'], createdAt: '2026-09-01T10:00:00.000Z' },
]

function App() {
  const [now, setNow] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(2)
  const [done, setDone] = useState<string[]>([])
  const [activeSection, setActiveSection] = useState('home')
  const [notes, setNotes] = useState<string[]>(['Remember warm layers for Kasol nights.'])
  const [noteText, setNoteText] = useState('')
  const [responsibilities, setResponsibilities] = useState([
    { item: 'First-aid and medicines', person: 'Abhijit', done: false },
    { item: 'Breakfast supplies', person: 'Rakesh', done: true },
    { item: 'Dinner snacks', person: 'Rajesh', done: false },
    { item: 'Water and chargers', person: 'Bikash', done: false },
  ])
  const [poll, setPoll] = useState(starterPoll)
  const [pollOption, setPollOption] = useState('')
  const [voter, setVoter] = useState('Abhijit')
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>('telegram')
  const [notificationStatus, setNotificationStatus] = useState('')
  const [reminderStatus, setReminderStatus] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(starterMessages)
  const [chatText, setChatText] = useState('')
  const [chatMember, setChatMember] = useState(() => localStorage.getItem('trip-chat-member') || 'Abhijit')
  const [chatStatus, setChatStatus] = useState('')
  const [realtimeStatus, setRealtimeStatus] = useState(isCloudSyncReady ? 'Connecting...' : 'Preview mode')
  const [expenses, setExpenses] = useState<Expense[]>(starterExpenses)
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expensePayer, setExpensePayer] = useState('Abhijit')
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>(members)
  const [expenseStatus, setExpenseStatus] = useState('')
  const [memories, setMemories] = useState<Memory[]>(starterMemories)
  const [galleryDay, setGalleryDay] = useState('all')
  const [uploader, setUploader] = useState('Abhijit')
  const [galleryPlace, setGalleryPlace] = useState('Shimla')
  const [galleryTime, setGalleryTime] = useState('')
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryStatus, setGalleryStatus] = useState('')
  const [geminiPrompt, setGeminiPrompt] = useState('Write a 2-line family trip welcome message for the group.')
  const [geminiReply, setGeminiReply] = useState('Gemini is not connected yet.')
  const [geminiStatus, setGeminiStatus] = useState('')
  const [pushStatus, setPushStatus] = useState('')
  const [activeDestination, setActiveDestination] = useState<string | null>(null)
  const [sosStage, setSosStage] = useState<'idle' | 'active'>('idle')
  const [sosHoldPct, setSosHoldPct] = useState(0)
  const [sosLocationText, setSosLocationText] = useState('')
  const [sosMapUrl, setSosMapUrl] = useState('')
  const [sosTimeText, setSosTimeText] = useState('')
  const sosIntervalRef = useRef<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  // Remembers who is using this device/browser, so the same name is
  // pre-selected next time and "Enable notifications" knows who to register.
  useEffect(() => {
    localStorage.setItem('trip-chat-member', chatMember)
  }, [chatMember])

  const refreshWebsite = () => window.location.reload()

  useEffect(() => {
    const refreshTimer = window.setInterval(refreshWebsite, 10 * 60 * 1000)
    return () => window.clearInterval(refreshTimer)
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return

    let active = true
    const channel = client
      .channel('trip-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (!active) return
        const message = payload.new as StoredChatMessage
        setChatMessages((current) => current.some((item) => String(item.id) === message.id) ? current : [...current, {
          id: message.id,
          member: message.member,
          text: message.text,
          time: new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        }])
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('Live sync')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('Sync unavailable')
      })

    const loadMessages = async () => {
      const { data, error } = await client
        .from('chat_messages')
        .select('id, member, text, created_at')
        .order('created_at', { ascending: true })

      if (!active) return
      if (error) {
        setChatStatus('Could not load the shared chat. Try again shortly.')
        return
      }
      setChatMessages((data as StoredChatMessage[]).map((message) => ({
        id: message.id,
        member: message.member,
        text: message.text,
        time: new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      })))
    }

    void loadMessages()
    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return

    let active = true
    const loadExpenses = async () => {
      const { data, error } = await client
        .from('expenses')
        .select('id, description, amount, paid_by_member, created_at, expense_participants(member)')
        .not('paid_by_member', 'is', null)
        .order('created_at', { ascending: true })

      if (!active) return
      if (error) {
        setExpenseStatus('Could not load shared expenses. Try again shortly.')
        return
      }
      setExpenses((data as StoredExpense[]).map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paid_by_member ?? 'Unknown member',
        participants: expense.expense_participants.map((participant) => participant.member),
        createdAt: expense.created_at,
      })))
    }

    const channel = client
      .channel('trip-expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => { void loadExpenses() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_participants' }, () => { void loadExpenses() })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('Live sync')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('Sync unavailable')
      })

    void loadExpenses()
    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return

    let active = true
    const loadPhotos = async () => {
      const { data, error } = await client
        .from('photos')
        .select('id, storage_path, uploaded_by, trip_day, place, caption, created_at')
        .order('created_at', { ascending: false })

      if (!active || error) return
      const cloudMemories = (data as StoredPhoto[]).map((photo) => {
        const [time, ...captionParts] = (photo.caption ?? 'Trip memory').split(' · ')
        return {
          id: photo.id,
          src: client.storage.from('trip-photos').getPublicUrl(photo.storage_path).data.publicUrl,
          day: photo.trip_day ?? 1,
          place: photo.place ?? 'Himachal',
          time,
          uploader: photo.uploaded_by,
          caption: captionParts.join(' · ') || 'Trip memory',
          quote: 'The road is better with all of us on it.',
        }
      })
      setMemories((current) => [...cloudMemories, ...current.filter((memory) => typeof memory.id === 'number')])
    }

    const channel = client
      .channel('trip-photos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => { void loadPhotos() })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('Live sync')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('Sync unavailable')
      })

    void loadPhotos()
    return () => {
      active = false
      void client.removeChannel(channel)
    }
  }, [])

  const days = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / 86400000))
  const reminderEnabled = days <= 40 && days >= 0
  const nextDay = itinerary.find((item) => item.day === Math.min(8, Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / 86400000) + 1))) ?? itinerary[0]
  const reminderTitle = days > 0 ? `${days} days to Himachal` : 'Himachal journey starts today!'
  const reminderMessage = days > 0 ? `Good morning, family! ${morningQuotes[days % morningQuotes.length]} Next: Day ${nextDay.day}, ${nextDay.title}.` : 'Good morning, family! Wishing everyone a very happy journey. Today we begin together.'
  const selected = itinerary.find((item) => item.day === selectedDay) ?? itinerary[0]

  const guideFor = (place: string): GuideWithMedia => {
    const guide = placeGuides[place]
    const isPunjab = ['Golden Temple', 'Wagah Border', 'Partition Museum', 'Jallianwala Bagh', 'Durgiana Temple', 'Gobindgarh Fort'].includes(place)
    const imageUrl = placeImages[place] ?? (isPunjab
      ? 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=80'
      : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80')

    if (guide) {
      return { ...guide, imageUrl, moment: 'Pause here together for a family photograph, a quiet look around, and one story to carry home.' }
    }

    return {
      name: place,
      region: 'Himachal route',
      highlights: 'Enjoy the local scenery, take photographs from safe viewpoints and follow local guidance.',
      bestTime: 'Daylight hours, with extra time kept for mountain-road conditions.',
      history: 'This stop is part of the cultural and scenic route connecting the family trip’s mountain destinations.',
      food: 'Choose a clean local cafe and try the regional thali, chai or a fresh seasonal snack.',
      mapQuery: place,
      imageUrl,
      moment: 'Pause here together for a family photograph, a quiet look around, and one story to carry home.',
    }
  }

  const progress = Math.round((done.length / checklist.length) * 100)

  const balanceByMember = members.reduce<Record<string, number>>((balances, member) => {
    balances[member] = 0
    return balances
  }, {})
  expenses.forEach((expense) => {
    const share = expense.amount / expense.participants.length
    balanceByMember[expense.paidBy] += expense.amount
    expense.participants.forEach((member) => { balanceByMember[member] -= share })
  })
  const settlements: Settlement[] = []
  const creditors = Object.entries(balanceByMember).filter(([, balance]) => balance > 0.01).map(([member, balance]) => ({ member, balance }))
  const debtors = Object.entries(balanceByMember).filter(([, balance]) => balance < -0.01).map(([member, balance]) => ({ member, balance: -balance }))
  let creditorIndex = 0
  let debtorIndex = 0
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const amount = Math.min(creditors[creditorIndex].balance, debtors[debtorIndex].balance)
    settlements.push({ from: debtors[debtorIndex].member, to: creditors[creditorIndex].member, amount })
    creditors[creditorIndex].balance -= amount
    debtors[debtorIndex].balance -= amount
    if (creditors[creditorIndex].balance < 0.01) creditorIndex += 1
    if (debtors[debtorIndex].balance < 0.01) debtorIndex += 1
  }

  const addExpense = async () => {
    const amount = Number(expenseAmount)
    const description = expenseDescription.trim()
    if (!description || !Number.isFinite(amount) || amount <= 0 || expenseParticipants.length === 0) {
      setExpenseStatus('Add a description, amount and at least one member.')
      return
    }
    const expense: Expense = { id: Date.now(), description, amount, paidBy: expensePayer, participants: expenseParticipants, createdAt: new Date().toISOString() }
    setExpenseDescription('')
    setExpenseAmount('')
    if (supabase) {
      const { data, error } = await supabase.from('expenses').insert({ description, amount: Math.round(amount), paid_by_member: expensePayer }).select('id, description, amount, paid_by_member, created_at').single()
      if (error || !data) {
        setExpenseStatus('Could not save this expense. Please try again.')
        return
      }
      const { error: participantError } = await supabase.from('expense_participants').insert(expenseParticipants.map((member) => ({ expense_id: data.id, member })))
      if (participantError) {
        setExpenseStatus('Expense saved, but its participants could not be saved.')
        return
      }
      setExpenses((current) => [...current, { ...expense, id: data.id }])
      try {
        await notifyGroup(`💰 New trip expense\n\n${description}: ${money.format(amount)}\nPaid by: ${expensePayer}\nShared by: ${expenseParticipants.join(', ')}\nEach share: ${money.format(amount / expenseParticipants.length)}`, 'telegram')
        setExpenseStatus('Expense saved and shared. Telegram notification sent.')
      } catch {
        setExpenseStatus('Expense saved and shared, but Telegram notification could not be sent.')
      }
      return
    }
    setExpenses((current) => [...current, expense])
    setExpenseStatus('Preview mode: this expense is visible only in this browser.')
  }

  const notifyOutstandingMembers = async () => {
    const owing = settlements
    const message = owing.length > 0
      ? owing.map((settlement) => `${settlement.from} pays ${money.format(settlement.amount)} to ${settlement.to}`).join('. ')
      : 'No outstanding repayments are due right now.'
    if ('Notification' in window) {
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
      if (permission === 'granted') new Notification('Trip budget reminder', { body: message })
    }
    setExpenseStatus(message)
  }

  const goTo = (section: string, target: string) => {
    setActiveSection(section)
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const mapEmbedUrl = (query: string) => googleMapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleMapsApiKey)}&q=${encodeURIComponent(query)}`
    : undefined

  const addNote = () => {
    if (!noteText.trim()) return
    setNotes((current) => [...current, noteText.trim()])
    setNoteText('')
  }

  const vote = (index: number) => {
    setPoll((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index && !item.votes.includes(voter)
          ? { ...item, votes: [...item.votes, voter] }
          : item,
      ),
    )
  }

  const addPollOption = () => {
    if (!pollOption.trim()) return
    const value = pollOption.trim()
    if (poll.some((item) => item.option.toLowerCase() === value.toLowerCase())) return
    setPoll((current) => [...current, { option: value, votes: [] }])
    setPollOption('')
  }

  // Registers this device to receive real push notifications for whoever is
  // currently selected in the chat composer. Uses the browser's native Web
  // Push API via two Supabase Edge Functions — no Firebase involved.
  const handleEnableNotifications = async () => {
    setPushStatus('Enabling notifications...')
    const result = await enableTripNotifications(slugifyMember(chatMember))
    if (result.ok) {
      setPushStatus(`Notifications on for ${chatMember} on this device.`)
    } else if (result.reason === 'denied') {
      setPushStatus('Notification permission was not granted.')
    } else if (result.reason === 'not-supported') {
      setPushStatus('This browser does not support push notifications.')
    } else {
      setPushStatus('Could not enable notifications on this device.')
    }
  }

  const triggerSos = () => {
    const now = new Date()
    setSosStage('active')
    setSosTimeText(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    const postAlert = async (text: string) => {
      if (supabase) {
        await supabase.from('chat_messages').insert({ member: chatMember, text })
      }
      void notifyTrip({ title: 'Emergency SOS', body: `${chatMember} triggered an SOS alert`, excludeMemberId: slugifyMember(chatMember) })
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`
          setSosMapUrl(mapUrl)
          setSosLocationText('Location shared with the family')
          void postAlert(`SOS! ${chatMember} needs help. Last known location: ${mapUrl}`)
        },
        () => {
          setSosLocationText('Location unavailable')
          void postAlert(`SOS! ${chatMember} needs help. Location unavailable.`)
        },
        { timeout: 8000 }
      )
    } else {
      setSosLocationText('Location unavailable')
      void postAlert(`SOS! ${chatMember} needs help. Location unavailable.`)
    }
  }

  const startSosHold = () => {
    if (sosStage === 'active') return
    const startedAt = Date.now()
    sosIntervalRef.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / 3000) * 100)
      setSosHoldPct(pct)
      if (pct >= 100) {
        if (sosIntervalRef.current) window.clearInterval(sosIntervalRef.current)
        sosIntervalRef.current = null
        triggerSos()
      }
    }, 60)
  }

  const cancelSosHold = () => {
    if (sosIntervalRef.current) {
      window.clearInterval(sosIntervalRef.current)
      sosIntervalRef.current = null
    }
    setSosHoldPct(0)
  }

  const markSafe = () => {
    setSosStage('idle')
    setSosHoldPct(0)
    setSosMapUrl('')
    setSosLocationText('')
    if (supabase) {
      void supabase.from('chat_messages').insert({ member: chatMember, text: `${chatMember} is safe now.` })
    }
    void notifyTrip({ title: 'All clear', body: `${chatMember} marked themselves safe`, excludeMemberId: slugifyMember(chatMember) })
  }

  const sendChatMessage = async () => {
    if (!chatText.trim()) return
    const text = chatText.trim()
    setChatText('')

    if (supabase) {
      setChatStatus('Sending to the family...')
      const { error } = await supabase.from('chat_messages').insert({ member: chatMember, text })
      if (error) {
        setChatStatus('Message could not be sent. Please try again.')
        setChatText(text)
        return
      }
      setChatStatus('Message sent to everyone.')
      void notifyTrip({ title: 'New trip message', body: `${chatMember}: ${text}`, excludeMemberId: slugifyMember(chatMember) })
      return
    }

    setChatMessages((current) => [...current, { id: Date.now(), member: chatMember, text, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }])
    setChatStatus('Preview mode: this message is only visible in this browser.')
  }

  const shareUpdate = async () => {
    setNotificationStatus('Sending...')
    try {
      const result = await notifyGroup(noteText.trim() || 'Trip update', notificationChannel)
      setNotificationStatus(result?.delivered ? `Sent through ${result.mode}.` : 'Preview notice prepared. Configure Supabase and the selected channel to deliver it.')
    } catch (error) {
      setNotificationStatus(error instanceof Error ? error.message : 'Notification failed. Please try again.')
    }
  }

  const enableMorningReminder = async () => {
    if (!('Notification' in window)) {
      setReminderStatus('Browser notifications are not supported here.')
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      localStorage.setItem('himachal-morning-reminder', 'enabled')
      setReminderStatus('Morning countdown reminder enabled on this device.')
    } else {
      setReminderStatus('Notification permission was not granted.')
    }
  }

  useEffect(() => {
    if (localStorage.getItem('himachal-morning-reminder') === 'enabled' && Notification.permission === 'granted' && reminderEnabled) {
      const key = `himachal-reminder-${now.toISOString().slice(0, 10)}`
      if (!localStorage.getItem(key)) {
        new Notification(reminderTitle, { body: reminderMessage })
        localStorage.setItem(key, 'sent')
      }
    }
  }, [now, reminderEnabled, reminderMessage, reminderTitle])

  const filteredMemories = memories.filter((memory) => galleryDay === 'all' || memory.day === Number(galleryDay))

  const startPhotoChallenge = (day: number, place: string, prompt: string) => {
    setSelectedDay(day)
    setGalleryPlace(place)
    setGalleryCaption(prompt)
    fileInput.current?.click()
  }

  const uploadMemories = async (files: FileList | null) => {
    if (!files?.length) return

    const uploaded: Memory[] = []
    for (const [index, file] of Array.from(files).filter((candidate) => candidate.type.startsWith('image/')).entries()) {
      const metadata = { uploader, day: selectedDay, place: galleryPlace, time: galleryTime || 'Trip memory', caption: galleryCaption || file.name.replace(/\.[^/.]+$/, '') }

      try {
        const cloudPhoto = await uploadTripPhoto(file, metadata)
        uploaded.push({
          id: Date.now() + index,
          src: cloudPhoto?.publicUrl ?? URL.createObjectURL(file),
          day: selectedDay,
          place: galleryPlace,
          time: metadata.time,
          uploader,
          caption: metadata.caption,
          quote: 'The road is better with all of us on it.',
        })
      } catch {
        setGalleryStatus('Photo upload failed. Please check your connection and try again.')
        return
      }
    }

    setMemories((current) => [...uploaded, ...current])
    setGalleryStatus(`${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} added${isCloudSyncReady ? ' and shared with the group.' : '. Preview mode keeps them in this browser.'}`)
  }

  const downloadMemory = (memory: Memory) => {
    const link = document.createElement('a')
    link.href = memory.src
    link.download = `${memory.place}-day-${memory.day}.jpg`
    link.click()
  }

  const downloadAllMemories = () => {
    filteredMemories.forEach((memory, index) => window.setTimeout(() => downloadMemory(memory), index * 180))
    setGalleryStatus(`Downloading ${filteredMemories.length} memories...`)
  }

  const runGeminiTest = async () => {
    if (!geminiPrompt.trim()) return
    setGeminiStatus('Asking Gemini...')
    try {
      const answer = await askGemini(geminiPrompt.trim())
      setGeminiReply(answer)
      setGeminiStatus(isGeminiReady ? 'Gemini connected successfully.' : 'Gemini is enabled in the app but needs an API key in .env.')
    } catch (error) {
      setGeminiReply(error instanceof Error ? error.message : 'Gemini request failed.')
      setGeminiStatus('Gemini connection error.')
    }
  }

  const askGeminiAndSendToTelegram = async () => {
    if (!geminiPrompt.trim()) return
    setGeminiStatus('Gemini is writing the Telegram message...')
    try {
      const answer = await askGemini(`Write a concise, family-friendly Telegram message for the Himachal Family Trip group. Do not use markdown tables. Keep it under 500 words. Request: ${geminiPrompt.trim()}`)
      setGeminiReply(answer)
      const result = await notifyGroup(answer, 'telegram')
      setGeminiStatus(result.delivered ? 'Gemini message sent to Telegram.' : 'Gemini message prepared. Configure Supabase and Telegram secrets for automatic delivery.')
    } catch (error) {
      setGeminiStatus(error instanceof Error ? error.message : 'Gemini to Telegram delivery failed.')
    }
  }

  return (
    <AuthGate>
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Mountain size={20} /></span>
          <div>
            <strong>Himachal Family Trip</strong>
            <small>16-23 October 2026</small>
          </div>
        </div>

        <div className="header-actions">
          <span className={`sync-status ${realtimeStatus === 'Live sync' ? 'synced' : 'local'}`}><span />{realtimeStatus}</span>
          <button
            className="sos-trigger"
            onPointerDown={startSosHold}
            onPointerUp={cancelSosHold}
            onPointerLeave={cancelSosHold}
            aria-label="Press and hold for 3 seconds to send an emergency SOS alert"
            title="Press and hold for 3 seconds"
          >
            <span className="sos-fill" style={{ width: `${sosHoldPct}%` }} />
            <span className="sos-label">SOS</span>
          </button>
          <button
            className="icon-button"
            aria-label="Notifications"
            title={pushStatus || `Enable notifications for ${chatMember}`}
            onClick={handleEnableNotifications}
          >
            <Bell size={20} />
            <span className="notification-dot" />
          </button>
          <button className="icon-button" onClick={refreshWebsite} aria-label="Refresh trip data" title="Refresh trip data">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main>
        {sosStage === 'active' && (
          <div className="sos-banner">
            <div className="sos-banner-head">
              <strong>Emergency alert sent</strong>
              <span>{sosTimeText}</span>
            </div>
            <p>{chatMember} triggered an SOS. The family has been notified{sosLocationText ? ` \u2014 ${sosLocationText}` : ''}.</p>
            <div className="sos-banner-actions">
              {sosMapUrl && (
                <a className="secondary-button" href={sosMapUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} /> View location
                </a>
              )}
              <button className="primary-button" onClick={markSafe}>
                <ShieldCheck size={16} /> I'm safe now
              </button>
            </div>
          </div>
        )}

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">OUR NEXT CHAPTER</p>
            <h1>Mountain roads.<br /><em>Family stories.</em></h1>
            <p className="hero-subtitle">Shimla <span>•</span> Manali <span>•</span> Kasol <span>•</span> Amritsar</p>
            <div className="countdown"><strong>{days}</strong><span>days to go</span></div>
            <button className="primary-button" onClick={() => document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' })}>Explore the trip <ArrowRight size={17} /></button>
          </div>
          <div className="hero-stamp"><Mountain size={34} /><span>7N / 8D</span><small>12 travellers</small></div>
        </section>

        <section id="home" className="stat-grid">
          <Stat icon={<CloudSun />} label="October weather" value="Crisp & clear" />
          <Stat icon={<MapPin />} label="Today's base" value="Shimla" />
          <Stat icon={<Users />} label="Our circle" value="4 families" />
          <Stat icon={<IndianRupee />} label="Tour fund" value={money.format(175896)} />
        </section>

        <section className="destinations-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WHERE WE'RE HEADED</p>
              <h2>Our destinations</h2>
            </div>
          </div>
          <div className="destination-grid">
            {destinationOrder.map((name) => {
              const destination = destinationDetails[name]
              return (
                <article className="destination-card" key={name}>
                  <img src={destination.image} alt={name} onError={(event) => { event.currentTarget.style.display = 'none' }} />
                  <div className="destination-body">
                    <h3>{name}</h3>
                    <p>{destination.tagline}</p>
                    <div className="place-tags">{destination.tags.map((tag) => <span key={tag}><MapPin size={13} />{tag}</span>)}</div>
                    <button className="text-button destination-link" onClick={() => setActiveDestination(name)}>View details <ChevronRight size={16} /></button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {activeDestination && destinationDetails[activeDestination] && (
          <div className="destination-modal-overlay" onClick={() => setActiveDestination(null)}>
            <article className="destination-modal" onClick={(event) => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setActiveDestination(null)} aria-label="Close destination details">×</button>
              <img className="modal-image" src={destinationDetails[activeDestination].image} alt={activeDestination} onError={(event) => { event.currentTarget.style.display = 'none' }} />
              <div className="modal-body">
                <p className="eyebrow">DESTINATION GUIDE</p>
                <h2>{activeDestination}</h2>
                <p className="modal-tagline">{destinationDetails[activeDestination].tagline}</p>
                <h4>About {activeDestination}</h4>
                <p>{destinationDetails[activeDestination].history}</p>
                <h4>Places to visit</h4>
                <div className="place-tags">{destinationDetails[activeDestination].places.map((place) => <span key={place}><MapPin size={13} />{place}</span>)}</div>
                <h4>Best time to visit</h4>
                <p>{destinationDetails[activeDestination].bestTime}</p>
                <h4>Food to try</h4>
                <div className="place-tags">{destinationDetails[activeDestination].food.map((item) => <span key={item}><Utensils size={13} />{item}</span>)}</div>
                <h4>Best photography spots</h4>
                <div className="place-tags">{destinationDetails[activeDestination].photography.map((spot) => <span key={spot}><Camera size={13} />{spot}</span>)}</div>
              </div>
            </article>
          </div>
        )}

        <section className={`morning-card ${days === 0 ? 'journey-day' : ''}`}>
          <div>
            <p className="eyebrow">{days === 0 ? 'TODAY IS THE DAY' : reminderEnabled ? 'THE FINAL COUNTDOWN' : 'COUNTDOWN NOTES'}</p>
            <h2>{reminderTitle}</h2>
            <p>{reminderMessage}</p>
          </div>
          <div className="morning-actions">
            <button className="secondary-button" onClick={enableMorningReminder}><Bell size={16} /> {reminderEnabled ? 'Enable morning alert' : 'Get trip alerts'}</button>
            {reminderStatus && <small>{reminderStatus}</small>}
          </div>
        </section>

        <section className="photo-challenge-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DAILY CHALLENGE</p>
              <h2>Family photo challenge</h2>
            </div>
          </div>
          <div className="challenge-row">
            {photoChallenges.map((challenge) => {
              const completed = memories.some((memory) => memory.day === challenge.day)
              return (
                <div className={`challenge-card ${completed ? 'completed' : ''}`} key={challenge.day}>
                  <span className="challenge-day">Day {challenge.day}</span>
                  <p className="challenge-prompt">{challenge.prompt}</p>
                  <button className="text-button" onClick={() => startPhotoChallenge(challenge.day, challenge.place, challenge.prompt)}>
                    {completed ? <><Check size={14} /> Add another</> : <><Camera size={14} /> Add photo</>}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="next-day panel">
          <div>
            <p className="eyebrow">NEXT ON THE ROAD</p>
            <h2>Next tour plan</h2>
            <p><strong>Day {nextDay.day} • {nextDay.date}</strong> {nextDay.title}</p>
            <p className="next-day-note">Suggested timing: leave around 8:00 AM, keep daylight for the route, and carry water, warm layers and snacks.</p>
            <div className="place-tags">{nextDay.places.map((place) => <span key={place}><MapPin size={13} />{place}</span>)}</div>
          </div>
          <CloudSun size={28} />
        </section>

        <section className="section-heading">
          <div>
            <p className="eyebrow">THE JOURNEY</p>
            <h2>Eight days, one shared story</h2>
          </div>
          <button className="text-button">View all <ChevronRight size={16} /></button>
        </section>

        <section id="itinerary" className="itinerary-layout">
          <div className="day-list">
            {itinerary.map((item) => (
              <button className={`day-row ${item.day === selectedDay ? 'active' : ''}`} key={item.day} onClick={() => setSelectedDay(item.day)}>
                <span className="day-number">{String(item.day).padStart(2, '0')}</span>
                <span><small>{item.date}</small><strong>{item.title}</strong></span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>

          <article className="day-feature">
            <div className="feature-top">
              <span className="day-pill">DAY {selected.day}</span>
              <span className="weather-note"><CloudSun size={15} /> Pre-winter chill</span>
            </div>
            <h3>{selected.title}</h3>
            <p className="feature-note">{selected.note}</p>
            <div className="place-tags">
              {selected.places.map((place) => (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(guideFor(place).mapQuery)}`} target="_blank" rel="noreferrer" key={place}><MapPin size={13} />{place}<ExternalLink size={12} /></a>
              ))}
            </div>
            <div className="place-guides">
              {selected.places.map((place) => {
                const guide = guideFor(place)
                return (
                  <div className="guide-card" key={place}>
                    <img className="guide-image" src={guide.imageUrl} alt={`${guide.name} travel view`} onError={(event) => { event.currentTarget.style.display = 'none' }} />
                    <div className="guide-heading">
                      <div><span>{guide.region}</span><h4>{guide.name}</h4></div>
                      <a aria-label={`Open ${guide.name} in Google Maps`} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(guide.mapQuery)}`} target="_blank" rel="noreferrer"><MapPin size={16} /></a>
                    </div>
                    {mapEmbedUrl(guide.mapQuery) ? <iframe className="guide-map" title={`${guide.name} live map`} src={mapEmbedUrl(guide.mapQuery)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ display: 'block', width: '100%', height: 150, marginBottom: 12, border: 0 }} /> : <small className="map-note" style={{ display: 'block', marginBottom: 12, color: 'var(--muted)', fontSize: 10 }}>Add a Google Maps browser key to show the live map here.</small>}
                    <p><b>See & do</b>{guide.highlights}</p>
                    <p><b>Best time</b>{guide.bestTime}</p>
                    <p><b>History</b>{guide.history}</p>
                    <p><b>Eat</b>{guide.food}</p>
                    <p className="memory-moment"><b>Remember</b>{guide.moment}</p>
                  </div>
                )
              })}
            </div>
          </article>
        </section>

        <section id="essentials" className="lower-grid">
          <article className="panel checklist-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">READY WHEN WE ARE</p>
                <h2>Pack together</h2>
              </div>
              <span className="progress-value">{progress}%</span>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            {checklist.map((item) => (
              <label className="check-row" key={item}>
                <input type="checkbox" checked={done.includes(item)} onChange={() => setDone((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} />
                <span className="check-box"><Check size={13} /></span>
                {item}
              </label>
            ))}
          </article>

          <article id="expenses" className="panel expense-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SHARED LEDGER</p>
                <h2>Clear trip budget</h2>
              </div>
              <IndianRupee size={22} />
            </div>
            <p>Add what was paid, choose everyone who benefited, and the app calculates each person’s exact share.</p>
            <div className="expense-form">
              <input value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} placeholder="What was this for?" aria-label="Expense description" />
              <input type="number" min="1" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="Amount in INR" aria-label="Expense amount" />
              <select value={expensePayer} onChange={(event) => setExpensePayer(event.target.value)} aria-label="Paid by">
                {members.map((member) => <option key={member}>{member}</option>)}
              </select>
              <div className="expense-members">
                <small>Shared by</small>
                {members.map((member) => <label key={member}><input type="checkbox" checked={expenseParticipants.includes(member)} onChange={() => setExpenseParticipants((current) => current.includes(member) ? current.filter((value) => value !== member) : [...current, member])} />{member}</label>)}
              </div>
              <button className="secondary-button" onClick={addExpense}><Plus size={16} /> Add expense</button>
            </div>
            {expenseStatus && <small className="notification-status">{expenseStatus}</small>}
            <div className="expense-total"><span>Total recorded expenses</span><strong>{money.format(expenses.reduce((total, expense) => total + expense.amount, 0))}</strong></div>
            <div className="expense-list">
              {expenses.map((expense) => <div className="expense-entry" key={expense.id}><span><strong>{expense.description}</strong><small>Paid by {expense.paidBy} · {expense.participants.length} members · {money.format(expense.amount / expense.participants.length)} each</small></span><b>{money.format(expense.amount)}</b></div>)}
            </div>
            <h3>Member balances</h3>
            {members.map((member) => <div className="family-row" key={member}><span>{member}</span><strong className={balanceByMember[member] >= 0 ? 'credit' : 'due'}>{balanceByMember[member] >= 0 ? `gets ${money.format(balanceByMember[member])}` : `owes ${money.format(Math.abs(balanceByMember[member]))}`}</strong></div>)}
            <h3>Who pays whom</h3>
            {settlements.length > 0 ? settlements.map((settlement) => <div className="family-row" key={`${settlement.from}-${settlement.to}`}><span>{settlement.from} pays {settlement.to}</span><strong>{money.format(settlement.amount)}</strong></div>) : <p>Everyone is settled.</p>}
            <button className="secondary-button" onClick={notifyOutstandingMembers}><Bell size={16} /> Notify members who owe</button>
          </article>
        </section>

        <section id="photos" className="gallery-panel panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">OUR SHARED ALBUM</p>
              <h2>Moments by place & time</h2>
            </div>
            <Camera size={21} />
          </div>
          <div className="gallery-toolbar">
            <select value={galleryDay} onChange={(event) => setGalleryDay(event.target.value)}>
              <option value="all">All trip days</option>
              {itinerary.map((item) => <option value={item.day} key={item.day}>Day {item.day} • {item.date}</option>)}
            </select>
            <button className="secondary-button" onClick={() => fileInput.current?.click()}><Plus size={16} /> Upload photos</button>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(event) => uploadMemories(event.target.files)} />
          </div>

          <div className="gallery-meta">
            <span>{isCloudSyncReady ? 'Everyone can see cloud-synced memories' : 'Preview mode: uploads are visible in this browser'}</span>
            <button className="text-button" onClick={downloadAllMemories}><Download size={15} /> Download all</button>
          </div>

          <div className="upload-details">
            <select value={uploader} onChange={(event) => setUploader(event.target.value)} aria-label="Uploaded by">
              {members.map((member) => <option key={member}>{member}</option>)}
            </select>
            <select value={galleryPlace} onChange={(event) => setGalleryPlace(event.target.value)} aria-label="Place">
              {Object.keys(placeGuides).map((place) => <option key={place}>{place}</option>)}
            </select>
            <input type="time" value={galleryTime} onChange={(event) => setGalleryTime(event.target.value)} aria-label="Photo time" />
            <input value={galleryCaption} onChange={(event) => setGalleryCaption(event.target.value)} placeholder="Caption for the moment" aria-label="Caption" />
          </div>

          {galleryStatus && <p className="gallery-status">{galleryStatus}</p>}

          <div className="memory-grid">
            {filteredMemories.map((memory) => (
              <article className="memory-card" key={memory.id}>
                <img src={memory.src} alt={`${memory.place}, Day ${memory.day}`} onError={(event) => { event.currentTarget.style.display = 'none' }} />
                <div className="memory-body">
                  <div className="memory-location">
                    <span>DAY {memory.day} • {memory.time}</span>
                    <button onClick={() => downloadMemory(memory)} aria-label={`Download ${memory.place} photo`}><Download size={15} /></button>
                  </div>
                  <h4>{memory.place}</h4>
                  <p>{memory.caption}</p>
                  <blockquote>“{memory.quote}”</blockquote>
                  <small>Uploaded by {memory.uploader}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="community-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">THE GROUP BOARD</p>
                <h2>Notes everyone sees</h2>
              </div>
              <Download size={19} />
            </div>
            <div className="note-list">
              {notes.map((note, index) => (
                <p key={`${note}-${index}`}><span>{members[index % members.length][0]}</span>{note}</p>
              ))}
            </div>
            <div className="inline-form">
              <input value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add a shared note..." />
              <button aria-label="Add note" onClick={addNote}><Plus size={17} /></button>
            </div>
            <div className="notify-row">
              <select value={notificationChannel} onChange={(event) => setNotificationChannel(event.target.value as NotificationChannel)} aria-label="Notification channel">
                <option value="mock">Preview message</option>
                <option value="telegram">Telegram group</option>
                <option value="whatsapp">WhatsApp group</option>
              </select>
              <button className="secondary-button" onClick={shareUpdate}><Send size={15} /> Share update</button>
            </div>
            {notificationStatus && <small className="notification-status">{notificationStatus}</small>}
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">WHO BRINGS WHAT</p>
                <h2>Shared jobs</h2>
              </div>
              <Users size={19} />
            </div>
            {responsibilities.map((job, index) => (
              <label className="job-row" key={job.item}>
                <input type="checkbox" checked={job.done} onChange={() => setResponsibilities((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))} />
                <span>{job.item}<small>{job.person}</small></span>
                <Check size={15} />
              </label>
            ))}
          </article>

          <article className="panel poll-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">DECIDE TOGETHER</p>
                <h2>Menu poll</h2>
              </div>
              <Utensils size={19} />
            </div>
            <div className="poll-voter">
              <label>Your name
                <select value={voter} onChange={(event) => setVoter(event.target.value)}>
                  {members.map((member) => <option key={member}>{member}</option>)}
                </select>
              </label>
            </div>
            {poll.map((item, index) => (
              <button key={item.option} className="poll-row" onClick={() => vote(index)}>
                <span>{item.option}</span>
                <strong>{item.votes.length}</strong>
              </button>
            ))}
            <div className="inline-form poll-add">
              <input value={pollOption} onChange={(event) => setPollOption(event.target.value)} placeholder="Add a food idea..." />
              <button onClick={addPollOption}><Plus size={17} /></button>
            </div>
          </article>
        </section>

        <section className="chat-panel panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">FAMILY CHAT</p>
              <h2>Talk together</h2>
            </div>
            <Users size={19} />
          </div>
          <p>A shared space for plans, questions and quick updates.</p>
          <div className="chat-messages">
            {chatMessages.map((message) => (
              <div className="chat-message" key={message.id}>
                <span>{message.member[0]}</span>
                <div>
                  <strong>{message.member} <small>{message.time}</small></strong>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-composer">
            <select value={chatMember} onChange={(event) => setChatMember(event.target.value)} aria-label="Chat member">
              {members.map((member) => <option key={member}>{member}</option>)}
            </select>
            <input value={chatText} onChange={(event) => setChatText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendChatMessage() }} placeholder="Write to the family..." aria-label="Chat message" />
            <button onClick={sendChatMessage} aria-label="Send chat message"><Send size={17} /></button>
          </div>
          <small>{chatStatus || (isCloudSyncReady ? 'Everyone sees new messages live.' : 'Preview mode: messages stay in this browser until Supabase is connected.')}</small>
        </section>

        <section className="panel gemini-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AI ASSIST</p>
              <h2>Gemini connection check</h2>
            </div>
            <ShieldCheck size={19} />
          </div>
          <p>Use a Gemini API key in your local .env file to test the connection.</p>
          <textarea value={geminiPrompt} onChange={(event) => setGeminiPrompt(event.target.value)} rows={3} aria-label="Gemini prompt" />
          <button className="secondary-button" onClick={runGeminiTest}>Ask Gemini</button>
          <button className="secondary-button" onClick={askGeminiAndSendToTelegram}><Send size={15} /> Ask Gemini & send to Telegram</button>
          {geminiStatus && <small className="notification-status" style={{ display: 'block' }}>{geminiStatus}</small>}
          <p className="gemini-reply">{geminiReply}</p>
        </section>
      </main>

      <nav className="bottom-nav">
        <button className={activeSection === 'home' ? 'selected' : ''} onClick={() => goTo('home', 'home')}><Mountain size={19} />Home</button>
        <button className={activeSection === 'trip' ? 'selected' : ''} onClick={() => goTo('trip', 'itinerary')}><MapPin size={19} />Trip</button>
        <button className={activeSection === 'expenses' ? 'selected' : ''} onClick={() => goTo('expenses', 'expenses')}><IndianRupee size={19} />Expenses</button>
        <button className={activeSection === 'photos' ? 'selected' : ''} onClick={() => goTo('photos', 'photos')}><Camera size={19} />Photos</button>
        <button aria-label="Open menu"><Menu size={20} /></button>
      </nav>
    </div>
    </AuthGate>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

export default App
