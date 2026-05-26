# Pomodoro Timer

A lightweight, offline-first Windows desktop Pomodoro timer built with Electron.

## Features

- Configurable work and break durations (1–120 min work, 1–60 min break)
- Start, pause, resume, and reset controls
- Local task label persisted to disk between sessions
- Desktop notifications on phase changes (with development fallback to console)

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm >= 8

## Local Run Steps

```bash
# Install dependencies
npm install

# Start the app
npm start

# Or use dev alias
npm run dev
```

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

## Release Build (Windows .exe)

To produce a portable Windows executable:

```bash
npm run pack
```

The built `.exe` will be in the `dist/` directory:

```
dist/PomodoroTimer-1.0.0-portable.exe
```

For a full installer build (NSIS installer + portable exe):

```bash
npm run dist
```

Both commands require all dependencies installed (`npm install`) and run fully offline.

## Project Structure

```
pomodoro/
  main.js         Electron main process
  preload.js      Context bridge for IPC
  src/
    index.html    Single-screen timer UI
    styles.css    Minimal dark theme
    renderer.js   Timer logic, controls, persistence
  test/
    smoke.test.js Automated smoke tests
```

## Configuration

Work/break durations and the task label are saved to `%APPDATA%\pomodoro-timer\pomodoro-data.json` and restored on next launch.