/* Muistiinpanot ovat Supabasessa. RLS on varsinainen käyttöoikeussuojaus. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TABLE = 'sb_notes';
  const FIELDS = 'id,user_id,title,body,created_at,updated_at,row_revision';
  const PAGE_SIZE = 50;
  let client = null, userId = null, generation = 0;
  let visible = false, listed = false, working = false;
  let page = 0, total = 0, rows = [];
  let selected = null, draftId = null, baseline = null;
  let pending = null, conflict = false;

  function message(text) { $('notes-status').textContent = text; $('notes-status').hidden = !text; }
  function values() { return { title: $('note-title').value.trim(), body: $('note-body').value }; }
  function dirty() {
    if (!baseline || $('note-form').hidden) return false;
    return $('note-title').value !== baseline.title || $('note-body').value !== baseline.body;
  }
  function canLeave() {
    if (working) { message('Odota, että meneillään oleva toiminto valmistuu.'); return false; }
    if (pending) { message('Tarkista ensin epävarman tallennuksen tai poiston tila.'); return false; }
    return !dirty() || window.confirm('Muistiinpanossa on tallentamattomia muutoksia. Haluatko hylätä ne?');
  }
  function valid(ticket, owner) { return generation === ticket && userId === owner; }
  function setWorking(value) {
    working = value;
    document.dispatchEvent(new CustomEvent('sb-notes-busy'));
    controls();
  }
  function controls() {
    const locked = !userId || working || Boolean(pending);
    $('notes-new').disabled = locked || !listed;
    $('notes-refresh').disabled = locked;
    $('notes-prev').disabled = locked || page === 0;
    $('notes-next').disabled = locked || (page + 1) * PAGE_SIZE >= total;
    $('note-save').disabled = locked || conflict || !dirty();
    $('note-delete').disabled = locked;
    $('note-delete').hidden = !selected;
    $('note-reload').hidden = !selected;
    $('note-reload').disabled = locked;
    $('note-verify').hidden = !pending;
    $('note-verify').disabled = !userId || working;
    $('note-title').disabled = locked;
    $('note-body').disabled = locked;
    for (const button of $('notes-list').querySelectorAll('button')) button.disabled = locked;
    $('note-form').setAttribute('aria-busy', String(working));
    if (pending) $('note-state').textContent = 'Tulos epävarma. Teksti on tässä tallessa. Tarkista tila ennen jatkamista.';
    else if (conflict) $('note-state').textContent = 'Palvelimen versio muuttui. Kopioi haluamasi teksti talteen ja lataa palvelimen versio.';
    else if (baseline) $('note-state').textContent = dirty() ? 'Tallentamattomia muutoksia' : selected ? 'Tallennettu Supabaseen' : 'Uusi muistiinpano';
  }
  function clearEditor() {
    selected = null; draftId = null; baseline = null; pending = null; conflict = false;
    $('note-title').value = ''; $('note-body').value = ''; $('note-state').textContent = '';
    $('note-form').hidden = true; $('notes-placeholder').hidden = false;
  }
  function fillEditor(row) {
    selected = row; draftId = row.id; conflict = false;
    baseline = { title: row.title, body: row.body };
    $('note-title').value = row.title; $('note-body').value = row.body;
    $('note-form').hidden = false; $('notes-placeholder').hidden = true;
    renderList(); controls();
  }
  function renderList() {
    $('notes-list').replaceChildren();
    for (const row of rows) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'note-list-button';
      button.setAttribute('aria-current', String(selected?.id === row.id));
      const title = document.createElement('span'); title.className = 'note-list-title'; title.textContent = row.title;
      const date = document.createElement('span'); date.className = 'note-list-date';
      date.textContent = new Date(row.updated_at).toLocaleString('fi-FI', { dateStyle: 'short', timeStyle: 'short' });
      button.append(title, date); button.addEventListener('click', () => void openNote(row.id));
      li.append(button); $('notes-list').append(li);
    }
    $('notes-list-info').textContent = !listed ? 'Luettelo ei ole vielä käytettävissä.' : total === 0 ? 'Ei vielä muistiinpanoja.' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} / ${total} muistiinpanoa`;
    controls();
  }
  async function request(query) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const result = await query.abortSignal(abort.signal);
      if (result.error) throw result.error;
      return result;
    } finally { clearTimeout(timeout); }
  }
  function problem(error) {
    if (['42P01', 'PGRST205'].includes(error?.code)) return 'Muistiinpanotaulua ei löydy. Aja paketin sb-notes-setup.sql Supabasen SQL Editorissa ja päivitä lista.';
    if (error?.code === '42501') return 'Tietokannan käyttöoikeudet eivät salli toimintoa. Tarkista, että asennuksen SQL-koodi on ajettu kokonaan.';
    return 'Supabaseen ei saatu yhteyttä tai pyyntö epäonnistui. Tarkista verkkoyhteys ja projektin tila.';
  }
  async function loadList(announce = true) {
    if (!userId || working || pending) return;
    const ticket = generation, owner = userId;
    setWorking(true);
    if (announce) message('Ladataan muistiinpanoja…');
    try {
      let result = await request(client.from(TABLE).select('id,user_id,title,created_at,updated_at,row_revision', { count: 'exact' })
        .eq('user_id', owner).order('updated_at', { ascending: false }).order('id').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1));
      if (!valid(ticket, owner)) return;
      if (!Array.isArray(result.data) || typeof result.count !== 'number') throw new Error('Invalid response');
      total = result.count; rows = result.data; listed = true;
      if (page > 0 && rows.length === 0) { page = 0; setWorking(false); return await loadList(announce); }
      renderList();
      if (announce) message('');
    } catch (error) {
      if (!valid(ticket, owner)) return;
      // Do not replace an earlier list with a misleading empty list on failure.
      message(problem(error));
      renderList();
    } finally { if (valid(ticket, owner)) setWorking(false); }
  }
  async function openNote(id, force = false) {
    if (!userId || working || pending || (!force && !canLeave())) return;
    const ticket = generation, owner = userId;
    setWorking(true); message('Ladataan muistiinpanoa…');
    try {
      const { data } = await request(client.from(TABLE).select(FIELDS).eq('id', id).eq('user_id', owner).maybeSingle());
      if (!valid(ticket, owner)) return;
      if (!data) { message('Muistiinpanoa ei enää löydy. Se on voitu poistaa toisella laitteella.'); return; }
      fillEditor(data); message(''); $('note-title').focus();
    } catch (error) { if (valid(ticket, owner)) message(problem(error)); }
    finally { if (valid(ticket, owner)) setWorking(false); }
  }
  function newNote() {
    if (!userId || !listed || !canLeave()) return;
    clearEditor(); draftId = crypto.randomUUID(); baseline = { title: '', body: '' };
    $('note-form').hidden = false; $('notes-placeholder').hidden = true;
    message(''); renderList(); controls(); $('note-title').focus();
  }
  function setConflict() {
    conflict = true;
    message('Muistiinpano muuttui tai poistettiin toisella laitteella. Muutoksiasi ei kirjoitettu vanhan version päälle. Teksti säilyy editorissa.');
  }
  function samePayload(row, operation) { return row && row.title === operation.payload.title && row.body === operation.payload.body; }
  async function saveNote(event) {
    event.preventDefault();
    if (!userId || working || pending || conflict || !dirty()) return;
    const payload = values();
    if (!payload.title || payload.title.length > 200 || payload.body.length > 100000) {
      message('Anna otsikko (enintään 200 merkkiä). Muistiinpanon enimmäispituus on 100 000 merkkiä.'); return;
    }
    const ticket = generation, owner = userId;
    const operation = { kind: selected ? 'update' : 'create', id: selected?.id || draftId, version: selected?.row_revision, payload };
    setWorking(true); message('Tallennetaan…');
    let success = false;
    try {
      const query = operation.kind === 'create'
        ? client.from(TABLE).insert({ id: operation.id, user_id: owner, ...payload })
        : client.from(TABLE).update(payload).eq('id', operation.id).eq('user_id', owner).eq('row_revision', operation.version);
      const { data } = await request(query.select(FIELDS));
      if (!valid(ticket, owner)) return;
      if (!Array.isArray(data)) throw new Error('Invalid response');
      if (data.length === 0 && operation.kind === 'update') { setConflict(); return; }
      if (data.length !== 1 || data[0].id !== operation.id || !samePayload(data[0], operation)) throw new Error('Unverified response');
      fillEditor(data[0]); message('Tallennettu.'); page = 0; success = true;
    } catch (error) {
      if (!valid(ticket, owner)) return;
      pending = operation;
      message(`${problem(error)} Tallennuksen tulos on epävarma. Paina ”Tarkista tallennuksen tila”; uutta kirjoitusta ei lähetetä automaattisesti.`);
    } finally {
      if (valid(ticket, owner)) { setWorking(false); if (success) void loadList(false); }
    }
  }
  async function deleteNote() {
    if (!userId || working || pending || !selected) return;
    if (!window.confirm(`Poistetaanko ”${selected.title}” pysyvästi?${dirty() ? ' Myös tallentamattomat muutokset hylätään.' : ''}`)) return;
    const ticket = generation, owner = userId;
    const operation = { kind: 'delete', id: selected.id, version: selected.row_revision };
    setWorking(true); message('Poistetaan…'); let success = false;
    try {
      const { data } = await request(client.from(TABLE).delete().eq('id', operation.id).eq('user_id', owner).eq('row_revision', operation.version).select('id'));
      if (!valid(ticket, owner)) return;
      if (!Array.isArray(data)) throw new Error('Invalid response');
      if (data.length === 0) { setConflict(); return; }
      if (data.length !== 1 || data[0].id !== operation.id) throw new Error('Unverified deletion');
      clearEditor(); message('Muistiinpano poistettu.'); success = true;
    } catch (error) {
      if (!valid(ticket, owner)) return;
      pending = operation;
      message(`${problem(error)} Poiston tulos on epävarma. Tarkista tila ennen uutta poistoyritystä.`);
    } finally { if (valid(ticket, owner)) { setWorking(false); if (success) void loadList(false); } }
  }
  async function verifyPending() {
    if (!userId || working || !pending) return;
    const ticket = generation, owner = userId, operation = pending;
    setWorking(true); message('Tarkistetaan palvelimelta…'); let refresh = false;
    try {
      const { data } = await request(client.from(TABLE).select(FIELDS).eq('id', operation.id).eq('user_id', owner).maybeSingle());
      if (!valid(ticket, owner)) return;
      pending = null;
      if (operation.kind === 'delete') {
        if (!data) { clearEditor(); message('Muistiinpano on poistettu.'); refresh = true; }
        else if (data.row_revision === operation.version) message('Muistiinpano on edelleen palvelimella. Voit yrittää poistoa uudelleen.');
        else setConflict();
      } else if (samePayload(data, operation) && (operation.kind === 'create' || data.row_revision === operation.version + 1)) {
        fillEditor(data); message('Tallennus vahvistettu palvelimelta.'); refresh = true;
      } else if (!data && operation.kind === 'create') {
        message('Muistiinpanoa ei ole palvelimella. Voit yrittää tallennusta uudelleen.');
      } else if (data && operation.kind === 'update' && data.row_revision === operation.version) {
        message('Muutoksia ei ole tallennettu. Voit yrittää tallennusta uudelleen.');
      } else {
        if (data && operation.kind === 'create') selected = data;
        setConflict();
      }
    } catch (error) { if (valid(ticket, owner)) message(`${problem(error)} Tulos on yhä epävarma; tekstiä ei lähetetty uudelleen.`); }
    finally { if (valid(ticket, owner)) { setWorking(false); if (refresh) void loadList(false); } }
  }
  function setAuth(nextClient, user) {
    const id = user?.id || null;
    client = nextClient;
    if (id === userId) return;
    generation++; userId = id; working = false;
    rows = []; page = 0; total = 0; listed = false;
    clearEditor(); message(''); renderList();
    document.dispatchEvent(new CustomEvent('sb-notes-busy'));
    if (id && visible) void loadList();
  }
  function setVisible(value) {
    const entering = value && !visible;
    visible = value;
    if (entering && userId && !listed && !working) void loadList();
  }
  $('open-notes').addEventListener('click', () => { location.hash = 'notes'; });
  $('notes-back').addEventListener('click', () => { if (canLeave()) location.hash = 'workspace'; });
  $('notes-new').addEventListener('click', newNote);
  $('notes-refresh').addEventListener('click', () => void loadList());
  $('notes-prev').addEventListener('click', () => { if (!working && !pending && page > 0) { page--; void loadList(); } });
  $('notes-next').addEventListener('click', () => { if (!working && !pending && (page + 1) * PAGE_SIZE < total) { page++; void loadList(); } });
  $('note-form').addEventListener('submit', event => void saveNote(event));
  $('note-delete').addEventListener('click', () => void deleteNote());
  $('note-verify').addEventListener('click', () => void verifyPending());
  $('note-reload').addEventListener('click', () => {
    if (selected && canLeave()) void openNote(selected.id, true);
  });
  for (const id of ['note-title', 'note-body']) $(id).addEventListener('input', controls);
  addEventListener('beforeunload', event => {
    if (dirty() || working || pending) { event.preventDefault(); event.returnValue = ''; }
  });
  window.sbNotes = { setAuth, setVisible, canLeave, isBusy: () => working || Boolean(pending) };
  renderList(); controls();
})();
