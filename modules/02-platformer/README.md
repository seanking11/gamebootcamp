# Module 2: 2D Platformer

**Weeks 3-4 | Physics, spatial design, and "game feel"**

> "A platformer lives or dies on whether the jump feels right."

---

## Week 1: History & Design Theory

### The Origin

Shigeru Miyamoto's **Donkey Kong (Nintendo, 1981)** created the platformer by asking a question no arcade game had asked before: what if the player moved *through* a space instead of defending one? Jumpman (later Mario) ran across girders, climbed ladders, and leaped over barrels. The jump — voluntary, committal, governed by a gravity arc — became the foundational verb of an entire genre.

### How the Genre Evolved

**Super Mario Bros. (Nintendo, 1985)** defined side-scrolling level design. Miyamoto and Takashi Tezuka built World 1-1 as a wordless tutorial: the first Goomba teaches you about enemies, the first block teaches you to hit things, the first mushroom teaches you about power-ups. It introduced the concept of a level as a designed *experience* with pacing and rhythm.

**Celeste (Matt Thorson / Extremely OK Games, 2018)** represents the modern evolution: extremely precise movement with generous player-assistance systems. These invisible affordances make a hard game feel fair rather than cheap:
- **Coyote time** — a ~6-frame grace period that lets you jump after walking off a ledge
- **Input buffering** — registering a jump press slightly before you land
- **Variable jump height** — the longer you hold the button, the higher you go

### What Makes Platformers "Great"

**"Game feel"** — the term coined by Steve Swink. The player's avatar is an instrument, and the levels are the sheet music. Great platformers have carefully tuned acceleration curves, responsive controls, and animation that communicates momentum. None of this is visible to the player, but all of it is *felt*.

### The Essential Mechanic

**The jump.** A single committal action with a gravity arc that the player must time and aim. Everything else in the genre is built around making that one verb endlessly interesting.

---

## Week 2: Build the MVP

### What You're Building

A single-screen (or short-scrolling) level with platforms the player can jump between. That's the core. If the jump feels good, you've succeeded.

### Core Concepts (Must Implement)

#### 1. Gravity & Acceleration-Based Movement
Apply a constant downward acceleration to the player's y-velocity each frame:
```
vy += gravity * dt
y += vy * dt
```
This produces a parabolic jump arc — fundamentally different from Pong's linear ball motion.

**Why it matters:** This is Euler integration. The pattern (accumulate forces → update velocity → update position) is the foundation of every physics system from Phaser's Arcade to Box2D to Havok.

#### 2. Grounded-State Detection
Track whether the player is standing on a surface. Only allow jump input when `isGrounded === true`.

**Why it matters:** Input processing must be context-dependent. This pattern recurs in dashing, wall-jumping, attacking — any ability with preconditions.

#### 3. Tilemap / Level Data
Represent the level as a 2D array of integers:
```
0 = air
1 = solid ground
2 = hazard (stretch)
```
Render and collide against it by mapping world coordinates to grid indices.

**Why it matters:** Tilemaps are the most common spatial data structure in 2D games (roguelikes, RTSs, puzzle games). They make collision lookups fast by converting world positions directly to grid indices.

#### 4. Tile-Based Collision Resolution
Resolve collisions between the player (a moving AABB) and static tile geometry:
1. Check tiles adjacent to the player
2. Compute penetration depth on each axis
3. Push the player out along the shallowest axis first

Resolving one axis before the other prevents corner-catching and tunneling bugs.

**Why it matters:** Axis-separated resolution is the standard approach in 2D engines. Understanding the *why* prevents a class of bugs that plagues beginners.

#### 5. Player State Machine
An explicit FSM: `Idle`, `Running`, `Jumping`, `Falling`. Each state governs:
- Which inputs are accepted
- How physics parameters behave
- Which animation plays

**Why it matters:** The State pattern applied to games. Scales to enemy AI, menu flow, network state, and any behavior with distinct modes.

#### 6. Camera / Viewport Scrolling
If your level is larger than one screen, translate all rendered positions by a camera offset so the player stays centered (or within a deadzone).

**Why it matters:** Introduces the distinction between *world space* and *screen space* — fundamental to every game with a movable viewport.

#### 7. Sprite Animation
Cycle through sprite frames based on the player's state. Idle loops, run cycles, jump/fall frames.

**Why it matters:** Visual output reflects logical state. The renderer displays what the state machine dictates — it never drives it.

### Stretch Goals (If Time Allows)

