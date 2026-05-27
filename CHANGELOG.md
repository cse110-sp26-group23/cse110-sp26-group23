# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Added

- Level loading system reading prompts from JSON data files
- Level selection UI on landing page (`index.html`)
- Playwright end-to-end test suite with game-flow scenarios (ADR-015)
- AGENTS.md and CLAUDE.md for AI-agent onboarding
- ADR-013 (feature modules architecture), ADR-014 (AGENTS.md rationale),
  ADR-015 (Playwright), ADR-016 (Docker/Kubernetes deployment)
- Timer module (`time.js`) integrated into game engine
- Progress bar for level completion tracking
- "Play Again" and "Exit" buttons on end screen
- Difficulty levels section in design document
- Mobile snippets section in design document
- Codebase takeaways document
- Sprint 4 sprint review and meeting notes

### Fixed

- Layout scaling for larger screen sizes and mobile devices

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
