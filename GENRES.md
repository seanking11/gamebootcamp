# Game Genre Encyclopedia

A reference guide to game genres — what defines them, what makes them tick, and what you'd learn by building one. This covers far more genres than the bootcamp modules. Use it to understand the landscape and find inspiration for your capstone project.

---

## How to Read This Guide

Each genre entry includes:
- **Defining Trait** — the single characteristic that puts a game in this genre
- **Core Mechanic** — the fundamental player action
- **Landmark Games** — 2-3 games that defined or perfected the genre
- **Key Design Concepts** — what building this genre teaches you
- **Has Module?** — whether this bootcamp has a dedicated module for it

---

## Action Genres

### Platformer
| | |
|---|---|
| **Defining Trait** | Player navigates by jumping between platforms in a gravity-bound space |
| **Core Mechanic** | The jump — a committal, arc-shaped movement action |
| **Landmark Games** | Super Mario Bros. (1985), Celeste (2018), Hollow Knight (2017) |
| **Key Design Concepts** | Gravity simulation, character controllers, game feel (coyote time, input buffering), level design as pacing |
| **Has Module?** | Yes — Module 2 |

### Metroidvania
| | |
|---|---|
| **Defining Trait** | Interconnected world where progress is gated by abilities acquired during exploration |
| **Core Mechanic** | Ability-gated exploration — you see areas you can't reach yet, then return with new powers |
| **Landmark Games** | Super Metroid (1994), Castlevania: Symphony of the Night (1997), Hollow Knight (2017) |
| **Key Design Concepts** | World map as a graph data structure, ability gating and backtracking, save/checkpoint systems, non-linear progression |
| **Has Module?** | Yes — Module 14 |

### Beat 'em Up / Hack and Slash
| | |
|---|---|
| **Defining Trait** | Player fights through waves of melee enemies, usually scrolling left to right |
| **Core Mechanic** | Close-range combat with combos against multiple enemies |
| **Landmark Games** | Streets of Rage 2 (1992), Devil May Cry (2001), Hades (2020) |
| **Key Design Concepts** | Combo systems, crowd management, hitbox/hurtbox, animation priority, enemy stagger/hitstun |
| **Has Module?** | Partially — Module 8 (Fighting Game) covers the core combat mechanics |

### Run and Gun
| | |
|---|---|
| **Defining Trait** | Side-scrolling action focused on shooting while moving through linear levels |
| **Core Mechanic** | Simultaneous movement and shooting with directional aiming |
| **Landmark Games** | Contra (1987), Metal Slug (1996), Cuphead (2017) |
| **Key Design Concepts** | Projectile systems, multi-directional aiming, level design with enemy placement, pattern-based boss design |
| **Has Module?** | Yes — Module 15 |

---

## Shooter Genres

### Top-Down Shooter / Twin-Stick
| | |
|---|---|
| **Defining Trait** | Overhead view, player shoots in any direction while navigating threats |
| **Core Mechanic** | Decoupled movement and aiming — navigate space while directing fire |
| **Landmark Games** | Robotron 2084 (1982), Geometry Wars (2005), Enter the Gungeon (2016) |
| **Key Design Concepts** | Object pooling, vector math (aiming), entity management at scale, spawn systems |
| **Has Module?** | Yes — Module 3 |

### Shoot 'em Up (Shmup) / Bullet Hell
| | |
|---|---|
| **Defining Trait** | Screen fills with enemy projectiles; player weaves through patterns |
| **Core Mechanic** | Navigation through bullet patterns — reading negative space |
| **Landmark Games** | Space Invaders (1978), DoDonPachi (1997), Ikaruga (2001) |
| **Key Design Concepts** | Bullet pattern design (geometric formations), hitbox precision (tiny player hitbox), scoring depth (graze systems, chains) |
| **Has Module?** | Partially — Module 3 covers the fundamentals |

### First-Person Shooter (FPS)
| | |
|---|---|
| **Defining Trait** | Player sees through the character's eyes, shoots with crosshair |
| **Core Mechanic** | Aim and shoot in 3D space from first-person perspective |
| **Landmark Games** | Doom (1993), Half-Life (1998), Call of Duty 4 (2007) |
| **Key Design Concepts** | 3D rendering pipeline, raycasting, 3D collision, weapon systems, level geometry, netcode (for multiplayer) |
| **Has Module?** | Yes — Module 11 |

