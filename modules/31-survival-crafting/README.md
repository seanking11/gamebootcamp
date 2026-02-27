# Module 31: Survival / Crafting
**Dropped into a hostile world with nothing — gather, craft, and build your way to survival | Wilderness Survival**
> "The genius of survival games is that a wooden door feels like a fortress when you built it yourself from trees you chopped with an axe you made from sticks you picked up off the ground."
---

## Prerequisites

| Module | What You'll Reuse |
|--------|-------------------|
| Module 7 — Roguelike | Inventory management, procedural generation, tile-based world |
| Module 3 — Shooter | Entity systems, health/damage, basic AI behaviors |

---

## Week 1: History & Design Theory

### The Origin

**Minecraft** did not invent the survival game, but it defined the modern template when Markus "Notch" Persson released the alpha in 2009 and the full version in 2011. The concept was disarmingly simple: you spawn in a procedurally generated world made of blocks. You can break any block with your hands. Breaking a tree gives you wood. Wood can be crafted into planks, planks into sticks, sticks and planks into a pickaxe. The pickaxe breaks stone faster. Stone makes better tools. Better tools access better materials. And then night falls, and monsters come. Minecraft's genius was the crafting tree — every material led to something that led to something else, and the survival pressure (hostile mobs at night) provided just enough motivation to keep climbing the tech tree without dictating how. Players could build a survival bunker, a cathedral, a functioning computer, or just dig straight down. The gather-craft-survive loop was so satisfying because each link in the chain felt earned, and the world's hostility made every shelter, every torch, every cooked meal feel like a personal victory.

### How the Genre Evolved

**Minecraft (2011)** — Mojang's block-based world established the genre's core loop: punch tree, get wood, craft tools, mine deeper, build shelter, survive the night. The procedural world meant every player's experience was unique, and the crafting tree provided a progression ladder without a scripted campaign. Minecraft proved two things that shaped the entire genre: first, that gathering and crafting are inherently satisfying even without traditional goals; second, that a world hostile enough to threaten the player but not so hostile as to crush them creates the perfect motivation to engage with the crafting system.

**Don't Starve (2013)** — Klei Entertainment took the survival formula and dialed up the consequence. Where Minecraft's death meant losing your inventory, Don't Starve's death was permanent. The game tracked hunger, health, and sanity — three stats that all drained simultaneously and required different resources to restore. Night was lethal without a light source (instant death in total darkness). Seasons changed the rules entirely: summer brought heat stroke, winter brought freezing. Don't Starve proved that survival games could be tightly designed around resource scarcity rather than open-ended exploration, and that multiple competing survival stats created more interesting decisions than a single health bar.

**Valheim (2021)** — Iron Gate Studio added a critical ingredient the genre had underexplored: progression that felt like an adventure. Valheim structured its crafting tree around boss fights — defeating each boss unlocked the tools needed to harvest the next tier of materials in the next biome. The building system was physics-based (structures needed support) and created satisfying architectural challenges. But Valheim's most important contribution was co-op scaling: the game was designed for 1-10 players, and the world's difficulty scaled accordingly. Valheim showed that the survival loop was not just a solo experience but a social one, where division of labor (one player mines, another builds, another explores) replicated the cooperative survival strategies humans actually use.

### What Makes It "Great"

A great survival game makes the player feel like they earned every inch of safety. The world starts hostile and stays hostile — the key is that the player's relationship to that hostility changes. On night one, a dark cave is terrifying. By night twenty, the player has a walled base with torches, a furnace, iron tools, and enough food to last a week. The world did not get easier; the player got more capable, and every piece of that capability was built by hand from raw materials. The crafting tree is the spine of the experience — each tier unlocks not just better stats but new verbs (smelting, farming, enchanting), and each new verb opens the world further. The best survival games balance two feelings: the vulnerability of knowing you are one mistake from death, and the pride of knowing everything you own, you made.

### The Essential Mechanic

The gather-craft-survive loop — turning raw materials into tools that enable gathering better materials.

---

## Week 2: Build the MVP

### What You're Building

