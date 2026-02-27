# Module 38: Sandbox
**Build a world where the player makes the rules | Digital Legos on an Infinite Table**
> "The best sandbox game gives you every tool and no instructions -- and somehow that's enough."
---

## Prerequisites

- **Module 31: Survival/Crafting** or **Module 5: Puzzle** -- You need grid-based world representation and item/block interaction patterns. Sandbox games extend grids to open-ended, player-authored worlds.
- **Module 7: Roguelike** -- You need procedural generation fundamentals. Sandbox worlds are generated, not hand-designed, and noise functions drive terrain creation.

## Week 1: History & Design Theory

### The Origin

The sandbox genre crystallized when a Swedish programmer named Markus "Notch" Persson released an early alpha of **Minecraft** in 2009, drawing inspiration from Infiniminer, Dwarf Fortress, and his own love of building. The premise was disarmingly simple: a world made of blocks, and you can place or destroy any of them. There were no objectives, no score, no win condition. You spawned in a procedurally generated landscape and decided what to do. Some players built castles. Some dug to the bottom of the world. Some recreated entire cities from real life. Minecraft did not invent the sandbox -- games like SimCity and Garry's Mod had explored player freedom before -- but it distilled the concept to its purest form. A world of blocks was a world of infinite possibility because every block was both a material and a canvas. By 2011, Minecraft was a global phenomenon, and the idea that a game could succeed without a designer-authored goal had been proven beyond any doubt.

### How the Genre Evolved

- **Garry's Mod (Facepunch Studios, 2004)** -- Started as a mod for Half-Life 2 that gave players access to the Source engine's physics objects and tools. Garry's Mod was not a game but a playground: spawn props, weld them together, attach thrusters, and see what happens. It pioneered the idea that the game engine itself -- its physics, its rendering, its entity system -- could be the toy. The community created game modes (Trouble in Terrorist Town, Prop Hunt) that turned the sandbox into a platform for entirely new games. Garry's Mod proved that when you give players tools and physics, they will create content you never imagined.

- **Minecraft (Mojang, 2011)** -- Defined the modern sandbox by combining block-based building with procedural terrain generation, survival mechanics, and crafting. Minecraft's procedural worlds meant no two players saw the same landscape, yet every player had the same tools. The addition of Survival mode (hunger, monsters, resource gathering) gave structure to the freeform creative experience, but Creative mode remained equally valid. Minecraft demonstrated that a game with intentionally simple graphics could become the best-selling game of all time by betting everything on player agency and systemic depth.

- **Terraria (Re-Logic, 2011)** -- Applied the sandbox formula to 2D, adding boss fights, loot progression, and biome variety to the building-and-mining core. Terraria proved that sandboxes did not need to be 3D to feel vast, and that adding authored content (bosses, events, rare items) to a player-driven world created a compelling hybrid. Where Minecraft leaned into open-ended creation, Terraria leaned into exploration and combat -- showing that the sandbox concept was flexible enough to support very different player motivations within the same genre.

### What Makes It "Great"

A great sandbox game trusts the player completely. It provides a world with consistent rules -- gravity pulls, water flows, fire spreads -- and then steps back. The rules must be discoverable through experimentation rather than explained through tutorials. The world must be large enough to feel like exploration matters and systemic enough that interactions between blocks create emergent surprises (water meeting lava creates obsidian; a lit torch next to a wood structure creates fire). The creative tools must have both a low floor (place a block, break a block) and a high ceiling (redstone computers, pixel art landscapes, functional machines). And critically, the world must feel like it belongs to the player: they shaped it, they built it, and when they log in tomorrow, it will be exactly as they left it. Persistence is what turns a toy into a home.

### The Essential Mechanic

Player-directed creation in a systemic world -- you make your own fun.

---

## Week 2: Build the MVP

### What You're Building

A 2D block-based sandbox where the player can place and destroy blocks on a grid, explore a procedurally generated terrain (hills, caves, surface variation), interact with blocks that follow physical rules (sand falls, water flows), save and load the world state, and switch between Creative mode (unlimited blocks, no threats) and Survival mode (limited inventory, health). The world is divided into chunks that load and unload as the player moves.

### Core Concepts

**1. Voxel / Block-based World**

The world is a grid where every cell holds a block type. In 2D, this is a large 2D array. In 3D, it is a 3D array. Each block type has properties (solid, transparent, gravity-affected) and the player interacts by placing or removing blocks.

