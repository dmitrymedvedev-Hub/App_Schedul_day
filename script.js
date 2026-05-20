const STORAGE_KEY = "daySchedulerTasks";
const WORK_DAY_MINUTES = 8 * 60;

const form = document.getElementById("task-form");
const nameInput = document.getElementById("task-name");
const durationInput = document.getElementById("task-duration");
const priorityInput = document.getElementById("task-priority");
const taskList = document.getElementById("task-list");
const summary = document.getElementById("summary");
const clearBtn = document.getElementById("clear-btn");

let tasks = loadTasks();

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function optimize(taskItems) {
  return [...taskItems].sort((a, b) => b.priority - a.priority || a.duration - b.duration);
}

function formatStartTime(totalMinutes) {
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function render() {
  const ordered = optimize(tasks);
  const total = ordered.reduce((acc, item) => acc + item.duration, 0);
  const free = WORK_DAY_MINUTES - total;

  summary.textContent = `Planned: ${total} min | Free in 8h day: ${free >= 0 ? free : 0} min`;

  taskList.innerHTML = "";
  let clock = 9 * 60;

  ordered.forEach((task, index) => {
    const li = document.createElement("li");
    const start = formatStartTime(clock);
    const end = formatStartTime(clock + task.duration);
    li.textContent = `${start}-${end} · ${task.name} (${task.duration} min, ${priorityLabel(task.priority)})`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Remove";
    removeBtn.style.marginLeft = "0.6rem";
    removeBtn.addEventListener("click", () => {
      const target = ordered[index];
      tasks = tasks.filter((item) => item.id !== target.id);
      saveTasks();
      render();
    });

    li.appendChild(removeBtn);
    taskList.appendChild(li);
    clock += task.duration;
  });
}

function priorityLabel(value) {
  if (value === 3) return "High";
  if (value === 2) return "Medium";
  return "Low";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const duration = Number(durationInput.value);
  const priority = Number(priorityInput.value);

  if (!name || Number.isNaN(duration) || duration <= 0) return;

  tasks.push({
    id: crypto.randomUUID(),
    name,
    duration,
    priority,
  });

  saveTasks();
  form.reset();
  durationInput.value = "30";
  priorityInput.value = "2";
  render();
});

clearBtn.addEventListener("click", () => {
  tasks = [];
  saveTasks();
  render();
});

render();
