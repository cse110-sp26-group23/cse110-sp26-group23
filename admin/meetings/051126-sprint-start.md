# LeetCode James - Team 23 Sprint Start Meeting Notes

## Opening
- **Type of Meeting:** Sprint Start Meeting
- **Date:** May 11th, 2026
- **Time:** 7:30 PM - 8:00 PM
- **Location:** Zoom

---

## Attendance

**Present:** Brendan, Timothy, Jeremy, Crystal, Asaki

**Absent:** Nick, Beckham, Neil, Mohammed, Jonathan, Sharana

---

## Old Business

- We have decided on the project direction and scope
- We came up with 30 user stories

---

## Assignment Review

- Worksheet

---

## Agenda

- Review the plan and [reference](/specs/documents/prototype/gamingPrototypeImage.png)
- Talk about architecture plans

---

## Discussion



---

## Decisions

- Decide intial tasks based on user stories, we need to recreate and make more specific tasks
    - ADRs
        - Create ADR about what our "feature modules" will be [#23](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/23)
        - Create ADR about testing strategy [#26](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/26)
        - Create ADR about saving user progress [#46](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/46)
        - Create ADR about prompt schema [#27](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/27)
        - Create ADR about game difficulty [#28](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/28)
    - [#25](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/25) Architecture flowchart (Brendan)
    - Implementation
        - Landing page (Start Game) that links to game.html [#49](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/49)
        - Game page (Two-pane stucture, code <-> render) that follows the reference image [#49](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/49)
        - Build minimal game loop that manages game state (gameEngine.js) [#49](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/49)
        - Render Pane that can render an input HTML/CSS string (renderPane.js) [#20](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/21)
        - Input Pane with typing and character comparison to the prompt (inputPane.js) [#21](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/21)
        - Connect Input Pane to Render Pane (blocked by the last two) [#49](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/49)
        - Metrics calculations: WPM, Accuracy, Error count, elapsed time. (metrics.js) [#29](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/29)
        - End Screen, displays metrics [#29](https://github.com/cse110-sp26-group23/cse110-sp26-group23/issues/29)

- Crystal and Asaki: Landing Page and Game Page


---

## Action Items & Follow-ups

- Send out tasks for everyone and have them assigned on our GitHub project

---

## Next Meetings

- Weekly Stand-ups (Tuesday and Thursday)
- TA Meeting (Friday)
- Next Friday Meeting