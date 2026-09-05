insert into families (name, billing_weight, tour_share, advance_paid, balance_due) values
  ('Abhijit Paira', 2.5, 37500, 2500, 35000),
  ('Rakesh Mandal', 2.0, 30000, 2500, 27500),
  ('Rajesh Mahata', 2.5, 37500, 2500, 35000),
  ('Bikash Patra', 2.0, 30000, 2500, 27500)
on conflict (name) do nothing;

insert into itinerary (day_number, date, title, places, note) values
  (1, '2026-10-16', 'Shimla pick-up and hotel transfer', array['Mall Road'], 'Settle in and take a gentle first walk.'),
  (2, '2026-10-17', 'Shimla local and Kufri sightseeing', array['The Ridge','Christ Church','Lakkar Bazaar','Kufri Himalayan Nature Park'], 'Start early for bright mountain light.'),
  (3, '2026-10-18', 'Shimla to Manali', array['Kullu Valley','Sundernagar Lake','Pandoh Dam'], 'Keep water and snacks within reach.'),
  (4, '2026-10-19', 'Solang Valley and Atal Tunnel', array['Solang Valley','Atal Tunnel','Sissu'], 'Leave by 8 AM and return before dark.'),
  (5, '2026-10-20', 'Manali to Kasol stay', array['Old Manali','Hadimba Devi Temple','Vashisht Temple'], 'Use the morning for Manali highlights.'),
  (6, '2026-10-21', 'Kasol to Amritsar transfer', array['Manikaran Sahib','Kasol'], 'Carry a warm layer for the morning.'),
  (7, '2026-10-22', 'Amritsar local sightseeing', array['Golden Temple','Wagah Border','Partition Museum'], 'Visit the Golden Temple early.'),
  (8, '2026-10-23', 'Amritsar drop', array['Jallianwala Bagh','Durgiana Temple','Gobindgarh Fort'], 'Keep luggage ready for the final transfer.')
on conflict (day_number) do nothing;

insert into checklist_items (item, category) values
  ('Warm layers and jacket', 'Personal'), ('Personal medicines', 'Personal'),
  ('ID proofs and tickets', 'Documents'), ('Chargers and power bank', 'Shared'),
  ('First aid kit', 'Shared'), ('Water bottles', 'Shared'), ('Comfortable walking shoes', 'Personal');
