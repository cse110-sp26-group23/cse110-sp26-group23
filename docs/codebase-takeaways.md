# Codebase Takeaways
This document summarizes CRAFT on building and maintaining a good codebase. A good project also includes planning, documentation, team process, testing, diagrams, issue tracking, and shared team knowledge. For this project, we should focus on building a clean process and a maintainable repo, not just adding features quickly.

## Main Takeaways

### 1. Software is bigger than code

Software includes more than the files that run the application. It also includes design documents, diagrams, user stories, meeting notes, sprint plans, pull requests, issue discussions, and team decisions.

For our project, this means the repo should not only show the final game. It should also show how we planned, designed, reviewed, tested, and improved the game over time.

### 2. Keep important project information close to the repo

A common problem is that project knowledge gets spread across too many places, such as Slack, Google Drive, personal notes, issue trackers, or just people's memory. When this happens, the project becomes harder to understand and maintain.

For this project course, we should follow a "repo everything" mindset when possible. Important planning documents, diagrams, decisions, and development notes should be captured in GitHub so future developers and graders can understand the project.

### 3. Plans should drive the code

Plans, diagrams, user stories, and design documents should not be treated as side notes. They should guide what we build. If the code changes, the related documentation should also be updated. Otherwise, the documentation becomes stale and stops being useful.

### 4. Code should feel like team code, not individual code

Even if one person writes a file, the code should still feel like it belongs to the whole team. This means we need shared conventions for naming, formatting, file structure, comments, and pull request reviews.

The goal is for the repo to look like it was written by one organized team, not by many people using unrelated styles.

### 5. Keep the repo clean

A messy repo makes the project harder to understand. We should avoid leaving junk files, old branches, commented-out code, unused files, or unnecessary dependencies.

Files such as `.DS_Store` and `node_modules` should not be committed. These should be handled through `.gitignore` and normal setup commands like `npm install`.

### 6. Favor readable code over clever code

Code is read more often than it is written. A short or clever solution is not always better if it becomes harder for the team to understand later. For our project, simple functions, clear names, and readable control flow are better than code that is compact but confusing.

### 7. Keep the code simple

We should keep the project simple, but not so short that the code becomes hard to understand. Less code can mean fewer bugs, but if we try to squeeze too much into one line or one function, it can make the project harder for teammates to read later.

For our repo, the goal should be simple and readable code, not clever code.

### 8. Plan for future changes without overbuilding

We should leave room for the project to grow later, but we should not make the design too complicated too early. It is fine to use simple placeholder functions or separate modules now if they make future changes easier.

For example, instead of naming a function `saveToLocalStorage(userData)`, we could name it `saveProgress(userData)`. That way, if we later decide to save progress somewhere else, like IndexedDB or another storage method, we do not have to rename or rethink the whole function.

### 9. Clean continuously

We should make small cleanup improvements as we work instead of waiting until the end. This includes cleaning code, documentation, branches, issues, and file organization.

### 10. Use pull requests seriously

Pull request reviews should be meaningful. Comments like "LGTM" are not always enough. Reviewers should check whether the code is readable, connected to the issue, tested, and consistent with the rest of the repo.


### 11. Use HTML, CSS, and JavaScript carefully

Since our project uses web technologies, we should care about basic web quality:

- Use semantic HTML when possible.
- Validate markup.
- Use consistent HTML formatting.
- Avoid using too many unnecessary `<div>` elements.
- Use CSS features directly instead of adding a framework for small layout tasks.
- Use JavaScript modules clearly.
- Add JSDoc comments where useful.
- Write unit tests for functions that can be tested directly.

### 12. Be careful with dependencies

Third-party code should not be added casually. Once we include a dependency, it becomes part of our responsibility.

Before adding a package, we should ask whether we really need it, whether the browser already gives us the feature, and whether the dependency adds more complexity than value.

### 13. Local-first thinking matters

Our game should still be usable when the internet is slow or unavailable. Since the project is supposed to be mobile-friendly and not require Wi-Fi, we should avoid making the main gameplay depend on a server or cloud account.

For the MVP, it makes more sense to keep things simple: use static files, local JSON prompt packs, and browser storage if we need to save progress.

---

## Actionable Improvements for Our Codebase

### Repo organization

- Keep project documents in the repo instead of only in Slack.
- Store architecture diagrams, design notes, and sprint documents under `docs/` or `specs/`.
- Keep related files close together when possible.
- Remove unused files and old experimental code when it is no longer needed.

### Git and GitHub workflow

- Use clear branch names such as `feat/`, `fix/`, `docs/`, or `infra/`.
- Use consistent commit messages, preferably Conventional Commits.
- Keep pull requests small enough to review carefully.
- Link pull requests to their related issues.
- Do not leave old branches around after they are merged.

### Documentation

- Keep README instructions up to date.
- Document how to run the project locally.
- Document how to run tests.
- Document how to deploy the project.
- Keep the architecture diagram updated when the code structure changes.
- Use JSDoc comments for important functions and modules.
- Add notes explaining major design decisions.

### Code style

- Use consistent naming conventions.
- Prefer readable names over overly short names.
- Avoid commented-out code.
- Use simple functions with clear responsibilities.

### HTML

- Use semantic HTML elements such as `main`, `section`, `nav`, `button`, and `form` when appropriate.
- Use lowercase element and attribute names.
- Validate important pages with an HTML validator.
- Avoid unnecessary wrapper `<div>` elements.

### CSS

- Avoid adding a full CSS framework just for small layout needs.
- Use modern CSS features such as flexbox or grid where appropriate.
- Make sure styles support mobile layouts.
- Check contrast and readability.

### JavaScript

- Use ES modules consistently.
- Keep modules focused on one responsibility.
- Use clear function names.
- Validate user-provided data where needed.
- Add JSDoc comments for exported functions.
- Keep game logic separate from DOM rendering when possible so it is easier to test.

### Testing

- Add unit tests for pure calculation modules like `metrics.js`.
- Add tests for state transitions in `gameEngine.js`.
- Add tests for error handling where useful.
- Run `npm test` before opening a pull request.
- Add end-to-end tests later for browser interactions and game flow.

### Project-specific actions

- Keep the game playable with local/static files.
- Keep syntax packs in local data files when possible.
- Avoid cloud login or account features for MVP unless strongly justified.
- Make mobile usability part of the core design
- Keep the MVP simple: one strong game loop before adding extra modes.
- Ask for feedback from teammates, TA, professor, and other teams.
- Use the game ourselves during development to find problems earlier.

