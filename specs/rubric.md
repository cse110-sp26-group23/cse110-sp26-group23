# Not So "Hidden" SWE Rubric

A consolidated rubric covering process, product, and team dimensions of a software project.

## Repository & Version Control

| Topic | Description |
|---|---|
| Repo Usage (over time) | How consistently the repo is used and maintained as the project evolves |
| Repo Consistency (naming, style) | Consistency of naming conventions and style across the repo |
| Commits (frequency & messages) | Frequency of commits and quality of commit messages |
| Pull Request (size, frequency) | Size and frequency of PRs |
| Pull Request Reviewing | Consistency and rigor of PR reviews |
| Branching Use | How branches are created, used, and merged |
| CI/CD Pipeline | Existence, usability, and documentation of the pipeline |
| Issue Tracking | Organization and follow-through on issues |
| Repo Org (entry point) | Quality of the README as a project entry point |
| Repo Org (clarity) | Clear folder structure and organization |
| Repo Use (Tagging & Releases) | Use of semantic versioning, tags, and releases |

## Documentation

| Topic | Description |
|---|---|
| Docs (Readme.md) | Structure and clarity of the README |
| Design Related Docs | Specificity of design goals and rules |
| UCD Related Docs | User-centered design documentation |
| Architectural Related Docs | Up-to-date description of system architecture |
| System Related Docs (Overview, Pipeline, etc.) | Coverage of system aspects |
| Team & Managerial Related Docs | Team-related documentation kept current |
| Developer Docs (API, classes, components) | Reference docs for developers |
| Doc Location and Doc DX | Discoverability and developer experience around docs |
| Doc Synchronicity with Code/Software | How well docs stay in sync with the codebase |

## Process & Sprint Management

| Topic | Description |
|---|---|
| Backlog Use | Maintenance and prioritization of the backlog |
| Sprint Planning and Estimation | Quality of planning and estimation |
| Sprint Execution & Tracking | Execution of sprint work and tracking progress |
| Sprint Review / Retrospective | Reflection and review at sprint boundaries |
| Daily Stand-Ups | Cadence and usefulness of stand-ups |

## Code Quality

| Topic | Description |
|---|---|
| Code Consistency | Consistent patterns across the codebase |
| Code Commenting | Appropriate use of comments |
| Code Decomposition | Breaking code into appropriate units |
| Code Linting and Style Enforcement | Automated style enforcement |

## Testing

| Topic | Description |
|---|---|
| Unit Testing | Coverage and quality of unit tests |
| E2E Testing | End-to-end test coverage |
| Hand Testing (Performed, Documented, ...) | Manual testing practices and documentation |

## Team & Stakeholders

| Topic | Description |
|---|---|
| "Dog Fooding" | Team using their own product |
| Stakeholder Feedback | Gathering and incorporating stakeholder input |
| Outside User Acceptance Testing | Testing with real external users |
| Team Communications (Ad hoc) | Quality of informal communication |
| Team Communications (Meetings) | Quality of formal meetings |
| Other Team Dynamics | General team health |
| Workload Distribution | How work is shared across the team |
| Workload Pace | Sustainability of the work pace |
| Other Things You Think Of | Open category for additional team factors |

## Product Quality Characteristics (ISO 25010)

Each is rated on importance (1-5)

| Characteristic | Description |
|---|---|
| Functional Suitability | Does it do what it's supposed to do |
| Performance Efficiency | Speed and resource use |
| Compatibility (interop) | Works with other systems |
| Usability | Ease of use |
| Reliability | Consistent correct behavior |
| Security | Protection of data and access |
| Maintainability | Ease of modification |
| Portability | Ability to run in different environments |

## Project Specification

With our team formed and enough practice with GenAI, in both a code focused and design-focused manner, we are ready to take on a project utilizing modern Agile methodologies.

While the project deliverable in the form of working quality software is quite important,  students are strongly reminded that the process we undertake is the actual focus in our academic exploration of SWE.  **A repeatable and observable quality focused process that ends up producing less feature rich software will get a higher grade than a large feature rich piece of software done opaquely or with less process.**

TL;DR - For a course, **process >> product**. Beyond a course, that may not hold.

### Agile and Process Requirements

Your team will be required to
 * Perform a documented sprint planning meeting before starting work each sprint and capture the information in your repository (GitHub)
 * Hold stand-up meetings virtually (Slack) and/or in-person at least 3 times a week and capture the information in your repository (GitHub)
 * Tasks are captured in an issue tracker (GitHub Issues) and work happens and is documented in the issue tracker
 * Perform a sprint review and retrospective at least two times in the remaining time of the quarter.  Information from the retrospective must be captured and there must be evidence of its incorporation
 * Meet with your TA weekly and capture the meeting information (GitHub)
 * Meet with the Prof once before the conclusion of the quarter

 Some meetings may not include all team members.  For example, TA or Prof meetings may be attended by two or three people, but planning and retrospective meetings must be attended by all.

### Repository, Process, and Tooling Requirements