### Third-Person Shooter (TPS)
| | |
|---|---|
| **Defining Trait** | Camera behind/over the player character, cover-based or action shooting |
| **Core Mechanic** | Shooting with spatial awareness of your character's body in the world |
| **Landmark Games** | Resident Evil 4 (2005), Gears of War (2006), Splatoon (2015) |
| **Key Design Concepts** | 3D camera systems (orbit cam), cover systems, over-the-shoulder aiming, animation blending |
| **Has Module?** | Yes — Modules 12, 16 |

---

## Adventure Genres

### Point-and-Click Adventure
| | |
|---|---|
| **Defining Trait** | Solve puzzles by examining and combining objects in a narrative world |
| **Core Mechanic** | Inventory puzzle solving — use item A on object B to progress |
| **Landmark Games** | The Secret of Monkey Island (1990), Myst (1993), Disco Elysium (2019) |
| **Key Design Concepts** | Inventory systems, dialog trees, puzzle dependency graphs, narrative scripting, hotspot interaction |
| **Has Module?** | Yes — Module 17 |

### Visual Novel
| | |
|---|---|
| **Defining Trait** | Narrative-driven with branching choices, minimal traditional gameplay |
| **Core Mechanic** | Choosing dialog options that branch the story |
| **Landmark Games** | Phoenix Wright: Ace Attorney (2001), Doki Doki Literature Club (2017), 13 Sentinels (2019) |
| **Key Design Concepts** | Branching narrative as a directed graph, dialog systems, text rendering/typewriter effects, save states for branching, flag-based story tracking |
| **Has Module?** | Yes — Module 18 |

### Walking Simulator / Exploration
| | |
|---|---|
| **Defining Trait** | Exploration-focused with environmental storytelling, minimal mechanics |
| **Core Mechanic** | Moving through a space and discovering narrative through the environment |
| **Landmark Games** | Gone Home (2013), Firewatch (2016), What Remains of Edith Finch (2017) |
| **Key Design Concepts** | Environmental storytelling, trigger zones for narrative beats, atmospheric audio design, pacing through level design |
| **Has Module?** | Yes — Module 19 |

---

## RPG Genres

### Turn-Based RPG (JRPG)
| | |
|---|---|
| **Defining Trait** | Combat is turn-based with menus; progression through stats and leveling |
| **Core Mechanic** | Selecting actions from menus in a turn-based combat system |
| **Landmark Games** | Final Fantasy VI (1994), Chrono Trigger (1995), Persona 5 (2016) |
| **Key Design Concepts** | Turn order/initiative systems, stat-based damage formulas, experience/leveling curves, party management, elemental weakness tables |
| **Has Module?** | Yes — Module 20 |

### Action RPG
| | |
|---|---|
| **Defining Trait** | Real-time combat with RPG progression (stats, leveling, loot) |
| **Core Mechanic** | Real-time combat where stats and gear affect outcomes |
| **Landmark Games** | Diablo (1997), Dark Souls (2011), Elden Ring (2022) |
| **Key Design Concepts** | Loot/drop tables (weighted random), stat systems, real-time combat with RPG modifiers, area design |
| **Has Module?** | Yes — Module 21 |

### Roguelike / Roguelite
| | |
|---|---|
| **Defining Trait** | Procedurally generated levels, permadeath, high replayability |
| **Core Mechanic** | Navigating procedural spaces where death resets progress (fully or partially) |
| **Landmark Games** | Rogue (1980), Spelunky (2012), Hades (2020) |
| **Key Design Concepts** | Procedural dungeon generation (BSP, room+corridor), permadeath design, meta-progression, item/ability synergies |
| **Has Module?** | Yes — Module 7 |

---

## Strategy Genres

