-- Aja kerran Supabasen SQL Editorissa. Ei poista tai korvaa olemassa olevia tauluja.
begin;

create table public.sb_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  body text not null default '' check (char_length(body) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_revision integer not null default 1 check (row_revision > 0)
);

create index sb_notes_user_updated_idx on public.sb_notes(user_id, updated_at desc, id);
alter table public.sb_notes enable row level security;
alter table public.sb_notes force row level security;

-- Automaattinen taulujen julkaiseminen voi olla pois: oikeudet annetaan tässä täsmällisesti.
revoke all on table public.sb_notes from public, anon, authenticated;
grant select, delete on table public.sb_notes to authenticated;
grant insert (id, user_id, title, body) on public.sb_notes to authenticated;
grant update (title, body) on public.sb_notes to authenticated;

create policy sb_notes_select_own on public.sb_notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy sb_notes_insert_own on public.sb_notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sb_notes_update_own on public.sb_notes
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy sb_notes_delete_own on public.sb_notes
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.sb_notes_stamp_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Muistiinpanon tunnistetta tai omistajaa ei saa muuttaa';
  end if;
  new.updated_at := clock_timestamp();
  new.row_revision := old.row_revision + 1;
  return new;
end;
$$;
revoke all on function public.sb_notes_stamp_update() from public, anon, authenticated;
create trigger sb_notes_before_update before update on public.sb_notes
  for each row execute function public.sb_notes_stamp_update();

commit;
