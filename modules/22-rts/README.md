# Module 22: Real-Time Strategy (RTS)
**Command armies, manage economies, conquer maps | You need more pylons**
> "No plan survives first contact with the enemy." — Helmuth von Moltke
---

## Prerequisites

- **Module 6 (Tower Defense):** Pathfinding algorithms (A*), enemy wave management, resource/economy systems.
- **Module 3 (Shooter):** Entity management for many simultaneous objects, real-time input handling, collision detection.

## Week 1: History & Design Theory

### The Origin

The real-time strategy genre emerged when designers asked: what if the tabletop war game ran in continuous time instead of turns? Dune II (Westwood, 1992) answered that question and established nearly every convention the genre still uses — resource harvesting, base building, unit production, and the fog of war. The critical design challenge was translating the deliberate, analytical nature of strategy games into a format where the clock never stops. The solution was giving the player god-like control (select units, right-click to command) while requiring them to manage scarce resources across multiple fronts simultaneously. The RTS became a genre about attention management as much as strategic thinking — the best player is not just the smartest, but the one who can execute the most actions per minute while making the fewest mistakes.

### How the Genre Evolved

- **StarCraft (Blizzard, 1998):** StarCraft perfected asymmetric faction design — three races (Terran, Zerg, Protoss) with fundamentally different economies, units, and strategies, yet balanced against each other. It proved that an RTS could sustain a professional competitive scene for decades, and that the genre's skill ceiling was essentially infinite. StarCraft's influence established the RTS as the premier "macro and micro" game: macro is building the right things at the right time, micro is controlling individual units with precision during combat.

- **Age of Empires II (Ensemble Studios, 1999):** Where StarCraft emphasized speed and asymmetry, AoE II emphasized long-term planning and civilization development. Its tech tree — a branching progression from the Dark Age to the Imperial Age — showed that RTS games could span hours and feel like epic narratives of growth. Age of Empires II's thirteen civilizations (expanded to dozens over time) demonstrated that even symmetric starting conditions could produce diverse gameplay through tech tree variations and unique units.

- **Company of Heroes (Relic Entertainment, 2006):** Relic stripped away base building and resource gathering in favor of territory control — holding strategic points on the map generated resources automatically. This shifted the genre's focus from economy to tactics: positioning, cover, flanking, and combined arms. Company of Heroes proved that the RTS could be as much about moment-to-moment battlefield decisions as about long-term build orders, and that reducing macro complexity could make the genre more accessible without sacrificing depth.

### What Makes an RTS "Great"

A great RTS creates meaningful decisions at every timescale. In the moment, the player micro-manages individual units — dodging projectiles, focusing fire, flanking. Over minutes, they make macro decisions — what to build next, when to expand, when to attack. Over the full game, they execute a strategy — rush early, turtle and tech up, or play for the late game. The best entries in the genre ensure that all three timescales matter, that no single strategy dominates, and that information (scouting, fog of war) is as valuable a resource as minerals or gold. An RTS is a game about imperfect information and imperfect execution — the winner is the player who makes the best decisions with incomplete data while under constant time pressure.

### The Essential Mechanic

Commanding multiple units while managing an economy in real-time.

## Week 2: Build the MVP

### What You're Building

A stripped-down RTS with one unit type, one resource, one building, and a simple enemy that produces units on a timer. The player gathers resources, builds structures that produce units, selects and commands those units, and attempts to destroy the enemy base — all while the fog of war hides unexplored territory. The emphasis is on the core interaction patterns (select, command, build) rather than content depth.

### Core Concepts (Must Implement)

**1. Box Selection / Unit Selection System**

The fundamental input pattern of the RTS: click to select one unit, click-drag to draw a box and select all units inside it, shift-click to add or remove units from the selection. Every command the player issues applies to the current selection.

```
selection = []
drag_start = null
is_dragging = false

function on_mouse_down(position):
    drag_start = position
    is_dragging = false

function on_mouse_move(position):
    if drag_start and distance(drag_start, position) > 5:
        is_dragging = true
        draw_selection_rectangle(drag_start, position)

function on_mouse_up(position):
    if is_dragging:
        # Box select: find all player units inside the rectangle
        box = make_rect(drag_start, position)
        if not input_held("shift"):
            selection = []
        for unit in player_units:
            if point_in_rect(unit.position, box):
                if unit not in selection:
                    selection.append(unit)
    else:
        # Single click
        clicked_unit = find_unit_at(position)
        if input_held("shift"):
            # Toggle unit in selection
            if clicked_unit in selection:
                selection.remove(clicked_unit)
            elif clicked_unit and clicked_unit.owner == "player":
                selection.append(clicked_unit)
        else:
            selection = []
            if clicked_unit and clicked_unit.owner == "player":
                selection = [clicked_unit]

    drag_start = null
    is_dragging = false
```

