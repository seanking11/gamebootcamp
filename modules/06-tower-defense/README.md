# Module 06: Tower Defense

**Weeks 11-12** | *Optimizing placement to control the flow of enemies through space*

---

## Week 1: History & Design Theory

### The Origin

**Rampart** (Atari, 1990) is the game most often cited as the ancestor of tower defense, though it did not look like what we now call the genre. Players placed castle walls on a grid, cannons fired automatically at approaching ships, and between rounds you scrambled to repair your fortifications before the next wave. The loop -- build, defend, repair, repeat -- was the seed. But the critical ingredient was spatial strategy: you were not controlling a character; you were shaping the battlefield itself. Where you placed your walls determined whether enemies could breach them. Rampart was an arcade game and a modest commercial success, but its design DNA would lie dormant for nearly two decades before the genre it inspired exploded into the mainstream.

### How the Genre Evolved

**Desktop Tower Defense** (Paul Preece, 2007) was a free Flash game that became a phenomenon. Its genius was simplicity: enemies walked from one side of an open grid to the other, and you placed towers anywhere on the grid to create a maze. The enemies pathfound around your towers in real time, so every placement decision reshaped the battlefield. This was the game that taught a generation of players (and developers) what "tower defense" meant. It demonstrated that the genre's core appeal was not action but optimization: you were designing a system, not executing reflexes.

**Plants vs. Zombies** (PopCap Games, 2009) simplified the formula for a mass audience. Instead of a free-form grid, it used lanes -- zombies marched in straight horizontal lines, and you planted defenders in a grid that snapped to those lanes. This removed pathfinding complexity and replaced it with resource management (sunlight as currency) and personality (every plant and zombie had distinct character). Plants vs. Zombies proved that tower defense did not require the player to understand algorithms; it just needed to feel like a series of interesting decisions about where to spend limited resources.

**Bloons TD** (Ninja Kiwi, 2007 onward) and **Kingdom Rush** (Ironhide, 2012) pushed depth in different directions. Bloons TD gave each tower branching upgrade paths, turning tower selection into a build-order optimization problem with hundreds of viable strategies. Kingdom Rush introduced hero units and fixed paths (no maze-building), focusing the player's attention on upgrade timing and ability usage. Together, these games demonstrated the genre's range: from open-grid mazing to fixed-path resource optimization, from casual to deeply strategic.

### What Makes Tower Defense Great

Tower defense is the rare genre where the player is a systems architect, not a performer. In a platformer or a shooter, success comes from execution -- timing a jump, landing a shot. In tower defense, success comes from design: you build a machine (your tower layout) and then watch it run against an input (the enemy wave). The enemies are the test suite; your tower layout is the system under test. When it works, you feel clever. When it fails, you know exactly which design decision was wrong, and you want to try again.

### The Essential Mechanic

**Optimizing placement to control the flow of enemies through space** -- the player builds static defenses whose positions determine how mobile enemies traverse the map, and victory comes from designing the most efficient arrangement.

---

## Week 2: Build the MVP

### What You're Building

A single-player tower defense game on a grid-based map. Enemies spawn in waves and follow a path toward a goal. The player places towers on the grid using currency earned from kills. Towers automatically target and shoot enemies within range. If too many enemies reach the goal, the player loses. The game should have at least 3 tower types, 5+ waves, and a basic upgrade system.

### Core Concepts (Must Implement)

#### 1. A* Pathfinding

This is the big new concept for this module. A* is a graph search algorithm that finds the shortest path between two points. It works on your grid: each cell is a node, walkable cells are connected to their neighbors, and towers (or walls) are impassable. A* uses a heuristic (an estimate of remaining distance) to explore promising paths first, making it dramatically faster than brute-force search.

Think of A* as a priority-queue-driven BFS. You maintain an open set (cells to explore) sorted by `f(n) = g(n) + h(n)`, where `g(n)` is the cost so far and `h(n)` is the heuristic estimate to the goal. At each step, you pop the lowest-cost node, check if it is the goal, and if not, expand its neighbors.

```
function aStar(grid, start, goal):
    openSet = PriorityQueue()
    openSet.add(start, priority=0)
    cameFrom = {}
    gScore = { start: 0 }

    while openSet is not empty:
        current = openSet.popLowest()

        if current == goal:
            return reconstructPath(cameFrom, current)

        for neighbor in getWalkableNeighbors(grid, current):
            tentativeG = gScore[current] + 1   // uniform cost
            if tentativeG < gScore.getOrDefault(neighbor, INFINITY):
                cameFrom[neighbor] = current
                gScore[neighbor] = tentativeG
                f = tentativeG + heuristic(neighbor, goal)
                openSet.add(neighbor, priority=f)

    return null  // no path exists

function heuristic(a, b):
    // Manhattan distance for 4-directional grid:
    return abs(a.x - b.x) + abs(a.y - b.y)
```

