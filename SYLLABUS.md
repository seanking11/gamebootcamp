# Game Dev Bootcamp

A game development course built for software developers. 38 modules covering every major game genre. Build MVP versions of classic games, learn the mechanics that make them tick, and understand the history that shaped them.

## Who This Is For

Software developers of any background — backend, frontend, data, mobile — who want to understand game development from the ground up. No prior game dev experience required, just programming fundamentals.

## Philosophy

- **Modules are a database.** Each of the 38 genre modules is a self-contained lesson. You don't do them all — you pick a [learning path](#learning-paths) or build your own.
- **Engine-agnostic first.** Every concept is taught as a universal pattern. You can use Unity, Godot, Phaser, raw Canvas + JS, or anything else. (3D modules recommend an engine.)
- **Build to learn.** Each module produces a playable MVP. The goal is not polish — it's understanding.
- **Historical grounding.** Every genre exists because someone solved a design problem. Understanding the history helps you understand the "why."
- **Bring your background.** Each module includes an "Analogies by Background" section mapping game concepts to patterns you already know — backend, frontend, or data/ML.

## Time Commitment

- **2-4 hours per 2-week module**
- Week 1: Historical context + design theory + mechanics breakdown (~1 hour)
- Week 2: Build the MVP (~2-3 hours hands-on)

## Key Resources

- **[Learning Paths](LEARNING_PATHS.md)** — Curated sequences through the modules. Pick a path that matches your goal.
- **[Genre Encyclopedia](GENRES.md)** — Quick reference for 40+ game genres, what defines them, and their core mechanics.

---

## All Modules

### Setup

| # | Module | Core Lesson |
|---|--------|-------------|
| 0 | [Setup](modules/00-setup/README.md) | Choose your engine, get "hello world" rendering |

### Foundation (Start Here)

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 1 | [Pong](modules/01-pong/README.md) | Game loop, input, collision, state | None |
| 2 | [2D Platformer](modules/02-platformer/README.md) | Gravity, tilemaps, game feel | 1 |
| 3 | [Top-Down Shooter](modules/03-top-down-shooter/README.md) | Entity management, AI, pooling | 1 |
| 4 | [Endless Runner](modules/04-endless-runner/README.md) | Procedural generation, difficulty curves | 1, 2 |

### Puzzle & Logic

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 5 | [Puzzle (Tetris)](modules/05-puzzle/README.md) | Grid as gameplay, cascading systems | 1 |
| 26 | [Sokoban](modules/26-sokoban/README.md) | Push mechanics, undo system, dead-state detection | 5, 7 |
| 27 | [Physics Puzzle](modules/27-physics-puzzle/README.md) | Physics engines, trajectory prediction, destruction | 2 |

### Strategy & Economy

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 6 | [Tower Defense](modules/06-tower-defense/README.md) | A* pathfinding, placement, economy | 1, 3 |
| 22 | [RTS](modules/22-rts/README.md) | Unit selection, fog of war, real-time economy | 6, 3 |
| 23 | [Turn-Based Strategy](modules/23-turn-based-strategy/README.md) | Grid tactics, probability, cover | 7, 6 |
| 24 | [Auto-Battler](modules/24-auto-battler/README.md) | Drafting, synergies, automated combat | 6, 10 |
| 25 | [4X Strategy](modules/25-4x-strategy/README.md) | Hex grids, tech trees, empire management | 22 or 23, 6 |

### Combat & Action

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 8 | [Fighting Game](modules/08-fighting-game/README.md) | Hitboxes, frame data, combos | 1, 3 |
| 15 | [Run and Gun](modules/15-run-and-gun/README.md) | Boss design, multi-directional shooting | 2, 3 |
| 21 | [Action RPG](modules/21-action-rpg/README.md) | Loot tables, stamina, i-frames | 3 or 8, 7 |
| 33 | [Survival Horror](modules/33-survival-horror/README.md) | Scarcity, stalker AI, tension design | 7, 3 |

### RPG & Progression

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 7 | [Roguelike](modules/07-roguelike/README.md) | Procedural dungeons, turn-based, inventory | 2, 4 |
| 10 | [Deckbuilder](modules/10-deckbuilder/README.md) | Card systems, command pattern, turn phases | 1 |
| 20 | [Turn-Based RPG](modules/20-turn-based-rpg/README.md) | Stats, parties, elemental systems | 7, 10 |
| 14 | [Metroidvania](modules/14-metroidvania/README.md) | Interconnected world, ability-gating | 2, 7 |

### Racing

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 9 | [Racing (Arcade)](modules/09-racing/README.md) | Steering physics, checkpoints, AI | 1, 2 |
| 28 | [Simulation Racing](modules/28-simulation-racing/README.md) | Tire grip, suspension, telemetry | 9, 2 |

### Narrative & Story

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 17 | [Point-and-Click](modules/17-point-and-click/README.md) | Inventory puzzles, dialog trees | 1 |
| 18 | [Visual Novel](modules/18-visual-novel/README.md) | Branching narrative, text rendering | 1 |
| 19 | [Walking Simulator](modules/19-walking-simulator/README.md) | Environmental storytelling, trigger zones | 1 |

