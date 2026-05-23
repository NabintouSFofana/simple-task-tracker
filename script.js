/* ============================================================
   SIMPLETASK
   A small to-do app that remembers what you did.
   Vanilla JS · no framework · no backend.
   ============================================================ */

(() => {
  'use strict';

  // ── Storage ────────────────────────────────────────────────
  const STORAGE_KEY = 'simpletask.v2';
  const THEME_KEY = 'simpletask.theme';
  const GUEST_KEY = '__guest__';

  /** @returns {{ currentUser: string|null, users: Record<string, {tasks: any[], completed: any[]}> }} */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('SimpleTask: could not parse stored state', err);
    }
    // Try to migrate from v1 (the old shape)
    const migrated = migrateFromV1();
    if (migrated) return migrated;
    return { currentUser: null, users: {} };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('SimpleTask: could not save state', err);
    }
  }

  /** Migrates data from the original SimpleTask v1 shape, if present. */
  function migrateFromV1() {
    try {
      const oldUserData = localStorage.getItem('userData');
      const oldCurrent = localStorage.getItem('currentUser');
      if (!oldUserData) return null;
      const parsed = JSON.parse(oldUserData);
      const users = {};
      for (const [email, data] of Object.entries(parsed)) {
        users[email] = {
          tasks: (data.tasks || []).map((t) => ({
            id: uid(),
            text: typeof t === 'string' ? t : (t.text || ''),
            createdAt: new Date().toISOString(),
          })).filter(t => t.text),
          completed: (data.completed || []).map((t) => ({
            id: uid(),
            text: t.text || '',
            // older entries stored just a 'YYYY-MM-DD' string
            completedAt: t.completedAt || (t.date ? `${t.date}T12:00:00.000Z` : new Date().toISOString()),
          })).filter(t => t.text),
        };
      }
      return {
        currentUser: oldCurrent && users[oldCurrent] ? oldCurrent : null,
        users,
      };
    } catch (err) {
      console.warn('SimpleTask: v1 migration failed', err);
      return null;
    }
  }

  // ── ID + escape helpers ────────────────────────────────────
  const uid = () =>
    (crypto.randomUUID && crypto.randomUUID()) ||
    Math.random().toString(36).slice(2) + Date.now().toString(36);

  // ── State ─────────────────────────────────────────────────
  let state = loadState();
  let filter = 'today'; // 'today' | 'week' | 'all'
  let undoBuffer = null;
  let undoTimer = null;

  function currentUserData() {
    if (!state.currentUser) return null;
    if (!state.users[state.currentUser]) {
      state.users[state.currentUser] = { tasks: [], completed: [] };
    }
    return state.users[state.currentUser];
  }

  // ── DOM refs ──────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const loginView = $('loginView');
  const appView = $('appView');
  const loginForm = $('loginForm');
  const userEmail = $('userEmail');
  const guestBtn = $('guestBtn');

  const greetingText = $('greetingText');
  const greetingName = $('greetingName');
  const greetingSub = $('greetingSub');

  const addTaskForm = $('addTaskForm');
  const taskInput = $('taskInput');
  const taskList = $('taskList');
  const completedList = $('completedList');
  const emptyActive = $('emptyActive');
  const emptyCompleted = $('emptyCompleted');

  const statToday = $('statToday');
  const statWeek = $('statWeek');
  const statAll = $('statAll');

  const filterButtons = document.querySelectorAll('.filter-btn');
  const clearCompletedBtn = $('clearCompletedBtn');
  const currentUserLabel = $('currentUserLabel');
  const switchUserBtn = $('switchUserBtn');

  const themeToggle = $('themeToggle');
  const toast = $('toast');
  const toastText = $('toastText');
  const toastUndo = $('toastUndo');

  // ── Theme ─────────────────────────────────────────────────
  function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }
  function getInitialTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(getInitialTheme());

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  });

  // Respect system pref changes only if user hasn't chosen
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener?.('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
  });

  // ── Login ─────────────────────────────────────────────────
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = userEmail.value.trim().toLowerCase();
    if (!email) { userEmail.focus(); return; }
    signIn(email);
  });

  guestBtn.addEventListener('click', () => signIn(GUEST_KEY));

  function signIn(key) {
    state.currentUser = key;
    if (!state.users[key]) state.users[key] = { tasks: [], completed: [] };
    saveState();
    showApp();
  }

  switchUserBtn.addEventListener('click', () => {
    state.currentUser = null;
    saveState();
    showLogin();
  });

  // ── Routing ───────────────────────────────────────────────
  function showLogin() {
    loginView.hidden = false;
    appView.hidden = true;
    userEmail.value = '';
    setTimeout(() => userEmail.focus(), 60);
  }
  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    renderGreeting();
    renderAll();
    setTimeout(() => taskInput.focus(), 60);
  }

  // ── Greeting ──────────────────────────────────────────────
  function renderGreeting() {
    const h = new Date().getHours();
    let greeting = 'Hello,';
    if (h < 5)  greeting = 'Working late,';
    else if (h < 12) greeting = 'Good morning,';
    else if (h < 17) greeting = 'Good afternoon,';
    else if (h < 21) greeting = 'Good evening,';
    else greeting = 'Good night,';
    greetingText.textContent = greeting;

    const name = state.currentUser === GUEST_KEY
      ? 'friend'
      : (state.currentUser || '').split('@')[0] || 'friend';
    greetingName.textContent = name;
    currentUserLabel.textContent = state.currentUser === GUEST_KEY ? 'guest' : (state.currentUser || 'guest');

    const data = currentUserData();
    const active = data?.tasks?.length || 0;
    const todayCount = countCompletedToday(data);

    if (active === 0 && todayCount === 0) {
      greetingSub.textContent = "What's on your list today?";
    } else if (active === 0 && todayCount > 0) {
      greetingSub.textContent = `You've finished ${todayCount} ${todayCount === 1 ? 'task' : 'tasks'} today. Beautiful.`;
    } else if (active === 1) {
      greetingSub.textContent = 'One thing on the list. You got this.';
    } else {
      greetingSub.textContent = `${active} things on your list.`;
    }
  }

  // ── Tasks ─────────────────────────────────────────────────
  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
  });
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') taskInput.value = '';
  });

  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    const data = currentUserData();
    data.tasks.push({ id: uid(), text, createdAt: new Date().toISOString() });
    taskInput.value = '';
    saveState();
    renderAll();
    taskInput.focus();
  }

  function completeTask(id) {
    const data = currentUserData();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const [task] = data.tasks.splice(idx, 1);
    const completed = { id: task.id, text: task.text, completedAt: new Date().toISOString() };
    data.completed.unshift(completed);
    saveState();

    // animate row out then re-render
    const li = taskList.querySelector(`[data-id="${cssEscape(id)}"]`);
    if (li) li.classList.add('is-completing');
    setTimeout(() => {
      renderAll(true); // bump-animate the today counter
      showUndoToast(completed);
    }, 280);
  }

  function deleteTask(id) {
    const data = currentUserData();
    const idx = data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    data.tasks.splice(idx, 1);
    saveState();
    renderAll();
  }

  function undoComplete(completed) {
    const data = currentUserData();
    const cidx = data.completed.findIndex(t => t.id === completed.id);
    if (cidx !== -1) data.completed.splice(cidx, 1);
    data.tasks.push({ id: completed.id, text: completed.text, createdAt: new Date().toISOString() });
    saveState();
    renderAll();
  }

  function clearCompleted() {
    const data = currentUserData();
    if (!data.completed.length) return;
    const ok = confirm(`Clear all ${data.completed.length} completed task${data.completed.length === 1 ? '' : 's'}? This can't be undone.`);
    if (!ok) return;
    data.completed = [];
    saveState();
    renderAll();
  }
  clearCompletedBtn.addEventListener('click', clearCompleted);

  // delegated list click handler (XSS-safe; we never inject html)
  taskList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const li = btn.closest('li');
    const id = li?.dataset.id;
    if (!id) return;
    if (btn.classList.contains('check-btn')) completeTask(id);
    else if (btn.classList.contains('delete-btn')) deleteTask(id);
  });

  // ── Filters ───────────────────────────────────────────────
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterButtons.forEach(b => {
        const active = b.dataset.filter === filter;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      renderCompleted();
    });
  });

  // ── Render ────────────────────────────────────────────────
  function renderAll(bumpToday = false) {
    renderGreeting();
    renderTasks();
    renderCompleted();
    renderStats(bumpToday);
  }

  function renderTasks() {
    const data = currentUserData();
    taskList.innerHTML = '';
    if (!data.tasks.length) {
      emptyActive.hidden = false;
      return;
    }
    emptyActive.hidden = true;

    for (const task of data.tasks) {
      const li = document.createElement('li');
      li.dataset.id = task.id;

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.className = 'check-btn';
      checkBtn.setAttribute('aria-label', `Mark "${task.text}" as done`);
      checkBtn.title = 'Mark done';

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.text; // XSS-safe

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.setAttribute('aria-label', `Delete "${task.text}"`);
      deleteBtn.title = 'Delete';
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>`;

      li.append(checkBtn, span, deleteBtn);
      taskList.appendChild(li);
    }
  }

  function renderCompleted() {
    const data = currentUserData();
    const list = filterCompleted(data.completed, filter);
    completedList.innerHTML = '';

    if (!list.length) {
      emptyCompleted.hidden = false;
      emptyCompleted.textContent =
        filter === 'today' ? "No finished tasks today. There's still time ↑" :
        filter === 'week'  ? 'Nothing finished this week yet.' :
                             'No completed tasks here yet.';
      clearCompletedBtn.hidden = data.completed.length === 0;
      return;
    }
    emptyCompleted.hidden = true;
    clearCompletedBtn.hidden = false;

    for (const task of list) {
      const li = document.createElement('li');

      const check = document.createElement('span');
      check.className = 'completed-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';

      const text = document.createElement('span');
      text.className = 'completed-text';
      text.textContent = task.text;

      const meta = document.createElement('time');
      meta.className = 'completed-meta';
      meta.setAttribute('datetime', task.completedAt);
      meta.textContent = formatWhen(task.completedAt);

      li.append(check, text, meta);
      completedList.appendChild(li);
    }
  }

  function renderStats(bumpToday = false) {
    const data = currentUserData();
    const today = countCompletedToday(data);
    const week = countCompletedThisWeek(data);
    const all = data.completed.length;

    statToday.textContent = today;
    statWeek.textContent = week;
    statAll.textContent = all;

    if (bumpToday) {
      statToday.classList.remove('bump');
      // force reflow to restart animation
      void statToday.offsetWidth;
      statToday.classList.add('bump');
    }
  }

  // ── Filters / counts ──────────────────────────────────────
  function filterCompleted(list, filter) {
    if (filter === 'all') return list;
    const startOfToday = startOfDay(new Date());
    if (filter === 'today') {
      return list.filter(t => new Date(t.completedAt) >= startOfToday);
    }
    if (filter === 'week') {
      const sevenAgo = new Date(startOfToday);
      sevenAgo.setDate(sevenAgo.getDate() - 6);
      return list.filter(t => new Date(t.completedAt) >= sevenAgo);
    }
    return list;
  }

  function countCompletedToday(data) {
    if (!data) return 0;
    const startOfToday = startOfDay(new Date());
    return data.completed.filter(t => new Date(t.completedAt) >= startOfToday).length;
  }

  function countCompletedThisWeek(data) {
    if (!data) return 0;
    const startOfToday = startOfDay(new Date());
    const sevenAgo = new Date(startOfToday);
    sevenAgo.setDate(sevenAgo.getDate() - 6);
    return data.completed.filter(t => new Date(t.completedAt) >= sevenAgo).length;
  }

  // ── Date formatting ───────────────────────────────────────
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }
  function formatWhen(iso) {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isSameDay(d, now)) return timeStr;
    if (isSameDay(d, yesterday)) return `Yesterday · ${timeStr}`;

    const daysAgo = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);
    if (daysAgo > 0 && daysAgo < 7) {
      return `${d.toLocaleDateString([], { weekday: 'short' })} · ${timeStr}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // ── Toast / undo ──────────────────────────────────────────
  function showUndoToast(completed) {
    undoBuffer = completed;
    toastText.textContent = `Finished — "${truncate(completed.text, 40)}"`;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    clearTimeout(undoTimer);
    undoTimer = setTimeout(hideToast, 4500);
  }
  function hideToast() {
    toast.classList.remove('is-visible');
    setTimeout(() => { toast.hidden = true; undoBuffer = null; }, 250);
  }
  toastUndo.addEventListener('click', () => {
    if (undoBuffer) undoComplete(undoBuffer);
    hideToast();
  });

  // ── Misc helpers ──────────────────────────────────────────
  function truncate(s, n) {
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"');
  }

  // ── Boot ──────────────────────────────────────────────────
  if (state.currentUser) {
    showApp();
  } else {
    showLogin();
  }
})();
