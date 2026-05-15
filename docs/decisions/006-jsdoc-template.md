# JSDoc Template

## Status

Proposed

## Context and Problem Statement

The course rubric and the team's own [Contributing Guide](../../CONTRIBUTING.md#code-documentation) require JSDoc comments on every exported function and class. Beyond IDE tooltips, the team plans to compile those comments into a browsable HTML reference, published to `https://<site>/api/` alongside the deployed game.

JSDoc itself only ships a default template that produces a functional but visually dated reference page (gray sidebars, no dark mode, dense typography). Several community templates exist as drop-in replacements via the `--template` flag. We need to pick one before wiring up the generation step so we are not relitigating the visual choice once docs are live.

This decision is scoped to the *template* only. The choice to use JSDoc at all is implicit in the JSDoc comment requirement already in the Contributing Guide, and the `jsdoc` dev dependency itself still needs TA approval per the [Dependency Policy](../../CONTRIBUTING.md#dependency-policy).

## Decision Drivers

* Visual consistency with the game's own UI, which commits to a dark default theme (see [design.md, Color and Theming](../design.md#color-and-theming))
* Active maintenance: an unmaintained template will rot when JSDoc itself releases a major version
* Configuration cost: templates with elaborate config files are friction for a course project
* Low approval risk: the template is a single dev dependency with no transitive runtime impact, so the additional approval burden on top of `jsdoc` itself should be near zero
* Familiarity for graders: the output should look like recognizable API docs, not a bespoke site

## Considered Options

* **Default JSDoc template** (no extra dependency)
* **docdash** ([npm](https://www.npmjs.com/package/docdash))
* **clean-jsdoc-theme** ([npm](https://www.npmjs.com/package/clean-jsdoc-theme))
* **better-docs** ([npm](https://www.npmjs.com/package/better-docs))

## Decision Outcome

Chosen option: **clean-jsdoc-theme**, because it has built-in dark and light themes that respect `prefers-color-scheme`, matching the design document's commitment to a dark default with a light toggle. It is actively maintained, is a single dev dependency, and produces output that reads as standard API docs.

Generation config will live in `jsdoc.config.json` at the repo root:

```json
{
  "source": { "include": ["source/js"] },
  "opts": {
    "destination": "docs/api/",
    "recurse": true,
    "template": "node_modules/clean-jsdoc-theme"
  },
  "theme_opts": {
    "default_theme": "dark"
  }
}
```

Run with:

```
jsdoc -c jsdoc.config.json
```

### Consequences

* Good: generated docs match the game's dark default, so a grader switching from the game to the API reference does not experience a jarring theme change
* Good: one extra dev dependency, low maintenance surface
* Good: `prefers-color-scheme` support means a user with a light OS theme still gets readable docs without a manual toggle
* Neutral: requires `jsdoc.config.json` to be committed; the default template would also need flags but they can live in a single command line
* Bad: less ubiquitous than docdash, so debugging an obscure config issue may require reading the template's source
* Bad: locks the team into one more npm package; if TA approval is withheld, fall back to the default template and revisit

## Pros and Cons of the Options

### Default JSDoc template

* Good, because zero extra dependencies and zero approval friction beyond `jsdoc` itself
* Good, because output is the de-facto baseline that every JSDoc user has seen
* Bad, because no dark mode, which clashes with the design document
* Bad, because typography and navigation feel dated next to modern doc sites, which undermines a deliverable that a grader will see

### docdash

* Good, because the most widely used third-party template (most StackOverflow answers, examples, etc.)
* Good, because clean sidebar navigation that scales well to many modules
* Bad, because light theme only as of the current major version; would clash with the game's dark default
* Bad, because customization is mostly via CSS overrides rather than first-class config options

### clean-jsdoc-theme (chosen)

* Good, because built-in dark and light themes with `prefers-color-scheme` support
* Good, because actively maintained and tracks recent JSDoc releases
* Good, because config is declarative via `theme_opts`, no CSS hacking for basic customization
* Bad, because less ubiquitous than docdash, so the community pool for niche issues is smaller

### better-docs

* Good, because supports TypeScript and React component docs out of the box
* Bad, because the project is vanilla JS with no React, so most of better-docs's value proposition is irrelevant
* Bad, because heavier dependency footprint than the alternatives for features we will not use
