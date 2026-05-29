(function () {
  const api = window.pomodoroAPI || {
    readData: async () => ({ taskLabel: '', workMinutes: 25, breakMinutes: 5 }),
    writeData: async () => {},
    notify: async () => { console.log('[dev-fallback] Notification'); return false; },
    logCycle: async (c) => { console.log('[dev-fallback] Log cycle', c); return [c]; },
    readCycles: async () => [],
    updateCycleNote: async (completedAt, note) => { console.log('[dev-fallback] Update cycle note', completedAt, note); return []; }
  };

  const el = (id) => document.getElementById(id);

  let timer = null;
  let remainingSeconds = 0;
  let isWorkPhase = true;
  let isPaused = false;

  const phaseLabel = el('phase-label');
  const timerDisplay = el('timer-display');
  const taskInput = el('task-input');
  const noteInput = el('note-input');
  const btnStart = el('btn-start');
  const btnPause = el('btn-pause');
  const btnReset = el('btn-reset');
  const workMinInput = el('work-min');
  const breakMinInput = el('break-min');
  const cycleLogList = el('cycle-log-list');
  const cycleCount = el('cycle-count');

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function getWorkMin() {
    return Math.max(1, Math.min(120, parseInt(workMinInput.value, 10) || 25));
  }

  function getBreakMin() {
    return Math.max(1, Math.min(60, parseInt(breakMinInput.value, 10) || 5));
  }

  function updateDisplay() {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }

  function setPhaseUI() {
    phaseLabel.textContent = isWorkPhase ? 'Work' : 'Break';
    document.body.classList.toggle('phase-break', !isWorkPhase);
  }

  async function notifyPhase() {
    const title = isWorkPhase ? 'Break Over' : 'Work Time!';
    const body = isWorkPhase ? 'Time to get back to work.' : 'Great job! Take a break.';
    const sent = await api.notify(title, body);
    if (!sent) {
      console.log(`[dev-notification] ${title}: ${body}`);
    }
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  async function logCompletedCycle() {
    const now = new Date();
    const cycle = {
      date: todayStr(),
      completedAt: now.toISOString(),
      taskLabel: taskInput.value.trim(),
      note: noteInput.value.trim(),
      workMinutes: getWorkMin()
    };
    noteInput.value = '';
    await api.logCycle(cycle);
    await renderCycleLog();
  }

  async function renderCycleLog() {
    const cycles = await api.readCycles();
    const today = todayStr();
    const todayCycles = cycles.filter((c) => c.date === today);
    cycleCount.textContent = String(todayCycles.length);

    cycleLogList.innerHTML = '';
    const recent = todayCycles.slice(-10).reverse();
    for (const c of recent) {
      const li = document.createElement('li');
      const time = new Date(c.completedAt);
      const hh = String(time.getHours()).padStart(2, '0');
      const mm = String(time.getMinutes()).padStart(2, '0');
      const label = c.taskLabel || 'Untitled';
      const mainLine = hh + ':' + mm + '  \u2014  ' + label + '  (' + c.workMinutes + ' min)';
      const mainSpan = document.createElement('span');
      mainSpan.className = 'cycle-main';
      mainSpan.textContent = mainLine;
      li.appendChild(mainSpan);

      if (c.note) {
        const noteSpan = document.createElement('span');
        noteSpan.className = 'cycle-note';
        noteSpan.textContent = c.note;
        li.appendChild(noteSpan);
      }

      const editBtn = document.createElement('button');
      editBtn.className = 'cycle-note-edit';
      editBtn.textContent = '\u270E';
      editBtn.title = 'Edit note';
      editBtn.addEventListener('click', () => startEditNote(li, c));
      li.appendChild(editBtn);

      cycleLogList.appendChild(li);
    }
  }

  function startEditNote(li, cycle) {
    const existing = li.querySelector('.cycle-note-input');
    if (existing) {
      existing.focus();
      return;
    }

    const noteSpan = li.querySelector('.cycle-note');
    const editBtn = li.querySelector('.cycle-note-edit');
    if (noteSpan) noteSpan.remove();
    if (editBtn) editBtn.remove();

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cycle-note-input';
    input.value = cycle.note || '';
    input.placeholder = 'Add a note\u2026';
    input.maxLength = 200;

    let saved = false;
    const saveNote = async () => {
      if (saved) return;
      saved = true;
      const newNote = input.value.trim();
      await api.updateCycleNote(cycle.completedAt, newNote);
      cycle.note = newNote;
      await renderCycleLog();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        saved = true;
        input.value = cycle.note || '';
        input.blur();
      }
    });
    input.addEventListener('blur', saveNote);
    li.appendChild(input);
    input.focus();
  }

  function tick() {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      clearInterval(timer);
      timer = null;
      const wasWork = isWorkPhase;
      isWorkPhase = !isWorkPhase;
      notifyPhase();
      if (wasWork) logCompletedCycle();
      startNewPhase();
    } else {
      updateDisplay();
    }
  }

  function startNewPhase() {
    remainingSeconds = (isWorkPhase ? getWorkMin() : getBreakMin()) * 60;
    setPhaseUI();
    updateDisplay();
    timer = setInterval(tick, 1000);
    document.body.classList.add('running');
  }

  function handleStart() {
    if (timer) return;
    if (!isPaused) {
      startNewPhase();
    } else {
      isPaused = false;
      timer = setInterval(tick, 1000);
      document.body.classList.add('running');
    }
    btnStart.disabled = true;
    btnPause.disabled = false;
  }

  function handlePause() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    isPaused = true;
    document.body.classList.remove('running');
    btnStart.disabled = false;
    btnPause.disabled = true;
  }

  function handleReset() {
    clearInterval(timer);
    timer = null;
    isPaused = false;
    isWorkPhase = true;
    remainingSeconds = getWorkMin() * 60;
    setPhaseUI();
    updateDisplay();
    document.body.classList.remove('running');
    btnStart.disabled = false;
    btnPause.disabled = true;
  }

  async function saveData() {
    await api.writeData({
      taskLabel: taskInput.value,
      workMinutes: getWorkMin(),
      breakMinutes: getBreakMin()
    });
  }

  async function loadData() {
    const data = await api.readData();
    taskInput.value = data.taskLabel || '';
    workMinInput.value = data.workMinutes || 25;
    breakMinInput.value = data.breakMinutes || 5;
    handleReset();
    renderCycleLog();
  }

  btnStart.addEventListener('click', handleStart);
  btnPause.addEventListener('click', handlePause);
  btnReset.addEventListener('click', handleReset);
  taskInput.addEventListener('change', saveData);
  workMinInput.addEventListener('change', () => { saveData(); if (!timer) handleReset(); });
  breakMinInput.addEventListener('change', () => { saveData(); if (!timer) handleReset(); });

  const btnMinimize = el('btn-minimize');
  const btnMaximize = el('btn-maximize');
  const btnClose = el('btn-close');

  btnMinimize.addEventListener('click', () => api.windowMinimize());
  btnClose.addEventListener('click', () => api.windowClose());

  async function updateMaximizeBtn() {
    const isMax = await api.windowIsMaximized();
    btnMaximize.setAttribute('aria-label', isMax ? 'Restore' : 'Maximize');
    btnMaximize.innerHTML = isMax ? '&#x29C9;' : '&#x25A1;';
  }

  btnMaximize.addEventListener('click', async () => {
    await api.windowMaximize();
    updateMaximizeBtn();
  });

  updateMaximizeBtn();

  document.addEventListener('DOMContentLoaded', loadData);
  if (document.readyState !== 'loading') loadData();
})();