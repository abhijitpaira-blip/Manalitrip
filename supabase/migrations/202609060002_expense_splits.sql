alter table expenses add column if not exists paid_by_member text;

create table if not exists expense_participants (
  expense_id uuid not null references expenses(id) on delete cascade,
  member text not null,
  primary key (expense_id, member)
);

alter table expense_participants enable row level security;

create policy "trip members can read expense participants" on expense_participants for select using (true);
create policy "trip members can add expense participants" on expense_participants for insert with check (true);

alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.expense_participants;
