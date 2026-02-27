# Module 07: Roguelike / Dungeon Crawler

**Weeks 13-14** | *Every run tells a different story -- because every run builds a different world.*

---

## Prerequisites

| Module | What You Used From It |
|---|---|
| Module 02 - Platformer | Tilemaps, tile-based world representation, camera systems |
| Module 04 - Endless Runner | Procedural generation fundamentals, seeded randomness, segment assembly |

You should be comfortable with 2D grid representations and the idea of assembling game content from reusable pieces at runtime.

---

## Week 1: History & Design Theory

### The Origin

**Rogue** (1980) -- Michael Toy & Glenn Wichman, UC Santa Cruz

Before Rogue, games were authored experiences. Every dungeon was hand-placed, every enemy a known quantity. Michael Toy and Glenn Wichman, working on a PDP-11 minicomputer, asked a radical question: what if the dungeon built itself? Rogue rendered its world entirely in ASCII characters -- `#` for walls, `.` for floors, `@` for the player -- and generated a new dungeon layout every single time you played. But the generation was only half the revolution. The other half was permadeath: when you died, your save file was deleted. No reloading. No take-backs. This single design constraint transformed every decision into a meaningful one. Should you drink the unidentified potion? Should you fight or flee? When death is permanent, resource management stops being bookkeeping and becomes survival. Rogue proved that a game did not need authored content to be compelling -- it needed systems that produced interesting decisions.

### How the Genre Evolved

**NetHack** (1987, the DevTeam) took Rogue's procedural dungeons and asked: what happens when every system can interact with every other system? NetHack became legendary not for its generation but for its emergent complexity. You could dip a unicorn horn in a potion to change its effect. You could write "Elbereth" on the floor to scare monsters. You could polymorph into a metallivore and eat your own armor. None of these interactions were special-cased -- they emerged from consistent rules applied broadly. NetHack is the ultimate example of composable systems: small, well-defined behaviors that produce exponential complexity when combined. The DevTeam's design philosophy -- "the DevTeam thinks of everything" -- meant that edge cases were features, not bugs.

**Spelunky** (Derek Yu, 2008 indie release, 2012 HD remake) shattered the assumption that roguelikes had to be turn-based or grid-based. Spelunky applied roguelike principles -- procedural generation, permadeath, systemic interactions -- to a real-time platformer. Suddenly, "roguelike" became a modifier rather than a genre: any game could be "roguelike" if it embraced randomized content and permanent consequence. Spelunky also demonstrated that procedural generation could feel hand-crafted. Its algorithm assembled rooms from pre-designed templates, guaranteeing a critical path to the exit while allowing enormous variation. Enter the Gungeon (2016) pushed this further into twin-stick shooter territory, while Dead Cells (2018) proved roguelike structure could coexist with Metroidvania progression and fluid combat.

**Hades** (Supergiant Games, 2020) solved the genre's longest-standing emotional problem: roguelikes felt hollow between runs. Earlier games like Rogue Legacy (2013) had introduced "meta-progression" -- persistent upgrades that carry across deaths -- but Hades wove narrative itself into the loop. Every death sent protagonist Zagreus back to the House of Hades, where characters remembered your previous attempts, relationships deepened, and story threads advanced. Death was not failure; it was a chapter break. This made the roguelike structure accessible to players who had bounced off the genre's traditional harshness, and it proved that permadeath and meaningful progression are not opposites -- they are complementary.

### What Makes Roguelikes Great

The roguelike's core design insight is that **constraint creates meaning**. In a game with save-scumming, every decision is reversible, which means no decision truly matters. Permadeath makes resources precious, makes risk tangible, and makes victory euphoric. Procedural generation ensures that memorization cannot substitute for understanding -- you must learn the *systems*, not the *layout*. Together, these two pillars produce a game that is different every time but fair every time, where expertise means reading situations rather than remembering solutions.

### The Essential Mechanic

Navigating procedurally generated spaces where every decision is permanent because death is permanent.

---

## Week 2: Build the MVP

### What You're Building

A turn-based dungeon crawler where the player explores procedurally generated floors, fights enemies, collects items, and tries to survive as deep as possible. When the player dies, the run is over -- start fresh with a new dungeon.

### Core Concepts (Must Implement)

#### 1. Procedural Dungeon Generation (BSP Tree Algorithm)

