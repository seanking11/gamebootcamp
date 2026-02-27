# Module 3: Top-Down Shooter

**Weeks 5-6 | Entity management, enemy AI, and managing chaos**

> "The screen fills with bullets and enemies, but skilled players see the negative space — the safe paths between projectiles."

---

## Week 1: History & Design Theory

### The Origin

Tomohiro Nishikado's **Space Invaders (Taito, 1978)** established the shoot-em-up. Its genius was accidental: the aliens moved faster as you destroyed them because the hardware could render fewer sprites more quickly. This created escalating difficulty — an emergent design principle that became foundational.

Space Invaders was so popular in Japan it caused a reported shortage of 100-yen coins.

### How the Genre Evolved

**Galaga (Namco, 1981)** added enemy attack patterns — aliens swooped in formations rather than marching uniformly, demanding pattern recognition from the player.

**Robotron: 2084 (Eugene Jarvis / Williams Electronics, 1982)** introduced twin-stick control: one joystick to move, one to shoot. This decoupled movement from aiming and doubled the player's decision space. The control scheme persisted for decades.

**Geometry Wars: Retro Evolved (Bizarre Creations, 2003/2005)** revived the genre for a modern audience, adding particle-heavy visual feedback and score-multiplier systems that rewarded aggressive play.

### What Makes Shmups "Great"

Shmups are about **readable chaos**. The "bullet hell" sub-genre (pioneered by Toaplan and Cave in the 1990s) made this explicit: hundreds of slow-moving, brightly colored bullets form dense geometric patterns the player weaves through.

Enemy wave design is composition — tempo, density, and rhythm arranged to create tension and release. A great shmup has the pacing of a well-arranged piece of music.

### The Essential Mechanic

**Navigation under fire** — the player must simultaneously process threats and find safe movement paths. Shooting is the verb, but *not getting hit* is the game.

---

## Week 2: Build the MVP

### What You're Building

A single-screen arena where you control a ship/character, enemies spawn in waves, and you shoot them down. Survive as long as possible, rack up points.

This module is where entity count explodes. Pong had 3 objects. The platformer had 1 player + static tiles. Here you might have dozens of enemies and hundreds of bullets alive at once.

### Core Concepts (Must Implement)

#### 1. Object Pooling
Pre-allocate a fixed-size array of bullet and enemy objects. Recycle them via an active/inactive flag instead of creating/destroying every frame.

```
pool = [bullet1, bullet2, ..., bulletN]  // all pre-created

acquire():
  find first inactive bullet, set active = true, return it

release(bullet):
  set active = false, reset position
```

**Why it matters:** Allocation and deallocation are expensive operations. Pre-allocating and recycling objects avoids per-frame memory churn and is essential anywhere entities spawn and despawn frequently.

#### 2. Spawn System & Wave Design
A data-driven system that reads a spawn schedule and instantiates enemies:
```
waves = [
  { time: 0,  type: "basic",  count: 5, formation: "line" },
  { time: 10, type: "fast",   count: 3, formation: "v" },
  { time: 20, type: "tank",   count: 2, formation: "random" },
]
```

Separate *what to spawn* (data) from *how to spawn* (logic).

**Why it matters:** Data-driven design — modifying behavior by editing data, not code. This is how professional games achieve content scalability without recompiling or redeploying.

#### 3. 2D Vector Math
You'll need:
- `atan2(dy, dx)` — compute aim angle from player to cursor/stick
- `normalize(vx, vy)` — ensure diagonal movement isn't faster than cardinal
- Angle → velocity: `vx = cos(angle) * speed`, `vy = sin(angle) * speed`

**Why it matters:** 2D vector math is the lingua franca of game programming. Everything here transfers to 3D with an added z-component.

#### 4. Projectile System
Bullets are fire-and-forget entities: spawned with a position, velocity vector, damage value, and owner tag. Each frame they move along their velocity. On collision with a valid target (not their owner), they deal damage and deactivate.

**Why it matters:** Autonomous entities with initial conditions. The owner-tag filtering introduces collision layers/masks.

#### 5. Collision Layers / Masks
Assign entities to categories: `player`, `player-bullet`, `enemy`, `enemy-bullet`, `pickup`. Define which categories interact.

```
player-bullet hits: enemy (yes), player (no), player-bullet (no)
enemy-bullet hits:  player (yes), enemy (no), enemy-bullet (no)
```

**Why it matters:** Without collision filtering, every entity checks against every other entity, and friendly fire becomes unavoidable. Layers let you declaratively define interaction rules. Every engine uses this pattern.

#### 6. Health & Damage
Entities get an `hp` property. `takeDamage(amount)` decrements it. At `hp <= 0`, trigger death (play effect, release back to pool).

**Why it matters:** Stateful entity interactions — one entity modifying another's state through a defined interface. Foundation of every RPG stat system, tower defense, and combat model.

#### 7. Enemy AI: Behavioral Patterns
Implement 2-3 distinct enemy behaviors as interchangeable functions:
- **Linear** — moves in a straight line
- **Sine-wave** — oscillates while advancing
- **Homing** — steers toward the player with limited turn rate