A **top-down survival game** on a grid-based world. The player spawns with nothing in a world containing trees, rocks, bushes, and ore deposits. They can gather raw materials by interacting with world objects (punch tree for wood, mine rock for stone). Using a crafting menu, they combine materials into tools (axe, pickaxe), structures (wall, door, campfire), and consumables (cooked meat). The player has three survival stats — health, hunger, and thirst — that drain over time. A day/night cycle affects visibility and enemy spawns: during the day, the world is safe for gathering; at night, hostile creatures emerge and move toward the player. The player must build shelter and manage resources to survive as many days as possible. Each night is harder than the last.

### Core Concepts

**1. Resource Gathering Loop**

The player interacts with world objects to harvest raw materials. Each object type yields specific resources and has a durability (number of hits before it is depleted). Some objects require specific tools — bare hands can gather wood and berries, but stone requires a pickaxe, and ore requires an iron pickaxe. Depleted objects can optionally regrow over time.

```
WORLD_OBJECTS = {
    "tree":     {resource: "wood",   amount: 3, hitsToBreak: 5, requiresTool: null,      regrowDays: 3},
    "rock":     {resource: "stone",  amount: 2, hitsToBreak: 8, requiresTool: "pickaxe", regrowDays: 0},
    "bush":     {resource: "berry",  amount: 2, hitsToBreak: 1, requiresTool: null,      regrowDays: 2},
    "ore_vein": {resource: "iron",   amount: 1, hitsToBreak: 12, requiresTool: "iron_pickaxe", regrowDays: 0},
    "animal":   {resource: "raw_meat", amount: 2, hitsToBreak: 3, requiresTool: null,    regrowDays: 0}
}

function gatherResource(player, worldObject):
    objData = WORLD_OBJECTS[worldObject.type]

    // Check tool requirement
    if objData.requiresTool != null:
        if not player.hasEquipped(objData.requiresTool):
            return "Requires " + objData.requiresTool

    worldObject.durability -= getToolDamage(player.equippedTool)

    if worldObject.durability <= 0:
        // Yield resources
        player.inventory.add(objData.resource, objData.amount)

        if objData.regrowDays > 0:
            worldObject.state = DEPLETED
            worldObject.regrowTimer = objData.regrowDays
        else:
            world.remove(worldObject)

        return "Gathered " + objData.amount + " " + objData.resource

    return "Hit! " + worldObject.durability + " remaining"

function tickRegrowth():
    for each obj in world.depletedObjects:
        obj.regrowTimer -= 1
        if obj.regrowTimer <= 0:
            obj.state = ACTIVE
            obj.durability = WORLD_OBJECTS[obj.type].hitsToBreak
```

*Why it matters:* The gathering loop is the foundation everything else is built on. Every tool, structure, meal, and weapon begins as a raw material in the world. The tool-gating system (need a pickaxe to mine stone, need stone to make a better pickaxe) creates natural progression tiers that guide the player without a tutorial. Gathering feels rewarding because each resource collected is potential — it could become a wall, a weapon, or a meal.

**2. Crafting Tree**

Recipes form a dependency tree: raw materials produce basic tools, basic tools enable access to better materials, better materials produce advanced tools and structures. The crafting menu shows all recipes but grays out those whose ingredients the player lacks. Each recipe has a category (tools, structures, consumables) and some recipes are unlocked only after crafting their prerequisites.