The dungeon is the first thing the player sees and the foundation everything else sits on. We will use **Binary Space Partitioning (BSP)**, the same spatial subdivision algorithm used in the original Doom renderer.

**The algorithm, step by step:**

1. Start with the entire map as a single rectangular region.
2. Split it into two sub-regions along a random axis (horizontal or vertical). Choose the split point randomly, but constrain it so neither child is too small.
3. Recursively split each sub-region. Stop when a region is small enough to contain exactly one room.
4. Within each leaf node, place a room -- a rectangle smaller than the leaf, randomly positioned inside it.
5. Walk back up the tree: for each internal node, connect its two children with a corridor (L-shaped or straight).

```
function generateDungeon(width, height, minRoomSize):
    root = createLeaf(0, 0, width, height)
    splitRecursively(root, minRoomSize)
    createRooms(root)
    createCorridors(root)
    return root.toTileGrid()

function splitRecursively(leaf, minSize):
    if leaf.width < minSize * 2 AND leaf.height < minSize * 2:
        return  // leaf is small enough, stop splitting

    if leaf.width > leaf.height:
        axis = VERTICAL
    else if leaf.height > leaf.width:
        axis = HORIZONTAL
    else:
        axis = randomChoice(VERTICAL, HORIZONTAL)

    splitPoint = randomBetween(minSize, leaf.sizeOnAxis - minSize)
    leaf.left  = createLeaf(... first half ...)
    leaf.right = createLeaf(... second half ...)

    splitRecursively(leaf.left, minSize)
    splitRecursively(leaf.right, minSize)

function createCorridors(node):
    if node is leaf:
        return node.room.center()

    leftCenter  = createCorridors(node.left)
    rightCenter = createCorridors(node.right)
    connectWithCorridor(leftCenter, rightCenter)
    return midpoint(leftCenter, rightCenter)
```

The BSP approach guarantees every room is reachable (because corridors follow the tree structure) and prevents rooms from overlapping (because the tree partitions space). The result is a grid of tiles where each cell is either `WALL`, `FLOOR`, or `CORRIDOR`.

**Why it matters:** BSP trees are a fundamental spatial data structure. Understanding recursive partitioning here teaches you how to subdivide space efficiently -- a technique used in physics engines, rendering pipelines, and spatial queries throughout game development.

---

#### 2. Turn-Based Game Loop

Real-time games run a continuous loop: `update -> render -> repeat`. A turn-based game is fundamentally different. Nothing happens until the player acts.

```
function gameLoop():
    while player.isAlive AND NOT reachedExit:
        render(world)
        action = waitForPlayerInput()     // BLOCKING - nothing updates

        if isValidAction(action, world):
            executeAction(player, action, world)

            for each enemy in world.enemies:
                enemyAction = enemy.decideAction(world)
                executeAction(enemy, enemyAction, world)

            world.updateEffects()         // poison ticks, cooldowns, etc.
            world.incrementTurn()
```

The key insight: the entire world is frozen until the player commits to an action. Then all entities process in sequence. This makes the game fully deterministic given the same inputs -- you could replay an entire run from a seed + input log.

**Why it matters:** This is the command pattern in practice. Each action is a discrete, self-contained operation against a world state. The deterministic, sequential nature of turn-based processing makes the game reproducible and debuggable -- you can replay an entire run from a seed and an input log.

---

#### 3. Fog of War / Visibility (Field of View)

The player should only see what their character can see. This requires a **field of view (FOV)** algorithm. Tiles can be in one of three visibility states: `UNSEEN` (never encountered), `SEEN` (previously visible, rendered dimly), or `VISIBLE` (currently in line of sight).

The simplest approach is **raycasting FOV**: cast rays from the player outward in all directions and mark tiles as visible until a ray hits a wall.

```
function calculateFOV(origin, maxRadius, tileGrid):
    clearAllVisible(tileGrid)

    for angle in 0 to 360 step ANGLE_INCREMENT:
        castRay(origin, angle, maxRadius, tileGrid)

function castRay(origin, angle, maxRadius, tileGrid):
    dx = cos(angle)
    dy = sin(angle)
    x = origin.x
    y = origin.y

    for distance in 1 to maxRadius:
        x += dx
        y += dy
        tileX = round(x)
        tileY = round(y)

        if outOfBounds(tileX, tileY):
            return

        tileGrid[tileX][tileY].visible = true
        tileGrid[tileX][tileY].explored = true

        if tileGrid[tileX][tileY].blocksLight:
            return  // ray stops at walls
```

