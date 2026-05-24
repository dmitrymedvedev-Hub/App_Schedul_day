const storageKey = 'dailySchedulerSession';
const themeStorageKey = 'dayStrideTheme';

const state = {
  token: '',
  user: null,
  schedules: [],
  route: 'home'
};

const elements = {
  authShell: document.getElementById('authShell'),
  appShell: document.getElementById('appShell'),
  signinView: document.getElementById('signinView'),
  signupView: document.getElementById('signupView'),
  signinForm: document.getElementById('signinForm'),
  signupForm: document.getElementById('signupForm'),
  signinEmail: document.getElementById('signinEmail'),
  signinPassword: document.getElementById('signinPassword'),
  signupName: document.getElementById('signupName'),
  signupEmail: document.getElementById('signupEmail'),
  signupPassword: document.getElementById('signupPassword'),
  authMessages: document.querySelectorAll('.auth-message'),
  themeButtons: document.querySelectorAll('.theme-toggle'),
  menuToggleBtn: document.getElementById('menuToggleBtn'),
  menuCloseBtn: document.getElementById('menuCloseBtn'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  newActivityBtn: document.getElementById('newActivityBtn'),
  signoutBtn: document.getElementById('signoutBtn'),
  profileSignoutBtn: document.getElementById('profileSignoutBtn'),
  accountName: document.getElementById('accountName'),
  accountEmail: document.getElementById('accountEmail'),
  profileForm: document.getElementById('profileForm'),
  profileAvatar: document.getElementById('profileAvatar'),
  profileName: document.getElementById('profileName'),
  profileEmail: document.getElementById('profileEmail'),
  profileMemberSince: document.getElementById('profileMemberSince'),
  profileNameInput: document.getElementById('profileNameInput'),
  profileEmailInput: document.getElementById('profileEmailInput'),
  profileTotalActivities: document.getElementById('profileTotalActivities'),
  profileCompletedActivities: document.getElementById('profileCompletedActivities'),
  profileHighPriority: document.getElementById('profileHighPriority'),
  message: document.getElementById('message'),
  pageTitle: document.getElementById('pageTitle'),
  todayLabel: document.getElementById('todayLabel'),
  welcomeTitle: document.getElementById('welcomeTitle'),
  homeSummary: document.getElementById('homeSummary'),
  todayCount: document.getElementById('todayCount'),
  plannedMinutes: document.getElementById('plannedMinutes'),
  completedCount: document.getElementById('completedCount'),
  nextActivityTitle: document.getElementById('nextActivityTitle'),
  nextActivityMeta: document.getElementById('nextActivityMeta'),
  focusTipTitle: document.getElementById('focusTipTitle'),
  focusTipCopy: document.getElementById('focusTipCopy'),
  totalActivities: document.getElementById('totalActivities'),
  highPriorityCount: document.getElementById('highPriorityCount'),
  completionRate: document.getElementById('completionRate'),
  dashboardTodayMinutes: document.getElementById('dashboardTodayMinutes'),
  homeActivityList: document.getElementById('homeActivityList'),
  timelineList: document.getElementById('timelineList'),
  statusBreakdown: document.getElementById('statusBreakdown'),
  scheduleForm: document.getElementById('scheduleForm'),
  formTitle: document.getElementById('formTitle'),
  resetBtn: document.getElementById('resetBtn'),
  filterSearch: document.getElementById('filterSearch'),
  filterDate: document.getElementById('filterDate'),
  filterStatus: document.getElementById('filterStatus'),
  filterPriority: document.getElementById('filterPriority'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  scheduleList: document.getElementById('scheduleList'),
  pages: {
    home: document.getElementById('homePage'),
    dashboard: document.getElementById('dashboardPage'),
    activities: document.getElementById('activitiesPage'),
    profile: document.getElementById('profilePage')
  },
  fields: {
    id: document.getElementById('scheduleId'),
    title: document.getElementById('title'),
    taskDate: document.getElementById('taskDate'),
    startTime: document.getElementById('startTime'),
    endTime: document.getElementById('endTime'),
    priority: document.getElementById('priority'),
    status: document.getElementById('status'),
    notes: document.getElementById('notes')
  }
};

const routes = {
  home: 'Home',
  dashboard: 'Dashboard',
  activities: 'My activities',
  profile: 'Profile'
};

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed'
};

const formatDateInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const today = () => formatDateInput();

const toDateKey = (value) => {
  if (!value) return '';

  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return formatDateInput(date);
  }

  return stringValue.slice(0, 10);
};