### 3D

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 11 | [First-Person Game (FPS)](modules/11-first-person-game/README.md) | 3D space, camera, raycasting | 1, 3 |
| 12 | [3D Platformer](modules/12-3d-platformer/README.md) | 3D camera systems, camera-relative movement | 2, 11 |
| 16 | [Third-Person Shooter](modules/16-third-person-shooter/README.md) | Cover, animation blending, ADS | 11, 3 |

### Simulation & Management

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 29 | [Management/Tycoon](modules/29-management-tycoon/README.md) | Simulation loops, satisfaction, finance | 6, 5 |
| 30 | [Farming/Life Sim](modules/30-farming-life-sim/README.md) | Calendar, growth timers, relationships | 7, 5 |
| 31 | [Survival/Crafting](modules/31-survival-crafting/README.md) | Gather-craft-survive, world persistence | 7, 3 |
| 38 | [Sandbox](modules/38-sandbox/README.md) | Voxel worlds, noise generation, player creation | 31 or 5, 7 |

### Casual & Rhythm

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 32 | [Rhythm Game](modules/32-rhythm-game/README.md) | Audio sync, timing windows, BPM scheduling | 1 |
| 34 | [Idle/Incremental](modules/34-idle-incremental/README.md) | Exponential growth, offline progress | 1 |

### Social & Multiplayer

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 35 | [Party Game](modules/35-party-game/README.md) | Mini-game framework, multiplayer input | 1 |
| 36 | [Trivia](modules/36-trivia/README.md) | Question databases, scoring, multi-input | 1 |
| 37 | [Social Deduction](modules/37-social-deduction/README.md) | Hidden roles, voting, information asymmetry | 1, 35 |

### Capstone

| # | Module | Core Lesson | Prerequisites |
|---|--------|-------------|---------------|
| 13 | [Capstone](modules/13-capstone/README.md) | Build your own game | Any path |

---

## Learning Paths

Don't do all 38 modules. Pick a **[Learning Path](LEARNING_PATHS.md)** — a curated sequence of 5-11 modules that tells a coherent story:

| Path | Focus | Modules | Time |
|------|-------|---------|------|
| [Foundation](LEARNING_PATHS.md#path-1-foundation-start-here) | Core game dev skills | 5 | 10 weeks |
| [Full 2D Journey](LEARNING_PATHS.md#path-2-the-full-2d-journey) | Comprehensive 2D | 11 | 22 weeks |
| [Into 3D](LEARNING_PATHS.md#path-3-into-the-third-dimension) | 2D fundamentals → 3D | 7-8 | 14-16 weeks |
| [Combat Deep Dive](LEARNING_PATHS.md#path-4-combat-deep-dive) | Fighting, shooting, action | 7 | 14 weeks |
| [Strategy & Systems](LEARNING_PATHS.md#path-5-strategy--systems) | Tactics, economy, planning | 6-7 | 12-14 weeks |
| [Narrative & Story](LEARNING_PATHS.md#path-6-narrative--story) | Interactive fiction, dialog | 6 | 12 weeks |
| [Puzzle & Logic](LEARNING_PATHS.md#path-7-puzzle--logic) | Spatial reasoning, physics | 6 | 12 weeks |
| [Roguelike & Procedural](LEARNING_PATHS.md#path-8-roguelike--procedural) | Generation, randomness | 7 | 14 weeks |
| [Simulation & Management](LEARNING_PATHS.md#path-9-simulation--management) | Economies, ecosystems | 6-7 | 12-14 weeks |
| [Casual & Mobile](LEARNING_PATHS.md#path-10-casual--mobile) | Accessible, replayable | 6 | 12 weeks |
| [Party & Social](LEARNING_PATHS.md#path-11-party--social) | Multiplayer, social games | 5 | 10 weeks |
| [RPG Spectrum](LEARNING_PATHS.md#path-12-rpg-spectrum) | Stats, loot, progression | 7 | 14 weeks |

Or [build your own path](LEARNING_PATHS.md#build-your-own-path).

---

## About the Analogies

Each module includes an **Analogies by Background** section mapping game dev concepts to patterns you already know:

- **Backend Developers** — event loops, connection pools, pub/sub, middleware, state machines, schedulers, caching
- **Frontend Developers** — requestAnimationFrame, DOM diffing, component lifecycle, CSS transforms, state management
- **Data / ML Engineers** — matrices, linear algebra, probability distributions, optimization, simulation

These sections are at the end of each module so they don't interrupt the flow.

---

## Deliverables Per Module

1. **A playable MVP** that demonstrates the core mechanic of the genre
2. **A short write-up** (3-5 sentences): What did you learn? What was harder than expected?

---

## Getting Started

1. Head to [Module 0: Setup](modules/00-setup/README.md) to pick your engine
2. Choose a [Learning Path](LEARNING_PATHS.md) or start with the [Foundation](#foundation-start-here)
3. Build, learn, repeat