```
RECIPES = {
    // Tier 1 — no tools needed
    "wood_axe":      {ingredients: {"wood": 3, "stone": 2}, category: "tools",     tier: 1},
    "wood_pickaxe":  {ingredients: {"wood": 3, "stone": 2}, category: "tools",     tier: 1},
    "campfire":      {ingredients: {"wood": 5, "stone": 3}, category: "structures", tier: 1},
    "wood_wall":     {ingredients: {"wood": 4},             category: "structures", tier: 1},
    "wood_door":     {ingredients: {"wood": 6},             category: "structures", tier: 1},

    // Tier 2 — requires tier 1 tools
    "stone_axe":     {ingredients: {"wood": 2, "stone": 5}, category: "tools",     tier: 2, requires: "wood_pickaxe"},
    "stone_pickaxe": {ingredients: {"wood": 2, "stone": 5}, category: "tools",     tier: 2, requires: "wood_pickaxe"},
    "furnace":       {ingredients: {"stone": 10},           category: "structures", tier: 2, requires: "wood_pickaxe"},
    "cooked_meat":   {ingredients: {"raw_meat": 1},         category: "consumable", tier: 1, nearRequired: "campfire"},

    // Tier 3 — requires furnace + iron
    "iron_pickaxe":  {ingredients: {"wood": 2, "iron": 3},  category: "tools",     tier: 3, requires: "furnace"}
}

function getAvailableRecipes(player):
    available = []
    for each name, recipe in RECIPES:
        // Check prerequisite crafting
        if recipe.requires and not player.hasCrafted(recipe.requires):
            continue
        // Check proximity requirement
        if recipe.nearRequired and not isNearStructure(player, recipe.nearRequired):
            continue
        available.add({name: name, recipe: recipe, canCraft: hasIngredients(player, recipe)})
    return available

function craft(player, recipeName):
    recipe = RECIPES[recipeName]
    if not hasIngredients(player, recipe):
        return "Missing ingredients"

    for each item, count in recipe.ingredients:
        player.inventory.remove(item, count)

    player.inventory.add(recipeName, 1)
    player.craftedRecipes.add(recipeName)
    return "Crafted " + recipeName
```

*Why it matters:* The crafting tree IS the progression system. There are no experience points, no skill trees, no level-ups. You progress by crafting better things, and better things let you access better materials, which let you craft even better things. The tree structure means the player always has a visible next goal ("I need 3 more iron to make the iron pickaxe"), and that goal drives all their gathering, exploration, and risk-taking decisions.

**3. Hunger / Thirst / Health Drain**

Three stats drain over time. Hunger and thirst decrease steadily; if either hits zero, health begins draining. Health also decreases from enemy attacks and environmental hazards. Eating food restores hunger, drinking water restores thirst, and specific items (bandages, medicine) restore health. The player must continuously gather and consume resources just to stay alive.

```
STAT_CONFIG = {
    hunger: {maxValue: 100, drainRate: 1.5,  healthDrainWhenEmpty: 2.0},
    thirst: {maxValue: 100, drainRate: 2.0,  healthDrainWhenEmpty: 3.0},
    health: {maxValue: 100, drainRate: 0.0}   // Health only drains from damage or empty hunger/thirst
}

function updateSurvivalStats(player, deltaTime):
    // Drain hunger and thirst
    player.hunger -= STAT_CONFIG.hunger.drainRate * deltaTime
    player.thirst -= STAT_CONFIG.thirst.drainRate * deltaTime

    // Clamp to zero
    player.hunger = max(player.hunger, 0)
    player.thirst = max(player.thirst, 0)

    // Drain health if hunger or thirst depleted
    if player.hunger <= 0:
        player.health -= STAT_CONFIG.hunger.healthDrainWhenEmpty * deltaTime
    if player.thirst <= 0:
        player.health -= STAT_CONFIG.thirst.healthDrainWhenEmpty * deltaTime

    if player.health <= 0:
        triggerDeath(player)

function consumeItem(player, item):
    effects = CONSUMABLE_DATA[item.type]
    if effects.hunger:
        player.hunger = min(player.hunger + effects.hunger, STAT_CONFIG.hunger.maxValue)
    if effects.thirst:
        player.thirst = min(player.thirst + effects.thirst, STAT_CONFIG.thirst.maxValue)
    if effects.health:
        player.health = min(player.health + effects.health, STAT_CONFIG.health.maxValue)
    player.inventory.remove(item.type, 1)

// Consumable data
CONSUMABLE_DATA = {
    "berry":        {hunger: 10, thirst: 5,  health: 0},
    "cooked_meat":  {hunger: 40, thirst: 0,  health: 10},
    "raw_meat":     {hunger: 15, thirst: 0,  health: -5},   // Eating raw hurts you
    "water_flask":  {hunger: 0,  thirst: 50, health: 0}
}
```

*Why it matters:* Multiple draining stats create competing priorities. If you only tracked health, the player would just avoid damage. With hunger and thirst, the player must actively seek resources even when no enemies are present. The interplay between stats creates interesting decisions: do you eat the berries now for a small hunger boost, or save them because you are about to enter a dangerous area where you might need every inventory slot for weapons?