const toTime = (value) => String(value || '').slice(0, 5);

const toMinutes = (time) => {
  const [hours, minutes] = toTime(time).split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesBetween = (start, end) => Math.max(toMinutes(end) - toMinutes(start), 0);

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const formatMemberSince = (value) => {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const initialsFor = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'DS';

const pageTone = {
  home: 'home',
  dashboard: 'dashboard',
  activities: 'activities',
  profile: 'profile'
};

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(themeStorageKey, nextTheme);

  const isDark = nextTheme === 'dark';
  elements.themeButtons.forEach((button) => {
    button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    button.dataset.theme = nextTheme;
    const text = button.querySelector('.theme-toggle-text');
    if (text) text.textContent = isDark ? 'Light' : 'Dark';
  });
};

const toggleTheme = () => {
  const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
};

const escapeHtml = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const setMessage = (text, isError = false) => {
  elements.message.textContent = text;
  elements.message.classList.toggle('error', isError);
};

const setAuthMessage = (text, isError = false) => {
  elements.authMessages.forEach((message) => {
    message.textContent = text;
    message.classList.toggle('error', isError);
  });
};

const saveSession = (session) => {
  localStorage.setItem(storageKey, JSON.stringify(session));
};

const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || null;
  } catch (error) {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(storageKey);
  state.token = '';
  state.user = null;
  state.schedules = [];
};

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      showAuth('signin');
    }

    throw new Error(payload?.message || 'Request failed.');
  }

  return payload;
};

const setAuthMode = (mode) => {
  const isSignup = mode === 'signup';
  elements.signinView.classList.toggle('hidden', isSignup);
  elements.signupView.classList.toggle('hidden', !isSignup);
};

const showAuth = (mode = 'signin') => {
  elements.authShell.classList.remove('hidden');
  elements.appShell.classList.add('hidden');
  setAuthMode(mode);
  setMessage('');
  setAuthMessage('');
};

const showApp = () => {
  elements.authShell.classList.add('hidden');
  elements.appShell.classList.remove('hidden');
  elements.accountName.textContent = state.user?.name || 'Account';
  elements.accountEmail.textContent = state.user?.email || '';
  elements.profileNameInput.value = state.user?.name || '';
  elements.profileEmailInput.value = state.user?.email || '';
};

const currentItems = () => {
  const search = elements.filterSearch.value.trim().toLowerCase();
  const date = elements.filterDate.value;
  const status = elements.filterStatus.value;
  const priority = elements.filterPriority.value;

  return state.schedules.filter((item) => {
    const text = `${item.title || ''} ${item.notes || ''}`.toLowerCase();
    const matchesSearch = !search || text.includes(search);
    const matchesDate = !date || toDateKey(item.task_date) === date;
    const matchesStatus = status === 'all' || item.status === status;
    const matchesPriority = priority === 'all' || item.priority === priority;
    return matchesSearch && matchesDate && matchesStatus && matchesPriority;
  });
};

const todayItems = () =>
  state.schedules
    .filter((item) => toDateKey(item.task_date) === today())
    .sort((a, b) => toTime(a.start_time).localeCompare(toTime(b.start_time)));

const renderActivityCard = (item) => `
  <article class="activity-card">
    <div class="activity-main">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(toDateKey(item.task_date))} | ${escapeHtml(toTime(item.start_time))} -
          ${escapeHtml(toTime(item.end_time))}</p>
      </div>
      <span class="badge ${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span>
    </div>
    <div class="activity-meta">
      <span>${escapeHtml(statusLabels[item.status] || item.status)}</span>
      <span>${formatDuration(minutesBetween(item.start_time, item.end_time))}</span>
    </div>
    ${item.notes ? `<p class="notes">${escapeHtml(item.notes)}</p>` : ''}
    <div class="activity-actions">
      <button class="ghost-button compact" type="button" data-action="edit" data-id="${item.id}">
        Edit
      </button>
      <button class="danger-button compact" type="button" data-action="delete" data-id="${item.id}">
        Delete
      </button>
    </div>
  </article>
`;

const renderEmpty = (text) => `<p class="empty-state">${escapeHtml(text)}</p>`;

