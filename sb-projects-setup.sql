-- Päivitys jo käytössä olevaan muistiinpanotauluun. Aja kerran SQL Editorissa.
-- Ei poista nykyisiä muistiinpanoja: niiden project_id jää tyhjäksi.
begin;

create table public.sb_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  body text not null default '' check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  row_revision integer not null default 1 check (row_revision > 0),
  unique (id, user_id)
);
create index sb_projects_user_updated_idx on public.sb_projects(user_id, updated_at desc, id);
alter table public.sb_projects enable row level security;
alter table public.sb_projects force row level security;
revoke all on table public.sb_projects from public, anon, authenticated;
grant select, delete on table public.sb_projects to authenticated;
grant insert (id, user_id, title, body) on public.sb_projects to authenticated;
grant update (title, body) on public.sb_projects to authenticated;

create policy sb_projects_select_own on public.sb_projects
  for select to authenticated using ((select auth.uid()) = user_id);
create policy sb_projects_insert_own on public.sb_projects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sb_projects_update_own on public.sb_projects
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy sb_projects_delete_own on public.sb_projects
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.sb_projects_stamp_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Projektin tunnistetta tai omistajaa ei saa muuttaa';
  end if;
  new.updated_at := clock_timestamp();
  new.row_revision := old.row_revision + 1;
  return new;
end;
$$;
revoke all on function public.sb_projects_stamp_update() from public, anon, authenticated;
create trigger sb_projects_before_update before update on public.sb_projects
  for each row execute function public.sb_projects_stamp_update();

alter table public.sb_notes add column project_id uuid;
-- Omistaja kuuluu viiteavaimeen: muistiinpanoa ei voi liittää toisen käyttäjän projektiin.
alter table public.sb_notes add constraint sb_notes_project_owner_fk
  foreign key (project_id, user_id) references public.sb_projects(id, user_id) on delete restrict;
create index sb_notes_user_project_updated_idx on public.sb_notes(user_id, project_id, updated_at desc);
grant insert (project_id), update (project_id) on public.sb_notes to authenticated;

commit;
