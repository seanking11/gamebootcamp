# Module 33: Survival Horror
**You are not the hunter — you are the hunted, and you never have enough bullets | The Dark Below**
> "The scariest thing in a game is not what you can see — it is the sound of footsteps in a hallway you thought was empty."
---

## Prerequisites

| Module | What You'll Reuse |
|--------|-------------------|
| Module 7 — Roguelike | Inventory management, room-based exploration, tile maps |
| Module 3 — Shooter | Health/damage systems, entity management, basic AI |

---

## Week 1: History & Design Theory

### The Origin

In 1996, Shinji Mikami and Capcom released **Resident Evil** and coined the term "survival horror." The game dropped players into a mansion filled with zombies and gave them almost nothing to fight back with — a knife, a handgun with scarce ammunition, and a handful of healing herbs scattered across the entire map. The game's camera was fixed to pre-rendered angles that the player could not control, meaning you often heard enemies before you saw them and sometimes could not see them at all. Doors took two seconds to open (a loading screen disguised as atmosphere). Inventory was limited to six slots, and saving the game consumed a finite resource (ink ribbons). Every system in Resident Evil was designed around a single principle: scarcity. You never had enough ammo to kill everything, enough health to take hits carelessly, enough inventory space to carry everything useful, or enough saves to retry freely. This scarcity transformed a third-person action game into something genuinely frightening — not because the zombies were scary in themselves, but because facing them meant spending resources you could not afford to lose. Mikami proved that fear in games is not about what threatens the player; it is about what the player lacks.

### How the Genre Evolved

**Resident Evil (1996)** — Capcom's original defined the genre's mechanical vocabulary: fixed camera angles that obscure threats, tank controls that make movement deliberate and vulnerable, a strict inventory limit that forces constant triage, save points that consume resources, and ammunition so scarce that players learned to dodge enemies rather than fight them. The mansion was a metroidvania-style interconnected map with locked doors and key items, meaning the player backtracked through previously "cleared" areas that could now contain new threats. Resident Evil established that survival horror is fundamentally a resource management game dressed in the aesthetics of a horror film.

**Silent Hill 2 (2001)** — Konami's Team Silent shifted the genre from physical horror (monsters that kill you) to psychological horror (a world that disturbs you). The town of Silent Hill was perpetually shrouded in fog and darkness, and the monsters were manifestations of the protagonist's guilt and trauma. Combat was deliberately clumsy — the game wanted you to feel vulnerable, not empowered. But Silent Hill 2's greatest contribution was its sound design. Audio designer Akira Yamaoka created a soundscape where industrial noise, radio static, and silence were as frightening as any monster. The radio crackled when enemies were near, training the player to dread a sound rather than a sight. Silent Hill 2 proved that survival horror's most powerful tool was not the monster — it was the atmosphere surrounding the monster.

**Amnesia: The Dark Descent (2010)** — Frictional Games asked a radical question: what if the player had no weapons at all? Amnesia removed combat entirely. The player could run, hide, and close doors — that was it. Enemies could not be killed, only avoided. The game introduced a sanity mechanic: looking at monsters or staying in darkness too long degraded the player's sanity, causing visual distortions and hallucinations. The only way to restore sanity was to stay in the light, but light sources were limited and attracted enemies. This created an impossible tension: darkness damages your mind, but light reveals your position. Amnesia proved that the most effective survival horror is the kind where the player is completely powerless, because powerlessness is the purest form of fear.

### What Makes It "Great"

A great survival horror game is an exercise in controlled deprivation. Every system exists to take something away from the player: ammo, health, visibility, safe places to save, inventory space, sanity. The genius is in the balance — the player must always feel like they are barely surviving, never comfortable but never hopeless. The pacing alternates between tension and release: a safe room with a save point and soothing music is not just a game mechanic, it is an emotional reset that makes the next dark hallway feel even darker by contrast. The enemy design matters less than the enemy's presence — a monster that patrols unpredictably is scarier than one that attacks on sight, because the patrol forces the player to listen, watch, and plan. And the information design is as important as the creature design: what the player cannot see (fixed cameras, darkness, fog) is more frightening than what they can. A great survival horror game does not scare the player with jump scares; it scares them by making them scare themselves.