const renderHome = () => {
  const items = todayItems();
  const planned = items.reduce((sum, item) => sum + minutesBetween(item.start_time, item.end_time), 0);
  const completed = items.filter((item) => item.status === 'completed').length;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextItem = items.find((item) => toMinutes(item.end_time) >= nowMinutes) || items[0];
  const highCount = items.filter((item) => item.priority === 'high').length;

  elements.todayLabel.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  elements.welcomeTitle.textContent = `Welcome back, ${state.user?.name?.split(' ')[0] || 'there'}.`;
  elements.homeSummary.textContent = items.length
    ? `You have ${items.length} activit${items.length === 1 ? 'y' : 'ies'} planned today.`
    : 'Your schedule is clear today.';
  elements.todayCount.textContent = items.length;
  elements.plannedMinutes.textContent = formatDuration(planned);
  elements.completedCount.textContent = completed;
  elements.nextActivityTitle.textContent = nextItem?.title || 'Nothing scheduled';
  elements.nextActivityMeta.textContent = nextItem
    ? `${toTime(nextItem.start_time)} - ${toTime(nextItem.end_time)} | ${statusLabels[nextItem.status]}`
    : 'Add an activity to build your plan.';
  elements.focusTipTitle.textContent = highCount ? 'Protect high priority time' : 'Keep it simple';
  elements.focusTipCopy.textContent = highCount
    ? `${highCount} high priority activit${highCount === 1 ? 'y' : 'ies'} need focused attention today.`
    : 'Start with one high-value activity and protect that time.';
  elements.homeActivityList.innerHTML = items.length
    ? items.slice(0, 3).map(renderActivityCard).join('')
    : renderEmpty('No activities planned for today.');
};

const renderDashboard = () => {
  const total = state.schedules.length;
  const high = state.schedules.filter((item) => item.priority === 'high').length;
  const completed = state.schedules.filter((item) => item.status === 'completed').length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const todays = todayItems();
  const todayMinutes = todays.reduce((sum, item) => sum + minutesBetween(item.start_time, item.end_time), 0);
  const statuses = ['pending', 'in_progress', 'completed'];

  elements.totalActivities.textContent = total;
  elements.highPriorityCount.textContent = high;
  elements.completionRate.textContent = `${rate}%`;
  elements.dashboardTodayMinutes.textContent = formatDuration(todayMinutes);
  elements.timelineList.innerHTML = todays.length
    ? todays
        .map(
          (item) => `
            <article class="timeline-item">
              <time>${escapeHtml(toTime(item.start_time))}</time>
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(statusLabels[item.status])}</span>
              </div>
            </article>
          `
        )
        .join('')
    : renderEmpty('No timeline items for today.');

  elements.statusBreakdown.innerHTML = statuses
    .map((status) => {
      const count = state.schedules.filter((item) => item.status === status).length;
      const percent = total ? Math.round((count / total) * 100) : 0;
      return `
        <div class="breakdown-row">
          <div>
            <strong>${statusLabels[status]}</strong>
            <span>${count} activities</span>
          </div>
          <div class="progress-track"><span style="width: ${percent}%"></span></div>
        </div>
      `;
    })
    .join('');
};

const renderActivities = () => {
  const items = currentItems().sort((a, b) => {
    const dateSort = toDateKey(a.task_date).localeCompare(toDateKey(b.task_date));
    return dateSort || toTime(a.start_time).localeCompare(toTime(b.start_time));
  });

  elements.scheduleList.innerHTML = items.length
    ? items.map(renderActivityCard).join('')
    : renderEmpty('No activities match this view.');
};

const renderProfile = () => {
  const total = state.schedules.length;
  const completed = state.schedules.filter((item) => item.status === 'completed').length;
  const high = state.schedules.filter((item) => item.priority === 'high').length;

  elements.profileAvatar.textContent = initialsFor(state.user?.name);
  elements.profileName.textContent = state.user?.name || 'Account name';
  elements.profileEmail.textContent = state.user?.email || 'account@example.com';
  elements.profileMemberSince.textContent = formatMemberSince(state.user?.createdAt);
  elements.profileNameInput.value = state.user?.name || '';
  elements.profileEmailInput.value = state.user?.email || '';
  elements.profileTotalActivities.textContent = total;
  elements.profileCompletedActivities.textContent = completed;
  elements.profileHighPriority.textContent = high;
};

const renderAll = () => {
  renderHome();
  renderDashboard();
  renderActivities();
  renderProfile();
};

