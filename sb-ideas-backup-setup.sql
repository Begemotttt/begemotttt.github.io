-- Päivitys olemassa oleviin projekteihin ja muistiinpanoihin. Aja kerran.
begin;

alter table public.sb_notes add column is_idea boolean not null default false;
grant insert (is_idea), update (is_idea) on public.sb_notes to authenticated;
create index sb_notes_user_ideas_idx on public.sb_notes(user_id, updated_at desc) where is_idea = true;

-- Yksi palvelinpuolen lukutoiminto: projektit ja muistiinpanot samasta tietokantanäkymästä.
-- SECURITY INVOKER säilyttää käyttäjän normaalit tauluoikeudet ja RLS-säännöt.
create function public.sb_export_backup()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception 'Kirjautuminen vaaditaan' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'format', 'smiling-buddha-backup',
    'schema_version', 1,
    'exported_at', now(),
    'user_id', owner_id,
    'projects', coalesce((select jsonb_agg(to_jsonb(p) order by p.id)
      from public.sb_projects p where p.user_id = owner_id), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.id)
      from public.sb_notes n where n.user_id = owner_id), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.sb_export_backup() from public, anon, authenticated;
grant execute on function public.sb_export_backup() to authenticated;

commit;