**Why it matters:** Box selection is the most important UX pattern in the RTS. It is how the player expresses intent at scale — without it, commanding an army of 50 units would require 50 individual clicks. The quality of the selection system directly determines how many actions per minute the player can execute.

**2. Right-Click Command System**

The context-sensitive command input: right-click on empty ground to move, right-click on an enemy to attack, right-click on a resource to gather. The same input produces different commands based on what is under the cursor.

```
function on_right_click(position):
    if len(selection) == 0: return

    target = get_entity_at(position)

    if target == null:
        # Move command
        issue_command(selection, { type: "move", destination: position })
    elif target.owner == "enemy":
        # Attack command
        issue_command(selection, { type: "attack", target: target })
    elif target.type == "resource":
        # Gather command (only for worker units)
        workers = selection.filter(u => u.can_gather)
        issue_command(workers, { type: "gather", target: target })

function issue_command(units, command):
    for unit in units:
        unit.current_command = command
        unit.command_queue = [command]   # Replace queue (shift-click would append)

function update_unit(unit, dt):
    if unit.current_command == null: return
    cmd = unit.current_command

    if cmd.type == "move":
        move_toward(unit, cmd.destination, dt)
        if distance(unit.position, cmd.destination) < 2:
            unit.current_command = next_in_queue(unit)

    elif cmd.type == "attack":
        if distance(unit.position, cmd.target.position) <= unit.attack_range:
            attack(unit, cmd.target)
        else:
            move_toward(unit, cmd.target.position, dt)

    elif cmd.type == "gather":
        if distance(unit.position, cmd.target.position) <= 1:
            gather_resource(unit, cmd.target)
        else:
            move_toward(unit, cmd.target.position, dt)
```

**Why it matters:** The right-click command system makes the RTS feel responsive and intuitive. One input does the "right thing" in every context. This design reduces the cognitive load of controlling many units — the player focuses on WHERE to click, and the game figures out WHAT to do.

**3. Fog of War Implementation**

The map is divided into three visibility states per tile: unexplored (completely hidden), explored but fogged (visible terrain, no unit info), and currently visible (fully revealed by a nearby unit). Each unit reveals tiles within its vision radius.

```
FOG_UNEXPLORED = 0    # Black — never seen
FOG_EXPLORED = 1      # Dim — seen before, no live info
FOG_VISIBLE = 2       # Clear — currently in unit's vision

fog_map = 2D array [map_width][map_height] initialized to FOG_UNEXPLORED

function update_fog_of_war():
    # Reset all visible tiles to explored (they were visible last frame)
    for x in 0 to map_width:
        for y in 0 to map_height:
            if fog_map[x][y] == FOG_VISIBLE:
                fog_map[x][y] = FOG_EXPLORED

    # For each player unit, reveal tiles within vision radius
    for unit in player_units:
        tiles_in_range = get_tiles_in_radius(unit.position, unit.vision_radius)
        for tile in tiles_in_range:
            # Optional: line-of-sight check for terrain blocking vision
            if has_line_of_sight(unit.position, tile):
                fog_map[tile.x][tile.y] = FOG_VISIBLE

function render_tile(x, y):
    if fog_map[x][y] == FOG_UNEXPLORED:
        draw_black(x, y)
    elif fog_map[x][y] == FOG_EXPLORED:
        draw_terrain(x, y)
        draw_overlay(x, y, color: black, opacity: 0.5)   # Dim overlay
    elif fog_map[x][y] == FOG_VISIBLE:
        draw_terrain(x, y)
        draw_entities_at(x, y)   # Show enemy units only in visible tiles
```

**Why it matters:** Fog of war transforms a strategy game from a puzzle (perfect information) into a true strategy game (imperfect information). Without fog, both players know everything and the game reduces to execution speed. With fog, scouting becomes essential, surprise attacks become possible, and the player must make decisions under uncertainty — which is what real strategy is.

**4. Resource Gathering and Tech Trees**

Workers collect a resource from the map, deposit it at the base, and the player spends resources to construct buildings that unlock new unit types. This is the economic backbone of the RTS — the engine that powers everything else.