**Why it matters:** A* is one of the most universally useful algorithms in computer science. Outside of games, it powers GPS routing, network packet routing, robot navigation, and dependency resolution. The deeper lesson is about informed search: when you have a heuristic (an estimate that never overestimates), you can explore large state spaces efficiently. You will use pathfinding or its variants in more contexts than you expect.

---

#### 2. Placement Systems

The player needs to place towers on the grid. This means you need a **build mode** state: when the player selects a tower type, the game enters a mode where clicking on the grid attempts to place that tower. Placement requires validation: is the cell empty? Can the player afford the tower? And critically -- if your game allows maze-building -- will this placement still leave a valid path for enemies?

```
function onGridClick(cellX, cellY, selectedTowerType):
    if not isValidPlacement(cellX, cellY):
        showError("Cannot place here")
        return

    if player.gold < selectedTowerType.cost:
        showError("Not enough gold")
        return

    // If maze-building: check that placement doesn't block all paths
    grid[cellY][cellX] = BLOCKED
    testPath = aStar(grid, enemySpawn, goal)
    if testPath == null:
        grid[cellY][cellX] = EMPTY     // revert
        showError("Would block enemy path")
        return

    player.gold -= selectedTowerType.cost
    createTower(cellX, cellY, selectedTowerType)

function isValidPlacement(cellX, cellY):
    return grid[cellY][cellX] == EMPTY
       and not isOnPath(cellX, cellY)   // for fixed-path maps
       and isInBuildableArea(cellX, cellY)
```

**Why it matters:** This is input validation with transactional rollback. You tentatively apply a state change (mark the cell as blocked), validate it against a constraint (path still exists), and either commit or revert. The "would block enemy path" check is a constraint satisfaction problem -- you must verify that a proposed change does not violate a system invariant before committing it.

---

#### 3. Economy / Resource Management

Towers cost gold. Enemies drop gold when killed. The player starts with enough gold for a few towers and must earn the rest through successful defense. This creates the fundamental tension of tower defense: spend now on cheap towers for immediate defense, or save for expensive towers that pay off later. The economy system is a simple ledger: income events (enemy killed) and expense events (tower purchased, tower upgraded).

```
player = {
    gold: 200,         // starting gold
    lives: 20          // HP -- enemies that reach the goal cost lives
}

TOWER_COSTS = {
    "basic":  100,
    "sniper": 200,
    "splash": 150
}

function onEnemyKilled(enemy):
    player.gold += enemy.bounty

function purchaseTower(type):
    cost = TOWER_COSTS[type]
    if player.gold >= cost:
        player.gold -= cost
        return true
    return false
```

**Why it matters:** This is resource budgeting. There is always a trade-off between immediate throughput and long-term efficiency. The player who spends all their gold on cheap towers survives early but stalls late. The player who hoards gold has a powerful endgame but might lose lives in the meantime. Balancing an economy is one of the hardest design problems in games -- the math is simple, but the feel requires extensive playtesting.

---

#### 4. Targeting AI for Towers

Each tower needs to decide which enemy to shoot. This is a strategy pattern: the tower has a targeting mode (nearest, first in path, strongest, weakest/lowest HP), and each mode is a different sorting function applied to the list of enemies within range. The player may be able to switch targeting modes per tower, or different tower types may have fixed strategies.

```
function getTarget(tower, enemies):
    inRange = enemies.filter(e => distance(tower, e) <= tower.range)

    if inRange.isEmpty():
        return null

    switch tower.targetingMode:
        case "nearest":
            return inRange.sortBy(e => distance(tower, e)).first()
        case "first":
            return inRange.sortBy(e => e.distanceAlongPath).last()
        case "strongest":
            return inRange.sortBy(e => e.maxHP).last()
        case "weakest":
            return inRange.sortBy(e => e.currentHP).first()
```

**Why it matters:** This is the strategy pattern in a textbook application. Each targeting mode is an interchangeable algorithm with the same interface: given a list of candidates, return the best one. The key design decision is not which strategy is "best" -- it is giving the player the ability to choose the right strategy for the current situation.