**4. Day/Night Cycle**

A continuous clock cycles between day and night. During the day, the world is lit, enemies do not spawn, and the player can gather safely. At dusk, a warning triggers. At night, visibility drops to a radius around the player (or around light sources), and hostile enemies spawn at the map edges and move toward the player. Dawn despawns remaining enemies. The cycle length is tunable, and each successive night can be longer or spawn more enemies.

```
DAY_NIGHT_CONFIG = {
    dayDuration: 180,       // seconds of real time
    nightDuration: 120,     // seconds of real time
    duskWarningTime: 15,    // seconds before night
    playerLightRadius: 3,   // tiles visible at night without campfire
    campfireLightRadius: 6
}

dayNightClock = {
    time: 0,
    phase: "day",  // "day", "dusk", "night", "dawn"
    dayCount: 1
}

function updateDayNight(deltaTime):
    dayNightClock.time += deltaTime
    totalCycleDuration = DAY_NIGHT_CONFIG.dayDuration + DAY_NIGHT_CONFIG.nightDuration

    if dayNightClock.time >= totalCycleDuration:
        dayNightClock.time -= totalCycleDuration
        dayNightClock.dayCount += 1

    if dayNightClock.time < DAY_NIGHT_CONFIG.dayDuration - DAY_NIGHT_CONFIG.duskWarningTime:
        dayNightClock.phase = "day"
    else if dayNightClock.time < DAY_NIGHT_CONFIG.dayDuration:
        dayNightClock.phase = "dusk"
        showWarning("Night is approaching...")
    else:
        dayNightClock.phase = "night"

function getVisibilityRadius(player):
    if dayNightClock.phase == "day" or dayNightClock.phase == "dusk":
        return FULL_VISIBILITY

    radius = DAY_NIGHT_CONFIG.playerLightRadius
    // Check for nearby campfires
    for each structure in getNearbyStructures(player.position):
        if structure.type == "campfire" and structure.lit:
            radius = max(radius, DAY_NIGHT_CONFIG.campfireLightRadius)
    return radius

function spawnNightEnemies():
    if dayNightClock.phase != "night":
        return

    enemiesToSpawn = BASE_ENEMIES + (dayNightClock.dayCount * ESCALATION_PER_NIGHT)
    for i in range(enemiesToSpawn):
        spawnPos = getRandomEdgePosition(world)
        enemy = createEnemy("hostile", spawnPos)
        enemy.target = player
        world.enemies.add(enemy)
```

*Why it matters:* The day/night cycle creates the fundamental rhythm of survival games: gather during the day, survive at night. It gives the crafting system purpose (you build shelter and campfires because night is coming), creates natural time pressure (you need enough resources before sunset), and makes light a gameplay mechanic rather than just a visual feature. The escalation across nights (more enemies, longer darkness) prevents the player from ever feeling fully safe.

**5. Base Building / Structure Placement**

The player places crafted structures (walls, doors, campfires) onto the grid. Walls block enemy pathfinding, doors can be opened by the player but not by basic enemies, and campfires provide light and enable cooking. The system validates placement (no overlapping, must be on empty ground) and structures have durability — enemies attack structures to break through.

