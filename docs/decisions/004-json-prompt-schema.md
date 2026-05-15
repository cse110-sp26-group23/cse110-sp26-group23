# Prompt Schema

## Status

Proposed

## Context and Problem Statement

The game loads levels from a Prompt Library (JSON files registered in a manifest, loaded by the Game Engine.) Each level defines a complete mini-webpage: the HTML and CSS that compose it, and what portion of that the player is expected to type. The Render Pane displays the page as the player types, building up to the finished result.

Before implementation begins on the Prompt Library, the team needs to agree on the JSON schema for a single level so that level authoring, level loading, and the Render Pane can be built against a stable contract.

The schema must:
- Describe a complete mini-webpage (HTML + CSS)
- Indicate what the player types: HTML only, CSS only, or HTML followed by CSS
- Support difficulty tagging and mobile-appropriate scoping
- Allow a per-line **snippet** to be marked on mobile, where the player types only the snippet and the surrounding scaffold auto-fills
- Allow new packs to be added by dropping in a JSON file and updating the manifest, with no game code changes

## Decision Drivers

* A level describes one mini-webpage end-to-end
* Different levels exercise different skills: some are pure HTML drills, some are pure CSS drills, some walk the player through both
* The Render Pane must be able to render the full target page from the level data alone, independent of player progress
* Schema must be hand-authorable in JSON without tooling
* Mobile players type short snippets per line (the interesting token: a tag name, a class, a property value) rather than whole lines with brackets, quotes, and punctuation. Desktop players type the full content
* Schema must accommodate both modes from one source of truth — authors should not maintain a "desktop version" and a "mobile version" of the same level
* Forward-compatible: adding fields like hints or thumbnails later should not require migrating existing files
* Diffable and reviewable in pull requests

## Considered Options

* **Option A: `html` + `css` + `mode` fields with inline snippet markers:** the level stores both the HTML and CSS that compose the page; a `mode` field declares which portion the player types; per-line snippet regions are marked inline with `{{...}}` delimiters
* **Option B: Typed and scaffold fields:** explicit `typed_html` / `scaffold_html` / `typed_css` / `scaffold_css` fields
* **Option C: Block list:** an ordered array of blocks, each tagged with language and `typed: true/false`
* **Option D: Parallel snippet array:** keep `html`/`css` as plain strings, store snippets as `[{ line, col, text }, ...]` alongside

## Decision Outcome

Chosen option: **Option A with inline snippet markers**, because it preserves the "the file describes the webpage" virtue while folding the mobile snippet concept into the existing strings as a thin annotation layer.

A level is a JSON object with this shape:

```json
{
  "id": "beginner-flexbox-row",
  "title": "Flex Row of Three Boxes",
  "difficulty": "easy",
  "mobile": true,
  "mode": "html_then_css",
  "html": "<div class=\"{{row}}\">\n  <div class=\"{{box}}\"></div>\n  <div class=\"{{box}}\"></div>\n  <div class=\"{{box}}\"></div>\n</div>",
  "css": ".row { display: {{flex}}; gap: 8px; }\n.box { width: 40px; height: 40px; background: {{purple}}; }"
}
```

Fields:
- `id`, `title`, `difficulty`, `mobile`, `mode`
- `html` the full HTML for the mini-webpage, with optional `{{...}}` snippet markers
- `css` the full CSS for the mini-webpage, with optional `{{...}}` snippet markers

### Snippet markers

A snippet is a region of a line delimited by `{{` and `}}`. The text inside the delimiters is what the mobile player types; the rest of the line is scaffold and auto-fills.

Rules:
- **One snippet per line, maximum.** Lines with no marker have no snippet (the whole line is scaffold on mobile, or part of the typed flow on desktop)
- **Markers do not cross line boundaries.** A `{{` must be closed by `}}` on the same line
- **Delimiters are stripped before rendering.** The Render Pane never displays `{{` or `}}`, `<div class="{{row}}">` renders as `<div class="row">`
- **Markers are advisory on desktop.** Desktop players type the full content per `mode`; the loader strips the delimiters and treats the level as plain `html` / `css`
- **Markers drive mobile gameplay.** Mobile players advance line-by-line, typing only the snippet text on each line that has one; lines without a snippet auto-advance

The Render Pane composes the page at render time, after stripping markers:

```html
<style>{css with markers stripped}</style>
{html with markers stripped}
```

### Authoring guidance

Pick the snippet so it's the *interesting* token on that line, the thing the level is teaching. Skip syntax: brackets, quotes, semicolons, indentation. Examples:

- Teaching tag names: `<{{section}}>` (not `{{<section>}}`)
- Teaching class names: `<div class="{{card}}">`
- Teaching CSS values: `display: {{flex}};`
- Teaching CSS properties: `{{justify-content}}: center;`

Lines that are pure structure (closing tags, blank lines, braces) typically have no snippet.

A pack file is an array of level objects. The manifest registers packs:

```json
{
  "packs": [
    { "id": "beginner", "file": "beginner.json", "difficulty": "easy" },
    { "id": "flexbox-drills", "file": "flexbox-drills.json", "difficulty": "medium" }
  ]
}
```

### Consequences

* Good: one source of truth as the same level file plays on mobile and desktop
* Good: markers are a thin syntactic layer; if the team later decides snippets aren't useful, stripping them recovers the v1 schema exactly
* Good: per-line snippets cap line length to something a mobile keyboard can handle without making authors split the file into a different structure
* Good: snippet text is visually adjacent to its context in the source, so reviewers can see what the player will type at a glance
* Bad: `{{` and `}}` are now reserved sequences in `html` and `css` strings. Levels that legitimately need those character pairs (template-literal demos, Vue/Handlebars teaching levels) need an escape mechanism. Not in v1; flag for later
* Bad: a level author can forget to mark snippets, producing a level that has no mobile playthrough. The loader should warn if `mobile: true` and no snippets are present
* Bad: one-snippet-per-line means lines with two interesting tokens (`<div class="row">` teaching both `div` and `row`) must pick one or be split across two lines
* Neutral: thumbnails, hints, escape sequences for literal `{{`, and per-level time limits are not in v1. All additive

## Pros and Cons of the Options

### Option A: `html` + `css` + `mode` with inline snippet markers (chosen)

* Good, because the file still reads as "the webpage, annotated" rather than a separate data structure
* Good, because mobile and desktop share one source
* Good, because snippets sit in context
* Bad, because `{{` `}}` are now reserved characters
* Bad, because the one-per-line cap is a real limit for some lines

### Option B: Typed and scaffold fields

* Good, because structurally distinguishes typed vs scaffold
* Bad, because four fields where two would do
* Bad, because doesn't address mobile snippets
* Bad, because End Screen rendering requires concatenation

### Option C: Block list

* Good, because supports interleaving and future languages
* Bad, because verbose to author
* Bad, because no current story requires interleaved blocks
* Bad, because snippet support would require yet another layer inside each block

### Option D: Parallel snippet array

* Good, because keeps `html`/`css` as clean strings
* Bad, because `{ line, col, text }` references break on any reformatting of the source
* Bad, because snippets are visually far from their context in the file
* Bad, because authors maintain two parallel structures by hand