For smoother results, look into **recursive shadowcasting**, which processes octants of the circle and handles edge cases (peeking around corners) more elegantly. But the raycasting approach above is sufficient for an MVP.

**Why it matters:** FOV is a spatial query: "given a point, what other points are reachable under constraints?" This is a core problem in game development that appears in AI sight lines, lighting systems, and stealth mechanics. Mastering it here gives you a reusable tool for any game that needs line-of-sight calculations.

---

#### 4. Inventory and Item System

Items in a roguelike are data, not code. A sword is not a `Sword` class -- it is a data record with stat modifiers. This is **data-driven design**: behavior emerges from data, not from class hierarchies.

```
// Items as data records, not class hierarchies
itemDefinitions = {
    "rusty_sword":  { slot: "weapon", modifiers: { attack: +2 }, weight: 3 },
    "iron_shield":  { slot: "offhand", modifiers: { defense: +3 }, weight: 5 },
    "health_potion": { slot: null, useEffect: "heal", healAmount: 10, consumable: true },
    "ring_of_sight": { slot: "ring", modifiers: { viewRadius: +2 }, weight: 0 }
}

// The inventory is just a bounded collection
class Inventory:
    maxSlots = 10
    items = []         // the "bag" - an array or list with a capacity
    equipped = {}      // map of slot -> item (weapon, offhand, ring, etc.)

    function equip(item):
        if item.slot == null:
            return ERROR("Cannot equip this item")
        if equipped[item.slot] exists:
            unequip(item.slot)     // move current equipment back to bag
        equipped[item.slot] = item
        items.remove(item)
        recalculateStats()

    function computeStatModifiers():
        totals = {}
        for each item in equipped.values():
            for each (stat, value) in item.modifiers:
                totals[stat] = totals.getOrDefault(stat, 0) + value
        return totals
```

Equipment slots act as a keyed map where each slot accepts exactly one item. The "bag" is a bounded list. Stat computation is a reduce operation across all equipped items.

**Why it matters:** This is configuration-driven architecture. Instead of writing a new class for every item, you define items as data and let a generic system interpret them. Adding a new item means adding a data record, not writing new code. The stat modifier pipeline (`base stats + sum(equipped modifiers) = effective stats`) is a composable transformation chain -- a pattern you will use whenever effects need to stack.

---

#### 5. Permadeath and Run Structure

A roguelike has two layers of state: **run state** (destroyed on death) and **persistent state** (survives across runs).

```
// Run state - exists only for the duration of one attempt
runState = {
    player: { hp: 30, maxHp: 30, attack: 5, defense: 2 },
    inventory: [],
    currentFloor: 1,
    dungeonSeed: generateSeed(),
    turnCount: 0,
    eventLog: []
}

// Persistent state - survives death, saved to disk
persistentState = {
    totalRuns: 14,
    bestFloor: 7,
    totalKills: 203,
    unlockedItems: ["rusty_sword", "iron_shield", "fire_wand"],
    // Optional meta-progression:
    permanentUpgrades: { startingHp: +5 }
}

function onPlayerDeath(runState, persistentState):
    persistentState.totalRuns += 1
    persistentState.bestFloor = max(persistentState.bestFloor, runState.currentFloor)
    persistentState.totalKills += runState.killCount
    saveToDisk(persistentState)

    // Run state is simply discarded -- not saved
    startNewRun(persistentState)
```

The architectural question is: what resets? In a pure roguelike, everything resets. In a "roguelite" (Hades, Dead Cells), certain progression carries over to make each death feel like it contributed to forward progress.

**Why it matters:** This is the fundamental distinction between ephemeral and persistent state. Run state is temporary and disposable -- rebuilt from scratch each time. Persistent state survives across sessions. The boundary between them is a design decision with major implications: what resets and what carries over defines the player's relationship with failure and progression.

---

#### 6. Entity-Component Thinking

A roguelike dungeon contains many different things -- the player, goblins, potions, traps, staircases -- but they share common traits. Instead of building a deep inheritance hierarchy (`Entity -> Creature -> Enemy -> Goblin`), use **composition**: each entity is a bag of components that describe what it is and what it can do.

