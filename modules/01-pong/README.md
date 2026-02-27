# Module 1: Pong

**Weeks 1-2 | The foundation of everything**

> "Pong is to game development what 'Hello World' is to programming — except it teaches you physics, input, collision, and state management all at once."

---

## Week 1: History & Design Theory

### The Origin

Allan Alcorn built Pong at Atari in 1972 as a training exercise assigned by Nolan Bushnell. It was not the first video game — that lineage traces to Ralph Baer's 1967 "Brown Box" prototype and the Magnavox Odyssey (1972) — but it was the first commercially successful arcade game. The prototype installed at Andy Capp's Tavern in Sunnyvale, California broke within days because the coin box overflowed.

Pong proved that video games were a viable business.

### How the Genre Evolved

**Breakout (1976)** — Designed by Steve Wozniak for Atari (with Steve Jobs as the middleman), Breakout transformed the two-player volley into a single-player destruction loop: hit ball, break bricks, clear the screen. This introduced the concept of a level-completion objective.

**Arkanoid (Taito, 1986)** — Added power-ups, enemy elements, and level variety. Proved that even the simplest game formula could support layers of complexity without losing its core readability.

### What Makes Ball-and-Paddle Games "Great"

These games are the purest expression of a game loop: **input causes action, action produces feedback, feedback demands new input**. The player always understands the system state — ball position, paddle position, trajectory. There is zero hidden information.

This transparency is why Pong is the best teaching tool for game development. It forces you to implement physics, input handling, collision detection, score state, and win/loss conditions — the complete skeleton of any game.

### The Essential Mechanic

**Deflection** — the player redirects a moving object. Every decision is about positioning and timing relative to a projectile you do not directly control.

---

## Week 2: Build the MVP

### What You're Building

A two-paddle, one-ball game. First to N points wins. That's it.

### Core Concepts (Must Implement)

#### 1. The Game Loop
A fixed-cadence loop that calls `processInput()`, `update(dt)`, and `render()` every frame. The `dt` (delta time) parameter ensures frame-rate independence.

**Why it matters:** Every real-time game runs on this loop. It is the heartbeat of any real-time application — process input, update state, render output, repeat.

**Implementation notes:**
- In an engine: this is your `Update()` / `_process()` method. The engine runs the loop for you.
- Without an engine: use `requestAnimationFrame` (web), `pygame.time.Clock` (Python), etc.

#### 2. Entity State as Data
Model paddles and ball as simple data structures:
```
paddle = { x, y, width, height, speed }
ball = { x, y, vx, vy, radius }
```

**Why it matters:** This is the seed of every entity/component system. Game objects are *data* that systems operate on. Separating data from behavior is the core principle behind data-oriented design in games.

#### 3. Input Handling
Read keyboard state each frame. Translate raw input into game actions (move paddle up/down).

**Why it matters:** Polling vs. event-driven input is a recurring design decision. Understanding when to check state continuously versus reacting to discrete events is a transferable skill.

#### 4. AABB Collision Detection
Test whether two rectangles overlap by comparing edges on each axis. The simplest and fastest collision check.

```
collides(a, b):
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y
```

**Why it matters:** AABB is the workhorse of 2D collision and is used as a broad-phase filter even in 3D engines.

#### 5. Collision Response
When the ball hits a paddle, reflect its velocity. Optionally adjust the angle based on where on the paddle it hits (top = up angle, bottom = down angle). This single mechanic is what makes Pong *a game* rather than a screensaver.

**Why it matters:** Separating detection from response is a fundamental pattern. Response can encode *gameplay feel*, not just physics.

#### 6. Game State Machine
Track the game's mode: `Start`, `Playing`, `Scored`, `GameOver`. Each state has different update logic and rendering.

**Why it matters:** This FSM pattern scales to menu systems, level transitions, multiplayer lobbies — any behavior with distinct modes.

#### 7. Rendering
Clear the screen each frame. Draw paddles as rectangles, ball as a circle/square, score as text.

**Why it matters:** Rendering is per-frame reconstruction, not retained state. Every frame is drawn from scratch based on current data — nothing persists visually between frames unless you redraw it.

### Stretch Goals (If Time Allows)

- **Simple AI opponent** — a paddle that tracks the ball's y-position with capped speed. Introduces AI as "just another input source."
- **Sound effects** — play a clip on bounce/score. Introduces event-driven audio (observer pattern).
- **Ball speed increase** — ball gets slightly faster after each paddle hit. Your first difficulty curve.

### MVP Spec

| Feature | Required |
|---------|----------|
| Two paddles that move with keyboard input | Yes |
| Ball that bounces off walls and paddles | Yes |
| Ball angle changes based on paddle hit position | Yes |
| Score tracking, displayed on screen | Yes |
| Game over at N points | Yes |
| AI opponent | Stretch |
| Sound effects | Stretch |

### Deliverable

- A playable Pong game
- Write-up: What did you learn? What was harder than expected?

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Game Loop | Like an event loop (Node.js) or reactor pattern — process input, do work, yield, repeat |
| Entity State as Data | Game objects as plain data structs are like DTOs or database rows — data that systems operate on |
| Input Handling | Polling input each frame is like polling a queue; event-driven input is like webhooks or pub/sub |
| AABB Collision | Like a bounding-box range query on a spatial index — fast, coarse overlap check |
| Collision Response | Like middleware that intercepts a match and decides the side effect (reject, transform, redirect) |
| Game State Machine | Like a connection state machine (CONNECTING → OPEN → CLOSING → CLOSED) with transition guards |
| Rendering | Like a stateless server response — every frame is built from scratch, nothing is retained between calls |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Game Loop | Like `requestAnimationFrame` — called every frame, you update state and re-render |
| Entity State as Data | Like component props/state — plain objects that the render function reads to produce output |
| Input Handling | Like adding `keydown`/`keyup` event listeners vs. reading `input.value` on an interval |
| AABB Collision | Like `getBoundingClientRect()` overlap checks for drag-and-drop hit testing |
| Collision Response | Like an event handler that decides what happens on collision — update state, trigger animation, play sound |
| Game State Machine | Like React component lifecycle or a router with guards — each "page" has its own update and render logic |
| Rendering | Unlike the DOM (retained mode), game rendering is immediate mode — you clear and redraw every frame, like re-running `render()` with no virtual DOM diffing |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Game Loop | Like a training loop — each iteration reads a batch (input), computes a forward pass (update), and logs metrics (render) |
| Entity State as Data | Like a row in a DataFrame or a feature vector — structured numeric data that functions transform |
| Input Handling | Like reading a sensor stream — poll for the latest sample each tick vs. react to change events |
| AABB Collision | Like bounding-box IoU (Intersection over Union) checks in object detection — fast rectangular overlap |
| Collision Response | Like applying a transformation when two regions overlap — the detection is the predicate, the response is the action |
| Game State Machine | Like a pipeline with stages (preprocessing → training → evaluation) — each stage has different logic and valid transitions |
| Rendering | Like regenerating a plot from data each frame — matplotlib `clf()` + redraw, not mutating existing chart elements |

### Discussion Questions

1. What happens if you don't multiply velocity by delta time? Try it on different frame rates.
2. Why does the ball angle on paddle hit matter so much for gameplay? What would the game feel like without it?
3. How would you add a "serve" mechanic (ball starts from the scoring player's side)?
