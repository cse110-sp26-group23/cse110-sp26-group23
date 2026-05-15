# Contributing to LeetCode James

## Local Development

No build step required. Clone the repo:

```
git clone https://github.com/cse110-sp26-group23/cse110-sp26-group23.git
```

The game uses native ES modules, which browsers refuse to load from `file://` URLs. **Do not** double-click `source/index.html` — it will appear to load but all imports will silently fail. Serve `source/` through a local static server:

```
python3 -m http.server --directory source 8000
```

Then open `http://localhost:8000/` in any modern browser. The [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension is an equivalent zero-install alternative.

---

## Branching Convention

Branch prefixes mirror the Conventional Commits types used in commit messages — see the [Commit Message Format](#commit-message-format) section below.

| Prefix | Use for | Commit type |
|--------|---------|-------------|
| `feat/` | New features | `feat` |
| `fix/` | Bug fixes | `fix` |
| `docs/` | Documentation-only changes | `docs` |
| `style/` | Formatting, whitespace, no logic change | `style` |
| `refactor/` | Code restructuring with no behavior change | `refactor` |
| `test/` | Adding or updating tests | `test` |
| `chore/` | CI/CD, tooling, configuration, dependencies | `chore` |

`infra/` is accepted as an alias for `chore/` when the work is specifically about CI/CD or build infrastructure, but the commit message should still use `chore` as the Conventional Commits type.

Branch names use kebab-case: `feat/countdown-timer`, `fix/iframe-css-leak`, `chore/add-eslint`.

---

## Commit Message Format

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(game): add countdown timer to game screen
fix(render): prevent CSS from leaking out of iframe
docs(readme): add local development instructions
test(metrics): add unit tests for WPM calculation
chore(ci): add HTML validation step to lint workflow
```

- Use the imperative mood: "add" not "added", "fix" not "fixed"
- Keep the subject line under 72 characters
- Reference issues in the body or footer: `Closes #42`

---

## Naming Conventions

### Files
| Type | Convention | Example |
|------|-----------|---------|
| HTML | `kebab-case` | `game-screen.html` |
| CSS | `kebab-case` | `typing-pane.css` |
| JavaScript modules | `camelCase` | `gameEngine.js` |

### JavaScript
| Item | Convention | Example |
|------|-----------|---------|
| Variables and functions | `camelCase` | `calculateWPM` |
| Classes | `PascalCase` | `GameEngine` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_DIFFICULTY` |
| DOM IDs | `kebab-case` | `render-pane` |
| CSS classes | `kebab-case` | `typing-input` |

---

## Code Documentation

All exported functions and classes must have a JSDoc comment:

```js
/**
 * Calculates words per minute from character count and elapsed time.
 * @param {number} charCount - Total characters typed correctly
 * @param {number} elapsedSeconds - Time elapsed in seconds
 * @returns {number} WPM rounded to the nearest integer
 */
function calculateWPM(charCount, elapsedSeconds) {
  return Math.round((charCount / 5) / (elapsedSeconds / 60));
}
```

Inline comments explain the *why*, not the *what*. If a reader would understand it by reading the code, skip the comment.

---

## AI Usage Policy

AI-generated code is allowed but must be disclosed on every PR via the "AI Usage" field in the PR template. Describe:
- What was generated (e.g., "Claude generated the initial `calculateWPM` function")
- What was changed after generation (e.g., "updated the formula and added JSDoc")

Code must be understood and reviewed by the author before it is merged. Undisclosed AI usage is a violation of the team charter.

---

## Pull Request Process

1. Open a branch using the naming convention above
2. Keep PRs focused (one feature or fix per PR)
3. PRs over 300 lines of code require review by at least one other team member (course requirement)
4. Fill in all fields of the PR template before requesting review
5. Resolve all review comments before merging
6. Squash commits on merge to keep history clean

---

## Linting

*Proposed*

ESLint runs automatically on every PR via GitHub Actions. To run it locally without adding anything to the project:

```
npm install -g eslint
eslint "source/**/*.js"
```

ESLint v9+ uses flat config and resolves files via glob patterns — the older `--ext .js` flag has been removed and will error if you pass it. The glob above covers both `source/js/` (production code) and `source/tests/` (Jasmine specs, which need the test-file overrides in `eslint.config.js` to recognize `describe`/`it` as globals — see [testing.md → Enforcement](./docs/testing.md#enforcement)).

Fix all errors before pushing. Warnings are allowed but should be addressed when convenient.

---

## Dependency Policy

This project uses no npm dependencies in the source code. Any dependency - including dev dependencies - requires explicit TA approval. If approval is granted, document the decision in a new ADR in `docs/decisions/` before adding the dependency.