```
STRUCTURE_DATA = {
    "wood_wall":   {durability: 50,  blocksMovement: true,  blocksEnemies: true,  lightRadius: 0},
    "wood_door":   {durability: 30,  blocksMovement: false, blocksEnemies: true,  lightRadius: 0},
    "campfire":    {durability: 100, blocksMovement: false, blocksEnemies: false, lightRadius: 6,
                    fuelDuration: 120, lit: true},
    "furnace":     {durability: 200, blocksMovement: true,  blocksEnemies: true,  lightRadius: 2}
}

function placeStructure(player, structureType, gridX, gridY):
    if not player.inventory.has(structureType):
        return "Not in inventory"

    tile = world.grid[gridX][gridY]
    if tile.occupied or tile.terrain == WATER:
        return "Cannot place here"

    structure = {
        type: structureType,
        durability: STRUCTURE_DATA[structureType].durability,
        maxDurability: STRUCTURE_DATA[structureType].durability,
        position: {x: gridX, y: gridY},
        lit: STRUCTURE_DATA[structureType].lightRadius > 0
    }

    tile.structure = structure
    tile.occupied = true
    player.inventory.remove(structureType, 1)

    // Update pathfinding grid
    if STRUCTURE_DATA[structureType].blocksEnemies:
        pathfindingGrid.setBlocked(gridX, gridY, true)

    return "Placed " + structureType

function damageStructure(structure, damage):
    structure.durability -= damage
    if structure.durability <= 0:
        tile = world.grid[structure.position.x][structure.position.y]
        tile.structure = null
        tile.occupied = false
        pathfindingGrid.setBlocked(structure.position.x, structure.position.y, false)
        // Drop some materials
        dropMaterials(structure.position, getScrapMaterials(structure.type))
```

*Why it matters:* Base building transforms the survival experience from reactive to proactive. Without it, the player runs from enemies every night. With it, the player designs a defensive perimeter, chooses where to put the door, decides which walls to reinforce. The base is the player's home, and defending it creates an emotional investment that pure combat cannot match. Structures also interact with other systems — walls redirect pathfinding, campfires provide light and cooking, doors create chokepoints.

**6. World Persistence**

The world state — every gathered resource, placed structure, and depleted object — must be serializable and loadable. When the player saves, the entire grid state, player inventory, survival stats, day count, and all entity positions are written to a data format. Loading restores the world exactly as it was. This is essential for a game that plays out over many real-world sessions.

```
function saveGame(world, player):
    saveData = {
        version: SAVE_VERSION,
        dayCount: dayNightClock.dayCount,
        dayNightTime: dayNightClock.time,

        player: {
            position: player.position,
            health: player.health,
            hunger: player.hunger,
            thirst: player.thirst,
            inventory: serializeInventory(player.inventory),
            craftedRecipes: player.craftedRecipes.toList()
        },

        grid: [],
        entities: []
    }

    // Serialize grid state
    for each tile in world.grid:
        if tile.modified:  // Only save changed tiles
            saveData.grid.add({
                x: tile.x, y: tile.y,
                terrain: tile.terrain,
                object: tile.worldObject ? serializeObject(tile.worldObject) : null,
                structure: tile.structure ? serializeStructure(tile.structure) : null
            })

    writeToFile("save.json", serialize(saveData))

function loadGame():
    saveData = deserialize(readFile("save.json"))

    if saveData.version != SAVE_VERSION:
        return migrateOrFail(saveData)

    world = generateBaseWorld(saveData.worldSeed)

    // Apply modifications
    for each tileData in saveData.grid:
        tile = world.grid[tileData.x][tileData.y]
        tile.terrain = tileData.terrain
        tile.worldObject = tileData.object ? deserializeObject(tileData.object) : null
        tile.structure = tileData.structure ? deserializeStructure(tileData.structure) : null

    player = restorePlayer(saveData.player)
    dayNightClock.dayCount = saveData.dayCount
    dayNightClock.time = saveData.dayNightTime

    return {world, player}
```

*Why it matters:* A survival game without persistence is a roguelike. Persistence is what allows the player to build something over time — a base that grows night by night, a stockpile that accumulates, a world that bears the marks of their decisions. Saving also has design implications: Do you allow saving anywhere (safety net) or only at specific locations (risk)? Do you save automatically (protection) or manually (player agency)? These are not technical questions — they are game design decisions about how much consequence death should carry.

**7. Threat Escalation**

Each successive night is harder than the last. The simplest implementation: more enemies spawn per night, and after certain day thresholds, tougher enemy types appear. This creates a soft timer on the game — the player must progress through the crafting tree fast enough to build defenses that can handle the escalating threat. Stagnation is death.