### Real-Time Strategy (RTS)
| | |
|---|---|
| **Defining Trait** | Command units and manage resources in real-time against opponents |
| **Core Mechanic** | Multi-unit selection, movement commands, and resource allocation simultaneously |
| **Landmark Games** | StarCraft (1998), Age of Empires II (1999), Company of Heroes (2006) |
| **Key Design Concepts** | Unit selection/command systems, pathfinding (A* at scale), resource economy, fog of war, minimap, build queues, tech trees |
| **Has Module?** | Yes — Module 22 |

### Turn-Based Strategy (TBS)
| | |
|---|---|
| **Defining Trait** | Players take turns moving units on a grid or map |
| **Core Mechanic** | Positioning units and executing actions within a turn budget |
| **Landmark Games** | Civilization (1991), Fire Emblem (1990), XCOM: Enemy Unknown (2012) |
| **Key Design Concepts** | Grid-based movement range calculation, action point systems, line-of-sight, hit probability, turn structure |
| **Has Module?** | Yes — Module 23 |

### Tower Defense
| | |
|---|---|
| **Defining Trait** | Place defensive structures to stop waves of enemies traversing a path |
| **Core Mechanic** | Optimizing tower placement to maximize coverage and damage |
| **Landmark Games** | Desktop Tower Defense (2007), Plants vs. Zombies (2009), Bloons TD 6 (2018) |
| **Key Design Concepts** | A* pathfinding, placement systems, economy/resource management, targeting AI, upgrade trees |
| **Has Module?** | Yes — Module 6 |

### Auto-Battler
| | |
|---|---|
| **Defining Trait** | Draft and position units that fight automatically; strategy is in preparation, not execution |
| **Core Mechanic** | Drafting units and arranging them on a board before combat resolves on its own |
| **Landmark Games** | Dota Auto Chess (2019), Teamfight Tactics (2019), Super Auto Pets (2021) |
| **Key Design Concepts** | Draft/shop economy, synergy systems (tribal bonuses), positioning on a grid, automated combat resolution, shared pool drafting |
| **Has Module?** | Yes — Module 24 |

### 4X Strategy
| | |
|---|---|
| **Defining Trait** | Explore, Expand, Exploit, Exterminate — large-scale empire building |
| **Core Mechanic** | Managing an empire across multiple interconnected systems (economy, military, diplomacy, research) |
| **Landmark Games** | Civilization IV (2005), Stellaris (2016), Humankind (2021) |
| **Key Design Concepts** | Hex/tile map generation, tech trees, diplomacy AI, multi-system simulation, fog of war at scale |
| **Has Module?** | Yes — Module 25 |

---

## Puzzle Genres

### Falling Block Puzzle (Tetris-like)
| | |
|---|---|
| **Defining Trait** | Pieces fall into a grid; player arranges them before they lock |
| **Core Mechanic** | Spatial arrangement under time pressure |
| **Landmark Games** | Tetris (1984), Dr. Mario (1990), Puyo Puyo (1991) |
| **Key Design Concepts** | Grid as gameplay state, piece rotation math, gravity/cascade, lock delay, scoring depth |
| **Has Module?** | Yes — Module 5 |

### Match-3
| | |
|---|---|
| **Defining Trait** | Swap adjacent tiles to create groups of 3+ matching elements |
| **Core Mechanic** | Pattern recognition and chain reactions in a grid |
| **Landmark Games** | Bejeweled (2001), Candy Crush Saga (2012), Puzzle Quest (2007) |
| **Key Design Concepts** | Grid matching algorithms, cascade/chain scoring, board shuffle detection (no moves remaining), hybridization with other genres |
| **Has Module?** | Partially — Module 5 covers grid-based puzzle fundamentals |

