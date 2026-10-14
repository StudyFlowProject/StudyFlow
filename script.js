(() => {
  "use strict";

  const STORAGE_KEY = "studyflow-tasks-v1";
  const form = document.querySelector("#taskForm");
  const titleInput = document.querySelector("#taskTitle");
  const dateInput = document.querySelector("#taskDate");
  const subjectInput = document.querySelector("#taskSubject");
  const filterSelect = document.querySelector("#filterTasks");
  const taskList = document.querySelector("#taskList");
  const emptyState = document.querySelector("#emptyState");
  const clearDoneButton = document.querySelector("#clearDone");

  let tasks = loadTasks();

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(task =>
        task && typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.done === "boolean"
      ) : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      alert("Je browser kan de gegevens niet bewaren. Controleer je browserinstellingen.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T12:00:00`);
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric", month: "short", year: "numeric"
    }).format(date);
  }

  function updateStats() {
    document.querySelector("#totalCount").textContent = tasks.length;
    document.querySelector("#openCount").textContent = tasks.filter(task => !task.done).length;
    document.querySelector("#doneCount").textContent = tasks.filter(task => task.done).length;
  }

  function makePill(text, extraClass = "") {
    const pill = document.createElement("span");
    pill.className = `pill ${extraClass}`.trim();
    pill.textContent = text;
    return pill;
  }

  function render() {
    taskList.replaceChildren();
    const filter = filterSelect.value;
    const visibleTasks = tasks
      .filter(task => filter === "all" || (filter === "open" && !task.done) || (filter === "done" && task.done))
      .sort((a, b) => {
        if (!a.date) return b.date ? 1 : 0;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });

    emptyState.hidden = visibleTasks.length > 0;
    emptyState.textContent = tasks.length === 0
      ? "Je lijst is nog leeg. Voeg hierboven je eerste opdracht toe."
      : "Geen opdrachten gevonden voor deze selectie.";

    for (const task of visibleTasks) {
      const item = document.createElement("article");
      item.className = `task${task.done ? " done" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", `Markeer ${task.title} als ${task.done ? "niet afgerond" : "afgerond"}`);
      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        saveTasks();
        render();
      });

      const main = document.createElement("div");
      main.className = "task-main";
      const title = document.createElement("p");
      title.className = "task-title";
      title.textContent = task.title;
      main.append(title);

      const meta = document.createElement("div");
      meta.className = "task-meta";
      if (task.subject) meta.append(makePill(task.subject));
      if (task.date) {
        const overdue = !task.done && task.date < new Date().toLocaleDateString("en-CA");
        meta.append(makePill(`Deadline: ${formatDate(task.date)}`, overdue ? "overdue" : ""));
      }
      meta.append(makePill(task.done ? "Afgerond" : "Nog te doen"));
      main.append(meta);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-button";
      deleteButton.textContent = "Verwijder";
      deleteButton.setAttribute("aria-label", `Verwijder ${task.title}`);
      deleteButton.addEventListener("click", () => {
        tasks = tasks.filter(entry => entry.id !== task.id);
        saveTasks();
        render();
      });

      item.append(checkbox, main, deleteButton);
      taskList.append(item);
    }
    updateStats();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    tasks.push({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      date: dateInput.value,
      subject: subjectInput.value.trim(),
      done: false,
      createdAt: new Date().toISOString()
    });
    saveTasks();
    form.reset();
    titleInput.focus();
    render();
  });

  filterSelect.addEventListener("change", render);
  clearDoneButton.addEventListener("click", () => {
    const completedCount = tasks.filter(task => task.done).length;
    if (completedCount === 0) {
      alert("Er zijn nog geen afgeronde opdrachten om te verwijderen.");
      return;
    }
    if (confirm(`Weet je zeker dat je ${completedCount} afgeronde opdracht(en) wilt verwijderen?`)) {
      tasks = tasks.filter(task => !task.done);
      saveTasks();
      render();
    }
  });

  render();
})();