```
ENEMY_TYPES = {
    "zombie":       {health: 20,  damage: 5,  speed: 1.0, spawnAfterDay: 1},
    "fast_zombie":  {health: 15,  damage: 8,  speed: 2.0, spawnAfterDay: 4},
    "brute":        {health: 60,  damage: 15, speed: 0.7, spawnAfterDay: 7,
                     attacksStructures: true, structureDamage: 20}
}

ESCALATION = {
    baseEnemyCount: 3,
    enemiesPerNight: 2,         // +2 enemies per night
    maxEnemiesPerNight: 30,
    bossEveryNNights: 5         // Special wave every 5 nights
}

function getSpawnTableForNight(nightNumber):
    spawnTable = []
    totalEnemies = min(
        ESCALATION.baseEnemyCount + (nightNumber * ESCALATION.enemiesPerNight),
        ESCALATION.maxEnemiesPerNight
    )

    for i in range(totalEnemies):
        // Pick enemy type based on what's available this night
        availableTypes = ENEMY_TYPES.filter(e => e.spawnAfterDay <= nightNumber)

        // Weight toward harder enemies as nights progress
        weights = []
        for each type in availableTypes:
            weight = 1.0 + (nightNumber - type.spawnAfterDay) * 0.3
            weights.add(weight)

        chosen = weightedRandomChoice(availableTypes, weights)
        spawnTable.add(chosen)

    // Boss wave
    if nightNumber % ESCALATION.bossEveryNNights == 0:
        spawnTable.add(createBossEnemy(nightNumber))

    return spawnTable

function updateEnemy(enemy, deltaTime):
    // Simple AI: move toward player, attack if adjacent
    if isAdjacent(enemy.position, player.position):
        attackPlayer(enemy, player)
    else if enemy.attacksStructures and isAdjacentToStructure(enemy):
        structure = getAdjacentStructure(enemy)
        damageStructure(structure, enemy.structureDamage * deltaTime)
    else:
        direction = pathfindToward(enemy.position, player.position)
        enemy.position += direction * enemy.speed * deltaTime
```

*Why it matters:* Without escalation, survival games stagnate. Once the player has food, water, and a shelter, there is no reason to keep playing. Escalation is the design tool that converts a sandbox into a game with tension — it is the reason you need iron tools, not just stone ones. The escalation curve must be carefully tuned: too gentle and the player gets bored; too steep and the player feels punished for exploring. The sweet spot is when the player feels like they are barely keeping up — always one tier of tools behind the threat level.

### Stretch Goals

- Add biomes (forest, desert, snow) with unique resources and hazards
- Implement a temperature system (cold at night, hot in desert, clothing provides insulation)
- Add a simple farming system (plant seeds, wait for crops, sustain food supply)
- Create multiplayer support where two players share the same world
- Add a map/minimap that reveals as the player explores (fog of war)

### MVP Spec

| Component | Minimum Viable Version |
|-----------|----------------------|
| World | 32x32 tile grid with trees, rocks, bushes, ore veins |
| Gathering | Interact with world objects to collect wood, stone, berries, iron, raw meat |
| Crafting | 10 recipes across 3 tiers (wood tools, stone tools, iron tools + structures + food) |
| Survival Stats | Health, hunger, thirst — drain over time, replenished by consuming items |
| Day/Night Cycle | 3-minute day, 2-minute night, visual darkness with light radius |
| Enemies | Spawn at night, pathfind toward player, attack player and structures |
| Base Building | Place walls, doors, campfires on the grid |
| Escalation | More enemies per night, tougher types after days 4 and 7 |
| Persistence | Save/load entire world state to a file |
| Win/Lose | Survive as many nights as possible; die when health reaches zero |

### Deliverable

A playable survival game where the player gathers resources from a grid-based world, crafts tools and structures through a tiered recipe system, manages hunger/thirst/health stats, builds a base to defend against nightly enemy waves, and survives as long as possible against escalating threats. The game must demonstrate the complete gather-craft-survive loop, a functional day/night cycle with enemy spawning, and world persistence through save/load.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|-------------|---------|
| Resource Gathering Loop | Like harvesting metrics from distributed services — each source yields specific data types, some require authenticated access (tool-gated), and you aggregate raw data for processing |
| Crafting Tree | Like a build system dependency graph — the final artifact depends on intermediate artifacts, which depend on raw source files, and the build fails if any dependency is missing |
| Hunger / Thirst / Health Drain | Like system resource depletion — CPU, memory, and disk fill up over time, and if any reaches capacity without intervention, the process crashes (player dies) |
| Day/Night Cycle | Like peak and off-peak traffic patterns — daytime is low-load (safe gathering), nighttime is high-load (enemy waves), and your infrastructure (base) must handle the peak |
| Base Building | Like configuring firewalls and network rules — each wall blocks a path, each door is a controlled access point, and the topology of your defenses determines what gets through |
| World Persistence | Like database state management — the world is the database, every action is a transaction, and save/load is backup and restore with schema versioning for compatibility |
| Threat Escalation | Like scaling load tests — each iteration increases requests per second, and if your system (base and gear) cannot handle the current load, it falls over |