### Sokoban / Push-Block
| | |
|---|---|
| **Defining Trait** | Push objects into target positions on a grid |
| **Core Mechanic** | Spatial reasoning — objects only push, never pull |
| **Landmark Games** | Sokoban (1982), Stephen's Sausage Roll (2016), Baba Is You (2019) |
| **Key Design Concepts** | Grid simulation, undo system (stack-based), puzzle validation, rule systems (Baba Is You's rules-as-objects) |
| **Has Module?** | Yes — Module 26 |

### Physics Puzzle
| | |
|---|---|
| **Defining Trait** | Solutions emerge from physics simulation interactions |
| **Core Mechanic** | Set up conditions and let physics resolve the outcome |
| **Landmark Games** | Angry Birds (2009), World of Goo (2008), Human: Fall Flat (2016) |
| **Key Design Concepts** | Physics engine integration, trajectory prediction, destructible objects, emergent solutions from simulation |
| **Has Module?** | Yes — Module 27 |

---

## Racing Genres

### Arcade Racing
| | |
|---|---|
| **Defining Trait** | Speed and spectacle over realistic physics |
| **Core Mechanic** | Controlling momentum through turns at high speed |
| **Landmark Games** | OutRun (1986), Burnout 3 (2004), Forza Horizon 5 (2021) |
| **Key Design Concepts** | Simplified steering model, drift mechanics, boost systems, track design |
| **Has Module?** | Yes — Module 9 |

### Kart Racing
| | |
|---|---|
| **Defining Trait** | Racing with power-up items that create chaos and catch-up opportunities |
| **Core Mechanic** | Racing + item management — items create drama and rubber-banding |
| **Landmark Games** | Super Mario Kart (1992), Crash Team Racing (1999), Mario Kart 8 (2014) |
| **Key Design Concepts** | Item systems tied to position (trailing players get better items), rubber-banding, track hazards, drift-boost mechanics |
| **Has Module?** | Partially — Module 9 covers racing fundamentals |

### Simulation Racing
| | |
|---|---|
| **Defining Trait** | Realistic vehicle physics and driving model |
| **Core Mechanic** | Managing tire grip, braking zones, and racing lines |
| **Landmark Games** | Gran Turismo (1997), iRacing (2008), Assetto Corsa (2014) |
| **Key Design Concepts** | Tire friction models, suspension simulation, telemetry systems, car tuning/setup |
| **Has Module?** | Yes — Module 28 |

---

## Simulation Genres

### Management / Tycoon
| | |
|---|---|
| **Defining Trait** | Build and optimize a system (business, city, theme park) |
| **Core Mechanic** | Resource allocation and system balancing across interconnected economies |
| **Landmark Games** | SimCity (1989), RollerCoaster Tycoon (1999), Two Point Hospital (2018) |
| **Key Design Concepts** | Economic simulation loops, satisfaction/demand modeling, UI for complex systems, time acceleration |
| **Has Module?** | Yes — Module 29 |

### Farming / Life Sim
| | |
|---|---|
| **Defining Trait** | Day/night cycle with crop/relationship management over in-game seasons |
| **Core Mechanic** | Time management — choosing how to spend limited in-game hours each day |
| **Landmark Games** | Harvest Moon (1996), Stardew Valley (2016), Animal Crossing (2001) |
| **Key Design Concepts** | Calendar/time systems, growth timers, NPC relationship tracking, inventory/crafting, save systems |
| **Has Module?** | Yes — Module 30 |

### Survival / Crafting
| | |
|---|---|
| **Defining Trait** | Gather resources, craft tools, survive against environment and/or enemies |
| **Core Mechanic** | Resource gathering and crafting loop — turn raw materials into tools that enable gathering better materials |
| **Landmark Games** | Minecraft (2011), Don't Starve (2013), Valheim (2021) |
| **Key Design Concepts** | Crafting recipe systems, inventory management, hunger/health resource drain, world persistence, day/night cycle affecting gameplay |
| **Has Module?** | Yes — Module 31 |

---

## Card & Board Game Genres

### Deckbuilder
| | |
|---|---|
| **Defining Trait** | Start with a weak deck, acquire cards during play to build a powerful engine |
| **Core Mechanic** | Curating a deck that generates emergent strategy through random draw order |
| **Landmark Games** | Dominion (2008, physical), Slay the Spire (2019), Balatro (2024) |
| **Key Design Concepts** | Deck/hand/discard data structures, card effect system (command pattern), turn phases, energy economy, synergy design |
| **Has Module?** | Yes — Module 10 |

### Digital Card Game (TCG/CCG)
| | |
|---|---|
| **Defining Trait** | Two players play cards from pre-built decks in competitive matches |
| **Core Mechanic** | Playing cards with costs and effects to reduce opponent's health to zero |
| **Landmark Games** | Magic: The Gathering (1993), Hearthstone (2014), Marvel Snap (2022) |
| **Key Design Concepts** | Mana curve design, card rarity/balance, collection systems, netcode for turn-based multiplayer |
| **Has Module?** | Partially — Module 10 covers core card game mechanics |

---

## Rhythm Genres

### Rhythm / Music Game
| | |
|---|---|
| **Defining Trait** | Player inputs are synchronized to music; timing and accuracy are scored |
| **Core Mechanic** | Hitting inputs in time with musical beats within a timing window |
| **Landmark Games** | PaRappa the Rapper (1996), Guitar Hero (2005), Beat Saber (2018) |
| **Key Design Concepts** | Audio synchronization, timing window system (perfect/great/good/miss), note highway/chart format, BPM-based event scheduling, latency calibration |
| **Has Module?** | Yes — Module 32 |

---

## Horror Genres

### Survival Horror
| | |
|---|---|
| **Defining Trait** | Limited resources and vulnerability create tension and fear |
| **Core Mechanic** | Resource scarcity — never having enough ammo/health to feel safe |
| **Landmark Games** | Resident Evil (1996), Silent Hill 2 (2001), Amnesia: The Dark Descent (2010) |
| **Key Design Concepts** | Inventory scarcity design, AI that hunts the player, sound design for tension, camera as a fear tool (fixed angles, limited visibility) |
| **Has Module?** | Yes — Module 33 |

---

## Casual & Mobile Genres

### Endless Runner
| | |
|---|---|
| **Defining Trait** | Auto-scrolling obstacle course; player input is reaction-based, game ends on failure |
| **Core Mechanic** | Single-input survival against escalating speed/difficulty |
| **Landmark Games** | Canabalt (2009), Temple Run (2011), Flappy Bird (2013) |
| **Key Design Concepts** | Procedural generation, difficulty curves, world streaming, persistence (high scores), single-input design |
| **Has Module?** | Yes — Module 4 |

### Idle / Incremental
| | |
|---|---|
| **Defining Trait** | Numbers go up, even when you're not playing |
| **Core Mechanic** | Purchasing upgrades that increase the rate of resource generation |
| **Landmark Games** | Cookie Clicker (2013), Adventure Capitalist (2015), Melvor Idle (2021) |
| **Key Design Concepts** | Exponential growth modeling, prestige/reset loops, offline progress calculation, big number formatting, engagement hooks without active gameplay |
| **Has Module?** | Yes — Module 34 |

### Hyper-Casual
| | |
|---|---|
| **Defining Trait** | One-touch mechanic, instant comprehension, session length under 1 minute |
| **Core Mechanic** | Varies — but always a single input mapped to one satisfying action |
| **Landmark Games** | Flappy Bird (2013), Crossy Road (2014), Helix Jump (2018) |
| **Key Design Concepts** | Extreme design economy, onboarding in 0 seconds, ad monetization integration, retention through difficulty |
| **Has Module?** | Partially — Module 4 (Endless Runner) covers the design philosophy |

---

## Social & Party Genres

### Party Game
| | |
|---|---|
| **Defining Trait** | Multiple players competing in varied mini-games, accessible to non-gamers |
| **Core Mechanic** | Varies per mini-game — the meta-mechanic is variety and social interaction |
| **Landmark Games** | Mario Party (1998), Jackbox Party Pack (2014), Among Us (2018) |
| **Key Design Concepts** | Mini-game framework architecture, input handling for many players, scoring/ranking systems, lobby management |
| **Has Module?** | Yes — Module 35 |

### Trivia
| | |
|---|---|
| **Defining Trait** | Questions and answers with scoring |
| **Core Mechanic** | Answering questions correctly under time pressure |
| **Landmark Games** | You Don't Know Jack (1995), Buzz! (2005), Jackbox (2014) |
| **Key Design Concepts** | Question database design, timer systems, scoring with streaks/multipliers, input for multiple simultaneous players, content pipeline for questions |
| **Has Module?** | Yes — Module 36 |

### Social Deduction
| | |
|---|---|
| **Defining Trait** | Players have hidden roles; deception and deduction drive gameplay |
| **Core Mechanic** | Lying and detecting lies — game mechanics create structured social interaction |
| **Landmark Games** | Mafia/Werewolf (1986, party game), Town of Salem (2014), Among Us (2018) |
| **Key Design Concepts** | Hidden information systems, role assignment, voting systems, phase-based gameplay (day/night), emergent social dynamics |
| **Has Module?** | Yes — Module 37 |

---

## Sandbox & Open World Genres

### Sandbox
| | |
|---|---|
| **Defining Trait** | Player-directed goals in a systemic world; create your own fun |
| **Core Mechanic** | Building and experimentation within a simulation |
| **Landmark Games** | Minecraft (2011), Garry's Mod (2004), Terraria (2011) |
| **Key Design Concepts** | Voxel/block-based worlds, save/load large world state, player-created content, emergent gameplay from system interactions |
| **Has Module?** | Yes — Module 38 |

---

## Quick Reference: Genre → Primary Mechanic

| Genre | Primary Mechanic | Module |
|-------|-----------------|--------|
| Ball-and-Paddle | Deflection | 1 |
| Platformer | Jump with gravity arc | 2 |
| Top-Down Shooter | Navigate under fire | 3 |
| Endless Runner | Survive escalating speed | 4 |
| Falling Block Puzzle | Spatial arrangement under time pressure | 5 |
| Tower Defense | Optimizing placement | 6 |
| Roguelike | Procedural exploration with permadeath | 7 |
| Fighting Game | Frame-tight read-and-react | 8 |
| Racing | Momentum through curves | 9 |
| Deckbuilder | Curating an engine from random draws | 10 |
| First-Person Game (FPS) | Aim and shoot in 3D first-person | 11 |
| 3D Platformer | Jump and land while managing a camera | 12 |
| Metroidvania | Ability-gated exploration | 14 |
| Run and Gun | Move and shoot through authored levels | 15 |
| Third-Person Shooter | Shooting with spatial body awareness | 16 |
| Point-and-Click | Inventory puzzles + dialog | 17 |
| Visual Novel | Branching narrative choices | 18 |
| Walking Simulator | Environmental storytelling | 19 |
| Turn-Based RPG | Menu combat with stats and parties | 20 |
| Action RPG | Real-time combat + loot + stats | 21 |
| RTS | Multi-unit command + economy | 22 |
| Turn-Based Strategy | Positional tactics in turns | 23 |
| Auto-Battler | Draft and position, watch combat | 24 |
| 4X Strategy | Empire management across systems | 25 |
| Sokoban | Push blocks, spatial reasoning | 26 |
| Physics Puzzle | Set up conditions, let physics resolve | 27 |
| Simulation Racing | Tire grip and racing lines | 28 |
| Management/Tycoon | Balance interconnected systems | 29 |
| Farming/Life Sim | Time management per day | 30 |
| Survival/Crafting | Gather → craft → survive loop | 31 |
| Rhythm | Input synchronized to music | 32 |
| Survival Horror | Scarcity creates tension | 33 |
| Idle/Incremental | Exponential growth management | 34 |
| Party Game | Varied mini-games, social play | 35 |
| Trivia | Q&A under time pressure | 36 |
| Social Deduction | Deception and detection | 37 |
| Sandbox | Player-directed creation | 38 |

---

## Genre Blending

Most modern games blend genres. Recognizing the *mechanics* behind each genre helps you understand what's being combined:

- **Hades** = Roguelike + Action RPG + Beat 'em Up + Narrative
- **Slay the Spire** = Deckbuilder + Roguelike
- **Puzzle Quest** = Match-3 + RPG
- **Into the Breach** = Turn-Based Strategy + Roguelike + Puzzle
- **Mario Kart** = Racing + Party Game (items)
- **Vampire Survivors** = Bullet Hell (inverted) + Roguelite + Idle
- **Balatro** = Deckbuilder + Poker + Roguelike

The capstone module (Module 13) is your chance to try a blend of your own.
