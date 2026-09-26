export type ItineraryDay = { day: number; date: string; title: string; places: string[]; note: string }

export const families = [
  { name: 'Abhijit Paira', weight: 2.5, share: 37500, trainShare: 12186, paid: 32322 },
  { name: 'Rakesh Mandal', weight: 2, share: 30000, trainShare: 9748, paid: 18700 },
  { name: 'Rajesh Mahata', weight: 2.5, share: 37500, trainShare: 10688, paid: 19063 },
  { name: 'Bikash Patra', weight: 2, share: 30000, trainShare: 8550, paid: 19063 },
]

export const familyMembers: Record<string, string[]> = {
  'Abhijit Paira': ['Abhijit', 'Maitrayee', 'Ariyan'],
  'Rakesh Mandal': ['Rakesh', 'Sumona', 'Arannya'],
  'Rajesh Mahata': ['Rajesh', 'Chaitrayee', 'Tanishka'],
  'Bikash Patra': ['Bikash', 'Susoma', 'Lit Champ'],
}

export const familyOfMember: Record<string, string> = Object.fromEntries(
  Object.entries(familyMembers).flatMap(([family, people]) => people.map((person) => [person, family]))
)

export const itinerary: ItineraryDay[] = [
  { day: 1, date: '16 Oct', title: 'Shimla pick-up and hotel transfer', places: ['Mall Road'], note: 'Settle in, keep the evening gentle, and take a first walk through Shimla.' },
  { day: 2, date: '17 Oct', title: 'Shimla local and Kufri sightseeing', places: ['The Ridge', 'Christ Church', 'Lakkar Bazaar', 'Kufri Himalayan Nature Park'], note: 'Start early for clear mountain light and lighter crowds at Kufri.' },
  { day: 3, date: '18 Oct', title: 'Shimla to Manali', places: ['Kullu Valley', 'Sundernagar Lake', 'Pandoh Dam'], note: 'A scenic transfer day. Keep water and snacks within reach.' },
  { day: 4, date: '19 Oct', title: 'Solang Valley and Atal Tunnel', places: ['Solang Valley', 'Atal Tunnel', 'Sissu'], note: 'Leave by 8 AM and return before the mountain roads get dark.' },
  { day: 5, date: '20 Oct', title: 'Manali to Kasol stay', places: ['Old Manali', 'Hadimba Devi Temple', 'Vashisht Temple'], note: 'Use the morning for Manali highlights before the Kasol transfer.' },
  { day: 6, date: '21 Oct', title: 'Kasol to Amritsar transfer', places: ['Manikaran Sahib', 'Kasol'], note: 'Carry a warm layer for the morning and keep the long transfer comfortable.' },
  { day: 7, date: '22 Oct', title: 'Amritsar local sightseeing', places: ['Golden Temple', 'Wagah Border', 'Partition Museum'], note: 'Early morning is serene at the Golden Temple; evenings are warmer in the plains.' },
  { day: 8, date: '23 Oct', title: 'Amritsar drop', places: ['Jallianwala Bagh', 'Durgiana Temple', 'Gobindgarh Fort'], note: 'Keep luggage ready and leave room for one last shared breakfast.' },
]

export const checklist = ['Warm layers and jacket', 'Personal medicines', 'ID proofs and tickets', 'Chargers and power bank', 'First aid kit', 'Water bottles', 'Comfortable walking shoes']
