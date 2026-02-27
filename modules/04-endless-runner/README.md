# Module 4: Endless Runner

**Weeks 7-8 | Procedural generation, difficulty curves, and infinite content**

> "The player never wins — they only survive longer. Every run is practice, and death is information."

---

## Week 1: History & Design Theory

### The Origin

Adam Saltsman built **Canabalt** in five days for the 2009 Experimental Gameplay Project. One button. One action: jump. The game scrolled automatically, accelerating until you inevitably died. It distilled game design to a single, repeatable decision under increasing pressure, and demonstrated that a browser game with one mechanic could be genuinely compelling.

Canabalt also established the template for the mobile game explosion that followed.

### How the Genre Evolved

**Temple Run (Imangi Studios, 2011)** mapped the runner to touchscreen swipe gestures and added lane-switching, sliding, and turning — giving the format spatial depth while keeping one-finger accessibility.

**Flappy Bird (Dong Nguyen, 2013)** went the opposite direction: a single tap controlling vertical position through fixed pipe gaps. Extreme simplicity plus harsh difficulty creates compulsive replay loops. Its virality was a case study in how low friction-to-retry drives engagement.

### The Roguelike Connection

The endless runner shares a core insight with roguelikes: **procedural generation creates infinite replayability because memorization cannot substitute for skill.**

**Spelunky (Derek Yu, 2008/2012)** uses procedural level generation to make a platformer infinitely replayable. **Hades (Supergiant Games, 2020)** layers persistent narrative progression over procedural runs, solving the genre's traditional weakness of feeling narratively empty.

### What Makes Endless Games "Great"

The core design insight is **inevitability** — the game continuously escalates until the player fails. The question is never "can you win?" but "how long can you last, and what will you learn for next time?"

This reframes every run as practice and death as information. Combined with procedural generation ensuring no two runs are identical, this creates a powerful loop: die → learn → try again → get further → die → learn.

### The Essential Mechanic

**Inevitability** — the game escalates or randomizes until the player fails. The design question is never *if* you lose, but *when* and *what you learn*.

---

## Week 2: Build the MVP

### What You're Building

An auto-scrolling game where the player avoids procedurally generated obstacles with a single input (jump or lane-switch). The world gets faster over time. High score persists between sessions.

This is the first module where there is no authored content — the game generates its own world at runtime.

### Core Concepts (Must Implement)

#### 1. Procedural Generation with Constraints
Generate obstacle/platform configurations at runtime, subject to constraints that guarantee solvability:

```
generate_segment():
  gap_width = random(MIN_GAP, MAX_GAP)
  gap_height = random(MIN_HEIGHT, MAX_HEIGHT)

  // Validate: can the player actually make this jump?
  if gap_width > max_jump_distance:
    gap_width = max_jump_distance * 0.9  // clamp to solvable

  place_obstacle(gap_width, gap_height)
```

The pipeline: **random seed → candidate → validate → place or retry**.

**Why it matters:** PCG is used in roguelikes, open worlds, loot tables, and any system where hand-authored content can't scale. The constraint-validation loop (generate, check, accept or retry) is a pattern that recurs across many domains of software engineering.

#### 2. World Streaming / Ring Buffer
Maintain a sliding window of active world chunks. As the player advances, chunks that scroll off the trailing edge are recycled to the leading edge with new content.

```
chunks = [chunk0, chunk1, chunk2, chunk3]  // only 4 in memory

on_chunk_exit(old_chunk):
  new_content = generate_segment()
  old_chunk.reset(new_content)
  old_chunk.move_to(leading_edge)
```

**Why it matters:** This is a circular buffer applied to spatial data. It solves the fundamental problem of "infinite content, finite memory" by recycling a fixed number of chunks rather than allocating endlessly.

#### 3. Difficulty Scaling
A function that maps elapsed time or distance to game parameters:

```
speed = min(MAX_SPEED, BASE_SPEED + distance * RAMP_RATE)
obstacle_density = lerp(EASY_DENSITY, HARD_DENSITY, distance / RAMP_DISTANCE)
gap_width = lerp(EASY_GAP, HARD_GAP, distance / RAMP_DISTANCE)
```

**Why it matters:** Dynamic difficulty is a design tool across every genre. The curve-as-parameter pattern introduces *tuning knobs* as first-class design elements -- values you expose and iterate on rather than hardcode.

#### 4. Single-Input Design
Map one action (tap/spacebar) to context-dependent behavior through an input abstraction layer:

```
raw input → action map → game command
spacebar  → "primary"  → jump (if grounded) / double-jump (if airborne)
```

**Why it matters:** Input abstraction is how professional games handle cross-platform controls. The single-input constraint also teaches *design economy* — creating depth from minimal inputs.

#### 5. Persistent High Score
Serialize the player's best score to persistent storage so it survives across sessions:

```
on_death:
  if current_score > load("high_score"):
    save("high_score", current_score)
  display_game_over(current_score, load("high_score"))
```