### Frontend Developers

| Core Concept | Analogy |
|-------------|---------|
| Resource Gathering Loop | Like pulling data from various API endpoints — each endpoint returns a specific resource type, some require authorization (tools), and you store the results in local state (inventory) |
| Crafting Tree | Like a component dependency tree — the page component requires a header, sidebar, and content component, each of which requires its own sub-components, all resolved at build time |
| Hunger / Thirst / Health Drain | Like browser resource limits — memory usage, CPU time, and network bandwidth are all finite, and if any is exhausted (tab crashes), the user experience dies |
| Day/Night Cycle | Like a light/dark theme toggle on a global timer — the entire rendering pipeline switches based on the current phase, affecting colors, visibility, and which UI elements appear |
| Base Building | Like drag-and-drop layout builders — each placed element snaps to a grid, validates against placement rules (no overlapping), and the resulting layout affects how users (enemies) navigate the page |
| World Persistence | Like saving application state to localStorage — the entire app state serializes to JSON, and on reload the app hydrates from the saved state, restoring exactly where the user left off |
| Threat Escalation | Like progressively loading heavier content — each scroll depth triggers more complex components, and if the page is not optimized (player not geared up), performance degrades and the user bounces |

### Data / ML Engineers

| Core Concept | Analogy |
|-------------|---------|
| Resource Gathering Loop | Like data collection from heterogeneous sources — each source has its own format and access requirements, and raw data must be ingested before any processing can begin |
| Crafting Tree | Like a feature engineering pipeline — raw features are transformed into intermediate features, which are combined into final feature vectors, and each step depends on the previous |
| Hunger / Thirst / Health Drain | Like model degradation over time — accuracy, latency, and data freshness all decay without active maintenance (retraining, cache refresh, infrastructure upkeep) |
| Day/Night Cycle | Like batch vs. streaming modes — daytime is batch processing (safe, predictable), nighttime is real-time streaming under load (enemies arrive continuously, latency matters) |
| Base Building | Like designing a data pipeline architecture — each component (wall, door, campfire) serves a specific function, and the topology determines throughput, fault tolerance, and bottlenecks |
| World Persistence | Like experiment tracking and model checkpointing — the entire state (model weights, hyperparameters, training progress) must be serializable and reproducible across sessions |
| Threat Escalation | Like adversarial training with increasing difficulty — each epoch introduces harder examples, and the model (player) must generalize from easier cases to survive harder ones |

---

## Discussion Questions

1. **The Crafting Tree as Implicit Tutorial:** Minecraft never tells you to make a pickaxe before mining stone — the crafting tree forces it. How does designing a crafting dependency graph replace traditional tutorials? What are the failure modes (player stuck, unclear next step), and how do you mitigate them without adding explicit instructions?

2. **Balancing Scarcity:** Don't Starve is punishing; Minecraft on easy mode is forgiving. Both are successful. How do you tune survival stat drain rates, enemy difficulty, and resource availability to hit a target difficulty level? What metrics would you track during playtesting to know if your balance is right?

3. **Persistence and Consequence:** Minecraft lets you respawn and recover your items. Don't Starve kills you permanently. Valheim destroys your inventory but keeps your world. How does the consequence of death change how players engage with the crafting and building systems? What would your MVP's death penalty be, and why?

4. **The Late-Game Problem:** Most survival games become trivially easy once the player reaches the top crafting tier and builds an impenetrable base. How do you keep the game interesting after the survival pressure is solved? Is escalation enough, or do you need a fundamentally different end-game loop?
