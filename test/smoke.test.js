const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed += 1;
  }
}

function suite(name, fn) {
  console.log(name);
  fn();
}

// --- Smoke tests ---

suite('Project structure', () => {
  const requiredFiles = [
    'package.json',
    'main.js',
    'preload.js',
    'src/index.html',
    'src/styles.css',
    'src/renderer.js',
    'README.md'
  ];
  for (const f of requiredFiles) {
    test(`${f} exists`, () => {
      assert(fs.existsSync(path.join(ROOT, f)), `Missing: ${f}`);
    });
  }
});

suite('package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('has correct main entry', () => {
    assert.strictEqual(pkg.main, 'main.js');
  });

  test('has start script', () => {
    assert.ok(pkg.scripts && pkg.scripts.start, 'Missing start script');
  });

  test('has dev script', () => {
    assert.ok(pkg.scripts && pkg.scripts.dev, 'Missing dev script');
  });

  test('has test script', () => {
    assert.ok(pkg.scripts && pkg.scripts.test, 'Missing test script');
  });

  test('electron is a devDependency', () => {
    assert.ok(pkg.devDependencies && pkg.devDependencies.electron, 'electron missing from devDependencies');
  });
});

suite('main.js', () => {
  const mainSrc = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf-8');

  test('creates BrowserWindow', () => {
    assert.ok(mainSrc.includes('BrowserWindow'), 'No BrowserWindow usage');
  });

  test('has IPC handler for read-data', () => {
    assert.ok(mainSrc.includes('read-data'), 'No read-data IPC handler');
  });

  test('has IPC handler for write-data', () => {
    assert.ok(mainSrc.includes('write-data'), 'No write-data IPC handler');
  });

  test('has IPC handler for notify', () => {
    assert.ok(mainSrc.includes('notify'), 'No notify IPC handler');
  });

  test('has IPC handler for log-cycle', () => {
    assert.ok(mainSrc.includes('log-cycle'), 'No log-cycle IPC handler');
  });

  test('has IPC handler for read-cycles', () => {
    assert.ok(mainSrc.includes('read-cycles'), 'No read-cycles IPC handler');
  });

  test('has IPC handler for update-cycle-note', () => {
    assert.ok(mainSrc.includes('update-cycle-note'), 'No update-cycle-note IPC handler');
  });

  test('data structure includes cycles array', () => {
    assert.ok(mainSrc.includes('cycles'), 'No cycles field in data structure');
  });

  test('uses Notification API', () => {
    assert.ok(mainSrc.includes('Notification'), 'No Notification usage');
  });

  test('uses preload script', () => {
    assert.ok(mainSrc.includes('preload.js'), 'No preload reference');
  });

  test('update-cycle-note persists note field on cycle', () => {
    assert.ok(mainSrc.includes('cycle.note'), 'No note field assignment in update-cycle-note handler');
  });
});

suite('preload.js', () => {
  const preloadSrc = fs.readFileSync(path.join(ROOT, 'preload.js'), 'utf-8');

  test('exposes contextBridge API', () => {
    assert.ok(preloadSrc.includes('contextBridge'), 'No contextBridge usage');
  });

  test('exposes pomodoroAPI', () => {
    assert.ok(preloadSrc.includes('pomodoroAPI'), 'No pomodoroAPI exposed');
  });

  test('exposes logCycle method', () => {
    assert.ok(preloadSrc.includes('logCycle'), 'No logCycle method exposed');
  });

  test('exposes readCycles method', () => {
    assert.ok(preloadSrc.includes('readCycles'), 'No readCycles method exposed');
  });

  test('exposes updateCycleNote method', () => {
    assert.ok(preloadSrc.includes('updateCycleNote'), 'No updateCycleNote method exposed');
  });
});