```
// Block type definitions
BLOCK_TYPES:
    AIR:    { id: 0, solid: false, transparent: true,  gravity: false }
    DIRT:   { id: 1, solid: true,  transparent: false, gravity: false }
    STONE:  { id: 2, solid: true,  transparent: false, gravity: false }
    SAND:   { id: 3, solid: true,  transparent: false, gravity: true  }
    WATER:  { id: 4, solid: false, transparent: true,  gravity: true, fluid: true }
    WOOD:   { id: 5, solid: true,  transparent: false, gravity: false, flammable: true }
    GRASS:  { id: 6, solid: true,  transparent: false, gravity: false }

// World as a 2D grid
class BlockWorld:
    grid = {}  // (x, y) -> blockId

    function getBlock(x, y):
        return grid.get((x, y), AIR.id)

    function setBlock(x, y, blockId):
        if blockId == AIR.id:
            grid.remove((x, y))  // don't store air explicitly
        else:
            grid[(x, y)] = blockId
        markChunkDirty(x, y)

    // Player interaction
    function placeBlock(x, y, blockId):
        if getBlock(x, y) == AIR.id:
            setBlock(x, y, blockId)
            triggerBlockUpdate(x, y)  // notify neighbors

    function destroyBlock(x, y):
        existing = getBlock(x, y)
        if existing != AIR.id:
            setBlock(x, y, AIR.id)
            spawnDroppedItem(x, y, existing)  // in survival mode
            triggerBlockUpdate(x, y)
```

**Why it matters:** The block grid is the world. Every other system -- rendering, physics, saving, generation -- reads from and writes to this grid. Keeping the data structure simple (a map of coordinates to block IDs) makes everything else straightforward. The decision to store only non-air blocks is a critical optimization for large worlds where most of the space is empty.

**2. Chunk-based World Loading**

The world is divided into fixed-size chunks (e.g., 16x16 blocks). Only chunks near the player are loaded into memory. As the player moves, new chunks are generated or loaded, and distant chunks are unloaded and saved to disk.

```
CHUNK_SIZE = 16  // blocks per chunk side

class Chunk:
    chunkX: int       // chunk coordinate (not block coordinate)
    chunkY: int
    blocks: array[CHUNK_SIZE][CHUNK_SIZE]
    isDirty: boolean  // modified since last save?
    mesh: renderable  // cached render data

    function getBlock(localX, localY):
        return blocks[localX][localY]

    function setBlock(localX, localY, blockId):
        blocks[localX][localY] = blockId
        isDirty = true
        mesh = null  // invalidate render cache

class ChunkManager:
    loadedChunks = {}   // (chunkX, chunkY) -> Chunk
    LOAD_RADIUS = 4     // chunks around player to keep loaded

    function update(playerPosition):
        playerChunkX = floor(playerPosition.x / CHUNK_SIZE)
        playerChunkY = floor(playerPosition.y / CHUNK_SIZE)

        // Load chunks in radius
        for cx in range(playerChunkX - LOAD_RADIUS, playerChunkX + LOAD_RADIUS + 1):
            for cy in range(playerChunkY - LOAD_RADIUS, playerChunkY + LOAD_RADIUS + 1):
                if (cx, cy) NOT in loadedChunks:
                    loadOrGenerateChunk(cx, cy)

        // Unload distant chunks
        for (cx, cy), chunk in loadedChunks:
            if abs(cx - playerChunkX) > LOAD_RADIUS + 1 OR
               abs(cy - playerChunkY) > LOAD_RADIUS + 1:
                saveChunkIfDirty(chunk)
                loadedChunks.remove((cx, cy))

    function loadOrGenerateChunk(cx, cy):
        if chunkExistsOnDisk(cx, cy):
            chunk = loadChunkFromDisk(cx, cy)
        else:
            chunk = generateChunk(cx, cy)  // procedural generation
        loadedChunks[(cx, cy)] = chunk

    // Convert world coords to chunk + local coords
    function worldToChunk(worldX, worldY):
        chunkX = floor(worldX / CHUNK_SIZE)
        chunkY = floor(worldY / CHUNK_SIZE)
        localX = worldX mod CHUNK_SIZE
        localY = worldY mod CHUNK_SIZE
        return (chunkX, chunkY, localX, localY)
```

**Why it matters:** Without chunks, you must load the entire world at once. For a world that is thousands of blocks wide and deep, that is impossible. Chunks let you trade memory for I/O: only the player's vicinity is in memory, and the rest lives on disk. This is the same principle as virtual memory in an operating system -- the player perceives an infinite world, but only a small window is active at any moment.

