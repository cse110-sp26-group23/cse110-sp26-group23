# No Hard-Coded Values in CSS

## Status

Accepted

## Context and Problem Statement

CSS across the project contained literal values (colors, spacing, font sizes, breakpoints) duplicated inline throughout stylesheets. This made theme changes error-prone, introduced inconsistencies between components, and made it hard to enforce a coherent design system. How should we manage design values so that the styling stays consistent and maintainable?

## Decision Drivers

* Consistency of visual design across components
* Ease of making global changes (e.g., adjusting a brand color or spacing scale)
* Reduced risk of drift and duplicated magic numbers
* Support for theming (e.g., light/dark modes)

## Considered Options

* Custom properties (CSS variables) for all design values
* Preprocessor variables (Sass/Less)
* Continue using literal values inline

## Decision Outcome

Chosen option: **Custom properties (CSS variables) for all design values**, because they provide a single source of truth, are runtime-adjustable (enabling theming without a rebuild), and require no additional tooling. All colors, spacing, typography, and breakpoint-related tokens must be defined as variables and referenced—no literal values inline.

### Consequences

* Good, because global design changes happen in one place and propagate everywhere.
* Good, because theming (e.g., dark mode) becomes trivial via variable overrides.
* Good, because it enforces a consistent design vocabulary across the team.
* Bad, because contributors must learn the token set rather than typing values directly.
* Bad, because indirection can make a single rule slightly harder to read in isolation.

### Confirmation

Compliance is verified through code review and a linter rule (e.g., stylelint) that flags literal color/length values outside the central variable definitions.