### The Essential Mechanic

Resource scarcity — never having enough ammo or health to feel safe, forcing careful decision-making.

---

## Week 2: Build the MVP

### What You're Building

A **top-down survival horror game** set in an abandoned facility. The player navigates a series of interconnected rooms, collecting sparse ammo, health kits, and key items while avoiding or confronting a stalker enemy that patrols the facility. The player has a limited inventory (8 slots with varying item sizes), a flashlight with limited battery, and a handgun with scarce ammo. The stalker enemy uses a state machine (patrol, investigate, chase, search, return) and reacts to sounds the player makes. Some rooms are safe rooms where the enemy cannot enter and the player can save. The game ends when the player reaches the exit or dies. Darkness is a core mechanic: rooms are dark unless the player uses the flashlight, and the flashlight battery drains and must be conserved.

### Core Concepts

**1. Resource Scarcity Design**

The total amount of ammunition and health items placed in the entire game is deliberately insufficient to kill every enemy and heal every wound. The player is forced to decide: fight this enemy and spend 3 of my 7 remaining bullets, or try to sneak past and risk taking damage? Scarcity is not random — it is authored. The designer places exactly enough resources that the player can complete the game if they are careful, but never enough that they feel safe.

```
// Resource budget for entire game
RESOURCE_BUDGET = {
    totalAmmo: 24,          // Enough to kill ~4 enemies (6 shots each), but there are 8
    totalHealthKits: 5,     // Each heals 40 HP; player has 100 HP
    totalBatteries: 3,      // Each adds 60 seconds of flashlight
    totalKeyItems: 3,       // Required to progress (cannot be skipped)
    totalSaveItems: 4       // Limited saves (ink ribbon style)
}

// Scarcity principle: total resources < total need
// Player MUST avoid some enemies, conserve some health, manage flashlight
ENEMY_STATS = {
    "zombie":  {health: 30, damage: 20, bulletsToKill: 6},
    "stalker": {health: 999, damage: 35, bulletsToKill: null}  // Cannot be killed
}

function placeResources(rooms):
    // Distribute resources across rooms with intentional spacing
    // Never cluster resources — spread them to force exploration
    // Place ammo AFTER encounters, not before — player commits before knowing the reward
    for each room in rooms:
        if room.hasEncounter:
            // Place reward in next room, not this one
            nextRoom = getNextRoom(room)
            addPickup(nextRoom, randomChoice(["ammo_small", "health_kit"]))

function createPickup(type):
    PICKUP_DATA = {
        "ammo_small":   {gives: "ammo",      amount: 4,  inventorySize: 1},
        "ammo_large":   {gives: "ammo",      amount: 8,  inventorySize: 2},
        "health_kit":   {gives: "health",    amount: 40, inventorySize: 2},
        "battery":      {gives: "flashlight", amount: 60, inventorySize: 1},
        "save_item":    {gives: "save",      amount: 1,  inventorySize: 1}
    }
    return PICKUP_DATA[type]
```

*Why it matters:* Scarcity is the fundamental design lever of survival horror. Without it, the game is an action game with creepy art. With it, every encounter becomes a risk-reward calculation: the player is not asking "can I kill this?" but "should I spend the resources?" This single constraint transforms every other system — inventory management becomes critical because you cannot carry everything, exploration becomes tense because you might find nothing, and the stalker enemy becomes terrifying because you literally cannot kill it.

**2. AI Stalker / Hunter Enemy**

The stalker is an enemy that cannot be killed and uses a multi-state behavior system: patrol (walk a route), investigate (heard a sound, move to its source), chase (spotted the player, pursue at high speed), search (lost sight of the player, check nearby rooms), and return (give up and resume patrol). The stalker reacts to player-generated sounds (running, shooting, opening doors) and to visual line-of-sight. Its unpredictability is what makes it frightening.