```
// Entities as compositions of components
player = Entity(
    Position(x=5, y=3),
    Renderable(glyph="@", color="white"),
    Health(current=30, max=30),
    CombatStats(attack=5, defense=2),
    Inventory(maxSlots=10),
    PlayerControlled()           // marker: takes input from player
)

goblin = Entity(
    Position(x=12, y=7),
    Renderable(glyph="g", color="green"),
    Health(current=8, max=8),
    CombatStats(attack=3, defense=1),
    AIControlled(behavior="chase_player"),  // marker: takes input from AI
    DropsLoot(table="goblin_drops")
)

healthPotion = Entity(
    Position(x=9, y=4),
    Renderable(glyph="!", color="red"),
    Consumable(effect="heal", amount=10),
    Pickupable()
)

// Systems operate on entities that have specific components
function combatSystem(attacker, defender):
    if attacker.has(CombatStats) AND defender.has(Health):
        damage = max(0, attacker.CombatStats.attack - defender.CombatStats.defense)
        defender.Health.current -= damage
        return damage

function aiSystem(world):
    for each entity with (AIControlled, Position):
        behavior = entity.AIControlled.behavior
        action = AI_BEHAVIORS[behavior](entity, world)
        executeAction(entity, action, world)
```

You do not need a full Entity-Component-System (ECS) framework for your MVP. Even a simple approach where entities are dictionaries of components gives you the flexibility to mix and match behaviors without deep inheritance trees.

**Why it matters:** This is composition over inheritance -- one of the most important architectural principles in software. It is also the conceptual foundation of ECS architecture, which powers engines from Unity to Bevy. Small, focused units of behavior composed together create complex systems that are far easier to extend than deep class hierarchies.

---

#### 7. Event Log / Message System

Roguelikes need to communicate what happened each turn: "You hit the goblin for 3 damage. The goblin drops a health potion. You hear something in the distance." This is a **structured event log** rendered as human-readable text.

```
class EventLog:
    messages = []       // bounded ring buffer or capped list
    maxMessages = 50

    function log(event):
        message = formatEvent(event)
        messages.append({ text: message, turn: world.turnCount })
        if messages.length > maxMessages:
            messages.removeFirst()

    function recentMessages(count=5):
        return messages.slice(-count)

// Events are structured data, formatted for display
function formatEvent(event):
    switch event.type:
        case "ATTACK":
            return "{attacker} hits {defender} for {damage} damage."
        case "DEATH":
            return "{entity} is destroyed!"
        case "PICKUP":
            return "You pick up the {item}."
        case "USE_ITEM":
            return "You use the {item}. {effect_description}"
        case "LEVEL_CHANGE":
            return "You descend to floor {floor}."

// Usage in combat
function resolveCombat(attacker, defender, world):
    damage = computeDamage(attacker, defender)
    defender.health.current -= damage

    world.eventLog.log({ type: "ATTACK", attacker: attacker.name,
                         defender: defender.name, damage: damage })

    if defender.health.current <= 0:
        world.eventLog.log({ type: "DEATH", entity: defender.name })
        handleDeath(defender, world)
```

The event log serves double duty: it is the player's feedback channel (what just happened?) and a debugging tool during development (why did that happen?).

**Why it matters:** The structured event contains machine-readable data; the formatted message is the human-readable representation. This separation -- storing events as data, rendering them as text -- means you can replay, filter, or reformat your game history without losing information. The event log is both a player feedback channel and a powerful debugging tool.

---

### Stretch Goals

1. **Multiple dungeon floors** -- a staircase entity that generates a new floor, increasing difficulty with depth (enemy count, item scarcity). Track floor number in run state.
2. **Varied enemy AI behaviors** -- some enemies patrol, some chase, some flee when low on health. Implement as strategy patterns keyed by the `AIControlled` behavior field.
3. **Unidentified items** -- potions and scrolls have randomized appearances per run ("blue potion" might be healing in one run, poison in another). The player must use items to learn what they do, adding risk to resource decisions.
4. **Mini-map** -- a small overlay showing explored tiles, useful for backtracking. Render from the `explored` flag on each tile.

---

### MVP Spec

