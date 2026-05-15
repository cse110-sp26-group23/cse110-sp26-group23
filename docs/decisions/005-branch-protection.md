# Branch Protection

## Status

Accepted

## Context and Problem Statement

Development needs to be done in a way that invites organization in a team setting. One primary driver of that is the way that code gets written and merged into the final product.

## Decision Drivers

* This project is short lived, yet we are still trying to mimic a real SWE environment where possible
* We've been lectured to the various technologies and a couple of loose approaches to this problem
* I (Timothy) have personally worked with a team through a very similar scenario and have prior experience with things that do/don't work well to use as a starting point here.

## Considered Options

These are options less so in the sense of being mutually exclusive and more so being things that were looked at holistically.

* should there be a dev branch?
* what about qa/staging/etc branches?
* should we require peer review vs single product owner
* codeowners file?

## Decision Outcome

We will be creating a main and dev branch with all code being merged into the dev branch and regular end of sprint releases being merged from dev into main. We believe this to be a middle ground between having enough levels of abstraction to deploy from later, while also being reasonable that this project is merely a few weeks long and having additional qa + staging + more branches doesn't make much sense. This decision will also allow us to later deploy main and dev environments for testing.

In order to make the process of getting code approved reasonably quick, we will require peer review from any member of the team (opposed to a dedicated member(s)) and compliment that with a codeowners file in the future if review from specific members would make sense for a particular part of the project.

### Consequences

* Good: [positive outcome]
* Bad: [negative outcome or trade-off accepted]