```
STALKER_STATES = {
    PATROL:      {speed: 1.0, detectionRange: 5,  hearingRange: 8},
    INVESTIGATE: {speed: 1.5, detectionRange: 7,  hearingRange: 10},
    CHASE:       {speed: 2.5, detectionRange: 12, hearingRange: 15},
    SEARCH:      {speed: 1.2, detectionRange: 8,  hearingRange: 10},
    RETURN:      {speed: 1.0, detectionRange: 5,  hearingRange: 8}
}

function updateStalker(stalker, player, deltaTime):
    stateConfig = STALKER_STATES[stalker.state]

    switch stalker.state:
        case PATROL:
            followPatrolRoute(stalker, deltaTime)
            if canSeePlayer(stalker, player, stateConfig.detectionRange):
                stalker.state = CHASE
                stalker.lastKnownPlayerPos = player.position
            else if heardSound(stalker, stateConfig.hearingRange):
                stalker.state = INVESTIGATE
                stalker.investigateTarget = getLastSoundPosition()

        case INVESTIGATE:
            moveToward(stalker, stalker.investigateTarget, stateConfig.speed, deltaTime)
            if canSeePlayer(stalker, player, stateConfig.detectionRange):
                stalker.state = CHASE
                stalker.lastKnownPlayerPos = player.position
            else if arrived(stalker, stalker.investigateTarget):
                stalker.searchTimer = SEARCH_DURATION
                stalker.state = SEARCH

        case CHASE:
            moveToward(stalker, player.position, stateConfig.speed, deltaTime)
            stalker.lastKnownPlayerPos = player.position
            if not canSeePlayer(stalker, player, stateConfig.detectionRange):
                stalker.state = SEARCH
                stalker.searchTimer = SEARCH_DURATION

        case SEARCH:
            // Check nearby rooms and hiding spots
            searchNearby(stalker, stalker.lastKnownPlayerPos, deltaTime)
            stalker.searchTimer -= deltaTime
            if canSeePlayer(stalker, player, stateConfig.detectionRange):
                stalker.state = CHASE
            else if stalker.searchTimer <= 0:
                stalker.state = RETURN

        case RETURN:
            moveToward(stalker, stalker.patrolRoute.nearestPoint(), stateConfig.speed, deltaTime)
            if arrived(stalker, stalker.patrolRoute.nearestPoint()):
                stalker.state = PATROL

function canSeePlayer(stalker, player, range):
    distance = getDistance(stalker.position, player.position)
    if distance > range:
        return false
    // Line of sight check — walls block vision
    if not hasLineOfSight(stalker.position, player.position):
        return false
    // Darkness check — flashlight makes player visible from further
    if player.flashlightOn:
        return true  // Flashlight is visible at full range
    return distance < range * 0.5  // In darkness, detection range halved
```

*Why it matters:* The stalker enemy is the signature feature of modern survival horror. Unlike scripted encounters (enemy placed behind door, attacks when opened), the stalker creates unpredictable tension. The player never knows where it is, and every decision — run or walk, flashlight on or off, take the shortcut through the dark room or the long way through lit hallways — is filtered through the question "where is the stalker right now?" The state machine creates readable but unpredictable behavior: the player learns the rules (it investigates sounds, it gives up after searching) but can never predict the exact outcome.

**3. Sound Design for Tension**

Sound is layered: a base ambient layer (building hum, distant drips), a tension layer that activates based on stalker proximity, and player-action sounds (footsteps, doors, gunshots) that alert the stalker. Silence is deliberate — safe rooms are quiet, and the absence of ambient sound signals safety. The player's actions generate sound events with a radius, and the stalker's hearing system detects these events.

