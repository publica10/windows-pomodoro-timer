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

  test('uses Notification API', () => {
    assert.ok(mainSrc.includes('Notification'), 'No Notification usage');
  });

  test('uses preload script', () => {
    assert.ok(mainSrc.includes('preload.js'), 'No preload reference');
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

  test('includes dev notification fallback', () => {
    assert.ok(rendererSrc.includes('dev-notification') || rendererSrc.includes('dev-fallback'), 'No dev notification fallback');
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
});

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}