**Why it matters:** The Strategy pattern applied to game AI. Enemy variety comes from *combining simple behaviors*, not writing complex ones. Scales to behavior trees and utility AI.

#### 8. Scoring with Combos
Rapid kills increment a combo counter that multiplies point values. A decay timer resets the multiplier if you stop killing.

**Why it matters:** Time-decaying state and feedback loops. Same pattern behind streak mechanics, idle-game generators, and engagement loops.

### Stretch Goals (If Time Allows)

- **Screen shake & hit-freeze** — On enemy death, displace the camera randomly for ~100ms (shake) and/or pause the simulation for 2-4 frames (hit-freeze). The highest-leverage "game feel" techniques that exist.
- **Power-ups / weapon upgrades** — Dropped items that modify fire rate, spread, or damage. Runtime behavior modification through data changes rather than code branching.
- **Particle effects** — Sparks, smoke, debris on death. Another object pool use case. Visual polish from *systems that generate variation*, not hand-crafted assets.

### MVP Spec

| Feature | Required |
|---------|----------|
| Player that moves and shoots (keyboard + mouse or twin-stick) | Yes |
| Bullets from an object pool | Yes |
| Enemies that spawn in waves | Yes |
| 2-3 different enemy behavior patterns | Yes |
| Collision between player-bullets and enemies | Yes |
| Health/damage system | Yes |
| Score display with combo multiplier | Yes |
| Screen shake / hit-freeze | Stretch |
| Power-ups | Stretch |
| Particle effects | Stretch |

### Deliverable

- A playable top-down shooter
- Write-up: What did you learn? What was harder than expected?

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Object Pooling | Like a connection pool (database, thread, HTTP keep-alive) — pre-allocate resources and recycle instead of create/destroy |
| Spawn System & Wave Design | Like a job scheduler or cron system — a data-driven schedule defines what to run and when |
| 2D Vector Math | Like computing distances and directions between network nodes — normalize, scale, and rotate coordinate pairs |
| Projectile System | Like fire-and-forget messages in a message queue — spawned with initial data, processed independently, consumed on delivery |
| Collision Layers / Masks | Like ACLs or role-based access control — a bitmask declares which categories of entities are allowed to interact |
| Health & Damage | Like a rate limiter or quota system — a numeric resource decremented by incoming requests, with a defined behavior at zero |
| Enemy AI: Behavioral Patterns | Like the Strategy pattern for request handlers — swap interchangeable behavior functions without changing the entity framework |
| Scoring with Combos | Like a time-windowed aggregation (tumbling window) — events within the window compound, and the window resets on timeout |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Object Pooling | Like a virtualized list (react-window) — reuse a fixed set of DOM nodes rather than creating/destroying as items scroll |
| Spawn System & Wave Design | Like a declarative animation timeline (GSAP, Framer Motion) — data defines what appears and when, the system executes it |
| 2D Vector Math | Like CSS `transform: translate()` and `rotate()` — positioning and directing elements using x/y coordinates and angles |
| Projectile System | Like dispatched Redux actions — created with a payload, processed by the system, and consumed when they reach their target |
| Collision Layers / Masks | Like event propagation rules — `stopPropagation` and `pointer-events: none` control which elements can interact with which events |
| Health & Damage | Like a progress bar or form validation counter — a numeric state decremented by interactions, triggering UI changes at thresholds |
| Enemy AI: Behavioral Patterns | Like swappable render strategies or higher-order components — different behavior functions plugged into the same entity interface |
| Scoring with Combos | Like a debounced input handler with an accumulator — rapid events build up a value, and a timeout resets it |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Object Pooling | Like pre-allocating a fixed-size tensor and writing into slices — avoids repeated memory allocation during hot loops |
| Spawn System & Wave Design | Like a data pipeline DAG with scheduled triggers — configuration defines what data (enemies) to produce and when |
| 2D Vector Math | Like basic linear algebra on 2D vectors — normalize, dot product, `atan2` are the same ops you use in feature engineering |
| Projectile System | Like particles in a simulation — each has initial conditions (position, velocity) and evolves independently under simple rules |
| Collision Layers / Masks | Like a boolean interaction matrix — `M[i][j] = 1` means category i can collide with category j, applied as a mask over all pairs |
| Health & Damage | Like decrementing a resource counter in a simulation — when the value crosses zero, trigger a state transition (death/removal) |
| Enemy AI: Behavioral Patterns | Like swappable loss functions or activation functions — plug different functions into the same interface to get different behavior |
| Scoring with Combos | Like exponential moving average with decay — recent events are weighted heavily, but the signal decays without continuous input |

### Discussion Questions

1. How does object pooling change the way you think about entity lifecycle compared to normal object creation/destruction?
2. What makes an enemy "interesting"? Is it their movement pattern, their health, their bullet pattern, or the combination?
3. Why does screen shake make impacts feel more powerful, even though it has zero gameplay effect?
4. How would you design wave pacing to create "tension and release" — moments of intense action followed by breathers?
