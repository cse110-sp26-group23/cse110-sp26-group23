# Codekata - Code Typing Game

**Codekata** is a code typing game built by team **LeetCode James** for CSE 110.

Players choose a difficulty and level, type HTML/CSS prompts, and see a live rendered preview of their code. The app includes level loading, settings, themes, progress tracking, a timer, typing metrics, and end-of-round results.

---

## Live Site

Play the deployed version here:

[https://cse110.timothyw.dev/](https://cse110.timothyw.dev/)

The deployed site also includes generated JSDoc API documentation at:

[https://cse110.timothyw.dev/api/](https://cse110.timothyw.dev/api/)

---

## Required Tools

Install these before working on the project:

- **Git**
- **Node.js 20+**
- **npm**
- **Python 3** for the simplest local static server
- A modern browser such as Chrome, Firefox, Safari, or Edge

Optional but useful:

- **VS Code Live Server** extension
- **Docker** if testing the production container locally
- **Helm/Kubernetes** only if working on deployment infrastructure

---

## Repository Structure

```
cse110-sp26-group23/
├── .github/               - PR template, issue templates, CI/CD workflows
├── admin/
│   ├── branding/          - team logo and visual assets
│   ├── meetings/          - all meeting notes
│   ├── misc/              - team charter and signed contracts
│   ├── team.md            - team roster and bios
│   └── videos/            - team intro video
├── docs/                  - architecture docs, design doc, ADRs, testing strategy
│   ├── decisions/         - Architecture Decision Records
│   ├── wireframes/        - screen wireframes
│   └── screenshots/       - reference screenshots
├── source/                - game source code
│   ├── js/                - ES modules
│   ├── css/               - stylesheets and theme tokens
│   ├── data/prompts/      - level prompt JSON files
│   ├── assets/            - fonts, audio, images
│   ├── tests/             - Jasmine unit tests
│   ├── Dockerfile         - production Docker image
│   └── nginx.conf         - Nginx config for static hosting
├── e2e/                   - Playwright end-to-end tests
├── helm/                  - Kubernetes deployment chart
└── specs/                 - user stories, prototypes, brainstorming, rubric
```

---

## Key Documents

| Document | Description |
|---|---|
| [Team Roster](admin/team.md) | Who we are |
| [Team Charter](admin/misc/rules.md) | Our working agreements |
| [Meeting Notes](admin/meetings/) | All sprint and stand-up notes |
| [User Stories](specs/user-stories/user-stories.md) | 30 finalized user stories |
| [Specs Index](specs/specs.md) | Table of contents for all specs and docs |
| [Architecture Overview](docs/architecture.md) | Component diagram and data flow |
| [Design Document](docs/design.md) | Personas, UCD flow, visual design principles |
| [ADR Index](docs/decisions/README.md) | All Architecture Decision Records |
| [Contributing Guide](CONTRIBUTING.md) | Branching, commits, naming conventions, JSDoc |
| [Changelog](CHANGELOG.md) | Version history |

---

## Deployment

The app is deployed as a static frontend from the `source/` directory. The production build uses `source/Dockerfile`, which:

1. Installs Node dependencies.
2. Generates the JSDoc API reference with `npm run docs`.
3. Copies the static app into an Nginx container.
4. Serves the generated API docs under `/api`.

Deployment is handled by GitHub Actions. On pushes to `main` or `dev`, `.github/workflows/build.yml` builds and pushes a Docker image to GitHub Container Registry.

For Kubernetes deployment files, see the `helm/` directory.

---

## Contributing

Most contribution rules are documented in [`CONTRIBUTING.md`](CONTRIBUTING.md). In general:

1. Branch from `dev`, not `main`.
2. Use the correct branch prefix, such as `feat/`, `fix/`, `docs/`, `test/`, or `chore/`.
3. Follow Conventional Commits, for example:

```bash
git commit -m "docs(readme): add deployment instructions"
```

---

## Team

**LeetCode James** — 11 members — [full roster](admin/team.md)

---

### Links

- [Mid Sprint Update](https://youtu.be/dHI33iXO95I?si=GdClDwTMKtrwJ9bH)
- [Final Project Private Version](https://youtu.be/NfWQodrvihI)
- [Final Project PUBLIC Version](https://youtu.be/OOeJLLiuG5U)

## Developer Documentation

Technical documentation for contributors and future maintainers lives in the [GitHub Wiki](../../wiki) and in the [`docs/`](docs/) directory. Start with the [Contributing Guide](CONTRIBUTING.md) for local setup, branching conventions, commit format, and coding standards.

A generated **JSDoc API reference** for the `source/js` modules is published at [`/api/`](https://cse110.timothyw.dev/api/) on the deployed site, and can be rebuilt locally with `npm run docs` with output in `docs/api/`.