```
player_resources = { minerals: 50 }   # Starting resources

costs = {
    "worker":   { minerals: 50,  build_time: 5.0 },
    "soldier":  { minerals: 100, build_time: 8.0, requires: "barracks" },
    "barracks": { minerals: 150, build_time: 10.0 }
}

function gather_resource(worker, resource_node):
    if worker.carrying >= worker.carry_capacity:
        # Return to base to deposit
        worker.current_command = { type: "deposit", target: find_nearest_base() }
        return

    worker.gather_timer += dt
    if worker.gather_timer >= 1.0:    # 1 second per harvest tick
        amount = min(5, resource_node.remaining)
        worker.carrying += amount
        resource_node.remaining -= amount
        worker.gather_timer = 0
        if resource_node.remaining <= 0:
            resource_node.destroy()    # Depleted

function deposit_resources(worker, base):
    player_resources.minerals += worker.carrying
    worker.carrying = 0
    # Automatically return to last resource node
    worker.current_command = { type: "gather", target: worker.last_resource }

function can_afford(unit_type):
    cost = costs[unit_type]
    return player_resources.minerals >= cost.minerals

function try_build(building_type, position):
    if can_afford(building_type):
        player_resources.minerals -= costs[building_type].minerals
        start_construction(building_type, position, costs[building_type].build_time)
```

**Why it matters:** The economy is the meta-game of the RTS. Every unit and building has an opportunity cost — minerals spent on soldiers cannot be spent on workers, and vice versa. The tech tree creates decision points: do you rush soldiers now, or invest in a barracks to unlock better units later? This is the "strategy" in real-time strategy.

**5. Formation Movement**

When multiple selected units are given a move command, they do not all path to the exact same point (which would cause clumping). Instead, they form up around the destination in a spread pattern, maintaining relative positions.

```
function calculate_formation_positions(units, destination):
    count = len(units)
    if count == 1:
        return [destination]

    positions = []
    # Simple grid formation
    columns = ceil(sqrt(count))
    spacing = 20    # pixels between units

    for i in 0 to count:
        row = floor(i / columns)
        col = i % columns
        offset_x = (col - columns / 2) * spacing
        offset_y = (row - floor(count / columns) / 2) * spacing
        positions.append({
            x: destination.x + offset_x,
            y: destination.y + offset_y
        })

    return positions

function issue_move_command(units, destination):
    formation = calculate_formation_positions(units, destination)
    for i, unit in enumerate(units):
        unit.current_command = { type: "move", destination: formation[i] }

# Steering: avoid overlapping while moving
function update_unit_movement(unit, dt):
    direction = normalize(unit.target - unit.position)

    # Separation: push away from nearby friendly units
    separation = { x: 0, y: 0 }
    for other in nearby_units(unit, radius: 15):
        away = normalize(unit.position - other.position)
        separation += away

    final_direction = normalize(direction * 0.8 + separation * 0.2)
    unit.position += final_direction * unit.speed * dt
```

**Why it matters:** Formation movement is what makes an army feel like an army instead of a blob. It also has tactical implications — a spread formation is harder to hit with area attacks, while a tight formation concentrates firepower. Even a simple formation system dramatically improves the visual and strategic quality of unit movement.

**6. Build Queue System**

Production buildings train units over time. The player can queue multiple units, and they are produced sequentially. Managing build queues across multiple buildings is a core macro skill.

```
function create_building(type, position):
    return {
        type: type,
        position: position,
        build_queue: [],        # List of unit types to produce
        current_build: null,
        build_progress: 0,
        rally_point: position   # Where produced units go
    }

function add_to_queue(building, unit_type):
    if not can_afford(unit_type): return
    if costs[unit_type].requires and not player_has_building(costs[unit_type].requires): return

    player_resources.minerals -= costs[unit_type].minerals
    building.build_queue.append(unit_type)

    if building.current_build == null:
        start_next_in_queue(building)

function start_next_in_queue(building):
    if len(building.build_queue) == 0:
        building.current_build = null
        return
    building.current_build = building.build_queue.pop(0)
    building.build_progress = 0

function update_building(building, dt):
    if building.current_build == null: return

    building.build_progress += dt
    total_time = costs[building.current_build].build_time

    if building.build_progress >= total_time:
        # Unit complete — spawn it
        new_unit = spawn_unit(building.current_build, building.position)
        new_unit.current_command = { type: "move", destination: building.rally_point }
        start_next_in_queue(building)

# Display: show queue contents and progress bar for current build
function render_build_queue(building):
    if building.current_build:
        progress = building.build_progress / costs[building.current_build].build_time
        draw_progress_bar(progress)
    for i, queued in enumerate(building.build_queue):
        draw_queue_icon(queued, position: i)
```

