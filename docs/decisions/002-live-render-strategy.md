# Live Render Strategy

## Status

Proposed

## Context and Problem Statement

The core mechanic of the game is that typed HTML and CSS appears as a rendered webpage in an adjacent pane, updating as the user types. We need to decide how to inject the user's typed content into the render pane safely, without leaking styles or scripts into the parent page.

## Decision Drivers

* Security: user-typed content must not be able to affect the parent page's DOM or styles
* Live feedback: the render pane should update on every keystroke with minimal latency
* Vanilla JS constraint: solution must work without external libraries
* Simplicity: the implementation should be understandable by all team members

## Considered Options

* `innerHTML` injection into a div
* `iframe` with `srcdoc` attribute
* `iframe` with a Blob URL (`URL.createObjectURL`)

## Decision Outcome

Chosen option: **`iframe` with `srcdoc` attribute**

### Consequences

* It will allow full DOM and style isolation
* Updating `srcdoc` is simple
* It may cause some character limits on older browsers
* Old versions of Edge and Internet Explorer do not support srcdoc

## Pros and Cons of the Options

### `innerHTML` injection into a div

* Good, because simplest implementation
* Bad, because typed CSS leaks to the parent page (styles defined by the user affect the whole document)
* Bad, because typed `<script>` tags in user input can execute in the parent page context (XSS risk)

### `iframe` with `srcdoc` attribute

* Good, because full DOM and style isolation
* Good, because updating `srcdoc` is straightforward: `iframe.srcdoc = userContent`
* Good, because no URL lifecycle to manage
* Bad, because `srcdoc` has a character limit in some older browsers (not a concern for modern targets)

### `iframe` with a Blob URL

* Good, because full isolation like `srcdoc`
* Good, because supports larger documents without the `srcdoc` length concern
* Bad, because requires managing the Blob URL lifecycle (`URL.createObjectURL` / `URL.revokeObjectURL`) on every keystroke
* Bad, because more complex implementation with potential memory leak if revocation is missed