**3. Infinite or Very Large World Generation**

Procedural terrain generation uses noise functions to create natural-looking landscapes. Perlin or simplex noise produces smooth, continuous elevation maps that generate hills, valleys, and caves without any hand-authoring.

```
// Terrain generation using noise
function generateChunk(chunkX, chunkY):
    chunk = Chunk(chunkX, chunkY)

    for localX in range(CHUNK_SIZE):
        worldX = chunkX * CHUNK_SIZE + localX

        // Surface height from noise (1D noise for 2D side-view)
        surfaceHeight = getSurfaceHeight(worldX)

        for localY in range(CHUNK_SIZE):
            worldY = chunkY * CHUNK_SIZE + localY

            if worldY > surfaceHeight:
                chunk.setBlock(localX, localY, AIR)
            else if worldY == surfaceHeight:
                chunk.setBlock(localX, localY, GRASS)
            else if worldY > surfaceHeight - 4:
                chunk.setBlock(localX, localY, DIRT)
            else:
                // Cave generation using 2D noise
                caveNoise = noise2D(worldX * 0.05, worldY * 0.05)
                if caveNoise > CAVE_THRESHOLD:
                    chunk.setBlock(localX, localY, AIR)  // cave
                else:
                    chunk.setBlock(localX, localY, STONE)

    return chunk

function getSurfaceHeight(worldX):
    // Layer multiple noise octaves for natural terrain
    height = BASE_GROUND_LEVEL
    height += noise1D(worldX * 0.01) * 20   // large hills
    height += noise1D(worldX * 0.05) * 5    // small bumps
    height += noise1D(worldX * 0.1)  * 2    // surface roughness
    return floor(height)

// Noise function (Perlin or simplex)
// Returns value in range [-1, 1], smoothly varying
// Same input always produces same output (deterministic with seed)
function noise1D(x):
    return perlinNoise(x, seed: WORLD_SEED)

function noise2D(x, y):
    return perlinNoise2D(x, y, seed: WORLD_SEED)
```

**Why it matters:** Procedural generation is what makes the world feel infinite. The noise function is deterministic -- given the same seed and coordinates, it always produces the same terrain -- so chunks can be generated on-demand and will seamlessly tile together. Layering multiple noise frequencies (octaves) creates natural-looking variation: broad rolling hills from low-frequency noise and rocky details from high-frequency noise.

**4. Player-created Content**

There are no authored levels. The player is the level designer. This means providing intuitive tools for block placement/destruction and ensuring the world is responsive enough that building feels good.

```
class PlayerBuilder:
    selectedBlock = DIRT
    hotbar = [DIRT, STONE, WOOD, SAND, WATER, GLASS]  // quick-select

    function handleInput(player, world):
        // Block selection via number keys or scroll wheel
        if numberKeyPressed(n):
            selectedBlock = hotbar[n - 1]

        // Get targeted block position (cursor/crosshair)
        targetPos = getBlockAtCursor(player.position, player.aimDirection)
        adjacentPos = getAdjacentBlock(targetPos, player.aimDirection)

        // Destroy block (left click / primary action)
        if primaryAction():
            if world.getBlock(targetPos.x, targetPos.y) != AIR:
                world.destroyBlock(targetPos.x, targetPos.y)

        // Place block (right click / secondary action)
        if secondaryAction():
            if world.getBlock(adjacentPos.x, adjacentPos.y) == AIR:
                // Don't place inside the player's body
                if NOT playerOccupies(player, adjacentPos):
                    world.placeBlock(adjacentPos.x, adjacentPos.y, selectedBlock)

    // Block targeting: raycast from player toward cursor
    function getBlockAtCursor(origin, direction):
        // Step along the ray until hitting a solid block
        for step in range(MAX_REACH):
            checkPos = origin + direction * step * 0.1
            blockX = floor(checkPos.x)
            blockY = floor(checkPos.y)
            if world.getBlock(blockX, blockY) != AIR:
                return (blockX, blockY)
        return null  // nothing in range

    // Visual feedback
    function renderBuildPreview(targetPos, adjacentPos):
        if targetPos != null:
            drawBlockOutline(targetPos, color: RED)     // block that would be destroyed
            drawBlockGhost(adjacentPos, selectedBlock)   // block that would be placed
```

**Why it matters:** The player's ability to reshape the world IS the game. If placement feels sluggish, if targeting is imprecise, or if feedback is unclear, the creative experience suffers. The build tools are this game's controller -- they must be as polished as the jump button in a platformer. Showing a preview of where the block will go before the player commits is a small detail that dramatically improves the building experience.