```
// Sound layer system
SOUND_LAYERS = {
    ambient:  {volume: 0.3, loop: true},   // Always playing
    tension:  {volume: 0.0, loop: true},   // Fades in near stalker
    danger:   {volume: 0.0, loop: true},   // Chase music
    safe:     {volume: 0.0, loop: true}    // Safe room music
}

function updateSoundLayers(player, stalker):
    distance = getDistance(player.position, stalker.position)

    // Tension layer fades in as stalker gets closer
    if stalker.state == CHASE:
        SOUND_LAYERS.danger.volume = 1.0
        SOUND_LAYERS.tension.volume = 0.0
    else if distance < TENSION_RADIUS:
        proximity = 1.0 - (distance / TENSION_RADIUS)
        SOUND_LAYERS.tension.volume = proximity
        SOUND_LAYERS.danger.volume = 0.0
    else:
        SOUND_LAYERS.tension.volume = 0.0
        SOUND_LAYERS.danger.volume = 0.0

    // Safe room overrides all tension
    if player.isInSafeRoom():
        SOUND_LAYERS.ambient.volume = 0.0
        SOUND_LAYERS.tension.volume = 0.0
        SOUND_LAYERS.danger.volume = 0.0
        SOUND_LAYERS.safe.volume = 0.5

// Player actions generate sound events
SOUND_EVENTS = {
    "walk":      {radius: 2, alertLevel: 0.2},
    "run":       {radius: 6, alertLevel: 0.7},
    "shoot":     {radius: 12, alertLevel: 1.0},
    "open_door": {radius: 4, alertLevel: 0.5},
    "drop_item": {radius: 3, alertLevel: 0.3}
}

function emitPlayerSound(soundType, position):
    event = SOUND_EVENTS[soundType]
    // Register sound in world for stalker hearing system
    world.activeSounds.add({
        position: position,
        radius: event.radius,
        alertLevel: event.alertLevel,
        timestamp: getCurrentTime()
    })

function heardSound(stalker, hearingRange):
    for each sound in world.activeSounds:
        distance = getDistance(stalker.position, sound.position)
        if distance <= min(sound.radius, hearingRange):
            return true
    return false

function getLastSoundPosition():
    return world.activeSounds.last().position
```

*Why it matters:* Sound design is arguably more important than visual design in survival horror. The player's ears detect threats before their eyes do — the stalker's footsteps in a nearby hallway, the creak of a door being pushed open, the sudden silence when ambient noise stops. Sound also creates a feedback loop: the player's own actions (running, shooting) generate noise that attracts the stalker, meaning the player's panic response (running away) can make the situation worse. The safe room music is not just ambiance — it is a Pavlovian signal that the player can relax, and its absence in other rooms is itself a form of tension.

**4. Camera as a Fear Tool**

The MVP uses a top-down view with limited visibility. The player can only see within their flashlight cone (a directed arc in front of them) plus a small ambient radius. Rooms outside the flashlight cone are dark. This means the player must choose where to look, and anything behind them or to the sides is invisible. The flashlight cone rotates with the player's facing direction, creating blind spots that the stalker can occupy.

```
CAMERA_CONFIG = {
    ambientVisRadius: 2,      // Tiles visible without flashlight
    flashlightArcAngle: 45,   // Degrees — narrow cone
    flashlightRange: 8,       // Tiles
    fullDarkAlpha: 0.95        // Nearly black outside visible area
}

function calculateVisibility(player):
    visibleTiles = []

    // Ambient visibility — small circle around player (always)
    for each tile in getTilesInRadius(player.position, CAMERA_CONFIG.ambientVisRadius):
        visibleTiles.add(tile)

    // Flashlight cone — if flashlight is on and has battery
    if player.flashlightOn and player.flashlightBattery > 0:
        coneStart = player.facingAngle - CAMERA_CONFIG.flashlightArcAngle / 2
        coneEnd = player.facingAngle + CAMERA_CONFIG.flashlightArcAngle / 2

        for each tile in getTilesInRadius(player.position, CAMERA_CONFIG.flashlightRange):
            angle = getAngle(player.position, tile.position)
            if isAngleBetween(angle, coneStart, coneEnd):
                // Raycast to check for walls blocking light
                if hasLineOfSight(player.position, tile.position):
                    visibleTiles.add(tile)

    return visibleTiles

function renderDarkness(visibleTiles):
    // Draw full-screen dark overlay
    drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, BLACK, CAMERA_CONFIG.fullDarkAlpha)

    // Cut out visible areas
    for each tile in visibleTiles:
        // Calculate distance-based light falloff
        dist = getDistance(player.position, tile.position)
        maxDist = CAMERA_CONFIG.flashlightRange
        falloff = 1.0 - (dist / maxDist)
        drawCircle(tile.screenX, tile.screenY, TILE_SIZE, alpha=falloff * 0.9, blendMode=ERASE)

function updateFlashlight(player, deltaTime):
    if player.flashlightOn:
        player.flashlightBattery -= BATTERY_DRAIN_RATE * deltaTime
        if player.flashlightBattery <= 0:
            player.flashlightBattery = 0
            player.flashlightOn = false
            playSound("flashlight_die")
```

