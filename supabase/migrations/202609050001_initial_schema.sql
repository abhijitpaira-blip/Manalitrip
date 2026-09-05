create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  billing_weight numeric not null,
  tour_share integer not null,
  advance_paid integer not null default 0,
  balance_due integer not null
);

create table if not exists itinerary (
  id uuid primary key default gen_random_uuid(),
  day_number integer not null unique,
  date date not null,
  title text not null,
  places text[] not null default '{}',
  note text not null
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  amount integer not null check (amount > 0),
  description text not null,
  category text not null default 'Other',
  paid_by_family uuid references families(id),
  trip_day integer,
  split_type text not null default 'equal_families',
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  uploaded_by text not null,
  trip_day integer,
  place text,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  category text not null default 'Personal',
  assigned_to text,
  completed boolean not null default false,
  completed_by text,
  completed_at timestamptz
);

alter table families enable row level security;
alter table itinerary enable row level security;
alter table expenses enable row level security;
alter table photos enable row level security;
alter table checklist_items enable row level security;

create policy "public trip data is readable" on families for select using (true);
create policy "public itinerary is readable" on itinerary for select using (true);
create policy "public expenses are readable" on expenses for select using (true);
create policy "public photos are readable" on photos for select using (true);
create policy "public checklist is readable" on checklist_items for select using (true);
create policy "trip members can add expenses" on expenses for insert with check (true);
create policy "trip members can add photos" on photos for insert with check (true);
create policy "trip members can update checklist" on checklist_items for update using (true);

insert into storage.buckets (id, name, public) values ('trip-photos', 'trip-photos', true)
on conflict (id) do update set public = true;

create policy "trip members can view photos" on storage.objects for select using (bucket_id = 'trip-photos');
create policy "trip members can upload photos" on storage.objects for insert with check (bucket_id = 'trip-photos');
