(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let client = null, userId = null, generation = 0;
  let visible = false, loading = false, exporting = false, loaded = false;
  let ideaRows = [];
  const valid = (ticket, owner) => generation === ticket && userId === owner;
  function controls() {
    $('export-backup').disabled = !userId || exporting || window.sbNotes.isBusy() || window.sbProjects.isBusy();
    $('idea-all').disabled = !userId || window.sbNotes.isBusy();
    for (const button of $('idea-board-list').querySelectorAll('button')) button.disabled = !userId || window.sbNotes.isBusy();
  }
  function renderIdeas() {
    $('idea-board-list').replaceChildren();
    for (const row of ideaRows) {
      const li = document.createElement('li'), button = document.createElement('button');
      button.type = 'button'; button.textContent = row.title;
      button.addEventListener('click', () => void window.sbNotes.openIdea(row.id));
      li.append(button); $('idea-board-list').append(li);
    }
    controls();
  }
  async function request(query, milliseconds = 15000) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), milliseconds);
    try {
      const result = await query.abortSignal(abort.signal);
      if (result.error) throw result.error;
      return result.data;
    } finally { clearTimeout(timeout); }
  }
  async function loadIdeas() {
    if (!userId || loading) return;
    const ticket = generation, owner = userId;
    loading = true; controls();
    $('idea-board-status').textContent = 'Ladataan ideoita…';
    try {
      const data = await request(client.from('sb_notes').select('id,user_id,title,updated_at')
        .eq('user_id', owner).eq('is_idea', true).order('updated_at', { ascending: false }).order('id').limit(10));
      if (!valid(ticket, owner)) return;
      if (!Array.isArray(data) || data.some(row => row.user_id !== owner || typeof row.id !== 'string' || typeof row.title !== 'string')) throw new Error('Invalid ideas');
      ideaRows = data; loaded = true; renderIdeas();
      $('idea-board-status').textContent = data.length ? '' : 'Ei vielä ideoita. Kirjoita ensimmäinen tai merkitse muistiinpano idealistaan.';
    } catch (error) {
      if (!valid(ticket, owner)) return;
      $('idea-board-status').textContent = error?.code === '42703'
        ? 'Idealistan päivitys puuttuu. Aja sb-ideas-backup-setup.sql.'
        : 'Idealistaa ei voitu ladata. Tarkista verkkoyhteys ja paina Päivitä.';
    } finally { if (valid(ticket, owner)) { loading = false; controls(); } }
  }
  function validBackup(data, owner) {
    if (!data || data.format !== 'smiling-buddha-backup' || data.schema_version !== 1 || data.user_id !== owner
      || typeof data.exported_at !== 'string' || !Number.isFinite(Date.parse(data.exported_at))
      || !Array.isArray(data.projects) || !Array.isArray(data.notes)) return false;
    const common = row => row && typeof row.id === 'string' && row.user_id === owner
      && typeof row.title === 'string' && typeof row.body === 'string'
      && Number.isInteger(row.row_revision) && row.row_revision > 0
      && Number.isFinite(Date.parse(row.created_at)) && Number.isFinite(Date.parse(row.updated_at));
    const projects = new Set(), notes = new Set();
    for (const row of data.projects) {
      if (!common(row) || projects.has(row.id)) return false;
      projects.add(row.id);
    }
    for (const row of data.notes) {
      if (!common(row) || notes.has(row.id) || typeof row.is_idea !== 'boolean'
        || (row.project_id !== null && !projects.has(row.project_id))) return false;
      notes.add(row.id);
    }
    return true;
  }
  async function exportBackup() {
    if (!userId || exporting || window.sbNotes.isBusy() || window.sbProjects.isBusy()) return;
    if ((window.sbNotes.isDirty() || window.sbProjects.isDirty())
      && !window.confirm('Varmuuskopio sisältää vain Supabaseen tallennetut tiedot. Tallentamattomat muutokset eivät sisälly tiedostoon. Jatketaanko?')) return;
    const ticket = generation, owner = userId;
    exporting = true; controls(); document.dispatchEvent(new CustomEvent('sb-tools-busy'));
    $('workspace-status').textContent = 'Valmistellaan varmuuskopiota…'; $('workspace-status').hidden = false;
    try {
      const data = await request(client.rpc('sb_export_backup'), 30000);
      if (!valid(ticket, owner)) return;
      if (!validBackup(data, owner)) throw new Error('Invalid backup');
      const date = new Date();
      const stamp = [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
      const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `smiling-buddha-varmuuskopio-${stamp}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('workspace-status').textContent = `Varmuuskopio ladattu: ${data.projects.length} projektia ja ${data.notes.length} muistiinpanoa. Ideat sisältyvät muistiinpanoihin.`;
    } catch (error) {
      if (!valid(ticket, owner)) return;
      $('workspace-status').textContent = ['42883','PGRST202'].includes(error?.code)
        ? 'Varmuuskopion tietokantapäivitys puuttuu. Aja sb-ideas-backup-setup.sql.'
        : 'Varmuuskopion vienti epäonnistui. Tiedostoa ei luotu. Tarkista verkkoyhteys ja tietokantapäivitys.';
    } finally { if (valid(ticket, owner)) { exporting = false; controls(); document.dispatchEvent(new CustomEvent('sb-tools-busy')); } }
  }
  function setAuth(nextClient, user) {
    client = nextClient; const id = user?.id || null;
    if (id === userId) return;
    generation++; userId = id; loading = false; exporting = false; loaded = false; ideaRows = [];
    $('idea-board-status').textContent = ''; renderIdeas();
    document.dispatchEvent(new CustomEvent('sb-tools-busy'));
    if (id && visible) void loadIdeas();
  }
  function setVisible(value) {
    const entering = value && !visible;
    visible = value;
    if (entering && userId && !loading) void loadIdeas();
  }
  $('idea-all').addEventListener('click', () => { if (window.sbNotes.setFilter('ideas')) location.hash = 'ideas'; });
  $('export-backup').addEventListener('click', () => void exportBackup());
  document.addEventListener('sb-notes-busy', controls);
  document.addEventListener('sb-projects-busy', controls);
  document.addEventListener('sb-notes-changed', () => { loaded = false; if (visible && userId) void loadIdeas(); });
  addEventListener('beforeunload', event => { if (exporting) { event.preventDefault(); event.returnValue = ''; } });
  window.sbWorkspaceTools = { setAuth, setVisible, isBusy: () => exporting };
  controls();
})();