**5. Block Interaction Rules**

Blocks interact with their neighbors: sand falls when unsupported, water flows downhill and spreads, fire ignites flammable blocks. These rules create emergent behavior from simple local interactions, similar to cellular automata.

```
// Block update tick: check each active block against rules
function updateBlocks(world, activeBlocks):
    for each (x, y) in activeBlocks:
        blockId = world.getBlock(x, y)
        blockType = BLOCK_TYPES[blockId]

        // Gravity: sand and gravel fall
        if blockType.gravity AND NOT blockType.fluid:
            below = world.getBlock(x, y - 1)
            if below == AIR.id:
                world.setBlock(x, y, AIR.id)
                world.setBlock(x, y - 1, blockId)
                markActive(x, y - 1)     // continue falling next tick
                markActive(x, y)         // block above might now fall too

        // Fluid: water flows sideways and down
        if blockType.fluid:
            updateFluid(world, x, y, blockId)

        // Fire spread
        if blockId == FIRE.id:
            updateFire(world, x, y)

function updateFluid(world, x, y, fluidId):
    // Flow down first
    below = world.getBlock(x, y - 1)
    if below == AIR.id:
        world.setBlock(x, y - 1, fluidId)
        markActive(x, y - 1)
    else:
        // Spread sideways
        left = world.getBlock(x - 1, y)
        right = world.getBlock(x + 1, y)
        if left == AIR.id:
            world.setBlock(x - 1, y, fluidId)
            markActive(x - 1, y)
        if right == AIR.id:
            world.setBlock(x + 1, y, fluidId)
            markActive(x + 1, y)

function updateFire(world, x, y):
    // Check neighbors for flammable blocks
    for (nx, ny) in getNeighbors(x, y):
        neighbor = BLOCK_TYPES[world.getBlock(nx, ny)]
        if neighbor.flammable:
            if random() < FIRE_SPREAD_CHANCE:
                world.setBlock(nx, ny, FIRE.id)
                markActive(nx, ny)
    // Fire burns out after a time
    if fireAge(x, y) > FIRE_DURATION:
        world.setBlock(x, y, AIR.id)
```

**Why it matters:** Block interactions are what make the world feel alive rather than static. When the player digs under sand and watches it collapse, when they pour water and it flows into a cave, when they accidentally set a forest on fire -- these emergent moments create stories. The rules are simple (gravity, flow, spread), but their interactions are complex. This is systemic design: small rules, big consequences.

**6. Save / Load Large World State**

The world must persist between sessions. Saving the entire world at once is expensive, so chunks are saved individually as they are modified. Compression reduces file size dramatically because block data is highly repetitive.

```
// Save format: one file per chunk
function getChunkFilePath(chunkX, chunkY):
    return SAVE_DIR + "/chunk_" + chunkX + "_" + chunkY + ".dat"

function saveChunk(chunk):
    if NOT chunk.isDirty:
        return  // nothing to save

    // Run-length encoding: compress repetitive blocks
    compressed = runLengthEncode(chunk.blocks)
    data = {
        version: SAVE_VERSION,
        chunkX: chunk.chunkX,
        chunkY: chunk.chunkY,
        blocks: compressed
    }
    writeBinaryFile(getChunkFilePath(chunk.chunkX, chunk.chunkY), data)
    chunk.isDirty = false

function loadChunk(chunkX, chunkY):
    path = getChunkFilePath(chunkX, chunkY)
    data = readBinaryFile(path)
    chunk = Chunk(data.chunkX, data.chunkY)
    chunk.blocks = runLengthDecode(data.blocks)
    return chunk

// Run-length encoding: [STONE, STONE, STONE, AIR, AIR] -> [(STONE, 3), (AIR, 2)]
function runLengthEncode(blocks):
    encoded = []
    currentBlock = blocks[0][0]
    count = 0
    for row in blocks:
        for blockId in row:
            if blockId == currentBlock:
                count += 1
            else:
                encoded.append((currentBlock, count))
                currentBlock = blockId
                count = 1
    encoded.append((currentBlock, count))
    return encoded

// World metadata: seed, player position, game mode
function saveWorldMeta(worldState):
    meta = {
        seed: worldState.seed,
        playerPosition: worldState.player.position,
        gameMode: worldState.gameMode,
        playTime: worldState.playTime,
        modifiedChunks: listModifiedChunkCoordinates()
    }
    writeJSONFile(SAVE_DIR + "/world.json", meta)

// Auto-save: save dirty chunks periodically
function autoSave(chunkManager):
    for chunk in chunkManager.loadedChunks.values():
        saveChunk(chunk)
    saveWorldMeta(worldState)
```