* All work including planning, meeting information, tests, and documentation must be captured in GitHub incrementally
* GenAI may be used, and if used, must be exposed and discussed
* Regardless of production mechanism (human or AI) work batches above 300 LoC must follow a pull-request path with evaluation by another human on the team
* Branching should be demonstrated and used over the project process but approach can vary as you go
* Versioning using [SemVer](https://semver.org/) must be employed
* A CI/CD pipeline must be built using GitHub Actions
* Deployment can happen to GitHub pages, Cloudflare, or as a downloadable asset, depending on the form.
* Testing with unit and e2e must be demonstrated, and not be applied only at the conclusion of the project.  Significant early efforts with testing should be verifiable in the repository.  Testing approaches may vary in tooling.
* Code documentation must be maintained as you go along in the project.  This also includes commenting using JSDocs
* Linting and quality checks should be performed both manually by developers and via a CI pipeline for software artifacts (this may go beyond JavaScript code)
* Repositories should use a .gitignore file
* Commit messages should be consistent and follow a format like [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
* A changelog should be kept and may be generated manually, automatically, or some hybrid
* A technical documentation site should be found either in a Github Wiki or private web site for future maintainers

### Technical Constraints

* You may use markdown, standards-based HTML, CSS without a framework, vanilla JavaScript without a framework, media assets such as audio, video, image, fonts, or PDF files, JSON files, and any .txt or configuration files needed
* Any server-side based technologies must work on Cloudflare or Github pages only
* All major technical decisions must be captured as Architectural Decision Records (ADRs) in [MADR](https://adr.github.io/madr/) format
* Dependencies can only be added with agreement from your teaching assistant (which implies proper justification)
* The form of what you build may include a traditional web application, progressive web application (Web app), wrapped mobile app (CapacitorJS), or a wrapped desktop app (ElectronJS).  Chrome Extensions, VS Code extensions, and Slack extensions also have been seen and on occasion, REST endpoints for outside consumption make sense.  Forms beyond any mentioned here must be given clearance.
* All projects must have a website to document what is produced for end users


### Project Topic and Process

You will be given a topic as a prompt for you to clarify and design.  Your TA mentor is your customer, and they work for the Prof who has driven the ideas.  The topic itself will have many design decisions and open-ended aspects.  You should do research and employ user-centered design throughout the project.  This should include, minimally, a design brief, user personas, user stories, and wireframes.  These artifacts should precede any non-exploratory work produced in the repository.

You will run a one-week sprint, Sunday to Sunday, for orienting, which is light work-wise due to the midterm.  Then, a one-week design and prototyping sprint with initial exploration.  Your TA will gate you on these two sprints and, if you do not perform them before heavy coding, you will be forced to repeat it the week after.

Your sprints will continue after, with a review break sometime in week 9.  The review break will involve another team in your cohort that will use your software, look at your code, evaluate it, and provide product and code feedback. You will do the same. Interaction, or even software evaluation, should happen once from the Prof before the end of week 10, and you are expected to interact with the TA weekly.

### Your Project Prompt

*You Name It: Code Typing Game* - Typing tutors of old are fun and all, but we want to have some real fun while getting our typing to Claude-level speeds.  Ideas like https://keysoffury.com/ show that we can build a game with typing, but what about what we type - code?  Be it &lt;html>, CSS, or JavaScript we want to challenge to jump, avoid falling code, shoot syntax, or whatever makes sense while learning about the syntax we need to write or recognize.  A game is lot more fun than flash cards, but make sure it can be expanded with new packs for all the UNIX commands, Claude syntax, API methods, or whatever syntax it is you might need to learn by playing in the future.  If we are waiting for class or bored, we might not have our laptop handy, so mobile friendliness is a must, and WiFI can't be required!


### Final Advice (from Ayla)
After all the build-up for the project, you're making... *a typing game*? Maybe it sounds a bit silly, or simple. And sure, you can probably make a *bad* typing game in an afternoon. But how do you make a typing game that people actually want to play? How do you make a game that helps people learn new syntax? How do you make a game that is rewarding on replay? The project prompt is just a starting point. Run with it. Get creative!

Some advice:

1. **Make user first decisions.** The first phase of the project is all about planning. This is the most important step. It's tempting to start out by making a laundry list of features that would be cool. But this isn't where you should start, or at least not where you should stop. No one wants a system that's a hodgepodge of random features thrown together. Instead, start with high level questions: *What are our motivations for building this game?* *Who is our audience?* *What qualities do we care about in our game?* A game that prioritizes addictiveness will look different from a game that prioritizes education. Once you have your high level design goals, you can evaluate whether or not each feature you want to implement supports those goals. The first idea is rarely the best. User needs inform design. Design informs architecture. Architecture informs code. The worst thing you can do is start with the code.

2. **Feedback should never be personal. Progress is made as a team.** Everyone has strengths they bring to the table and things to learn. An effective team is one that improves together. Retrospectives are a place to reflect on whole team process, not to point fingers. Code review is about assuring code quality and consistency, and sharing knowledge, not about calling people out for making mistakes. If you ever find yourself starting a sentence "If we had just done what I suggested..." ***stop***. 

3. **You can use AI, but do so deliberately.** Based on your experience in the warm-ups, your team is equipped to make an informed decision about how to use AI. AI can be a useful accelerant. With precise prompting and guardrails, it can produce some quality code. But AI does not replace you. It does not reason for you. And, at the end of the day, this is a class, and your goal should be to learn. If one thing you want to learn from this class is Javascript and HTML, then asking Claude to write all your code isn't going to serve you. 

4. **Be consistent. Don't cram.** In some classes you can cram a quarter's worth of a work into a few all-nighters. If that's how you approach this class, then you have missed the point.