---

#### 5. Range Detection

Every tower has a range radius. Each frame (or each tower tick), you need to determine which enemies are within range. The basic approach is a circle-based distance check: if the Euclidean distance between the tower center and the enemy position is less than or equal to the tower's range, the enemy is in range. For visual feedback, draw the range circle when the player hovers over or selects a tower.

```
function isInRange(tower, enemy):
    dx = tower.x - enemy.x
    dy = tower.y - enemy.y
    distSquared = dx * dx + dy * dy
    return distSquared <= tower.range * tower.range
    // Compare squared values to avoid expensive sqrt

function getEnemiesInRange(tower, allEnemies):
    return allEnemies.filter(e => isInRange(tower, e))
```

**Why it matters:** Range detection is a spatial query, and the squared-distance optimization is a micro-optimization you will see everywhere in game development. At small scale, iterating over all enemies per tower per frame is fine. At large scale (hundreds of towers, thousands of enemies), you would need spatial indexing -- quadtrees, spatial hash grids, or similar structures. Start with the brute-force check, and understand why spatial indexing exists for when you need it.

---

#### 6. Upgrade Trees

After placing a tower, the player can spend additional gold to upgrade it. In the simplest form, upgrades increase damage, range, or fire rate. In more complex designs, towers have branching upgrade paths: a basic tower might upgrade into either a "sniper" (high damage, slow fire, long range) or a "machine gun" (low damage, fast fire, short range). Upgrades are data, not code: define them in a configuration structure and apply stat modifications.

```
UPGRADE_TREE = {
    "basic": {
        "path_a": [
            { name: "Sharper Arrows", cost: 100, damage: +5 },
            { name: "Sniper Scope",   cost: 200, damage: +10, range: +2 },
            { name: "Railgun",        cost: 500, damage: +30, range: +3 }
        ],
        "path_b": [
            { name: "Faster Draw",    cost: 80,  fireRate: +0.5 },
            { name: "Twin Barrels",   cost: 180, fireRate: +1.0 },
            { name: "Gatling Tower",  cost: 400, fireRate: +2.0, damage: +3 }
        ]
    }
}

function upgradeTower(tower, pathId):
    path = UPGRADE_TREE[tower.type][pathId]
    nextUpgrade = path[tower.upgradeLevel[pathId]]
    if player.gold >= nextUpgrade.cost:
        player.gold -= nextUpgrade.cost
        applyStatModifiers(tower, nextUpgrade)
        tower.upgradeLevel[pathId] += 1
```

**Why it matters:** This is data-driven configuration -- the same approach you use for feature flags, tiered pricing plans, or role-based permissions. The upgrade tree is a static data structure that the game engine interprets at runtime. Adding a new upgrade path means adding data, not writing new code. This separation of data and logic is one of the most important architectural principles in software engineering, and game developers learned it early because designers need to tweak numbers constantly without recompiling.

---

#### 7. Wave Design (Revisited)

You built wave systems in Module 03 (Top-Down Shooter), but tower defense waves work differently. The player is stationary, so waves must create pressure through composition and pacing, not through surrounding the player. A good wave system mixes enemy types (fast but fragile, slow but tanky, groups of weak enemies, single powerful enemies), adjusts spawn rates, and introduces new threats at predictable intervals so the player can plan.

```
WAVES = [
    { enemies: [{ type: "basic", count: 10, interval: 1.0 }] },
    { enemies: [{ type: "basic", count: 15, interval: 0.8 }] },
    { enemies: [
        { type: "basic", count: 10, interval: 0.8 },
        { type: "fast",  count: 5,  interval: 0.5, delay: 5.0 }
    ]},
    { enemies: [{ type: "tank", count: 3, interval: 2.0 }] },
    // Wave 5: boss wave
    { enemies: [
        { type: "basic", count: 20, interval: 0.5 },
        { type: "boss",  count: 1,  interval: 0,   delay: 10.0 }
    ]}
]

function startWave(waveIndex):
    wave = WAVES[waveIndex]
    for group in wave.enemies:
        scheduleSpawns(group.type, group.count, group.interval, group.delay)
```

**Why it matters:** Wave design is systematic stress-testing of the player's defenses. Each wave is a pressure pattern: sustained pressure (many weak enemies), burst pressure (a group of fast enemies), heavy pressure (a tank with lots of HP), and peak events (a boss). The data-driven wave format (an array of objects with types, counts, and intervals) is a declarative configuration pattern -- adding new waves means adding data, not writing new code.