*Why it matters:* Restricted visibility is the most powerful fear tool in the survival horror designer's kit. The player cannot see behind them. The player cannot see around corners. The player must choose between seeing further (flashlight on, battery draining, visible to stalker) and staying hidden (flashlight off, nearly blind, conserving battery). Every room entry is a moment of dread because the player must sweep the flashlight across the room to check for threats, and during that sweep, anything behind them is invisible. The darkness is not an aesthetic choice — it is a game mechanic that creates information asymmetry between the player and the stalker.

**5. Safe Rooms / Tension-Release Pacing**

Safe rooms are specially marked areas where the stalker cannot enter. They contain a save point (consuming a save item), sometimes a resource pickup, and distinct audio (calm music replacing ambient tension). The level is designed to alternate between dangerous exploration and safe room respites, creating a rhythm of tension and relief that prevents the player from becoming desensitized or exhausted.

```
SAFE_ROOM_CONFIG = {
    stalkerCanEnter: false,
    hasSavePoint: true,
    ambientTrack: "safe_room_music",
    lightLevel: "fully_lit"    // No flashlight needed
}

function enterRoom(player, room):
    player.currentRoom = room

    if room.isSafeRoom:
        // Stalker cannot follow
        if stalker.state == CHASE:
            stalker.state = SEARCH
            stalker.lastKnownPlayerPos = room.entrance

        // Switch audio
        crossfadeAudio(SOUND_LAYERS.safe, duration=1000)
        stopLayer(SOUND_LAYERS.tension)
        stopLayer(SOUND_LAYERS.danger)

        // Full lighting
        room.lightLevel = 1.0

        showNotification("Safe Room")

    else:
        // Resume tension audio
        crossfadeAudio(SOUND_LAYERS.ambient, duration=500)
        room.lightLevel = 0.0  // Dark — flashlight needed

function saveGame(player, room):
    if not room.isSafeRoom or not room.hasSavePoint:
        return "Cannot save here"

    if not player.inventory.has("save_item"):
        return "No save item (ink ribbon)"

    player.inventory.remove("save_item", 1)
    writeSaveFile(serializeGameState())
    return "Game saved. " + player.inventory.count("save_item") + " saves remaining."

// Level pacing — safe rooms placed at intervals
function designLevel():
    // Pattern: explore 3-4 dangerous rooms, then reach a safe room
    // Safe rooms are placed at emotional "checkpoints"
    rooms = [
        dangerousRoom("hallway_a"),
        dangerousRoom("storage"),
        dangerousRoom("lab_1"),
        safeRoom("office"),           // Breathe.
        dangerousRoom("hallway_b"),
        dangerousRoom("basement"),
        dangerousRoom("generator"),
        dangerousRoom("lab_2"),
        safeRoom("break_room"),       // Breathe.
        dangerousRoom("final_hall"),
        exitRoom("exit")
    ]
```

*Why it matters:* Pacing is what separates survival horror from a haunted house. A haunted house is constant stimulation — every room has a scare. But constant stimulation causes desensitization, and after ten minutes the player stops being afraid. Safe rooms reset the player's emotional baseline. The calm music, the full lighting, the knowledge that the stalker is locked out — these create genuine relief. And that relief makes the next dark hallway feel even worse, because the player knows what they are losing by leaving. The save point consuming a resource adds one more scarcity pressure: "Do I save now, or push ahead and save later? What if I die?"

**6. Inventory Tetris**

Items have different sizes and must fit into a grid-based inventory. Ammo takes 1 slot, a health kit takes 2 (1x2), a key item takes 1, and a large weapon takes 4 (2x2). The player must arrange items spatially to fit everything they need, and must make painful decisions about what to leave behind. The inventory screen does not pause the game — the stalker can still approach while the player is managing their bag.

