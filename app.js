const STORAGE_KEY = "offline-todo-list";

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const emptyMessage = document.querySelector("#empty-message");
const remainingCount = document.querySelector("#remaining-count");
const themeToggle = document.querySelector("#theme-toggle");
const filterButtons = document.querySelectorAll("[data-filter]");

const THEME_STORAGE_KEY = "offline-todo-theme";
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

let todos = loadTodos();
let currentFilter = "all";

// 從瀏覽器儲存空間讀取待辦資料，若資料損壞則回到空清單。
function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTodos) ? savedTodos : [];
  } catch {
    return [];
  }
}

// 將目前清單保存到瀏覽器，重新整理後仍可保留。
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 取得目前主題；沒有手動選擇時讓 CSS 跟隨作業系統設定。
function getCurrentTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || (systemThemeQuery.matches ? "dark" : "light");
}

function updateThemeButton() {
  const isDark = getCurrentTheme() === "dark";
  themeToggle.textContent = isDark ? "☀️ 淺色模式" : "🌙 深色模式";
  themeToggle.setAttribute("aria-label", isDark ? "切換至淺色模式" : "切換至深色模式");
  themeToggle.setAttribute("aria-pressed", String(isDark));
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  updateThemeButton();
}

function getVisibleTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.completed);
  }

  if (currentFilter === "completed") {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

function updateEmptyMessage(visibleTodos) {
  if (visibleTodos.length > 0) {
    emptyMessage.hidden = true;
    return;
  }

  const messages = {
    all: "還沒有任何待辦事項，新增一個吧!",
    active: "目前沒有未完成的待辦事項。",
    completed: "目前沒有已完成的待辦事項。",
  };
  emptyMessage.textContent = messages[currentFilter];
  emptyMessage.hidden = false;
}

function renderTodos() {
  todoList.replaceChildren();
  const visibleTodos = getVisibleTodos();

  visibleTodos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";
    item.classList.toggle("completed", todo.completed);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `完成待辦：${todo.text}`);
    checkbox.addEventListener("change", () => {
      todo.completed = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "刪除";
    deleteButton.setAttribute("aria-label", `刪除待辦：${todo.text}`);
    deleteButton.addEventListener("click", () => {
      todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    item.append(checkbox, text, deleteButton);
    todoList.append(item);
  });

  const unfinishedTodos = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成：${unfinishedTodos} 項`;
  updateEmptyMessage(visibleTodos);

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (!text) {
    todoInput.focus();
    return;
  }

  todos.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    completed: false,
  });

  saveTodos();
  renderTodos();
  todoForm.reset();
  todoInput.focus();
});

themeToggle.addEventListener("click", () => {
  const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    renderTodos();
  });
});

systemThemeQuery.addEventListener("change", () => {
  if (!localStorage.getItem(THEME_STORAGE_KEY)) {
    applyTheme(systemThemeQuery.matches ? "dark" : "light");
  }
});

if (localStorage.getItem(THEME_STORAGE_KEY)) {
  applyTheme(getCurrentTheme());
} else {
  document.documentElement.removeAttribute("data-theme");
  updateThemeButton();
}
renderTodos();