**Why it matters:** A sandbox game without saving is a sandcastle at high tide. Players invest hours building structures, and losing that work is unacceptable. Chunk-based saving means only modified regions are written to disk, which keeps saves fast even for enormous worlds. Run-length encoding exploits the fact that most chunks are filled with large contiguous regions of the same block type (all stone underground, all air above), compressing the data dramatically.

**7. Creative vs. Survival Modes**

The same world supports different experiences by toggling systems on and off. Creative mode gives unlimited blocks and disables damage. Survival mode adds health, hunger, inventory limits, and threats. The world data is identical -- only the rules change.

```
class GameMode:
    CREATIVE = "creative"
    SURVIVAL = "survival"

class GameRules:
    function applyMode(mode, systems):
        switch mode:
            case CREATIVE:
                systems.health.enabled = false
                systems.hunger.enabled = false
                systems.inventory.unlimited = true
                systems.damage.enabled = false
                systems.flying.enabled = true
                systems.blockBreakSpeed = INSTANT
                systems.enemies.enabled = false

            case SURVIVAL:
                systems.health.enabled = true
                systems.health.max = 100
                systems.hunger.enabled = true
                systems.hunger.max = 100
                systems.inventory.unlimited = false
                systems.inventory.slots = 36
                systems.damage.enabled = true
                systems.flying.enabled = false
                systems.blockBreakSpeed = NORMAL  // varies by tool + block
                systems.enemies.enabled = true

// System toggle pattern
class HealthSystem:
    enabled = true
    current = 100
    max = 100

    function takeDamage(amount):
        if NOT enabled:
            return  // creative mode: invincible
        current = max(0, current - amount)
        if current <= 0:
            triggerDeath()

    function update(deltaTime):
        if NOT enabled:
            return
        // Regenerate health when hunger is full
        if hungerSystem.current >= hungerSystem.max * 0.9:
            current = min(max, current + REGEN_RATE * deltaTime)

// Inventory differs by mode
class Inventory:
    unlimited = false
    slots = []

    function addItem(itemId, count):
        if unlimited:
            return true  // always succeeds in creative
        // Find existing stack or empty slot
        for slot in slots:
            if slot.itemId == itemId AND slot.count < MAX_STACK:
                slot.count += count
                return true
        emptySlot = slots.find(s => s.isEmpty())
        if emptySlot:
            emptySlot.itemId = itemId
            emptySlot.count = count
            return true
        return false  // inventory full
```

**Why it matters:** Two modes from one world doubles the game's appeal. Creative mode attracts builders who want to construct without constraints. Survival mode attracts adventurers who want challenge and progression. The design principle -- toggling systems on and off rather than building separate games -- is efficient and ensures both modes benefit from the same world generation, block physics, and save system. It also demonstrates that game feel is defined by rules, not content.

### Stretch Goals

- Add biomes (desert, forest, snow) that vary block distribution and surface features based on noise.
- Implement a basic crafting system: combine blocks at a crafting table to create new blocks or tools.
- Add day/night cycle with lighting that affects visibility and enemy spawning.
- Implement basic enemies (zombies that spawn at night) with simple pathfinding.
- Add a tool system where pickaxes mine faster than bare hands, and axes chop wood faster.
- Create a simple multiplayer mode where two players can build in the same world.
- Add decorative blocks (flowers, torches, signs) with non-standard rendering.

### MVP Spec

| Element | Scope |
|---|---|
| **World** | 2D side-view block grid, procedurally generated terrain with hills and caves |
| **Blocks** | 6-8 block types: air, dirt, stone, grass, sand, water, wood, plus a selected-block indicator |
| **Generation** | Noise-based terrain with surface variation, underground caves, and at least 2 visual layers (dirt over stone) |
| **Chunks** | World divided into 16x16 chunks, loaded/unloaded based on player proximity |
| **Player** | Character that walks, jumps, and has a reach radius for placing/destroying blocks |
| **Building** | Place selected block type, destroy existing blocks, hotbar for block selection |
| **Physics** | Sand falls under gravity, water flows down and sideways |
| **Modes** | Creative (unlimited blocks, no damage, optional flying) and Survival (health, inventory limits) |
| **Camera** | Follows the player, shows approximately 3x3 chunks on screen |
| **Save/Load** | Chunk-based saving with run-length encoding, auto-save, world metadata file |
| **UI** | Hotbar showing selected block, health/hunger bars in survival, crosshair for targeting |

