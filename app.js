/* Supabase Auth. Private content must be protected by server-side RLS. */
(() => {
  'use strict';
  let client = null;
  let currentUser = null;
  let ready = false;
  let busy = false;
  let revision = 0;
  function isLoggedIn() { return Boolean(currentUser); }
  const $ = id => document.getElementById(id);
  const form = $('login-form');
  const email = $('email');
  const password = $('password');
  const showPassword = $('show-password');
  const status = $('form-status');
  const dialog = $('info-dialog');
  const themeButton = document.querySelector('.theme-toggle');
  const savedTheme = (() => { try { return localStorage.getItem('sb-theme'); } catch { return null; } })();

  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', dark ? 'Vaihda vaaleaan teemaan' : 'Vaihda tummaan teemaan');
  }
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  themeButton.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('sb-theme', next); } catch { /* Theme still works without storage. */ }
  });
  $('year').textContent = String(new Date().getFullYear());

  function resetPasswordVisibility() {
    password.type = 'password';
    showPassword.setAttribute('aria-pressed', 'false');
    showPassword.setAttribute('aria-label', 'Näytä salasana');
    $('caps-warning').hidden = true;
  }
  showPassword.addEventListener('click', () => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    showPassword.setAttribute('aria-pressed', String(visible));
    showPassword.setAttribute('aria-label', visible ? 'Piilota salasana' : 'Näytä salasana');
  });
  password.addEventListener('keyup', event => {
    $('caps-warning').hidden = !(event.getModifierState && event.getModifierState('CapsLock'));
  });
  password.addEventListener('blur', () => { $('caps-warning').hidden = true; });
  function fieldError(input, message) {
    const error = $(input.id + '-error');
    error.textContent = message;
    error.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  [email, password].forEach(input => input.addEventListener('input', () => {
    fieldError(input, '');
    status.hidden = true;
    status.textContent = '';
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || busy) return;
    email.value = email.value.trim();
    const emailMessage = !email.value ? 'Kirjoita sähköpostiosoite.' : email.validity.typeMismatch ? 'Tarkista sähköpostiosoitteen muoto.' : '';
    const passwordMessage = !password.value ? 'Kirjoita salasana.' : '';
    fieldError(email, emailMessage);
    fieldError(password, passwordMessage);
    if (emailMessage || passwordMessage) {
      status.hidden = true;
      (emailMessage ? email : password).focus();
      return;
    }
    busy = true;
    updateControls();
    status.textContent = 'Kirjaudutaan…';
    status.hidden = false;
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.value, password: password.value
      });
      password.value = '';
      resetPasswordVisibility();
      if (error) throw error;
      if (!data.session || !data.user) throw new Error('Missing session');
      currentUser = data.user;
      revision++;
      status.hidden = true;
      history.replaceState(null, '', location.pathname + location.search + '#workspace');
      renderRoute(true);
    } catch (error) {
      currentUser = null;
      revision++;
      password.value = '';
      resetPasswordVisibility();
      renderRoute();
      status.textContent = authMessage(error);
      status.hidden = false;
    } finally {
      busy = false;
      updateControls();
    }
  });

  function openDialog(title, description) {
    $('dialog-title').textContent = title;
    $('dialog-description').textContent = description;
    dialog.showModal();
  }
  $('forgot-password').addEventListener('click', () => openDialog('Salasanan palautus', 'Salasanan palautus sivulta ei ole vielä käytössä. Voit hallita omaa käyttäjätiliäsi Supabasen Authentication-osiossa.'));
  $('privacy-button').addEventListener('click', () => openDialog('Tietosuoja', 'Kirjautumistiedot lähetetään salatun HTTPS-yhteyden kautta Supabaseen. Salasanaa ei tallenneta sivun koodiin tai selaimen tallennustilaan. Supabasen kirjautumisistunto ja teemavalinta tallennetaan selaimen paikalliseen tallennustilaan. Sivu ei käytä analytiikkaa. Projektit ja muistiinpanot tallennetaan Supabasen tietokantaan ja niitä saa käyttää vain niiden omistaja. Tallentamaton teksti on vain tämän sivun muistissa. Hosting-palvelut voivat käsitellä teknisiä lokitietoja.'));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  $('dialog-done').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  function renderRoute(focus = false) {
    const ideasView = location.hash === '#ideas' && isLoggedIn();
    const notesView = (location.hash === '#notes' || ideasView) && isLoggedIn();
    const projectsView = location.hash === '#projects' && isLoggedIn();
    const preview = (location.hash === '#workspace' || notesView || projectsView) && isLoggedIn();
    $('entry-panel').hidden = preview;
    $('workspace').hidden = !preview;
    document.title = projectsView ? 'Projektit · Smiling Buddha' : ideasView ? 'Ideat · Smiling Buddha' : notesView ? 'Muistiinpanot · Smiling Buddha' : preview ? 'Oma tila · Smiling Buddha' : 'Kirjaudu sisään · Smiling Buddha';
    $('workspace-overview').hidden = notesView || projectsView;
    $('projects-panel').hidden = !projectsView;
    window.sbProjects.setAuth(client, currentUser);
    window.sbProjects.setVisible(projectsView);
    $('notes-panel').hidden = !notesView;
    window.sbNotes.setAuth(client, currentUser);
    if (ideasView && $('notes-project-filter').value !== 'ideas') window.sbNotes.setFilter('ideas');
    $('notes-heading').textContent = ideasView ? 'Ideat' : 'Muistiinpanot';
    $('notes-project-filter').closest('.notes-filter').hidden = ideasView;
    window.sbNotes.setVisible(notesView);
    window.sbWorkspaceTools.setAuth(client, currentUser);
    window.sbWorkspaceTools.setVisible(preview && !notesView && !projectsView);
    if (preview) { password.value = ''; resetPasswordVisibility(); }
    $('signed-in-user').textContent = currentUser?.email || '';
    if (focus) (projectsView ? $('projects-heading') : notesView ? $('notes-heading') : preview ? $('workspace-heading') : $('login-heading')).focus({preventScroll: true});
  }
  $('back-to-login').addEventListener('click', async () => {
    if (!client || busy || window.sbWorkspaceTools.isBusy() || !window.sbNotes.canLeave() || !window.sbProjects.canLeave()) return;
    busy = true;
    updateControls();
    $('workspace-status').hidden = true;
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      revision++;
      currentUser = null;
      status.hidden = true;
      history.replaceState(null, '', location.pathname + location.search);
      renderRoute(true);
    } catch {
      $('workspace-status').textContent = 'Uloskirjautuminen ei onnistunut. Tarkista verkkoyhteys ja yritä uudelleen.';
      $('workspace-status').hidden = false;
    } finally {
      busy = false;
      updateControls();
    }
  });

  function updateControls() {
    $('submit-button').disabled = !ready || busy;
    $('back-to-login').disabled = !ready || busy || window.sbNotes.isBusy() || window.sbProjects.isBusy() || window.sbWorkspaceTools.isBusy();
    $('submit-button').querySelector('span').textContent = busy ? 'Odota…' : 'Kirjaudu sisään';
    form.setAttribute('aria-busy', String(busy));
  }
  function authMessage(error) {
    if (error?.code === 'email_not_confirmed') return 'Vahvista sähköpostiosoitteesi ennen kirjautumista.';
    if (error?.code === 'invalid_credentials' || error?.status === 400) return 'Sähköpostiosoite tai salasana on väärä, tai tiliä ei ole vahvistettu.';
    if (error?.status === 429) return 'Liian monta yritystä. Odota hetki ennen uutta yritystä.';
    return 'Kirjautumispalveluun ei saatu yhteyttä. Tarkista verkkoyhteys ja Supabase-projektin tila.';
  }
  async function restoreSession() {
    const ticket = ++revision;
    let candidateId = null;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      candidateId = data.session?.user?.id || null;
      let user = null;
      if (data.session) {
        const result = await client.auth.getUser();
        if (result.error) throw result.error;
        user = result.data.user;
      }
      if (ticket !== revision) return;
      currentUser = user;
      // The SDK has now processed confirmation tokens. Do not retain them in the URL.
      if (location.hash.includes('access_token=') || location.hash.includes('error=')) {
        history.replaceState(null, '', location.pathname + location.search + (user ? '#workspace' : ''));
      } else if (user && location.hash !== '#notes' && location.hash !== '#ideas' && location.hash !== '#projects') {
        history.replaceState(null, '', location.pathname + location.search + '#workspace');
      }
      renderRoute();
      status.hidden = true;
      $('workspace-status').hidden = true;
    } catch (error) {
      if (ticket !== revision) return;
      const sameKnownUser = currentUser && candidateId === currentUser.id;
      const expired = [401, 403].includes(error?.status) || ['bad_jwt', 'session_not_found', 'refresh_token_not_found'].includes(error?.code);
      if (sameKnownUser && !expired) {
        // A temporary verification failure must not erase an unsaved editor.
        // The database still enforces the access token and RLS on every request.
        renderRoute();
        $('workspace-status').textContent = 'Kirjautumistilan tarkistus epäonnistui. Tarkista verkkoyhteys. Tallentamattomat muutokset säilyvät tässä näkymässä.';
        $('workspace-status').hidden = false;
      } else {
        currentUser = null;
        renderRoute();
        status.textContent = authMessage(error);
        status.hidden = false;
      }
    } finally {
      ready = true;
      updateControls();
    }
  }
  async function initializeAuth() {
    updateControls();
    status.textContent = 'Tarkistetaan kirjautumistilaa…';
    status.hidden = false;
    try {
      client = window.sbAuthClient;
      if (!client) throw new Error('SDK unavailable');
      await restoreSession();
      client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          revision++;
          currentUser = null;
          history.replaceState(null, '', location.pathname + location.search);
          renderRoute();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Keep the callback synchronous; SDK methods run after its lock is released.
          setTimeout(() => { if (!busy) void restoreSession(); }, 0);
        }
      });
    } catch {
      ready = false;
      updateControls();
      status.textContent = 'Kirjautumisen käynnistys epäonnistui. Päivitä sivu ja tarkista verkkoyhteys.';
      status.hidden = false;
    }
  }
  document.addEventListener('sb-notes-busy', updateControls);
  document.addEventListener('sb-projects-busy', updateControls);
  document.addEventListener('sb-tools-busy', updateControls);
  addEventListener('hashchange', () => renderRoute(true));
  addEventListener('pageshow', event => { if (event.persisted && client) { $('workspace').hidden = true; void restoreSession(); } });
  addEventListener('pagehide', () => { password.value = ''; resetPasswordVisibility(); });
  renderRoute();
  void initializeAuth();
})();