**Why it matters:** Build queues are how the player converts economic advantage into military strength. Keeping production buildings busy (never idle, never supply-blocked) is one of the most important macro skills in the RTS. The queue system also creates pacing — units do not appear instantly, so the player must plan ahead.

**7. Minimap with Fog**

A small overview of the entire map shown in a corner of the screen. It displays terrain, unit positions (color-coded by team), fog state, and allows the player to click on it to jump the camera to that location.

```
MINIMAP_SIZE = 150    # pixels
MINIMAP_POSITION = { x: screen_width - MINIMAP_SIZE - 10, y: screen_height - MINIMAP_SIZE - 10 }

function render_minimap():
    scale_x = MINIMAP_SIZE / map_width
    scale_y = MINIMAP_SIZE / map_height

    # Draw terrain base
    for x in 0 to map_width:
        for y in 0 to map_height:
            mini_x = MINIMAP_POSITION.x + x * scale_x
            mini_y = MINIMAP_POSITION.y + y * scale_y

            if fog_map[x][y] == FOG_UNEXPLORED:
                draw_pixel(mini_x, mini_y, color: black)
            elif fog_map[x][y] == FOG_EXPLORED:
                draw_pixel(mini_x, mini_y, color: dark_gray)
            else:
                draw_pixel(mini_x, mini_y, color: terrain_color(x, y))

    # Draw units as colored dots
    for unit in all_units:
        if fog_map[unit.tile_x][unit.tile_y] == FOG_VISIBLE or unit.owner == "player":
            mini_x = MINIMAP_POSITION.x + unit.position.x * scale_x
            mini_y = MINIMAP_POSITION.y + unit.position.y * scale_y
            color = "green" if unit.owner == "player" else "red"
            draw_dot(mini_x, mini_y, color: color, size: 2)

    # Draw camera viewport rectangle
    cam_rect = get_camera_viewport()
    draw_rect_outline(
        MINIMAP_POSITION.x + cam_rect.x * scale_x,
        MINIMAP_POSITION.y + cam_rect.y * scale_y,
        cam_rect.width * scale_x,
        cam_rect.height * scale_y,
        color: white
    )

function on_minimap_click(screen_position):
    # Convert minimap click to world position and move camera
    relative_x = (screen_position.x - MINIMAP_POSITION.x) / MINIMAP_SIZE
    relative_y = (screen_position.y - MINIMAP_POSITION.y) / MINIMAP_SIZE
    world_x = relative_x * map_width
    world_y = relative_y * map_height
    center_camera_on(world_x, world_y)
```

**Why it matters:** The minimap is the player's strategic awareness tool. In a game where the camera shows only a fraction of the map, the minimap provides the global context needed to make informed decisions: Where is the enemy attacking? Where are my idle workers? Where should I expand? Clicking the minimap to jump the camera is essential for managing multiple fronts.

### Stretch Goals

- **Attack-move command:** Units move to a destination but automatically engage any enemy encountered along the way. This is the most-used command in competitive RTS play.
- **Simple AI opponent:** An enemy AI that gathers resources, builds units on a timer, and sends them to attack the player's base periodically.
- **Multiple unit types:** Add a ranged unit and a melee unit with different strengths, creating combined-arms tactics.
- **Control groups:** Press Ctrl+1 to assign selected units to group 1, press 1 to re-select them instantly. This is the keyboard shortcut backbone of competitive RTS.

### MVP Spec

| Element | Minimum Viable Version |
|---|---|
| **Units** | 1 unit type (worker that can also fight) or 1 worker + 1 soldier |
| **Resource** | 1 resource type, harvestable from nodes on the map |
| **Buildings** | Base (deposits resources, trains workers) + 1 production building |
| **Selection** | Click to select, drag-box to multi-select |
| **Commands** | Right-click to move, right-click enemy to attack, right-click resource to gather |
| **Fog of War** | 3-state fog (unexplored, explored, visible) updated per unit |
| **Build Queue** | Buildings produce units over time with a queue |
| **Minimap** | Overview with fog state, unit dots, and click-to-move-camera |
| **Enemy** | A pre-placed enemy base that produces units on a timer |
| **Win/Lose** | Destroy enemy base to win, lose if your base is destroyed |