### Deliverable

A playable 2D sandbox where the player spawns in a procedurally generated world, can place and destroy blocks freely, watches sand fall and water flow, explores caves underground, and saves their world to disk. The world must load in chunks as the player explores so that the world feels unbounded. Creative and Survival modes must both be functional. A playtester should be able to dig a cave, build a house, flood it with water, and come back the next day to find it exactly as they left it.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Voxel / block-based world | Like a key-value store where the key is spatial coordinates and the value is a block type -- the entire world is a giant distributed hash map |
| Chunk-based world loading | Like database sharding -- partition data by spatial key, load shards on demand, and unload idle shards to manage memory |
| Infinite world generation | Like lazy evaluation or on-demand resource provisioning -- data (terrain) is computed only when requested and deterministically reproducible from a seed |
| Player-created content | Like a user-generated content API -- the server provides the schema and tools, but all content comes from users rather than administrators |
| Block interaction rules | Like event-driven microservices -- a block change emits an event, neighboring blocks react, and cascading updates propagate through the system |
| Save/load large world state | Like incremental backups with change tracking -- only modified chunks are written, and compression (RLE) exploits data redundancy to minimize storage |
| Creative vs. survival modes | Like feature flags and permission tiers -- the same codebase serves different experiences by toggling capabilities at runtime |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Voxel / block-based world | Like a CSS Grid layout where every cell is a styled element -- the world is a massive grid, and each cell's "class" (block type) determines its appearance |
| Chunk-based world loading | Like virtualized scrolling (react-window) in a long list -- only render DOM nodes for items currently visible, and recycle/create nodes as the user scrolls |
| Infinite world generation | Like procedural CSS patterns or generative art -- deterministic functions produce varied, natural-looking output from minimal input (a seed value) |
| Player-created content | Like a no-code website builder -- the platform provides components and a canvas, but every layout is user-authored |
| Block interaction rules | Like CSS cascade and inheritance -- changing one element triggers reflow in neighbors, and rules propagate through the layout tree |
| Save/load large world state | Like localStorage with serialization -- converting a complex application state to a compact format for persistence and restoring it on next visit |
| Creative vs. survival modes | Like toggling between edit mode and preview mode in a CMS -- same content, different interaction rules and available tools |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Voxel / block-based world | Like a sparse tensor or sparse matrix -- most values are zero (air), so you store only non-default entries for memory efficiency |
| Chunk-based world loading | Like batch loading training data -- load chunks of a dataset into memory as needed, process them, and release to stay within GPU memory limits |
| Infinite world generation | Like procedural data augmentation with a fixed seed -- deterministic transformations create unlimited varied training samples from a compact specification |
| Player-created content | Like interactive labeling tools -- the system provides the interface, but the human provides all the meaningful content (labels, annotations) |
| Block interaction rules | Like cellular automata or Conway's Game of Life -- simple local rules applied to a grid produce complex emergent global behavior |
| Save/load large world state | Like model checkpointing -- periodically serialize the current state to disk so training (gameplay) can resume from the last checkpoint after interruption |
| Creative vs. survival modes | Like switching between training mode and evaluation mode in a neural network -- the same model (world) behaves differently depending on which systems (dropout, batch norm) are active |

---

## Discussion Questions

1. **The blank canvas problem:** Many players launch a sandbox game and immediately ask "but what do I DO?" Total freedom can be paralyzing. How do you guide players toward satisfying experiences without imposing objectives that undermine the sandbox premise? What role do tutorials, starter worlds, or suggested challenges play?

2. **Emergence vs. intention:** When water meets lava in Minecraft, it creates obsidian. This was not designed as a feature -- it emerged from the interaction rules. How do you design block interaction systems that produce interesting emergent behaviors without producing game-breaking exploits? How much emergence is too much?

3. **Performance as a design constraint:** A sandbox world is astronomically large. Every design decision (block types, update frequency, chunk size, save format) has performance implications. How does the need to run at 60fps on modest hardware constrain what is possible in a sandbox? Where do you sacrifice simulation accuracy for performance?

4. **Player investment and grief:** In a multiplayer sandbox, one player can spend hours building a castle that another player destroys in seconds. How do you handle this tension? Should blocks be indestructible in certain areas? Should there be ownership? How does the answer change the fundamental nature of the sandbox?