```
INVENTORY_CONFIG = {
    gridWidth: 4,
    gridHeight: 2,    // 8 total cells
    cellSize: 1       // Each cell holds 1 unit
}

ITEM_SIZES = {
    "handgun_ammo":  {w: 1, h: 1},
    "health_kit":    {w: 1, h: 2},
    "battery":       {w: 1, h: 1},
    "key_card":      {w: 1, h: 1},
    "shotgun":       {w: 2, h: 1},
    "save_item":     {w: 1, h: 1}
}

function canFitItem(inventory, item, startX, startY):
    size = ITEM_SIZES[item.type]
    if startX + size.w > INVENTORY_CONFIG.gridWidth:
        return false
    if startY + size.h > INVENTORY_CONFIG.gridHeight:
        return false

    for dx in range(size.w):
        for dy in range(size.h):
            if inventory.grid[startX + dx][startY + dy] != null:
                return false
    return true

function addToInventory(inventory, item):
    // Try to find a spot that fits
    for y in range(INVENTORY_CONFIG.gridHeight):
        for x in range(INVENTORY_CONFIG.gridWidth):
            if canFitItem(inventory, item, x, y):
                placeItem(inventory, item, x, y)
                return true

    return false  // No room — player must drop something

function placeItem(inventory, item, startX, startY):
    size = ITEM_SIZES[item.type]
    for dx in range(size.w):
        for dy in range(size.h):
            inventory.grid[startX + dx][startY + dy] = item

function removeFromInventory(inventory, item):
    size = ITEM_SIZES[item.type]
    for dx in range(size.w):
        for dy in range(size.h):
            inventory.grid[item.x + dx][item.y + dy] = null

// The inventory screen does NOT pause the game
function openInventory():
    showInventoryOverlay()
    gamePaused = false  // Stalker still moves!
    showWarning("The world does not stop while you rummage...")
```

*Why it matters:* Inventory Tetris transforms item management from a simple list into a spatial puzzle with real consequences. When the player finds a shotgun (2x1) but their inventory is full of small items arranged badly, they must reorganize or discard something. This friction is intentional — it forces the player to think about what they truly need and creates agonizing moments where they leave a health kit behind because they cannot fit it. The non-pausing inventory screen adds urgency: spending too long rearranging items means the stalker is still patrolling, and the player is not watching the door.

**7. Darkness and Lighting as Mechanics**

The flashlight is not just a visual aid — it is a resource, a detection tool, and a risk. The flashlight drains battery over time, and batteries are scarce. Turning the flashlight on lets the player see further but also makes them visible to the stalker from greater range. Some environmental puzzles require the flashlight (reading a code on a wall, finding a hidden item in a dark corner). The tension between needing to see and needing to hide is the core dilemma of every room.

```
FLASHLIGHT_CONFIG = {
    maxBattery: 100,
    drainRate: 8,          // Units per second — ~12 seconds of continuous use
    detectionMultiplier: 2.0, // Stalker sees flashlight user from 2x range
    flickerThreshold: 20   // Below this, flashlight starts flickering
}

function updateFlashlightMechanics(player, deltaTime):
    if not player.flashlightOn:
        return

    // Drain battery
    player.flashlightBattery -= FLASHLIGHT_CONFIG.drainRate * deltaTime

    // Flicker when low
    if player.flashlightBattery < FLASHLIGHT_CONFIG.flickerThreshold:
        player.flashlightFlicker = true
        // Random on/off every few frames
        if random() < 0.3:
            player.flashlightVisible = not player.flashlightVisible

    // Die when empty
    if player.flashlightBattery <= 0:
        player.flashlightBattery = 0
        player.flashlightOn = false
        player.flashlightVisible = false
        playSound("flashlight_die")

function useBattery(player):
    if player.inventory.has("battery"):
        player.inventory.remove("battery", 1)
        player.flashlightBattery = min(
            player.flashlightBattery + 60,
            FLASHLIGHT_CONFIG.maxBattery
        )
        playSound("battery_insert")

// Environmental puzzles requiring light
function interactWithObject(player, object):
    if object.requiresLight and not player.flashlightVisible:
        return "It's too dark to see."

    if object.type == "wall_code":
        return "The code reads: " + object.code
    if object.type == "hidden_item":
        addToInventory(player.inventory, object.item)
        return "Found: " + object.item.name

// Stalker detection is affected by flashlight
function getStalkerDetectionRange(stalker, player):
    baseRange = STALKER_STATES[stalker.state].detectionRange
    if player.flashlightOn and player.flashlightVisible:
        return baseRange * FLASHLIGHT_CONFIG.detectionMultiplier
    return baseRange
```

