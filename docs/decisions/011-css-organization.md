# CSS File Organization

## Context and Problem Statement

The project has multiple pages (a landing page and a game page) plus cross-cutting UI that appears as overlays on top of the game page (settings, theming, etc.). A single monolithic stylesheet would grow unwieldy and force every page to load rules it never uses, while a stylesheet-per-component would create a sprawl of tiny files and many `<link>` tags. How should we organize CSS files so that each page loads what it needs, shared concerns live in one place, and the structure stays legible as the UI grows?

## Decision Drivers

* Each page should load only the styles relevant to it.
* Cross-cutting concerns (theme tokens, reusable overlays) should not be duplicated across pages.
* No build step is in use; stylesheets are linked directly in HTML.
* The structure should make it obvious where a given rule belongs.

## Considered Options

* Single monolithic stylesheet for the whole app
* One stylesheet per page only
* Page stylesheets plus a shared theme layer and shared overlay/component stylesheets

## Decision Outcome

Chosen option: **Page stylesheets plus a shared theme layer and shared overlay/component stylesheets**, linked directly via `<link>` tags in each page's HTML.

Stylesheets fall into three roles:

* **Theme layer** (`theme.css`) - defines the design tokens (CSS custom properties for color, spacing, typography). Linked first on every page so its variables are available to everything that follows. This is the single source of truth referenced by the no-hard-coded-values rule.
* **Page stylesheets** (`main.css`, `game.css`) - styles scoped to a single page's layout and unique elements. A page links exactly one of these.
* **Overlay / component stylesheets** (`settings.css`, etc.) - styles for self-contained UI that appears over a page (overlays, modals, panels). Linked on whichever pages host that component.

Each HTML file links the theme layer, then its page stylesheet, then any overlay/component stylesheets it needs.

### Consequences

* Good, because a page only loads the CSS it actually uses.
* Good, because shared concerns (tokens, reusable overlays) live in one file and are reused across pages without duplication.
* Good, because file role maps directly to where a rule belongs, making the codebase easy to navigate.
* Bad, because the page author must remember to link the correct set of files in the right order, and a missing link produces unstyled UI.
* Bad, because multiple `<link>` tags mean multiple requests; without a build step there is no bundling or minification.

### Confirmation

Each new HTML page should link a `theme.css` first, exactly one page stylesheet, and only the overlay stylesheets it uses. Overlay and theme rules should not appear inside page stylesheets. 

*Theme system is an upcoming feature, but it is important to plan for it now.*