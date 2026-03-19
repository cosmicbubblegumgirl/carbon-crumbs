(() => {
  const config = window.APP_CONFIG || {};
  const storageKeys = config.storageKeys || {};
  const presets = config.presets || [];
  const animals = config.animals || [];
  const shadeLegend = config.shadeLegend || [];
  const communityAverageWeekly = Number(config.communityAverageWeekly || 22.4);
  const defaultGoal = Number(config.defaultGoal || 35);
  const apiBase = typeof config.apiBase === "string" ? config.apiBase : "";
  const assetBase = typeof config.assetBase === "string" && config.assetBase.trim()
    ? config.assetBase.replace(/\\?$/, "/")
    : "./assets/";

  const els = {
    totalEmissionsValue: document.getElementById("totalEmissionsValue"),
    weeklyTotalValue: document.getElementById("weeklyTotalValue"),
    streakValue: document.getElementById("streakValue"),
    profileAnimalSelect: document.getElementById("profileAnimalSelect"),
    animalHeroEmoji: document.getElementById("animalHeroEmoji"),
    animalNameValue: document.getElementById("animalNameValue"),
    animalStory: document.getElementById("animalStory"),
    latestFootprintStatus: document.getElementById("latestFootprintStatus"),
    animalFootprintValue: document.getElementById("animalFootprintValue"),
    shadeLegend: document.getElementById("shadeLegend"),
    footprintTrail: document.getElementById("footprintTrail"),
    storageStatus: document.getElementById("storageStatus"),
    presetSelect: document.getElementById("presetSelect"),
    activityForm: document.getElementById("activityForm"),
    titleInput: document.getElementById("titleInput"),
    categoryInput: document.getElementById("categoryInput"),
    quantityInput: document.getElementById("quantityInput"),
    co2Input: document.getElementById("co2Input"),
    dateInput: document.getElementById("dateInput"),
    noteInput: document.getElementById("noteInput"),
    demoFillButton: document.getElementById("demoFillButton"),
    authForm: document.getElementById("authForm"),
    authSubmitButton: document.getElementById("authSubmitButton"),
    emailInput: document.getElementById("emailInput"),
    passwordInput: document.getElementById("passwordInput"),
    nameInput: document.getElementById("nameInput"),
    nameField: document.getElementById("nameField"),
    authAnimalInput: document.getElementById("authAnimalInput"),
    authAnimalField: document.getElementById("authAnimalField"),
    accountState: document.getElementById("accountState"),
    logoutButton: document.getElementById("logoutButton"),
    topCategoryValue: document.getElementById("topCategoryValue"),
    topCategorySubtext: document.getElementById("topCategorySubtext"),
    communityAverageValue: document.getElementById("communityAverageValue"),
    topActivityValue: document.getElementById("topActivityValue"),
    topActivitySubtext: document.getElementById("topActivitySubtext"),
    goalValue: document.getElementById("goalValue"),
    goalInput: document.getElementById("goalInput"),
    saveGoalButton: document.getElementById("saveGoalButton"),
    goalFill: document.getElementById("goalFill"),
    goalStatusText: document.getElementById("goalStatusText"),
    comparisonHeadline: document.getElementById("comparisonHeadline"),
    comparisonText: document.getElementById("comparisonText"),
    weeklyBarChart: document.getElementById("weeklyBarChart"),
    tipsList: document.getElementById("tipsList"),
    activityList: document.getElementById("activityList"),
    categoryFilter: document.getElementById("categoryFilter"),
    toast: document.getElementById("toast")
  };

  const tokenKey = storageKeys.token || "carboncrumbs.token";

  const state = {
    activities: loadJSON(storageKeys.activities, []),
    goal: Number(localStorage.getItem(storageKeys.goal) || defaultGoal),
    selectedAnimal: localStorage.getItem(storageKeys.animal) || (animals[0] ? animals[0].id : "deer"),
    currentUser: loadJSON(storageKeys.authUser, null),
    users: loadJSON(storageKeys.users, []),
    authMode: "login",
    token: localStorage.getItem(tokenKey),
    serverMode: false
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function todayString() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().split("T")[0];
  }

  function formatKg(value) {
    return `${Number(value).toFixed(2)} kg`;
  }

  function formatDateLabel(dateStr) {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function capitalize(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  function setToken(token) {
    state.token = token;
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  }

  async function apiRequest(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;

    const res = await fetch(`${apiBase}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }

  function activityFromDB(a) {
    return {
      id: String(a._id),
      userId: String(a.user),
      title: a.title,
      category: a.category,
      quantity: Number(a.quantity),
      co2: Number(a.co2),
      total: Number(a.emission),
      date: new Date(a.loggedAt).toISOString().split("T")[0],
      note: a.note || "",
      createdAt: a.createdAt ? new Date(a.createdAt).getTime() : Date.now()
    };
  }

  async function loadFromServer() {
    const data = await apiRequest("GET", "/api/dashboard");
    state.serverMode = true;

    if (data.user) {
      state.currentUser = {
        id: String(data.user._id),
        name: data.user.name,
        email: data.user.email,
        animal: data.user.animal,
        weeklyGoalKg: data.user.weeklyGoalKg
      };
      state.selectedAnimal = data.user.animal || state.selectedAnimal;
      state.goal = Number(data.user.weeklyGoalKg || defaultGoal);
      persistCurrentUser();
      persistAnimal();
      persistGoal();
      if (els.goalInput) els.goalInput.value = String(state.goal);
    }

    if (Array.isArray(data.activities)) {
      const serverActivities = data.activities.map(activityFromDB);
      const guest = state.activities.filter((a) => a.userId === "guest");
      state.activities = [...serverActivities, ...guest];
      persistActivities();
    }
  }

  function persistActivities() {
    saveJSON(storageKeys.activities, state.activities);
  }

  function persistGoal() {
    localStorage.setItem(storageKeys.goal, String(state.goal));
  }

  function persistAnimal() {
    localStorage.setItem(storageKeys.animal, state.selectedAnimal);
  }

  function persistCurrentUser() {
    if (state.currentUser) saveJSON(storageKeys.authUser, state.currentUser);
    else localStorage.removeItem(storageKeys.authUser);
  }

  function persistUsers() {
    saveJSON(storageKeys.users, state.users);
  }

  function getAnimalById(id) {
    return animals.find((animal) => animal.id === id) || animals[0];
  }

  function getUserScopedActivities() {
    if (!state.currentUser) return state.activities.filter((a) => a.userId === "guest");
    return state.activities.filter((a) => a.userId === state.currentUser.id || a.userId === "guest");
  }

  function getWeeklyData(activities) {
    const days = [];
    const today = new Date(`${todayString()}T00:00:00`);

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        total: 0
      });
    }

    activities.forEach((activity) => {
      const bucket = days.find((day) => day.date === activity.date);
      if (bucket) bucket.total += Number(activity.total);
    });

    return days;
  }

  function getCategoryTotals(activities) {
    return activities.reduce((acc, item) => {
      const category = item.category || "other";
      acc[category] = (acc[category] || 0) + Number(item.total);
      return acc;
    }, {});
  }

  function getTopActivity(activities) {
    if (!activities.length) return null;
    return [...activities].sort((a, b) => Number(b.total) - Number(a.total))[0];
  }

  function getFootprintShade(total) {
    return shadeLegend.find((shade) => total <= shade.max) || shadeLegend[shadeLegend.length - 1];
  }

  function calculateStreak(activities) {
    if (!activities.length) return 0;
    const uniqueDates = [...new Set(activities.map((a) => a.date))].sort().reverse();
    let streak = 0;
    let cursor = new Date(`${todayString()}T00:00:00`);

    for (let i = 0; i < uniqueDates.length; i += 1) {
      const cursorIso = cursor.toISOString().split("T")[0];
      if (uniqueDates[i] === cursorIso) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        const yesterday = new Date(`${todayString()}T00:00:00`);
        yesterday.setDate(yesterday.getDate() - 1);
        if (uniqueDates[i] === yesterday.toISOString().split("T")[0]) streak = 1;
        break;
      } else {
        break;
      }
    }
    return streak;
  }

  function renderShadeLegend() {
    if (!els.shadeLegend) return;
    els.shadeLegend.innerHTML = "";
    shadeLegend.forEach((shade) => {
      const pill = document.createElement("div");
      pill.className = "legend-pill";
      pill.innerHTML = `<span class="legend-swatch" style="background:${shade.color}"></span><span>${shade.label}</span>`;
      els.shadeLegend.appendChild(pill);
    });
  }

  function renderFootprintTrail(activities) {
    if (!els.footprintTrail) return;
    els.footprintTrail.innerHTML = "";
    const latest = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 18);

    if (!latest.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Your trail will appear here as you log activities.";
      els.footprintTrail.appendChild(empty);
      return;
    }

    latest.forEach((item, index) => {
      const mark = document.createElement("div");
      const shade = getFootprintShade(Number(item.total));
      mark.className = "footprint-mark";
      mark.style.background = shade.color;
      mark.style.opacity = String(Math.max(0.55, 1 - index * 0.02));
      mark.title = `${item.title} • ${formatKg(item.total)} • ${formatDateLabel(item.date)}`;
      els.footprintTrail.appendChild(mark);
    });
  }

  function renderAnimalPanel(totalWeekly) {
    const animal = getAnimalById(state.selectedAnimal);
    if (!animal) return;
    els.animalHeroEmoji.textContent = animal.emoji;
    els.animalNameValue.textContent = animal.name;
    els.animalStory.textContent = animal.story;

    const shade = getFootprintShade(totalWeekly);
    els.latestFootprintStatus.textContent = shade.label;
    els.animalFootprintValue.textContent = totalWeekly > 0
      ? `This week feels like ${shade.label.toLowerCase()} at ${formatKg(totalWeekly)}.`
      : "No activities logged yet.";

    renderFootprintTrail(getUserScopedActivities());
  }

  function renderBarChart(days) {
    if (!els.weeklyBarChart) return;
    els.weeklyBarChart.innerHTML = "";
    const max = Math.max(...days.map((day) => day.total), 1);

    days.forEach((day) => {
      const col = document.createElement("div");
      col.className = "bar-column";
      const height = Math.max((day.total / max) * 100, day.total > 0 ? 8 : 0);
      col.innerHTML = `
        <div class="bar-value">${day.total > 0 ? day.total.toFixed(1) : "0.0"}kg</div>
        <div class="bar-track"><div class="bar-fill" style="height:${height}%"></div></div>
        <div class="bar-label">${day.label}</div>
      `;
      els.weeklyBarChart.appendChild(col);
    });
  }

  function renderTips(activities, categoryTotals, weeklyTotal) {
    if (!els.tipsList) return;
    els.tipsList.innerHTML = "";
    const tips = [];

    if (!activities.length) {
      tips.push("Start with one honest activity each day. Awareness grows from small consistency.");
      tips.push("Try logging transport, food, and electricity once today to see where your footprint begins.");
      tips.push("Pick a weekly goal that feels gentle but real, then revisit it after a few days.");
    } else {
      const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
      if (topCategory?.[0] === "transport") tips.push("Transport leads your footprint. Replacing one car trip can soften your week.");
      if (topCategory?.[0] === "food") tips.push("Food is your biggest source right now. One or two lower-impact meals can help.");
      if (topCategory?.[0] === "energy") tips.push("Energy use stands out this week. Reduce idle power where possible.");
      tips.push(weeklyTotal > state.goal
        ? "You are above your weekly goal. Focus on your single highest-emission habit first."
        : "You are within your goal range. Keep repeating the lighter choices that worked.");

      const topActivity = getTopActivity(activities);
      if (topActivity) tips.push(`Your highest activity is "${topActivity.title}". Look for a softer version next time.`);
    }

    tips.slice(0, 4).forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      els.tipsList.appendChild(li);
    });
  }

  function renderMetrics() {
    const activities = getUserScopedActivities();
    const total = activities.reduce((sum, item) => sum + Number(item.total), 0);
    const weeklyData = getWeeklyData(activities);
    const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.total, 0);
    const streak = calculateStreak(activities);

    els.totalEmissionsValue.textContent = formatKg(total);
    els.weeklyTotalValue.textContent = formatKg(weeklyTotal);
    els.streakValue.textContent = `${streak} day${streak === 1 ? "" : "s"}`;

    const categoryTotals = getCategoryTotals(activities);
    const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    els.topCategoryValue.textContent = topCategoryEntry ? capitalize(topCategoryEntry[0]) : "Transport";
    els.topCategorySubtext.textContent = topCategoryEntry ? `${formatKg(topCategoryEntry[1])} so far` : "0.00 kg so far";

    els.communityAverageValue.textContent = `${communityAverageWeekly.toFixed(1)} kg`;
    const topActivity = getTopActivity(activities);
    els.topActivityValue.textContent = topActivity ? topActivity.title : "Nothing logged yet";
    els.topActivitySubtext.textContent = topActivity
      ? `${formatKg(topActivity.total)} on ${formatDateLabel(topActivity.date)}`
      : "Start tracking to discover your patterns";

    els.goalValue.textContent = `${state.goal} kg`;
    const goalPercent = state.goal > 0 ? Math.min((weeklyTotal / state.goal) * 100, 100) : 0;
    els.goalFill.style.width = `${goalPercent}%`;

    if (weeklyTotal === 0) {
      els.goalStatusText.textContent = "Your weekly goal progress will appear here.";
      els.comparisonHeadline.textContent = "You're just getting started.";
      els.comparisonText.textContent = "Log activities to compare your impact with the community average.";
    } else if (weeklyTotal <= state.goal) {
      els.goalStatusText.textContent = `You are within your weekly goal. Current total: ${formatKg(weeklyTotal)}.`;
      if (weeklyTotal < communityAverageWeekly) {
        els.comparisonHeadline.textContent = "You're walking lighter than average.";
        els.comparisonText.textContent = `Your week is ${formatKg(communityAverageWeekly - weeklyTotal)} below the community average.`;
      } else {
        els.comparisonHeadline.textContent = "You're right on or above community average.";
        els.comparisonText.textContent = "A few gentle changes could move you below the curve.";
      }
    } else {
      els.goalStatusText.textContent = `You are ${formatKg(weeklyTotal - state.goal)} above your weekly goal.`;
      els.comparisonHeadline.textContent = "Your trail is heavier than average.";
      els.comparisonText.textContent = `You are ${formatKg(weeklyTotal - communityAverageWeekly)} above the community average this week.`;
    }

    renderAnimalPanel(weeklyTotal);
    renderBarChart(weeklyData);
    renderTips(activities, categoryTotals, weeklyTotal);
  }

  function renderActivities() {
    if (!els.activityList) return;
    const filter = els.categoryFilter?.value || "all";
    let activities = [...getUserScopedActivities()].sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
    if (filter !== "all") activities = activities.filter((item) => item.category === filter);

    els.activityList.innerHTML = "";
    if (!activities.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No activities match this view yet.";
      els.activityList.appendChild(empty);
      return;
    }

    activities.forEach((item) => {
      const article = document.createElement("article");
      article.className = "activity-item";
      article.dataset.id = item.id;
      article.innerHTML = `
        <div>
          <div class="activity-head">
            <strong>${escapeHTML(item.title)}</strong>
            <span class="category-badge badge-${item.category}">${escapeHTML(item.category)}</span>
          </div>
          <div class="activity-meta">${escapeHTML(formatDateLabel(item.date))} • Qty ${item.quantity} × ${item.co2} kg/unit</div>
          ${item.note ? `<div class="activity-note">${escapeHTML(item.note)}</div>` : ""}
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="activity-total">${formatKg(item.total)}</div>
          <button class="delete-activity-btn" data-id="${escapeHTML(item.id)}" aria-label="Delete activity" title="Remove this activity">✕</button>
        </div>
      `;
      els.activityList.appendChild(article);
    });

    els.activityList.querySelectorAll(".delete-activity-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteActivity(btn.dataset.id));
    });
  }

  function updateStorageStatus() {
    if (!els.storageStatus) return;
    if (state.currentUser) {
      const sync = state.serverMode ? " • Synced with server" : " • Local only";
      els.storageStatus.textContent = `Signed in as ${state.currentUser.name || state.currentUser.email}${sync}`;
    } else {
      els.storageStatus.textContent = "Guest mode • Local storage enabled";
    }
  }

  function updateAccountState() {
    if (!els.accountState) return;
    if (state.currentUser) {
      els.accountState.innerHTML = `<strong>Welcome back, ${escapeHTML(state.currentUser.name || state.currentUser.email)}.</strong><span>Your activity trail is being stored in this browser profile.</span>`;
      els.logoutButton.hidden = false;
    } else {
      els.accountState.innerHTML = `<strong>Guest mode is active.</strong><span>Your activity trail is saved in your browser until you choose to sign in and sync it.</span>`;
      els.logoutButton.hidden = true;
    }
  }

  function setAuthMode(mode) {
    state.authMode = mode;
    document.querySelectorAll(".auth-tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.authMode === mode));
    const isRegister = mode === "register";
    els.nameField.classList.toggle("hidden", !isRegister);
    els.authAnimalField.classList.toggle("hidden", !isRegister);
    els.authSubmitButton.textContent = isRegister ? "Register" : "Login";
  }

  async function registerUser({ name, email, password, animal }) {
    try {
      const data = await apiRequest("POST", "/api/auth/register", { name, email, password, animal });
      setToken(data.token);
      state.serverMode = true;
      state.currentUser = { id: String(data.user.id), name: data.user.name, email: data.user.email };
      state.selectedAnimal = data.user.animal || animal;
      persistCurrentUser();
      persistAnimal();

      const guest = state.activities.filter((a) => a.userId === "guest");
      if (guest.length) {
        try { await apiRequest("POST", "/api/activities/import", { activities: guest }); } catch (_) {}
        state.activities = state.activities.filter((a) => a.userId !== "guest");
        persistActivities();
      }

      await loadFromServer();
      showToast("Account created and signed in.");
      return;
    } catch (err) {
      if (err.message && !err.message.includes("Failed to fetch")) {
        showToast(err.message);
        return;
      }
    }

    const exists = state.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return showToast("An account with that email already exists.");

    const user = {
      id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      animal
    };

    state.users.push(user);
    persistUsers();
    state.currentUser = { id: user.id, name: user.name, email: user.email };
    state.selectedAnimal = animal;
    persistCurrentUser();
    persistAnimal();
    renderAll();
    showToast("Account created and signed in (offline mode).");
  }

  async function loginUser({ email, password }) {
    try {
      const data = await apiRequest("POST", "/api/auth/login", { email, password });
      setToken(data.token);
      state.serverMode = true;
      state.currentUser = { id: String(data.user.id), name: data.user.name, email: data.user.email };
      state.selectedAnimal = data.user.animal || state.selectedAnimal;
      persistCurrentUser();
      persistAnimal();

      const guest = state.activities.filter((a) => a.userId === "guest");
      if (guest.length) {
        try { await apiRequest("POST", "/api/activities/import", { activities: guest }); } catch (_) {}
        state.activities = state.activities.filter((a) => a.userId !== "guest");
        persistActivities();
      }

      await loadFromServer();
      showToast("Signed in successfully.");
      return;
    } catch (err) {
      if (err.message && !err.message.includes("Failed to fetch")) {
        showToast(err.message);
        return;
      }
    }

    const match = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!match) return showToast("Invalid email or password.");

    state.currentUser = { id: match.id, name: match.name, email: match.email };
    state.selectedAnimal = match.animal || state.selectedAnimal;
    persistCurrentUser();
    persistAnimal();
    renderAll();
    showToast("Signed in successfully (offline mode).");
  }

  function logoutUser() {
    setToken(null);
    state.serverMode = false;
    state.currentUser = null;
    state.activities = state.activities.filter((a) => a.userId === "guest");
    persistCurrentUser();
    persistActivities();
    renderAll();
    showToast("You have been logged out.");
  }

  async function addActivity({ title, category, quantity, co2, date, note }) {
    if (state.serverMode && state.currentUser) {
      try {
        const created = await apiRequest("POST", "/api/activities", { title, category, quantity, co2, date, note });
        state.activities.push(activityFromDB(created));
        persistActivities();
        renderAll();
        showToast("Activity saved to your trail.");
        return;
      } catch (err) {
        showToast(err.message || "Could not save activity.");
        return;
      }
    }

    const total = Number(quantity) * Number(co2);
    state.activities.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId: state.currentUser ? state.currentUser.id : "guest",
      title: title.trim(),
      category,
      quantity: Number(quantity),
      co2: Number(co2),
      total: Number(total.toFixed(2)),
      date,
      note: note.trim(),
      createdAt: Date.now()
    });
    persistActivities();
    renderAll();
    showToast("Activity added to your trail.");
  }

  async function deleteActivity(id) {
    if (state.serverMode && state.currentUser) {
      try {
        await apiRequest("DELETE", `/api/activities/${id}`);
      } catch (err) {
        showToast(err.message || "Could not delete activity.");
        return;
      }
    }

    state.activities = state.activities.filter((a) => a.id !== id);
    persistActivities();
    renderAll();
    showToast("Activity removed.");
  }

  async function saveGoal() {
    const value = Number(els.goalInput.value);
    if (!value || value <= 0) return showToast("Enter a valid weekly goal.");
    state.goal = value;
    persistGoal();

    if (state.serverMode && state.currentUser) {
      try { await apiRequest("PUT", "/api/user", { weeklyGoalKg: value }); } catch (_) {}
    }

    renderMetrics();
    showToast("Weekly goal saved.");
  }

  function seedDemoActivities() {
    const today = new Date(`${todayString()}T00:00:00`);
    const sample = [
      { title: "Car commute", category: "transport", quantity: 12, co2: 0.21, note: "Morning drive" },
      { title: "Vegetarian meal", category: "food", quantity: 1, co2: 1.4, note: "Lunch choice" },
      { title: "Home electricity use", category: "energy", quantity: 6, co2: 0.45, note: "Evening consumption" },
      { title: "Bus ride", category: "transport", quantity: 8, co2: 0.08, note: "Shared travel" },
      { title: "Beef-based meal", category: "food", quantity: 1, co2: 5.2, note: "Dinner out" }
    ];

    sample.forEach((item, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      addActivity({ ...item, date: date.toISOString().split("T")[0] });
    });

    showToast("Demo mix loaded.");
  }

  function applyPreset(index) {
    const preset = presets[index];
    if (!preset) return;
    els.titleInput.value = preset.title;
    els.categoryInput.value = preset.category;
    els.quantityInput.value = String(preset.quantity);
    els.co2Input.value = String(preset.co2);
    els.noteInput.value = preset.note || "";
  }

  function renderAll() {
    updateStorageStatus();
    updateAccountState();
    if (els.profileAnimalSelect) els.profileAnimalSelect.value = state.selectedAnimal;
    renderMetrics();
    renderActivities();
  }

  function initScrollButtons() {
    document.querySelectorAll("[data-scroll-to]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.getAttribute("data-scroll-to"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-jump-select]").forEach((select) => {
      select.addEventListener("change", () => {
        const targetId = select.value;
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        select.value = "";
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
      });
    }, { threshold: 0.15 });
    items.forEach((item) => observer.observe(item));
  }

  function initHeroBannerSlideshow() {
    const banner = document.getElementById("heroBanner");
    const dotsHost = document.getElementById("bannerDots");
    if (!banner || !dotsHost) return;

    const slides = [
      `${assetBase}forest-hd-1.jpg`,
      `${assetBase}forest-hd-2.jpg`,
      `${assetBase}misty-forest.avif`,
      `${assetBase}emerald-river.jpeg`,
      `${assetBase}waterfall.jpg`,
      `${assetBase}river-stones.jpg`
    ];

    let index = 0;
    let timerId = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isPhone = window.matchMedia("(max-width: 720px)").matches;
    const isTablet = !isPhone && window.matchMedia("(max-width: 1024px)").matches;
    const intervalMs = reduceMotion ? 6000 : isPhone ? 5400 : isTablet ? 4700 : 4200;
    const fadeMs = reduceMotion ? 0 : isPhone ? 140 : isTablet ? 220 : 260;

    dotsHost.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = `banner-dot${i === 0 ? " active" : ""}`;
      dotsHost.appendChild(dot);
    });

    const dots = [...dotsHost.querySelectorAll(".banner-dot")];
    const show = (nextIndex, instant = false) => {
      index = nextIndex;

      if (!instant && fadeMs > 0) {
        banner.classList.add("is-fading");
        window.setTimeout(() => {
          banner.style.backgroundImage = `url('${slides[index]}')`;
          banner.classList.remove("is-fading");
        }, fadeMs);
      } else {
        banner.style.backgroundImage = `url('${slides[index]}')`;
      }

      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    };

    const advance = () => {
      const next = (index + 1) % slides.length;
      show(next);
    };

    const start = () => {
      if (timerId !== null || reduceMotion) return;
      timerId = window.setInterval(advance, intervalMs);
    };

    const stop = () => {
      if (timerId === null) return;
      window.clearInterval(timerId);
      timerId = null;
    };

    show(0, true);
    start();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }

  function initEvents() {
    if (els.presetSelect) {
      els.presetSelect.addEventListener("change", (event) => {
        const index = Number(event.target.value);
        if (!Number.isNaN(index) && event.target.value !== "") applyPreset(index);
      });
    }

    if (els.profileAnimalSelect) {
      els.profileAnimalSelect.addEventListener("change", async (event) => {
        state.selectedAnimal = event.target.value;
        persistAnimal();

        if (state.currentUser) {
          if (state.serverMode) {
            try { await apiRequest("PUT", "/api/user", { animal: state.selectedAnimal }); } catch (_) {}
          } else {
            const user = state.users.find((u) => u.id === state.currentUser.id);
            if (user) {
              user.animal = state.selectedAnimal;
              persistUsers();
            }
          }
        }

        renderMetrics();
        showToast("Animal companion updated.");
      });
    }

    if (els.activityForm) {
      els.activityForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = {
          title: els.titleInput.value,
          category: els.categoryInput.value,
          quantity: els.quantityInput.value,
          co2: els.co2Input.value,
          date: els.dateInput.value,
          note: els.noteInput.value
        };

        if (!payload.title.trim()) return showToast("Please add an activity title.");
        if (!payload.date) return showToast("Please choose a date.");

        await addActivity(payload);
        els.activityForm.reset();
        els.quantityInput.value = "1";
        els.co2Input.value = "2.5";
        els.dateInput.value = todayString();
      });
    }

    if (els.demoFillButton) els.demoFillButton.addEventListener("click", seedDemoActivities);

    document.querySelectorAll(".auth-tab").forEach((button) => {
      button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
    });

    if (els.authForm) {
      els.authForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = els.emailInput.value.trim();
        const password = els.passwordInput.value.trim();
        if (!email || !password) return showToast("Email and password are required.");

        if (state.authMode === "register") {
          const name = els.nameInput.value.trim();
          const animal = els.authAnimalInput.value;
          if (!name) return showToast("Please add your name.");
          if (password.length < 6) return showToast("Password must be at least 6 characters.");
          await registerUser({ name, email, password, animal });
        } else {
          await loginUser({ email, password });
        }

        els.authForm.reset();
        if (els.authAnimalInput) els.authAnimalInput.value = state.selectedAnimal;
      });
    }

    if (els.logoutButton) els.logoutButton.addEventListener("click", logoutUser);
    if (els.saveGoalButton) els.saveGoalButton.addEventListener("click", saveGoal);
    if (els.categoryFilter) els.categoryFilter.addEventListener("change", renderActivities);
  }

  function initDefaults() {
    if (els.dateInput) els.dateInput.value = todayString();
    if (els.goalInput) els.goalInput.value = String(state.goal);

    if (els.profileAnimalSelect) {
      els.profileAnimalSelect.innerHTML = "";
      animals.forEach((animal) => {
        const option = document.createElement("option");
        option.value = animal.id;
        option.textContent = `${animal.emoji} ${animal.name}`;
        els.profileAnimalSelect.appendChild(option);
      });
      els.profileAnimalSelect.value = state.selectedAnimal;
    }

    if (els.authAnimalInput) {
      els.authAnimalInput.innerHTML = "";
      animals.forEach((animal) => {
        const option = document.createElement("option");
        option.value = animal.id;
        option.textContent = `${animal.emoji} ${animal.name}`;
        els.authAnimalInput.appendChild(option);
      });
      els.authAnimalInput.value = state.selectedAnimal;
    }

    if (els.presetSelect) {
      presets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${preset.title} • ${preset.category}`;
        els.presetSelect.appendChild(option);
      });
    }

    setAuthMode("login");
  }

  initDefaults();
  renderShadeLegend();
  initEvents();
  initScrollButtons();
  initHeroBannerSlideshow();
  initReveal();

  if (state.token) {
    loadFromServer().then(renderAll).catch(() => {
      state.serverMode = false;
      renderAll();
    });
  } else {
    renderAll();
  }
})();