- **Coyote time & input buffering** — Small timing windows that make controls feel generous. This is where "good" becomes "great."
- **Collectibles** — Items that disappear on contact and increment a counter. Introduces trigger colliders (overlap without physical push-back).
- **Hazards & death/respawn** — Tiles that reset the player to a checkpoint. Introduces the death lifecycle: `Alive → Dying → Respawning → Alive`.
- **Variable jump height** — Cutting vertical velocity when the button is released mid-jump. Makes the jump feel responsive rather than committed.

### MVP Spec

| Feature | Required |
|---------|----------|
| Player character with gravity | Yes |
| Jump with parabolic arc | Yes |
| Tile-based level (at least one screen) | Yes |
| Solid platform collision (no falling through) | Yes |
| Player state machine (idle, run, jump, fall) | Yes |
| Camera follow (if level scrolls) | Yes |
| Coyote time / input buffering | Stretch |
| Collectibles | Stretch |
| Hazards / death | Stretch |

### Deliverable

- A playable platformer level
- Write-up: What did you learn? What was harder than expected?

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Gravity & Acceleration | Like an accumulator pattern — forces accumulate into velocity, velocity into position, evaluated each tick of a scheduler |
| Grounded-State Detection | Like a precondition guard on an API endpoint — certain actions are only valid when the system is in a specific state |
| Tilemap / Level Data | Like a spatial index or hash map with O(1) lookup — convert world coordinates to grid indices for instant collision queries |
| Tile-Based Collision Resolution | Like conflict resolution in concurrent writes — detect overlap, determine the smallest correction, apply it in priority order |
| Player State Machine | Like a connection or session state machine (IDLE → ACTIVE → CLOSING) — each state governs valid transitions and behavior |
| Camera / Viewport Scrolling | Like pagination or a sliding window over a large dataset — you only render the visible subset, offset by the current position |
| Sprite Animation | Like a view layer driven by state — the renderer reads the current state and selects the appropriate representation, never the reverse |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Gravity & Acceleration | Like a CSS `transition` with `ease-in` — acceleration gives the jump a natural curve rather than linear movement |
| Grounded-State Detection | Like disabling a button until a form is valid — the jump action is gated by a boolean precondition |
| Tilemap / Level Data | Like a CSS Grid layout where each cell is a component — the 2D array defines what occupies each grid position |
| Tile-Based Collision Resolution | Like resolving overlapping absolutely-positioned elements — detect the overlap, compute how much to push back, resolve one axis at a time |
| Player State Machine | Like a React `useReducer` or component lifecycle — state determines which inputs are accepted and what renders |
| Camera / Viewport Scrolling | Like `overflow: scroll` on a container — the viewport clips the visible area and translates based on scroll position |
| Sprite Animation | Like swapping CSS classes based on state — `idle`, `running`, `jumping` each trigger a different animation keyframe set |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Gravity & Acceleration | Like Euler integration of an ODE — `v += a*dt`, `x += v*dt` is the simplest numerical integration scheme |
| Grounded-State Detection | Like a conditional mask — `is_grounded` is a boolean gate that filters which operations can execute, like `np.where()` |
| Tilemap / Level Data | Like a 2D numpy array or sparse matrix — each cell holds a tile type, and coordinate-to-index conversion is simple integer division |
| Tile-Based Collision Resolution | Like resolving constraint violations in optimization — find the minimum penetration vector and project along it to satisfy the constraint |
| Player State Machine | Like a Markov chain with deterministic transitions — current state plus input determines the next state |
| Camera / Viewport Scrolling | Like slicing a window from a large tensor — `world[cam_y:cam_y+h, cam_x:cam_x+w]` extracts the visible region |
| Sprite Animation | Like selecting a visualization based on a categorical variable — the state label indexes into a lookup table of frame sequences |

### Discussion Questions

1. What's the difference between "realistic" gravity and gravity that "feels right"? Try doubling your gravity constant while also doubling jump force — how does it change the feel?
2. Why resolve collision on one axis before the other? What happens if you resolve both simultaneously?
3. How does Super Mario Bros. World 1-1 teach the player without any text? What design principles are at work?

### Recommended Reference

If you want to go deeper on game feel and platformer mechanics, Matt Thorson (Celeste developer) and Maddy Thorson shared detailed breakdowns of Celeste's movement system. The key insight: **good game feel is built from dozens of tiny, invisible lies** — coyote time, input buffering, corner correction, variable jump height — that make the game feel more responsive than the raw physics would allow.