---

#### 8. Path Recalculation

If your game allows the player to place towers that block the enemy path (maze-building), you must handle path recalculation. When a tower is placed, all enemies currently navigating need updated paths. There are two common approaches: **fixed paths** (enemies follow a predetermined route and towers can only be placed alongside it) or **dynamic paths** (enemies pathfind in real time and towers reshape the maze). Fixed paths are simpler and perfectly valid for an MVP. Dynamic paths are more interesting but require careful performance management.

```
// Option A: Fixed path (defined at map creation)
FIXED_PATH = [(0,5), (1,5), (2,5), (2,6), (2,7), ...]

function moveEnemy(enemy):
    target = FIXED_PATH[enemy.pathIndex]
    moveToward(enemy, target)
    if reachedTarget(enemy, target):
        enemy.pathIndex += 1
        if enemy.pathIndex >= FIXED_PATH.length:
            enemyReachedGoal(enemy)

// Option B: Dynamic path (recalculate on tower placement)
function onTowerPlaced():
    newPath = aStar(grid, spawn, goal)
    if newPath == null:
        rejectPlacement()  // handled in placement validation
        return
    // Update all active enemies:
    for enemy in activeEnemies:
        enemy.path = aStar(grid, enemy.currentCell, goal)
```

**Why it matters:** Path recalculation is cache invalidation. When the grid changes (a tower is placed), all cached paths are stale and must be recomputed. Fixed paths are the simple option -- predictable, no invalidation needed. Dynamic paths are more flexible, but you pay the cost of recalculation every time the grid changes. Choosing between them is an architecture decision with familiar trade-offs: simplicity and predictability versus flexibility and computational cost.

---

### Stretch Goals

1. **Multiple enemy paths / spawn points** -- Enemies enter from multiple edges of the map, forcing the player to defend in multiple directions simultaneously. This tests whether your pathfinding and placement systems generalize beyond a single start/end pair.

2. **Tower selling with depreciation** -- Let the player sell towers for a percentage of their total investment (purchase + upgrades). This adds a "refactoring" mechanic: sometimes the optimal move is to tear down an old design and rebuild, accepting a resource loss for a better architecture.

3. **Special abilities / active skills** -- Give the player a cooldown-based ability (a bomb that damages all enemies in an area, a freeze that slows a wave, a gold bonus). This introduces cooldown management -- a timer-based system that prevents an action from being used again until a delay has elapsed.

4. **Creep types with special behaviors** -- Flying enemies that ignore the ground path (bypassing your maze entirely), healing enemies that restore HP to nearby creeps, or shielded enemies that are immune to certain tower types. Each special behavior forces the player to diversify their defense strategy rather than relying on a single dominant approach.

### MVP Spec

| Feature | Required? |
|---|---|
| Grid-based map with defined path or pathfinding | Yes |
| A* pathfinding (at minimum for initial path) | Yes |
| Tower placement with validation (affordability, valid cell) | Yes |
| At least 3 tower types with different stats | Yes |
| Economy system (gold from kills, spent on towers) | Yes |
| Targeting AI (at least one strategy; nearest is fine) | Yes |
| Range detection and range visualization | Yes |
| 5+ enemy waves with escalating difficulty | Yes |
| At least 2 enemy types (e.g., basic and fast) | Yes |
| Lives system (enemies reaching goal cost lives) | Yes |
| Game over when lives reach zero | Yes |
| Basic upgrade system (at least 1 upgrade per tower type) | Yes |
| Dynamic path recalculation on tower placement | Stretch |
| Branching upgrade paths | Stretch |
| Tower selling | Stretch |
| Multiple spawn points | Stretch |
| Flying / special enemy types | Stretch |
| Active abilities with cooldowns | Stretch |

### Deliverable