*Why it matters:* The flashlight is the perfect survival horror item because using it helps and hurts simultaneously. The player needs it to see, to read clues, to find items. But every second it is on, the battery drains and the stalker can see them from further away. This creates a rhythm of on-off-on-off that keeps the player in a constant state of micro-decision-making. The flicker mechanic at low battery is pure psychological design: the unreliable light is more frightening than no light, because the player cannot trust what they see. And when the flashlight finally dies in a dark room, the sound it makes is the most terrifying thing in the game.

### Stretch Goals

- Add a second enemy type (slower, but attracted to light instead of sound)
- Implement a sanity system that distorts visuals and audio when the player stays in darkness too long
- Add environmental puzzles (combine key items, enter codes found on walls)
- Create branching paths with multiple endings based on resources consumed
- Add a heartbeat sound effect that speeds up as the stalker gets closer

### MVP Spec

| Component | Minimum Viable Version |
|-----------|----------------------|
| Map | 10 interconnected rooms (7 dangerous, 2 safe rooms, 1 exit) |
| Player | Move, aim flashlight, shoot, interact, open inventory |
| Stalker | 5-state AI (patrol, investigate, chase, search, return), reacts to sound and sight |
| Flashlight | Cone visibility, battery drain, flicker at low charge, increases stalker detection range |
| Inventory | 4x2 grid, items have sizes, inventory does not pause game |
| Resources | 24 total ammo, 5 health kits, 3 batteries, 4 save items across the whole game |
| Sound System | Ambient layer, tension layer (proximity), chase music, safe room music, player sound events |
| Safe Rooms | 2 rooms with save points, calm music, full lighting, stalker cannot enter |
| Win/Lose | Win by reaching exit with key items; lose when health reaches zero |
| Darkness | Rooms are dark by default; flashlight and ambient radius provide visibility |

### Deliverable

A playable survival horror game where the player navigates a dark facility with a limited flashlight, collects scarce resources, manages a grid-based inventory, and avoids or confronts a stalker enemy driven by a 5-state AI. The game must demonstrate resource scarcity (never enough ammo or batteries to feel safe), sound-based AI detection (running and shooting attract the stalker), flashlight-as-a-resource tension (seeing costs battery and increases detection risk), and safe room pacing (clear emotional contrast between dangerous and safe areas). The player should feel genuinely tense in dark rooms and genuinely relieved in safe rooms.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|-------------|---------|
| Resource Scarcity Design | Like capacity planning with insufficient budget — you have fewer servers than you need, so every request must be triaged, and you cannot afford to waste capacity on low-priority tasks |
| AI Stalker / Hunter Enemy | Like a monitoring daemon with escalating alert levels — it patrols (idle check), investigates (warning), chases (critical alert), searches (cooldown), and returns to baseline, each state with different thresholds and behaviors |
| Sound Design for Tension | Like log levels and alerting — the ambient system hum is INFO, proximity tension is WARN, chase music is CRITICAL, and silence (safe room) is the blessed absence of pages |
| Camera as a Fear Tool | Like operating a production system with partial observability — you can only monitor a few dashboards at once (flashlight cone), and the systems you are not watching (dark rooms) are where failures hide |
| Safe Rooms / Tension-Release | Like maintenance windows — a scheduled period where no deployments happen, alerts are silenced, and the on-call engineer can breathe before the next production cycle |
| Inventory Tetris | Like bin-packing containers on a server — each process has a memory footprint (item size), the server has fixed RAM (grid), and you must fit everything that matters or kill a process (drop an item) |
| Darkness and Lighting | Like debug logging — turning it on reveals more information (visibility) but adds overhead (battery drain) and can expose your system to observers (stalker detection), so you toggle it only when needed |

