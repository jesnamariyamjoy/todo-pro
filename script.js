const input = document.getElementById("taskInput");
const dueDate = document.getElementById("dueDate");
const list = document.getElementById("taskList");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const toggleMode = document.getElementById("toggleMode");

let dragIndex = null;
let chart;

// Notification permission
Notification.requestPermission();

document.addEventListener("DOMContentLoaded", loadTasks);

document.getElementById("addBtn").onclick = addTask;
search.oninput = filterTasks;
filter.onchange = filterTasks;
toggleMode.onclick = () => document.body.classList.toggle("dark");

// Add Task
function addTask() {
  if (!input.value) return alert("Enter task!");

  const tasks = getTasks();
  tasks.push({
    text: input.value,
    date: dueDate.value,
    completed: false,
    notified: false
  });

  input.value = "";
  dueDate.value = "";

  saveTasks(tasks);
}

// Get Tasks
function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

// Save Tasks
function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();
}

// Load Tasks
function loadTasks() {
  list.innerHTML = "";
  const tasks = getTasks();

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", true);
    li.dataset.index = index;

    const span = document.createElement("span");
    span.innerText = `${task.text} (${task.date || "No date"})`;

    if (task.completed) span.classList.add("completed");

    span.onclick = () => {
      task.completed = !task.completed;
      saveTasks(tasks);
    };

    const del = document.createElement("button");
    del.innerText = "X";
    del.className = "delete-btn";

    del.onclick = () => {
      tasks.splice(index, 1);
      saveTasks(tasks);
    };

    li.appendChild(span);
    li.appendChild(del);
    list.appendChild(li);
  });

  updateAnalytics(tasks);
  renderChart(tasks);
  filterTasks();
}

// Filter
function filterTasks() {
  const text = search.value.toLowerCase();
  const type = filter.value;

  document.querySelectorAll("li").forEach(li => {
    const content = li.innerText.toLowerCase();
    const completed = li.querySelector("span").classList.contains("completed");

    let show = true;

    if (text && !content.includes(text)) show = false;
    if (type === "completed" && !completed) show = false;
    if (type === "pending" && completed) show = false;

    li.style.display = show ? "flex" : "none";
  });
}

// Analytics
function updateAnalytics(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  document.getElementById("total").innerText = total;
  document.getElementById("completed").innerText = completed;
  document.getElementById("pending").innerText = pending;
}

// Chart
function renderChart(tasks) {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  const ctx = document.getElementById("taskChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ["#4CAF50", "#FF5252"]
      }]
    }
  });
}

// Drag & Drop
document.addEventListener("dragstart", e => {
  if (e.target.tagName === "LI") {
    dragIndex = e.target.dataset.index;
  }
});

document.addEventListener("dragover", e => e.preventDefault());

document.addEventListener("drop", e => {
  if (e.target.closest("li")) {
    const dropIndex = e.target.closest("li").dataset.index;
    const tasks = getTasks();

    const dragged = tasks.splice(dragIndex, 1)[0];
    tasks.splice(dropIndex, 0, dragged);

    saveTasks(tasks);
  }
});

// Reminder
function checkReminders() {
  const tasks = getTasks();
  const now = new Date();

  tasks.forEach(task => {
    if (task.date && !task.notified) {
      const due = new Date(task.date);

      if (due <= now && Notification.permission === "granted") {
        new Notification("⏰ Reminder", { body: task.text });
        task.notified = true;
      }
    }
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

setInterval(checkReminders, 60000);