**Why it matters:** First introduction to persistence in this course. The save/load lifecycle scales to save-game systems, profiles, cloud saves, and leaderboards.

#### 6. Parallax Scrolling
Render multiple background layers that scroll at different speeds to create depth:

```
for each layer in background_layers:
  layer.x_offset = camera.x * layer.depth_factor
  // depth_factor: 0.1 (far clouds), 0.5 (mid buildings), 0.8 (near ground)
```

**Why it matters:** Introduces z-ordering and render layers. The parallax math is the conceptual foundation for perspective projection in 3D.

#### 7. Speed-as-Score
Use cumulative distance as the primary score metric, displayed in real-time as a continuously incrementing counter.

**Why it matters:** Implicit scoring — the score emerges from survival, not discrete events. The pacing variable (speed) is itself the progression metric.

### Stretch Goals (If Time Allows)

- **Seeded randomness** — Use a seeded PRNG so the same seed produces the same obstacle sequence. Enables daily challenges and deterministic testing.
- **Near-miss rewards** — Detect when the player barely avoids an obstacle (expanded "danger zone" AABB) and award bonus points. Secondary collision zones used for scoring without physical effect.
- **Trail / after-image effects** — Render fading copies of the player at recent positions (ring buffer of `{pos, opacity}`). Communicates speed visually.
- **Analytics hooks** — Emit structured events on death (`{distance, obstacle_type, speed}`) for later analysis. Gameplay telemetry applied to tuning.

### MVP Spec

| Feature | Required |
|---------|----------|
| Auto-scrolling world | Yes |
| Single-input control (jump or lane-switch) | Yes |
| Procedurally generated obstacles | Yes |
| Constraint validation (always solvable) | Yes |
| World chunk recycling (ring buffer) | Yes |
| Difficulty that increases over time | Yes |
| Distance-based score, displayed in real-time | Yes |
| Persistent high score (survives refresh/restart) | Yes |
| Parallax background | Yes |
| Seeded randomness | Stretch |
| Near-miss bonus | Stretch |

### Deliverable

- A playable endless runner
- Write-up: What did you learn? What was harder than expected?

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Procedural Generation with Constraints | Constraint-based job scheduling -- generate a candidate, validate against rules, accept or retry |
| World Streaming / Ring Buffer | Log rotation or network packet sliding windows -- fixed buffer, recycle oldest entry |
| Difficulty Scaling | A/B test ramp-ups or adaptive rate limiting -- a parameter curve that changes system behavior over time |
| Single-Input Design | API gateway routing -- one entry point, context-dependent dispatch to different handlers |
| Persistent High Score | Key-value persistence (save/load lifecycle) -- same pattern as session storage or user profile serialization |
| Parallax Scrolling | Layered middleware pipeline -- each layer processes the same request at a different depth/priority |
| Speed-as-Score | Uptime counters or throughput metrics -- the score is an emergent measure of continuous survival, not discrete events |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Procedural Generation with Constraints | Dynamically generating DOM elements from data with validation rules before insertion |
| World Streaming / Ring Buffer | Virtual scrolling / windowed list (react-window) -- only render visible items, recycle DOM nodes as the user scrolls |
| Difficulty Scaling | CSS easing functions or requestAnimationFrame-driven interpolation that changes a property over time |
| Single-Input Design | Event delegation -- one event listener on a parent dispatches to context-dependent handlers |
| Persistent High Score | localStorage or IndexedDB persistence -- read/write a serialized value that survives page refresh |
| Parallax Scrolling | CSS `transform: translateZ()` with `perspective` -- layers at different z-depths scroll at different rates |
| Speed-as-Score | A live-updating reactive counter (like a Zustand/Redux store) whose value is derived from elapsed time |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Procedural Generation with Constraints | Constrained sampling from a probability distribution -- generate, reject if outside bounds, resample |
| World Streaming / Ring Buffer | Streaming data pipeline with a fixed-size sliding window (e.g., a rolling buffer in a time-series ingest) |
| Difficulty Scaling | A learning-rate schedule or hyperparameter annealing curve -- a function that changes a parameter over training steps |
| Single-Input Design | A single-feature model that maps one input to multiple outputs depending on context (decision boundary) |
| Persistent High Score | Checkpointing model state to disk so training can resume after interruption |
| Parallax Scrolling | Multi-resolution feature maps -- the same scene represented at different spatial scales (coarse to fine) |
| Speed-as-Score | A cumulative metric (like cumulative reward in RL) that emerges from continuous operation rather than discrete scoring events |

### Discussion Questions

1. How do you test that procedurally generated content is always solvable? What happens when your constraints have bugs?
2. What makes a good difficulty curve? Should it be linear, logarithmic, step-wise? Why does Flappy Bird feel so different from Temple Run despite both being "endless"?
3. How would you add a meta-progression system (unlockable characters, permanent upgrades) that gives players a reason to come back beyond beating their high score?
4. What's the difference between "random" and "procedural"? How does seeded randomness change the player's relationship with the content?