A playable single-player tower defense game. Enemies spawn in waves and follow a path toward a goal. The player places and upgrades towers using gold earned from kills. Towers automatically target and fire at enemies in range. The game ends when the player survives all waves (victory) or loses all lives (defeat). Submit a screen recording or playable link alongside your source code. Include a brief write-up (a few sentences is fine) explaining whether you chose fixed paths or dynamic pathfinding and why.

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| A* Pathfinding | Query optimizer cost model or network packet routing -- informed search using a heuristic to explore large state spaces efficiently |
| Placement Systems | Request validation with transactional rollback -- tentatively apply a change, check business rules / system invariants, commit or revert |
| Economy / Resource Management | Capacity planning -- budget allocation between immediate throughput (cheap infra now) and long-term efficiency (bigger investment later) |
| Targeting AI for Towers | Load balancer algorithms (round-robin, least-connections, weighted) or cache eviction policies (LRU, LFU) -- interchangeable strategies with the same interface |
| Range Detection | Geo-spatial queries in PostGIS or geofencing services -- at scale, brute-force becomes spatial indexing (R-trees, quadtrees) |
| Upgrade Trees | Feature flags or tiered pricing configuration -- static data structures interpreted at runtime, adding options means adding data not code |
| Wave Design | Load test scenarios -- sustained load, burst traffic, heavy requests, and peak events defined as declarative configuration (like CI/CD pipelines or job schedulers) |
| Path Recalculation | CDN cache invalidation or routing table recomputation -- when state changes, cached results are stale and must be recomputed |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| A* Pathfinding | DOM traversal with a heuristic -- like a best-first search through a component tree to find the optimal render path |
| Placement Systems | Form validation with optimistic UI -- show the change, validate against rules, revert the DOM if validation fails |
| Economy / Resource Management | State budget in a Redux/Zustand store -- every action (purchase/earn) is a dispatched event that updates a central balance |
| Targeting AI for Towers | Event delegation with different handler strategies -- the same listener interface, but the selection logic (nearest, first, strongest) is swappable |
| Range Detection | Bounding-rect intersection checks (`getBoundingClientRect`) for detecting which elements overlap a circular region |
| Upgrade Trees | Nested component configuration objects -- a JSON structure that defines what a component renders, extended by adding data |
| Wave Design | Declarative animation sequences (CSS keyframes or Framer Motion) -- timed events defined as configuration, not imperative code |
| Path Recalculation | Virtual DOM diffing after state change -- when the underlying data changes, the rendered output must be recomputed and reconciled |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| A* Pathfinding | Best-first search through a state space, like beam search in sequence models -- a heuristic guides exploration toward the goal |
| Placement Systems | Constraint satisfaction with rollback -- like checking that adding a feature to a model does not violate multicollinearity constraints |
| Economy / Resource Management | Compute budget allocation -- spend GPU hours on quick experiments now or save for a large training run later |
| Targeting AI for Towers | Scoring functions for candidate selection -- rank items by different criteria (distance, strength), same interface as ranking models or selection policies in RL |
| Range Detection | k-nearest-neighbors spatial query -- at scale, brute-force distance checks become KD-trees or approximate nearest neighbor indexes |
| Upgrade Trees | Hyperparameter configuration trees -- branching options defined as data (YAML/JSON), parsed and applied at runtime |
| Wave Design | Synthetic data generation schedules -- batches of varying size, type, and difficulty defined declaratively, like a data pipeline DAG |
| Path Recalculation | Recomputing a downstream feature when an upstream input changes -- like cache invalidation in a feature store or re-running a DAG node |

### Discussion Questions

1. **A* in the real world.** A* requires an admissible heuristic -- one that never overestimates the true cost. Manhattan distance works for a 4-directional grid. Where else have you encountered heuristic-driven search or optimization in backend systems? How does a database query optimizer's cost model relate to A*'s heuristic?

2. **Static vs. dynamic routing.** Fixed paths are simpler but less interesting. Dynamic pathfinding is more complex but lets the player build mazes. How does this trade-off mirror the choice between static routing and dynamic routing in network infrastructure or microservice mesh configurations?

3. **Economy balance as system design.** If towers are too cheap, the game is trivially easy. If enemies give too little gold, the game is impossible. How do you approach balancing an economy like this? What does playtesting an in-game economy have in common with capacity planning or cost optimization for cloud infrastructure?

4. **Performance and spatial queries.** In an MVP, checking every enemy against every tower each frame is fine. At what scale does this break down, and what data structures (quadtrees, spatial hashing) would you reach for? How do these relate to spatial indexing in databases or geofencing services you have worked with?

---

## Prerequisites

- **Module 01 (Pong) -- recommended.** Pong introduces the game loop, input handling, and collision detection. Tower defense builds on all of these fundamentals.
- **Module 03 (Top-Down Shooter) -- recommended.** The top-down shooter introduces wave spawning, enemy AI, and projectile systems. Tower defense reuses all three concepts but shifts the player's role from direct combatant to architect. If you completed Module 03, you will find the wave and projectile systems familiar; the new challenges are pathfinding, placement, and economy.
