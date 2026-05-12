# Contributing to LeetCode James

## Local Development

No build step required. Clone the repo and open `source/index.html` in any modern browser.

```
git clone https://github.com/cse110-sp26-group23/cse110-sp26-group23.git
```

For features that use the live render iframe, use a local static file server to avoid browser security restrictions. The [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) is helpful for testing.

---

## Branching Convention

| Prefix | Use for |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation-only changes |
| `infra/` | CI/CD, tooling, configuration |
| `refactor/` | Code restructuring with no behavior change |
| `test/` | Adding or updating tests |

Branch names use kebab-case: `feat/countdown-timer`, `fix/iframe-css-leak`.

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

ESLint runs automatically on every PR via GitHub Actions. To run it locally without installing anything in the project:

```
npm install -g eslint
eslint source/js/ --ext .js
```

Fix all errors before pushing. Warnings are allowed but should be addressed when convenient.

---

## Dependency Policy

This project uses no npm dependencies in the source code. Any dependency - including dev dependencies - requires explicit TA approval. If approval is granted, document the decision in a new ADR in `docs/decisions/` before adding the dependency.