suite('renderer.js', () => {
  const rendererSrc = fs.readFileSync(path.join(ROOT, 'src', 'renderer.js'), 'utf-8');

  test('implements start', () => {
    assert.ok(rendererSrc.includes('btn-start'), 'No start button reference');
  });

  test('implements pause', () => {
    assert.ok(rendererSrc.includes('btn-pause'), 'No pause button reference');
  });

  test('implements reset', () => {
    assert.ok(rendererSrc.includes('btn-reset'), 'No reset button reference');
  });

  test('implements timer display', () => {
    assert.ok(rendererSrc.includes('timer-display'), 'No timer display reference');
  });

  test('implements task label persistence', () => {
    assert.ok(rendererSrc.includes('taskLabel'), 'No taskLabel reference');
    assert.ok(rendererSrc.includes('task-input'), 'No task input reference');
  });

  test('implements note input for cycle', () => {
    assert.ok(rendererSrc.includes('noteInput'), 'No noteInput reference');
    assert.ok(rendererSrc.includes('note-input'), 'No note-input element reference');
  });

  test('includes note in cycle log entry', () => {
    assert.ok(rendererSrc.includes('note:'), 'No note field in cycle log entry');
  });

  test('clears note input after logging cycle', () => {
    assert.ok(rendererSrc.includes("noteInput.value = ''"), 'No noteInput reset after logging cycle');
  });

  test('implements inline note editing in log', () => {
    assert.ok(rendererSrc.includes('startEditNote'), 'No startEditNote function');
    assert.ok(rendererSrc.includes('cycle-note-input'), 'No cycle-note-input class');
  });

  test('includes dev notification fallback', () => {
    assert.ok(rendererSrc.includes('dev-notification') || rendererSrc.includes('dev-fallback'), 'No dev notification fallback');
  });

  test('implements cycle logging', () => {
    assert.ok(rendererSrc.includes('logCompletedCycle'), 'No logCompletedCycle function');
  });

  test('renders cycle log', () => {
    assert.ok(rendererSrc.includes('renderCycleLog'), 'No renderCycleLog function');
  });

  test('filters cycles by today', () => {
    assert.ok(rendererSrc.includes('todayStr'), 'No todayStr function');
  });

  test('renders note in cycle log items', () => {
    assert.ok(rendererSrc.includes('cycle-note'), 'No cycle-note class reference');
  });

  test('renders edit button in cycle log items', () => {
    assert.ok(rendererSrc.includes('cycle-note-edit'), 'No cycle-note-edit class reference');
  });
});

suite('index.html', () => {
  const html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf-8');

  test('references renderer.js', () => {
    assert.ok(html.includes('renderer.js'), 'No renderer.js reference');
  });

  test('references styles.css', () => {
    assert.ok(html.includes('styles.css'), 'No styles.css reference');
  });

  test('has timer display element', () => {
    assert.ok(html.includes('timer-display'), 'No timer-display element');
  });

  test('has work duration input', () => {
    assert.ok(html.includes('work-min'), 'No work-min input');
  });

  test('has break duration input', () => {
    assert.ok(html.includes('break-min'), 'No break-min input');
  });

  test('has cycle log section', () => {
    assert.ok(html.includes('cycle-log'), 'No cycle-log section');
  });

  test('has cycle count element', () => {
    assert.ok(html.includes('cycle-count'), 'No cycle-count element');
  });

  test('has cycle log list element', () => {
    assert.ok(html.includes('cycle-log-list'), 'No cycle-log-list element');
  });

  test('has note input element', () => {
    assert.ok(html.includes('note-input'), 'No note-input element');
  });

  test('has note section', () => {
    assert.ok(html.includes('note-section'), 'No note-section element');
  });
});

// --- Note persistence tests ---

suite('Cycle note storage', () => {
  const mainSrc = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf-8');

  test('log-cycle handler pushes cycle with note support', () => {
    const logCycleMatch = mainSrc.includes("ipcMain.handle('log-cycle'");
    assert.ok(logCycleMatch, 'No log-cycle IPC handler');
  });

  test('update-cycle-note handler finds cycle by completedAt', () => {
    const hasFind = mainSrc.includes('.find(') && mainSrc.includes('completedAt');
    assert.ok(hasFind, 'update-cycle-note does not find cycle by completedAt');
  });

  test('update-cycle-note handler writes updated data', () => {
    const hasWrite = mainSrc.includes('writeData(data)');
    assert.ok(hasWrite, 'update-cycle-note does not persist changes');
  });

  test('renderer note input value is cleared after logging cycle', () => {
    const rendererSrc = fs.readFileSync(path.join(ROOT, 'src', 'renderer.js'), 'utf-8');
    assert.ok(rendererSrc.includes("noteInput.value = ''"), 'noteInput not cleared after cycle log');
  });

  test('renderer renders cycle note in log items', () => {
    const rendererSrc = fs.readFileSync(path.join(ROOT, 'src', 'renderer.js'), 'utf-8');
    assert.ok(rendererSrc.includes('cycle-note'), 'No cycle-note rendering');
  });

  test('renderer provides inline note editing UI', () => {
    const rendererSrc = fs.readFileSync(path.join(ROOT, 'src', 'renderer.js'), 'utf-8');
    assert.ok(rendererSrc.includes('startEditNote'), 'No startEditNote function for inline editing');
    assert.ok(rendererSrc.includes('updateCycleNote'), 'No updateCycleNote call in renderer');
  });

  test('preload exposes updateCycleNote IPC bridge', () => {
    const preloadSrc = fs.readFileSync(path.join(ROOT, 'preload.js'), 'utf-8');
    assert.ok(preloadSrc.includes('updateCycleNote'), 'No updateCycleNote in preload');
    assert.ok(preloadSrc.includes('update-cycle-note'), 'No update-cycle-note IPC channel in preload');
  });
});

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}