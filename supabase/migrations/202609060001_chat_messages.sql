create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  member text not null,
  text text not null check (char_length(trim(text)) > 0),
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "trip members can read chat" on chat_messages for select using (true);
create policy "trip members can send chat" on chat_messages for insert with check (true);

alter publication supabase_realtime add table public.chat_messages;
