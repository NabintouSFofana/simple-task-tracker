const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const completedSection = document.getElementById("completedTasks");
const statsPanel = document.getElementById("statsPanel");
const darkToggle = document.getElementById("darkModeToggle");

let currentUser = localStorage.getItem("currentUser") || "";
let userData = JSON.parse(localStorage.getItem("userData")) || {};
let tasks = [];
let completedTasks = [];

function loginUser() {
  const emailInput = document.getElementById("userEmail").value.trim().toLowerCase();
  if (emailInput) {
    currentUser = emailInput;
    if (!userData[currentUser]) {
      userData[currentUser] = { tasks: [], completed: [] };
    }
    localStorage.setItem("currentUser", currentUser);
    localStorage.setItem("userData", JSON.stringify(userData));
    document.querySelector(".user-login").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadUserData();
    showWelcome();
    renderTasks();
  }
}

function showWelcome() {
  document.getElementById("userWelcome").innerText = `👋 Welcome, ${currentUser}`;
}

function loadUserData() {
  userData = JSON.parse(localStorage.getItem("userData")) || {};
  tasks = userData[currentUser]?.tasks || [];
  completedTasks = userData[currentUser]?.completed || [];
}

function updateUserData() {
  userData[currentUser] = { tasks, completed: completedTasks };
  localStorage.setItem("userData", JSON.stringify(userData));
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${task}</span>
      <div>
        <button title="Mark as done" onclick="markAsDone(${index})">✅</button>
        <button title="Delete this task" onclick="deleteTask(${index})">❌</button>
      </div>
    `;
    taskList.appendChild(li);
  });
  renderCompleted();
}

function renderCompleted() {
  completedSection.innerHTML = "<h3>✅ Completed Tasks</h3>";
  statsPanel.innerHTML = "";

  if (completedTasks.length === 0) {
    completedSection.innerHTML += "<p>No tasks completed yet.</p>";
    return;
  }

  const ul = document.createElement("ul");
  let today = new Date().toISOString().split("T")[0];
  let todayCount = 0;

  completedTasks.forEach(task => {
    if (task.date === today) todayCount++;
    const li = document.createElement("li");
    li.textContent = `${task.text} (${task.date})`;
    li.className = "completed";
    ul.appendChild(li);
  });

  completedSection.appendChild(ul);
  statsPanel.innerText = `🎯 ${todayCount} task(s) completed today`;
}

function addTask() {
  const newTask = taskInput.value.trim();
  if (newTask !== "") {
    tasks.push(newTask);
    taskInput.value = "";
    updateUserData();
    renderTasks();
  }
}

function markAsDone(index) {
  const doneTask = {
    text: tasks.splice(index, 1)[0],
    date: new Date().toISOString().split("T")[0]
  };
  completedTasks.push(doneTask);
  updateUserData();
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  updateUserData();
  renderTasks();
}

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

darkToggle.addEventListener("change", () => {
  if (darkToggle.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkMode", "enabled");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkMode", "disabled");
  }
});

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  darkToggle.checked = true;
}

if (currentUser) {
  document.querySelector(".user-login").style.display = "none";
  document.getElementById("app").style.display = "block";
  loadUserData();
  showWelcome();
  renderTasks();
}
