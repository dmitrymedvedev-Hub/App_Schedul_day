const form = document.getElementById('scheduleForm');
const resetBtn = document.getElementById('resetBtn');
const list = document.getElementById('scheduleList');
const message = document.getElementById('message');
const filterDate = document.getElementById('filterDate');

const fields = {
  id: document.getElementById('scheduleId'),
  title: document.getElementById('title'),
  taskDate: document.getElementById('taskDate'),
  startTime: document.getElementById('startTime'),
  endTime: document.getElementById('endTime'),
  priority: document.getElementById('priority'),
  status: document.getElementById('status'),
  notes: document.getElementById('notes')
};

const setMessage = (text, isError = false) => {
  message.textContent = text;
  message.classList.toggle('error', isError);
};

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const resetForm = () => {
  fields.id.value = '';
  form.reset();
};

const readFormData = () => ({
  title: fields.title.value.trim(),
  taskDate: fields.taskDate.value,
  startTime: fields.startTime.value,
  endTime: fields.endTime.value,
  priority: fields.priority.value,
  status: fields.status.value,
  notes: fields.notes.value.trim()
});

const fetchSchedules = async () => {
  const query = filterDate.value ? `?date=${encodeURIComponent(filterDate.value)}` : '';
  const response = await fetch(`/api/schedules${query}`);
  if (!response.ok) throw new Error('Failed to load schedules.');
  return response.json();
};

const renderSchedules = (items) => {
  if (!items.length) {
    list.innerHTML = '<p class="empty">No tasks planned for this filter.</p>';
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
      <article class="card">
        <div class="card-top">
          <div>
            <strong>${escapeHtml(item.title)}</strong><br />
            <small>${escapeHtml(item.task_date)} · ${escapeHtml(item.start_time.slice(0, 5))} - ${escapeHtml(
        item.end_time.slice(0, 5)
      )}</small>
          </div>
          <span class="badge ${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span>
        </div>
        <div>Status: <strong>${escapeHtml(item.status.replace('_', ' '))}</strong></div>
        ${item.notes ? `<div>Notes: ${escapeHtml(item.notes)}</div>` : ''}
        <div class="actions">
          <button type="button" data-action="edit" data-id="${item.id}">Edit</button>
          <button type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </article>`
    )
    .join('');
};

const loadSchedules = async () => {
  try {
    const items = await fetchSchedules();
    renderSchedules(items);
    setMessage(items.length ? '' : 'Add your first task to start organizing your day.');
  } catch (error) {
    setMessage(error.message, true);
  }
};

const saveSchedule = async (id, payload) => {
  const response = await fetch(id ? `/api/schedules/${id}` : '/api/schedules', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Request failed.');
  }

  return id ? response.json() : response.json();
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = readFormData();
  const id = fields.id.value;

  try {
    await saveSchedule(id, payload);
    setMessage(id ? 'Task updated successfully.' : 'Task created successfully.');
    resetForm();
    await loadSchedules();
  } catch (error) {
    setMessage(error.message, true);
  }
});

resetBtn.addEventListener('click', resetForm);
filterDate.addEventListener('change', loadSchedules);

list.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const id = target.dataset.id;
  const action = target.dataset.action;
  if (!id || !action) return;

  if (action === 'delete') {
    try {
      const response = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed.');
      setMessage('Task removed.');
      await loadSchedules();
    } catch (error) {
      setMessage(error.message, true);
    }
    return;
  }

  if (action === 'edit') {
    const cards = await fetchSchedules();
    const item = cards.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    fields.id.value = item.id;
    fields.title.value = item.title;
    fields.taskDate.value = item.task_date;
    fields.startTime.value = item.start_time.slice(0, 5);
    fields.endTime.value = item.end_time.slice(0, 5);
    fields.priority.value = item.priority;
    fields.status.value = item.status;
    fields.notes.value = item.notes || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

fields.taskDate.valueAsDate = new Date();
filterDate.valueAsDate = new Date();
loadSchedules();
