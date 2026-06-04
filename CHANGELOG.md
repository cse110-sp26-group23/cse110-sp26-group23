# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

---

## [0.2.0] - 2026-06-03

### Added

- Level loading system reading prompts from JSON data files
- Level selection UI on landing page (`index.html`)
- Additional beginner/intermediate/expert levels with preview screenshots
- Color theme system with selectable themes (`theme.css`, settings)
- Audio module (`audio.js`) with keystroke and error sound feedback
- Background music system (`music-theory.js`) with selectable tracks
- Timer module (`time.js`) and countdown timer integrated into the game engine
- Mobile snippet mode for tap-to-insert syntax on touch devices
- Progress persistence via local storage (`progress.js`)
- Progress bar for level completion tracking
- "Play Again" and "Exit" buttons on end screen
- Generated JSDoc API reference, now served at `/api/` of the deployed site
- Expanded Playwright end-to-end test suite with game-flow scenarios (ADR-015)
- AGENTS.md and CLAUDE.md for AI-agent onboarding
- ADR-013 (feature modules architecture), ADR-014 (AGENTS.md rationale),
  ADR-015 (Playwright), ADR-016 (Docker/Kubernetes deployment)
- Difficulty levels and mobile snippets sections in design document
- Codebase takeaways document and repo map documentation
- Sprint 4 and Sprint 5 sprint reviews and meeting notes

### Fixed

- JSDoc API docs build crashing before emitting the home page (enabled the
  markdown plugin so code spans in comments render as escaped `<code>`)
- Accuracy score calculation on incorrect final keystrokes (#172)
- Level no longer ends when the last character typed is incorrect
- Settings menu update and view-toggle button states during gameplay
- Automatic scroll behavior in the input pane
- Replaced hardcoded CSS units with theme tokens (ADR-010)
- Maximum page size handling and layout scaling for large and mobile screens

---

## [0.1.0] - 2026-05-20

### Added

- Core game engine (`gameEngine.js`) with keystroke matching and score tracking
- Render pane (`renderPane.js`) with live HTML/CSS preview via sandboxed iframe
- Input pane (`inputPane.js`) for typing code input
- Game page (`game.html`, `game.js`, `game.css`) wiring all modules together
- End screen (`endScreen.js`) displaying accuracy, WPM, and score metrics
- Settings module (`settings.js`) for user preferences
- Landing page (`index.html`, `main.css`) with start UI
- Mobile-responsive game page layout
- Placeholder theme (`theme.css`) with initial visual styling
- Wireframes for landing, game, and end screens (desktop and mobile)
- CI/CD pipeline with HTML/CSS/JS validation and Jasmine unit-test workflow
- Helm chart and initial Docker/Kubernetes deployment configuration
- Jasmine unit tests for game engine, render pane, and end screen modules
- JSDoc comments on all exported functions
- Architecture Decision Records ADR-001 through ADR-012
- PR template with AI usage disclosure and Conventional Commits checklist
- Issue templates for tasks and user stories
- CONTRIBUTING.md: branching conventions, Conventional Commits format, JSDoc
  requirements, AI usage policy, and dependency policy
- Architecture overview, design (personas, UCD flow, visual principles), and
  testing strategy documentation
- Source directory structure with planned file layout

### Fixed

- Auto-rendering of preview pane when game starts (`fix/auto-render`)
- Input pane CSS formatting and layout (`fix/input-pane`)