### Deliverable

A playable RTS where the player gathers resources with workers, constructs a building, produces combat units, and commands them to destroy an enemy base — all while fog of war hides unexplored territory and a minimap provides strategic overview. The enemy should produce units on a timer and attack periodically, creating time pressure. The game is won by destroying the enemy base before it overwhelms the player.

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Box Selection | Like bulk operations in a database — SELECT * WHERE position WITHIN bounding_box. You query for entities matching spatial criteria and operate on the result set. |
| Right-Click Commands | Like RESTful API design — the same endpoint (right-click) performs different operations (GET, POST, DELETE) based on context (what the cursor is over). |
| Fog of War | Like access control with visibility scopes — each unit is a principal with a vision radius, and only entities within that radius are authorized for display. |
| Resource Gathering / Tech Tree | Like capacity planning — you invest compute (workers) to generate throughput (resources) that funds infrastructure (buildings) that enables capability (new unit types). |
| Formation Movement | Like load-balanced request distribution — incoming traffic (a move command) is distributed across servers (units) so no single server receives all the load (units do not stack on one tile). |
| Build Queue | Like a message queue with consumers — build orders are enqueued, and the building processes them sequentially at a fixed rate, like a worker consuming from a job queue. |
| Minimap | Like a monitoring dashboard — an aggregated, real-time view of the entire system's health (map state), with the ability to drill into specific services (click to move camera). |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Box Selection | Like `document.querySelectorAll` with a spatial query — you define a bounding box and receive all matching DOM elements (units) within it. |
| Right-Click Commands | Like context menus in a UI — right-clicking produces different options depending on what element the cursor is over (file, folder, text). |
| Fog of War | Like lazy loading with placeholder content — unexplored areas show a placeholder (black), explored areas show a low-res preview (dimmed terrain), and visible areas are fully loaded. |
| Resource Gathering / Tech Tree | Like a build pipeline — raw source (resources) is compiled (gathered) into artifacts (buildings/units) through a dependency graph (tech tree). |
| Formation Movement | Like CSS Flexbox layout — units are distributed along an axis with configurable spacing and alignment, avoiding overlap while maintaining a coherent visual group. |
| Build Queue | Like a render queue or animation frame queue — tasks are processed in order, one at a time, with a progress indicator showing completion percentage. |
| Minimap | Like a site map or thumbnail preview — a zoomed-out view of the full page (map) showing the user's current viewport location, with click-to-scroll navigation. |

### Data/ML Developers

| Core Concept | Analogy |
|---|---|
| Box Selection | Like spatial indexing with a bounding box query — a k-d tree or R-tree returns all data points (units) within the query rectangle. |
| Right-Click Commands | Like polymorphic dispatch based on input type — the same function call (right-click) routes to different implementations based on the runtime type of the argument (target entity). |
| Fog of War | Like masking in attention mechanisms — each unit's vision defines an attention mask, and only unmasked tokens (visible tiles) contribute to the player's information. |
| Resource Gathering / Tech Tree | Like a DAG of data transformations — raw data (resources) flows through processing stages (buildings), and later stages depend on outputs of earlier ones (tech requirements). |
| Formation Movement | Like distributing data points to avoid collisions in a visualization — applying repulsive forces (separation steering) while maintaining cluster structure (formation shape). |
| Build Queue | Like a FIFO job queue in a training pipeline — jobs (unit production orders) are processed sequentially, each taking a known duration, with the pipeline reporting progress. |
| Minimap | Like a dimensionality reduction visualization (t-SNE or PCA plot) — the full high-dimensional data (game map) is projected into a small, navigable overview that preserves key relationships. |

### Discussion Questions

1. StarCraft professionals execute 300+ actions per minute (APM). To what extent should an RTS reward mechanical speed versus strategic thinking? Can you design an RTS where the slower player wins if they make better decisions?

2. Fog of war creates imperfect information, which means the player must make decisions under uncertainty. How does this change the nature of "optimal play" compared to a game with perfect information (like chess)? What role does scouting play in reducing uncertainty?

3. The RTS genre has declined in mainstream popularity while MOBAs (which evolved from RTS mods) have thrived. What aspects of the RTS are too demanding for casual play, and how might you simplify them without losing strategic depth?

4. In an RTS, the player manages an economy, an army, and information simultaneously. How is this form of multitasking different from the moment-to-moment decision-making in an action game? What cognitive skills does each genre train?