const setRoute = (route) => {
  state.route = routes[route] ? route : 'home';
  elements.pageTitle.textContent = routes[state.route];
  document.body.dataset.route = pageTone[state.route];

  Object.entries(elements.pages).forEach(([name, page]) => {
    page.classList.toggle('hidden', name !== state.route);
  });

  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.route === state.route);
  });
  if (window.innerWidth <= 980) closeMenu();
};

const openMenu = () => {
  elements.appShell.classList.add('menu-open');
  elements.appShell.classList.remove('menu-collapsed');
  if (elements.menuToggleBtn) {
    elements.menuToggleBtn.setAttribute('aria-expanded', 'true');
    elements.menuToggleBtn.classList.add('open');
  }
  const isOverlay = window.innerWidth <= 980;
  // If a dedicated sidebar close button exists, show it for accessibility on small screens
  if (elements.menuCloseBtn) elements.menuCloseBtn.style.display = isOverlay ? '' : 'none';
  // accessibility: hide main content from assistive tech and trap focus in sidebar only for overlay (mobile)
  if (isOverlay) {
    document.querySelectorAll('main, header, footer, [role="main"]').forEach((el) => el?.setAttribute('aria-hidden', 'true'));
    enableSidebarFocusTrap();
  }
};

const closeMenu = () => {
  elements.appShell.classList.remove('menu-open');
  elements.appShell.classList.add('menu-collapsed');
  if (elements.menuToggleBtn) {
    elements.menuToggleBtn.setAttribute('aria-expanded', 'false');
    elements.menuToggleBtn.classList.remove('open');
  }
  if (elements.menuCloseBtn) elements.menuCloseBtn.style.display = 'none';
  // accessibility: restore main content visibility and remove focus trap
  document.querySelectorAll('main, header, footer, [role="main"]').forEach((el) => el?.removeAttribute('aria-hidden'));
  disableSidebarFocusTrap();
};

let _sidebarKeyListener = null;
function getFocusable(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
}

function enableSidebarFocusTrap() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const focusables = getFocusable(sidebar);
  if (focusables.length) focusables[0].focus();

  _sidebarKeyListener = (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      if (elements.menuToggleBtn) elements.menuToggleBtn.focus();
      return;
    }

    if (e.key !== 'Tab') return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', _sidebarKeyListener);
}

function disableSidebarFocusTrap() {
  if (_sidebarKeyListener) {
    document.removeEventListener('keydown', _sidebarKeyListener);
    _sidebarKeyListener = null;
  }
}

const toggleMenu = () => {
  const isClosed = elements.appShell.classList.contains('menu-collapsed');
  if (isClosed) {
    openMenu();
  } else {
    closeMenu();
  }
};

const resetForm = () => {
  elements.fields.id.value = '';
  elements.scheduleForm.reset();
  elements.fields.taskDate.value = today();
  elements.fields.priority.value = 'medium';
  elements.fields.status.value = 'pending';
  elements.formTitle.textContent = 'Create activity';
};

const openActivitiesPage = () => {
  resetForm();
  setRoute('activities');
  elements.fields.title.focus();
};

const readFormData = () => ({
  title: elements.fields.title.value.trim(),
  taskDate: elements.fields.taskDate.value,
  startTime: elements.fields.startTime.value,
  endTime: elements.fields.endTime.value,
  priority: elements.fields.priority.value,
  status: elements.fields.status.value,
  notes: elements.fields.notes.value.trim()
});

const loadSchedules = async () => {
  state.schedules = await apiRequest('/api/schedules');
  renderAll();
};

const handleAuthSuccess = async ({ token, user }) => {
  state.token = token;
  state.user = user;
  saveSession({ token, user });
  showApp();
  setRoute('home');
  await loadSchedules();
};

elements.signinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: elements.signinEmail.value.trim(),
        password: elements.signinPassword.value
      })
    });
    await handleAuthSuccess(payload);
  } catch (error) {
    setAuthMessage(error.message, true);
  }
});

elements.signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: elements.signupName.value.trim(),
        email: elements.signupEmail.value.trim(),
        password: elements.signupPassword.value
      })
    });
    await handleAuthSuccess(payload);
  } catch (error) {
    setAuthMessage(error.message, true);
  }
});

