(function () {
  const api = window.pomodoroAPI || {
    readData: async () => ({ taskLabel: '', workMinutes: 25, breakMinutes: 5 }),
    writeData: async () => {},
    notify: async () => { console.log('[dev-fallback] Notification'); return false; }
  };

  const el = (id) => document.getElementById(id);

  let timer = null;
  let remainingSeconds = 0;
  let isWorkPhase = true;
  let isPaused = false;

  const phaseLabel = el('phase-label');
  const timerDisplay = el('timer-display');
  const taskInput = el('task-input');
  const btnStart = el('btn-start');
  const btnPause = el('btn-pause');
  const btnReset = el('btn-reset');
  const workMinInput = el('work-min');
  const breakMinInput = el('break-min');

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

  function tick() {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      clearInterval(timer);
      timer = null;
      isWorkPhase = !isWorkPhase;
      notifyPhase();
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