### Frontend Developers

| Core Concept | Analogy |
|-------------|---------|
| Resource Scarcity Design | Like working within a tight performance budget — you have limited JS bundle size, limited render time, and limited DOM nodes, so every addition must justify its cost |
| AI Stalker / Hunter Enemy | Like a complex animation state machine — idle, hover, active, loading, error states with defined transitions, each state triggering different visual behaviors and accepting different inputs |
| Sound Design for Tension | Like progressive loading feedback — silence (no spinner) means nothing is happening, a subtle indicator means background activity, and a prominent loading state means something critical is in progress |
| Camera as a Fear Tool | Like viewport-based rendering — the user only sees what is in the viewport (flashlight cone), and everything outside it is unrendered (dark), creating a focus area surrounded by unknown content |
| Safe Rooms / Tension-Release | Like navigating from a complex interactive page to a simple settings page — the cognitive load drops, the UI simplifies, and the user resets before returning to the dense interface |
| Inventory Tetris | Like a responsive grid layout with differently-sized cards — each card has a width and height, and the layout engine must arrange them within a fixed container without overlap or overflow |
| Darkness and Lighting | Like a spotlight tour/walkthrough overlay — only the highlighted element is visible, the rest of the page is dimmed, and the user must actively move the spotlight to explore content |

### Data / ML Engineers

| Core Concept | Analogy |
|-------------|---------|
| Resource Scarcity Design | Like working with a limited compute budget — you cannot train every model or run every experiment, so you must prioritize which runs are worth the GPU hours |
| AI Stalker / Hunter Enemy | Like a Markov chain with state-dependent transition probabilities — the stalker's next state depends on its current state and observed inputs, with each state having distinct emission probabilities (behaviors) |
| Sound Design for Tension | Like multi-channel telemetry — different data streams (ambient, tension, chase, safe) are mixed in real time, and the current blend provides an intuitive read on system state without checking individual metrics |
| Camera as a Fear Tool | Like partial observability in reinforcement learning — the agent (player) receives only a local observation (flashlight cone), not the full state, and must make decisions under uncertainty about the rest of the environment |
| Safe Rooms / Tension-Release | Like checkpointing during training — periodic saves allow you to roll back to a known good state, and the relief of seeing "checkpoint saved" resets the anxiety of losing hours of training to a crash |
| Inventory Tetris | Like feature selection with a constrained model — you can only include N features (items) of varying dimensionality (size), and choosing which features provide the most value within the constraint is the core optimization problem |
| Darkness and Lighting | Like the exploration-exploitation tradeoff — using the flashlight (exploration) reveals new information but costs resources (battery) and increases risk (detection), while staying dark (exploitation of known safe paths) conserves resources but limits new information |

---

## Discussion Questions

1. **The Powerlessness Spectrum:** Resident Evil gives you a gun with scarce ammo. Amnesia gives you no weapons at all. Both are considered masterpieces of the genre. Where on the powerlessness spectrum should your MVP sit, and how does the player's ability to fight back change the nature of the fear? Is a player with 3 bullets more scared or less scared than a player with 0?

2. **Sound as Game Design:** Your stalker AI reacts to player-generated sounds. This means the player's own panic (running, slamming doors) makes the situation worse. How do you communicate this mechanic to the player without breaking immersion? And how do you prevent the optimal strategy from being "never run, never shoot" — which might be safe but is not fun?

3. **Pacing and Desensitization:** After 30 minutes of being chased, even the most frightening stalker becomes familiar. How do you prevent desensitization? Is the solution more variety (different enemies), less exposure (stalker is rare), or escalation (stalker gets smarter)? How does the safe room pattern help, and how many dangerous rooms can you put between safe rooms before the player becomes numb?

4. **The Inventory Decision:** Your inventory does not pause the game. This means opening the inventory is itself a risk. How does this non-pausing design change player behavior compared to a paused inventory? What are the UX challenges of asking players to make spatial arrangement decisions while under time pressure from a patrolling stalker?