elements.scheduleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = elements.fields.id.value;
  const taskDate = elements.fields.taskDate.value;

  try {
    await apiRequest(id ? `/api/schedules/${id}` : '/api/schedules', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(readFormData())
    });
    elements.filterSearch.value = '';
    elements.filterStatus.value = 'all';
    elements.filterPriority.value = 'all';
    elements.filterDate.value = taskDate || today();
    setMessage(id ? 'Activity updated.' : 'Activity created.');
    resetForm();
    await loadSchedules();
    setRoute('activities');
  } catch (error) {
    setMessage(error.message, true);
  }
});

elements.profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const payload = await apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: elements.profileNameInput.value.trim(),
        email: elements.profileEmailInput.value.trim()
      })
    });

    state.token = payload.token;
    state.user = payload.user;
    saveSession({ token: state.token, user: state.user });
    showApp();
    renderProfile();
    setMessage('Profile updated.');
  } catch (error) {
    setMessage(error.message, true);
  }
});

const handleActivityAction = async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const { action, id } = target.dataset;
  if (!action || !id) return;

  if (action === 'delete') {
    try {
      await apiRequest(`/api/schedules/${id}`, { method: 'DELETE' });
      setMessage('Activity deleted.');
      await loadSchedules();
    } catch (error) {
      setMessage(error.message, true);
    }
    return;
  }

  const item = state.schedules.find((entry) => String(entry.id) === String(id));
  if (!item) return;

  elements.fields.id.value = item.id;
  elements.fields.title.value = item.title;
  elements.fields.taskDate.value = toDateKey(item.task_date);
  elements.fields.startTime.value = toTime(item.start_time);
  elements.fields.endTime.value = toTime(item.end_time);
  elements.fields.priority.value = item.priority;
  elements.fields.status.value = item.status;
  elements.fields.notes.value = item.notes || '';
  elements.formTitle.textContent = 'Update activity';
  setRoute('activities');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.addEventListener('click', (event) => {
  // delegate to the closest button element so clicks on inner spans/icons still trigger
  const clicked = event.target;
  const button = clicked.closest ? clicked.closest('button') : null;
  if (!button) return;

  if (button.dataset.action) {
    handleActivityAction({ target: button });
    return;
  }

  if (button.dataset.route) {
    if (button.id === 'newActivityBtn' && button.dataset.route === 'activities') {
      openActivitiesPage();
      return;
    }

    setRoute(button.dataset.route);
    return;
  }

  if (button.dataset.authMode) {
    setAuthMode(button.dataset.authMode);
    return;
  }
});

elements.resetBtn.addEventListener('click', resetForm);
elements.filterDate.addEventListener('change', renderActivities);
elements.filterSearch.addEventListener('input', renderActivities);
elements.filterStatus.addEventListener('change', renderActivities);
elements.filterPriority.addEventListener('change', renderActivities);
elements.clearFiltersBtn.addEventListener('click', () => {
  elements.filterSearch.value = '';
  elements.filterDate.value = '';
  elements.filterStatus.value = 'all';
  elements.filterPriority.value = 'all';
  renderActivities();
});
if (elements.menuToggleBtn) elements.menuToggleBtn.addEventListener('click', toggleMenu);
if (elements.menuCloseBtn) elements.menuCloseBtn.addEventListener('click', closeMenu);
if (elements.sidebarOverlay) elements.sidebarOverlay.addEventListener('click', closeMenu);
if (elements.newActivityBtn) elements.newActivityBtn.addEventListener('click', openActivitiesPage);
elements.themeButtons.forEach((button) => button.addEventListener('click', toggleTheme));
window.addEventListener('resize', () => {
  if (window.innerWidth > 980) openMenu();
});
const signOut = () => {
  clearSession();
  showAuth('signin');
};

elements.signoutBtn.addEventListener('click', signOut);
elements.profileSignoutBtn.addEventListener('click', signOut);

const boot = async () => {
  applyTheme(getPreferredTheme());
  elements.fields.taskDate.value = today();
  elements.filterDate.value = today();
  elements.filterPriority.value = 'all';
  if (window.innerWidth > 980) {
    // show desktop menu state (expanded)
    openMenu();
  } else {
    closeMenu();
  }

  const session = loadSession();
  if (!session?.token || !session?.user) {
    showAuth('signin');
    return;
  }

  state.token = session.token;
  state.user = session.user;

  try {
    const profile = await apiRequest('/api/auth/me');
    state.user = profile.user;
    saveSession({ token: state.token, user: state.user });
    showApp();
    setRoute('home');
    await loadSchedules();
  } catch (error) {
    showAuth('signin');
  }
};

boot();
