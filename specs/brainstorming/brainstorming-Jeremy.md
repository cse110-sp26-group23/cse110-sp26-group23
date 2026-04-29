# [Jeremy Shih] - Brainstorming Document

## Concept
A turn-based typing game around LeBron James' NBA career, players start as a draft prospect and must pass combine-style typing tests(examines: sprint, standing long jump, vertical jump, Shuttle Run, etc.) to get drafted, then play through era-based "seasons"

## Target Audience
Player who enjoys typing games, interested in NBA. 

## Core Loop
Complete typing challenges (sprint, standing long jump, vertical jump, Shuttle Run, etc.) → earn a Draft Grade (e.g. #1 Pick vs Late Round) → unlock your first "season" → play through game-like typing rounds representing real career eras.
## The 3 Key Features
- Draft rank system: Combine results set your starting rank (#1–30 pick). Rank affects starting difficulty and cosmetic jersey number in your profile.
- Season boost card: After each era, player gets a card pack provide different perks when playing(allow more mistyping/spelling, increase the probability of simple words appearing, etc. )
- Season stat card: After each era, player gets a basketball-style stat card: WPM, accuracy %, longest streak, misspellings — shareable as an image.

## Unique Selling Point
No other typing game uses a sports career as a progression narrative. The LeBron arc is universally recognized and gives every difficulty spike a story reason, the stages are title for each turning point/ important games for LeBron James.

## Inspiration / References
- Keys of Fury:https://keysoffury.com/
- Ztype:https://zty.pe/
- Typing Hoops - Game:https://www.typinggames.zone/typing-hoops
- Lebron James

## Scope
**MVP:** What's the absolute minimum version that's playable/usable?
- Combine Screen:
  - WPM speed test — player types a short phrase, time recorded, WPM calculated
  - Accuracy drill — 5 phrases, errors tracked, accuracy % calculated
  - Draft rank output (1–30) — WPM + accuracy combined into a score, mapped to a pick number, shown on a Draft Night results screen
- One era (Cleveland I): 
  - Shooting mechanic — a phrase appears, player types it correctly to score points
  - Blocking mechanic — a phrase with a deliberate typo or wrong word appears, player identifies and corrects it, miss = lose a life
  - game over screen
- Season stat card:
  - Shown at era end after surviving all rounds
  - Displays WPM, accuracy %, shots made, blocks made, overall grade (S/A/B/C)
  - Static layout, no share functionality yet
- Season boost card:
  - Shown on Draft Night results screen after rank is revealed
  - Player receives one random card based on draft rank (higher pick = better card)
  - Boost stays active for the entire Cleveland I era
- Web Basics
  - Runs fully in the browser
  - Service worker for offline play after first load


## Open Questions
Things that need to be figured out before or during development.
- Does the LeBron framing need any IP/licensing consideration — are we using names and likenesses or just career references?
- What exactly are the "combine tests" — WPM sprint, accuracy fill-in, reaction time? Need to define all three before design sprint.