| Element | Requirement |
|---|---|
| Grid | Minimum 40x30 tile dungeon, procedurally generated with BSP or room-and-corridor |
| Rooms | At least 5 rooms per floor, all connected |
| Player | Moves in 4 or 8 directions, one tile per turn |
| Enemies | At least 2 enemy types with different stats |
| Combat | Bump-to-attack (move into an enemy tile to attack), damage = attacker.attack - defender.defense (minimum 0) |
| Items | At least 3 item types (weapon, consumable, stat-modifier) |
| Inventory | Bag with limited capacity, at least 1 equipment slot |
| Fog of war | Tiles beyond view radius are hidden; previously seen tiles are dimmed |
| Permadeath | Death ends the run, returns to a "new run" screen |
| Event log | Visible on screen, shows at least the last 5 messages |
| Win condition | Reach the stairs on the final floor, or survive N floors |

### Deliverable

A playable single-floor dungeon crawler (or multi-floor, if you hit the stretch goal) where the layout is different every time, the player can fight enemies, pick up and use items, and death ends the run. Submit your project along with a brief write-up (3-5 sentences) describing which generation algorithm you chose, what your run state vs. persistent state boundary looks like, and one emergent interaction you did not explicitly plan for.

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| BSP Dungeon Generation | Recursive partitioning like B-trees subdividing key spaces in database query planners |
| Turn-Based Game Loop | Request-response model: each player action is like processing a message off a queue in event-driven microservices |
| Fog of War / Field of View | Network visibility queries -- can host A reach host B given firewall rules? Same class of problem as access control scoping |
| Inventory and Item System | Configuration-driven architecture like feature flags, rule engines, and schema-driven APIs; stat pipeline mirrors middleware chains |
| Permadeath and Run Structure | Ephemeral vs. persistent state: run state is an in-memory cache or user session; persistent state is your database |
| Entity-Component Thinking | Composition over inheritance applied to microservice design -- small, focused services composed to create complex systems |
| Event Log / Message System | Structured logging and event sourcing -- JSON log entries rendered in dashboards, audit trails, and activity feeds |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| BSP Dungeon Generation | Recursive layout subdivision like CSS Grid or flexbox nesting -- splitting available space into smaller containers |
| Turn-Based Game Loop | Similar to Redux dispatch: an action is dispatched, reducers process it, and the UI re-renders with the new state |
| Fog of War / Field of View | Conditional rendering -- only mount/render components that are "visible" based on application state |
| Inventory and Item System | Component props as data: items are like configuration objects passed to a generic `<ItemSlot>` component |
| Permadeath and Run Structure | Session storage vs. localStorage -- run state clears on tab close, persistent state survives across sessions |
| Entity-Component Thinking | React component composition -- mixing small, reusable components (`<Health>`, `<Position>`) instead of deep inheritance |
| Event Log / Message System | Browser event system and console logging -- structured CustomEvents rendered as human-readable DOM updates |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| BSP Dungeon Generation | KD-tree spatial partitioning used in nearest-neighbor searches and spatial indexing of high-dimensional data |
| Turn-Based Game Loop | Sequential pipeline execution in a DAG -- each step (player turn, enemy turns, effects) runs in defined order |
| Fog of War / Field of View | Raycasting is a Monte Carlo-style sampling of visibility space; shadowcasting optimizes by pruning sectors analytically |
| Inventory and Item System | Stat modifiers are vectorized operations -- sum a matrix of equipped-item stat columns to get the effective stat vector |
| Permadeath and Run Structure | Ephemeral compute vs. persistent storage: run state is a Spark executor's in-memory data; persistent state is the data lake |
| Entity-Component Thinking | Entity-component tables are columnar data stores -- query entities by filtering on component columns, like a DataFrame |
| Event Log / Message System | Structured event logs are append-only datasets -- replay, aggregate, and analyze them like time-series data in a pipeline |

---

### Discussion Questions

1. **Randomness vs. fairness:** Your dungeon generator might place the player in a room with three enemies and no items, or in a room with a powerful weapon and no threats. How do you constrain procedural generation to ensure runs feel fair without feeling scripted? What techniques from load balancing or capacity planning apply?

2. **The persistence boundary:** You chose what resets on death and what persists. How did you decide? If you were designing a roguelite (some progression carries over), where would you draw the line, and how would you prevent persistent upgrades from trivializing the challenge?

3. **Composition vs. inheritance:** You built entities from components rather than class hierarchies. Where did this approach make things easier? Where did it create friction? How does this compare to choosing between a monolithic ORM model and a set of composable service interfaces?

4. **Event sourcing your game:** Your event log records everything that happened in a turn. Could you reconstruct the entire game state from the initial seed + the sequence of player inputs? What would that buy you (replays, debugging, anti-cheat), and what are the costs?

---
