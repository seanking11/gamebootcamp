# Module 23: Turn-Based Strategy
**Grids, probability, and agonizing decisions | 95% to hit. Missed.**
> "In preparing for battle I have always found that plans are useless, but planning is indispensable." — Dwight D. Eisenhower
---

## Prerequisites

- **Module 7 (Roguelike):** Grid-based world representation, turn-based input loops, entity-on-grid movement.
- **Module 6 (Tower Defense):** Pathfinding (A* or BFS), tile cost considerations, spatial reasoning.

## Week 1: History & Design Theory

### The Origin

Turn-based tactics games descended directly from tabletop war games — hex grids, cardboard counters, and probability tables. The digital translation began with early titles like Nobunaga's Ambition (1983) and the original Fire Emblem (1990), which moved the war game to a console screen and replaced dice rolls with hidden random number generators. The genre's core promise is giving the player time to think. Unlike an RTS where the clock never stops, a turn-based strategy game says: "Here is a complex situation. Take as long as you need to find the best move." This deliberate pacing attracted players who valued planning over reflexes, and the genre became the home of some of the deepest tactical systems in all of gaming.

### How the Genre Evolved

- **Fire Emblem (Intelligent Systems, 1990):** The original Fire Emblem established the tactical RPG template: grid-based maps, character permadeath, weapon triangle (swords beat axes beat lances), and movement ranges defined by unit class. Its genius was making each unit a named character with personality and relationships — losing a unit was not just a tactical setback but an emotional loss. Fire Emblem proved that the stakes of turn-based combat did not need to be abstract; they could be deeply personal.

- **XCOM: Enemy Unknown (Firaxis, 2012):** Firaxis reinvented the tactical game for a modern audience. Its cover system — half cover and full cover modifying hit probability — made positioning the central tactical decision. Its visible percentage displays ("72% to hit") created agonizing risk-reward calculations that the player could see and reason about. XCOM also layered a strategic management game (base building, research, resource allocation) on top of the tactical combat, creating two complementary timescales of decision-making.

- **Into the Breach (Subset Games, 2018):** Into the Breach stripped the genre to its absolute essence: small grids, few units, and complete information. Every enemy telegraphs its next attack, and the player's job is to figure out how to prevent the most damage with limited actions. Its "undo move" system (you can take back movement but not attacks) gave the player permission to experiment. Into the Breach proved that turn-based tactics could be a puzzle game — deterministic, transparent, and brutally elegant.

### What Makes Turn-Based Strategy "Great"

A great turn-based strategy game makes every decision feel like it matters. The best entries create situations where the player can see multiple viable options, each with clear tradeoffs: advance this sniper to high ground for a better angle but expose her to flanking fire, or keep her in cover with a worse shot? Use the last action point to attack or to set up overwatch? The probability system must be transparent enough that the player can make informed bets (XCOM's percentage displays) but uncertain enough that no plan is guaranteed. And the consequences must be real — whether through permadeath, limited resources, or cascading position disadvantage. When a plan comes together despite uncertainty, the satisfaction is profound. When it falls apart because of a 5% miss, the agony is equally memorable.

### The Essential Mechanic

Positioning units on a grid where cover, range, and probability determine outcomes.

## Week 2: Build the MVP

### What You're Building

A tactical combat game on a grid where the player controls 3-4 units against a group of enemies. Each unit has action points, a movement range, and an attack with a hit probability modified by cover and range. The map has cover objects (walls, crates) that units can hide behind. Turns alternate between the player (who moves all units) and the enemy (which follows simple AI). Win by eliminating all enemies; lose if all player units fall.

### Core Concepts (Must Implement)

**1. Movement Range Calculation on a Grid**

From a unit's current position, calculate which tiles it can reach given its movement budget. This is a breadth-first search (BFS) where each tile has a movement cost, and the search stops when the budget is exhausted.

```
function calculate_movement_range(unit):
    start = unit.grid_position
    budget = unit.move_range    # e.g., 5 tiles

    reachable = {}    # tile -> remaining_budget
    queue = [(start, budget)]
    reachable[start] = budget

    while queue is not empty:
        current, remaining = queue.pop_front()

        for neighbor in get_adjacent_tiles(current):    # 4-directional or 6 for hex
            if not is_walkable(neighbor): continue
            if is_occupied_by_enemy(neighbor): continue

            cost = get_tile_move_cost(neighbor)    # 1 for normal, 2 for rough terrain
            new_remaining = remaining - cost

            if new_remaining >= 0 and new_remaining > reachable.get(neighbor, -1):
                reachable[neighbor] = new_remaining
                queue.append((neighbor, new_remaining))

    return reachable    # Highlight these tiles as valid move destinations

function get_tile_move_cost(tile):
    if tile.terrain == "normal": return 1
    if tile.terrain == "rough": return 2
    if tile.terrain == "water": return 3
    return 1
```

**Why it matters:** Movement range visualization is how the player plans. Seeing the blue-highlighted tiles tells them exactly what is possible this turn. The BFS with variable tile costs adds tactical depth — rough terrain becomes a natural choke point, and high-cost tiles create interesting tradeoffs between the short path and the safe path.

**2. Action Point System**

Each unit gets a fixed number of action points (AP) per turn. Moving costs AP. Attacking costs AP. Using an ability costs AP. The player must decide how to spend them — a unit that moves far cannot attack, and a unit that attacks twice cannot move.

```
ACTIONS = {
    "move":     { ap_cost: 1 },
    "attack":   { ap_cost: 1 },
    "overwatch": { ap_cost: 2 },    # Uses all remaining AP
    "heal":     { ap_cost: 1 }
}

function start_player_turn():
    for unit in player_units:
        unit.ap = unit.max_ap    # Typically 2
        unit.has_moved = false
        unit.has_attacked = false

function try_action(unit, action_type):
    cost = ACTIONS[action_type].ap_cost
    if unit.ap < cost:
        show_message("Not enough action points")
        return false
    unit.ap -= cost
    return true

function get_available_actions(unit):
    actions = []
    if unit.ap >= ACTIONS["move"].ap_cost and not unit.has_moved:
        actions.append("move")
    if unit.ap >= ACTIONS["attack"].ap_cost:
        actions.append("attack")
    if unit.ap >= ACTIONS["overwatch"].ap_cost:
        actions.append("overwatch")
    if unit.ap >= ACTIONS["heal"].ap_cost and unit.has_heal_ability:
        actions.append("heal")
    return actions

function end_unit_turn(unit):
    # Unit is done — check if all player units have spent their AP
    if all(u.ap == 0 or u.is_done for u in player_units):
        start_enemy_turn()
```

**Why it matters:** Action points create the fundamental tension in turn-based tactics: economy of action. With only 2 AP, every point matters. Do you move into cover or stay exposed and attack twice? Do you advance or set up overwatch? AP turns each unit's turn into a small optimization problem with real consequences.

**3. Hit Probability / Accuracy System**

When a unit attacks, the hit chance is calculated from base accuracy modified by distance, cover, flanking, and elevation. The percentage is displayed to the player before they commit, creating an informed gamble.

```
BASE_HIT_CHANCE = 75    # Percent

COVER_MODIFIERS = {
    "none": 0,
    "half": -25,     # Half cover: -25% to hit
    "full": -40      # Full cover: -40% to hit
}

RANGE_PENALTY = -5      # Per tile beyond optimal range
FLANK_BONUS = 25        # Attacking from the side/rear
ELEVATION_BONUS = 10    # Shooting from high ground

function calculate_hit_chance(attacker, defender):
    chance = BASE_HIT_CHANCE

    # Cover: check what's between attacker and defender
    cover = get_cover_between(attacker.position, defender.position)
    chance += COVER_MODIFIERS[cover]

    # Range penalty
    dist = grid_distance(attacker.position, defender.position)
    if dist > attacker.optimal_range:
        chance += RANGE_PENALTY * (dist - attacker.optimal_range)

    # Flanking bonus: is attacker attacking from side/rear?
    if is_flanking(attacker.position, defender):
        chance += FLANK_BONUS

    # Elevation bonus
    if attacker.elevation > defender.elevation:
        chance += ELEVATION_BONUS

    # Clamp between 5% and 95% — nothing is guaranteed
    chance = clamp(chance, 5, 95)
    return chance

function attempt_attack(attacker, defender):
    hit_chance = calculate_hit_chance(attacker, defender)

    # Display to player: "72% to hit — 4 damage"
    display_shot_preview(hit_chance, attacker.damage)

    if player_confirms_attack():
        roll = random(0, 100)
        if roll < hit_chance:
            apply_damage(defender, attacker.damage)
            show_result("HIT!")
        else:
            show_result("MISSED")

function get_cover_between(attacker_pos, defender_pos):
    # Check tiles adjacent to the defender for cover objects
    # Cover only counts if it's between the attacker and defender
    direction = normalize(attacker_pos - defender_pos)
    cover_tile = defender_pos + round(direction)
    if has_cover_object(cover_tile):
        if is_full_cover(cover_tile): return "full"
        return "half"
    return "none"
```

**Why it matters:** The hit probability system is the emotional core of the genre. Showing the player "72% to hit" before they shoot creates a moment of genuine tension — they chose to take this shot knowing it might miss. This transforms RNG from something that happens TO the player into a risk the player consciously accepts. It is the difference between "the game cheated me" and "I knew the odds and I took the gamble."

**4. Cover System on a Grid**

Certain tiles or tile edges provide cover. A unit standing behind cover receives a defensive bonus against attacks from the covered direction. Cover is directional — it protects from one side but not from flanking.

```
# Cover objects are placed on the map
cover_objects = [
    { position: [3, 4], type: "half", blocks_movement: false },    # Sandbags
    { position: [5, 2], type: "full", blocks_movement: true },     # Wall
    { position: [7, 6], type: "half", blocks_movement: false }     # Crate
]

function get_cover_for_unit(unit_pos, attacker_pos):
    # Check the tile between unit and attacker for cover
    dx = sign(attacker_pos.x - unit_pos.x)
    dy = sign(attacker_pos.y - unit_pos.y)

    # Check cardinal directions from the unit toward the attacker
    check_positions = []
    if dx != 0: check_positions.append({ x: unit_pos.x + dx, y: unit_pos.y })
    if dy != 0: check_positions.append({ x: unit_pos.x, y: unit_pos.y + dy })

    best_cover = "none"
    for pos in check_positions:
        for cover in cover_objects:
            if cover.position == [pos.x, pos.y]:
                if cover.type == "full" and best_cover != "full":
                    best_cover = "full"
                elif cover.type == "half" and best_cover == "none":
                    best_cover = "half"

    return best_cover

# Display cover indicators around a selected unit
function show_cover_indicators(unit_pos):
    directions = [UP, DOWN, LEFT, RIGHT]
    for dir in directions:
        adjacent = unit_pos + dir
        cover_type = get_cover_at(adjacent)
        if cover_type == "full":
            draw_shield_icon(unit_pos, dir, color: blue)     # Full shield
        elif cover_type == "half":
            draw_shield_icon(unit_pos, dir, color: yellow)   # Half shield
```

**Why it matters:** Cover makes positioning the most important decision in the game. The same unit in the open dies in one hit; behind full cover, it can hold a position for turns. Cover creates a tactical vocabulary: "advance to the next cover," "flank the enemy's cover," "destroy their cover with explosives." The grid becomes a landscape of safe and dangerous positions.

**5. Fog of War with Unit Vision**

Each unit reveals a radius of tiles around it. Tiles outside all units' vision are hidden. Enemy units in hidden tiles are invisible. This makes scouting and vision control a tactical resource.

```
function update_tactical_fog(player_units):
    # Reset visibility
    for x in 0 to grid_width:
        for y in 0 to grid_height:
            visible_map[x][y] = false

    # Each unit reveals tiles around it
    for unit in player_units:
        if unit.is_dead: continue
        for x in 0 to grid_width:
            for y in 0 to grid_height:
                dist = grid_distance(unit.position, [x, y])
                if dist <= unit.vision_range:
                    # Check line of sight (blocked by tall cover / walls)
                    if has_line_of_sight_grid(unit.position, [x, y]):
                        visible_map[x][y] = true

function has_line_of_sight_grid(from_pos, to_pos):
    # Bresenham line between the two grid positions
    tiles_on_line = get_line_tiles(from_pos, to_pos)
    for tile in tiles_on_line:
        if tile == to_pos: break    # Don't block by the target tile itself
        if blocks_vision(tile):     # Tall walls block LOS
            return false
    return true

function get_visible_enemies():
    visible = []
    for enemy in all_enemies:
        if visible_map[enemy.position.x][enemy.position.y]:
            visible.append(enemy)
    return visible

# Enemies in fog are not rendered and cannot be targeted
function render_grid():
    for x in 0 to grid_width:
        for y in 0 to grid_height:
            draw_terrain(x, y)
            if not visible_map[x][y]:
                draw_fog_overlay(x, y)    # Darken non-visible tiles
```

**Why it matters:** Fog of war in a tactics game transforms information into a resource. Moving a unit forward is not just about positioning — it is about gaining vision. An enemy you cannot see is an enemy you cannot plan for. This creates tension between aggressive advancement (gaining information) and cautious play (staying safe), and rewards the player who controls the most information.

**6. Initiative / Turn Order for Units**

The system that determines when each side acts. Common approaches include "I-go-you-go" (player moves all units, then enemy moves all units), alternating activation (player moves one unit, enemy moves one), or speed-based individual initiative.

```
# Approach 1: I-Go-You-Go (XCOM style) — simplest for MVP
current_phase = "player"

function start_player_phase():
    current_phase = "player"
    for unit in player_units:
        unit.ap = unit.max_ap
    # Player takes actions with all units in any order
    # When all units are done (or player clicks "End Turn"):
    # -> start_enemy_phase()

function start_enemy_phase():
    current_phase = "enemy"
    for enemy in enemy_units:
        enemy.ap = enemy.max_ap
        execute_enemy_ai(enemy)
    start_player_phase()

# Approach 2: Alternating (more tactical, less swingy)
turn_queue = []

function build_turn_queue():
    # Interleave player and enemy units by speed
    all_units = player_units + enemy_units
    all_units.sort_by(u => u.stats.speed, descending)
    turn_queue = all_units

function next_unit_turn():
    if len(turn_queue) == 0:
        build_turn_queue()    # New round
    unit = turn_queue.pop(0)
    if unit.is_dead:
        next_unit_turn()    # Skip dead units
        return
    unit.ap = unit.max_ap
    if unit.owner == "player":
        enable_player_control(unit)
    else:
        execute_enemy_ai(unit)
```

**Why it matters:** Turn order profoundly affects strategy. In I-go-you-go, a player who loses a unit does not get a chance to react until the enemy phase ends — momentum swings are dramatic. In alternating systems, losing a unit still hurts, but the opponent cannot chain multiple kills without the player getting a response. The choice of system changes how aggressive or defensive the optimal strategy is.

**7. Undo / Preview System**

Showing the player what will happen before they commit. Movement preview shows the path and destination. Attack preview shows hit chance and damage. Into the Breach-style systems even show enemy intentions, letting the player plan with near-complete information.

```
preview_state = null

function preview_move(unit, destination):
    path = find_path(unit.position, destination)
    # Show the path the unit will take
    for tile in path:
        highlight_tile(tile, color: blue_transparent)
    # Show what cover the unit will have at the destination
    show_cover_indicators(destination)
    # Show which enemies will be in range from the destination
    for enemy in get_visible_enemies():
        if grid_distance(destination, enemy.position) <= unit.attack_range:
            highlight_tile(enemy.position, color: red_transparent)
            hit_chance = calculate_hit_chance_from(destination, enemy)
            show_floating_text(enemy.position, str(hit_chance) + "%")

function preview_attack(attacker, defender):
    hit_chance = calculate_hit_chance(attacker, defender)
    damage = attacker.damage

    # Show detailed preview panel
    display_panel({
        "Hit Chance": str(hit_chance) + "%",
        "Damage": str(damage),
        "Cover": get_cover_for_unit(defender.position, attacker.position),
        "Range": grid_distance(attacker.position, defender.position),
        "Flanking": is_flanking(attacker.position, defender)
    })

# Undo: allow taking back movement (but not attacks)
move_history = []

function execute_move(unit, destination):
    move_history.append({ unit: unit, from: unit.position, ap_spent: 1 })
    unit.position = destination
    unit.ap -= 1

function undo_last_move():
    if len(move_history) == 0: return
    last = move_history.pop()
    if last.unit.has_attacked:
        show_message("Cannot undo — unit has already attacked")
        move_history.append(last)    # Put it back
        return
    last.unit.position = last.from
    last.unit.ap += last.ap_spent
```

**Why it matters:** The preview system is what separates a tactics game from a guessing game. By showing the player exactly what will happen (or the probability of what will happen), the designer ensures that mistakes feel like the player's fault, not the game's. Undo for movement further reduces frustration — the interesting decision is "where should I position?" not "did I click the right tile?" Removing friction from execution puts all the pressure on decision-making, where it belongs.

### Stretch Goals

- **Overwatch / reaction fire:** A unit spends AP to enter "overwatch" — it will automatically shoot the first enemy that moves within its line of sight during the enemy turn.
- **Destructible cover:** Explosives or heavy attacks can destroy cover objects, opening new sight lines and removing enemy protection.
- **Unit classes:** Sniper (long range, low movement), assault (short range, high movement), support (healer, buffer). Different classes create squad composition decisions.
- **Enemy intent display:** Into the Breach style — show exactly what each enemy will do next turn, turning the game into a puzzle of mitigation.

### MVP Spec

| Element | Minimum Viable Version |
|---|---|
| **Grid** | 8x8 to 12x12 tile grid with terrain and cover objects |
| **Player Units** | 3-4 units with HP, movement range, attack range, and damage |
| **Enemy Units** | 3-5 enemies with simple AI (move toward player, attack if in range) |
| **Movement** | BFS-based range display, click-to-move, path preview |
| **Combat** | Hit probability based on cover and range, displayed before confirming |
| **Cover** | At least 2 cover types (half and full) affecting hit chance |
| **Action Points** | 2 AP per unit per turn: move + attack, or double move, or double attack |
| **Fog of War** | Per-unit vision radius, enemies hidden outside vision |
| **Turn Structure** | I-go-you-go: player moves all units, then all enemies act |
| **Preview** | Movement path preview, attack hit % preview, cover indicators |
| **Win/Lose** | Eliminate all enemies to win; all player units killed = lose |

### Deliverable

A playable turn-based tactics game where the player positions 3-4 units on a grid with cover objects, moves them within calculated ranges, attacks enemies with probability-based hits modified by cover and range, and attempts to eliminate all enemies before being eliminated. The player should always see hit percentages before attacking and movement ranges before moving. At least one moment in the game should create a genuine tactical dilemma — a choice between a safe option and a risky-but-rewarding one.

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Movement Range (BFS) | Like a network hop-count query — BFS from a source node with a TTL (movement budget), where each edge has a weight (tile cost), returning all reachable nodes. |
| Action Point System | Like API rate limits per request window — each unit gets N actions per turn, and the caller (player) must decide how to spend them before the window resets. |
| Hit Probability | Like probabilistic data structures (Bloom filters, HyperLogLog) — the system gives you a confidence percentage, not a guarantee. You design around the uncertainty. |
| Cover System | Like defense-in-depth in security — half cover is a firewall (reduces attack surface), full cover is a firewall plus WAF (reduces it further). Flanking is bypassing both from an unprotected vector. |
| Fog of War (Unit Vision) | Like service discovery with TTL — each unit broadcasts its presence and vision radius, and only entities within the discovery range appear in the service registry. |
| Initiative / Turn Order | Like round-robin vs. priority scheduling — I-go-you-go is round-robin (each side gets a full slice), alternating activation is priority scheduling (fastest entity goes first). |
| Undo / Preview | Like dry-run mode in a deployment pipeline — you preview the changes before committing, and rollback is possible for non-destructive operations (moves) but not for destructive ones (attacks). |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Movement Range (BFS) | Like calculating reachable routes in a navigation menu — from the current page (position), determine which pages (tiles) are reachable within N clicks (movement budget). |
| Action Point System | Like a multi-step form with a limited number of fields per page — the user allocates their inputs (actions) across available slots (AP) before submitting (ending turn). |
| Hit Probability | Like conversion rate predictions in A/B testing — "72% chance this variant wins" is the same kind of informed uncertainty as "72% to hit." You act on the probability, knowing it might not pan out. |
| Cover System | Like CSS `overflow: hidden` with directional clipping — cover blocks incoming attacks (content) from one direction but not others, depending on the element's position relative to the container. |
| Fog of War (Unit Vision) | Like virtualized rendering — only elements (tiles) within the viewport (vision radius) are rendered. Everything outside exists in the DOM (game state) but is not displayed. |
| Initiative / Turn Order | Like event loop task scheduling — microtasks (individual unit actions) vs. macrotasks (full-phase turns). The scheduling model determines response latency and interactivity. |
| Undo / Preview | Like optimistic UI updates with rollback — show the user the expected result immediately (preview), let them confirm, and revert (undo) if they change their mind before the server acknowledges. |

### Data/ML Developers

| Core Concept | Analogy |
|---|---|
| Movement Range (BFS) | Like breadth-first graph traversal with edge weights — the same algorithm used in social network analysis (friends-of-friends within N hops) applied to a spatial grid. |
| Action Point System | Like a computational budget in inference — each unit has a fixed FLOP budget (AP), and the player allocates it across operations (move, attack) to maximize output quality (tactical outcome). |
| Hit Probability | Like model confidence scores — the system outputs a probability (72% to hit), and the decision-maker (player) must choose whether to act on it, just as a practitioner decides whether a model's 72% confidence is sufficient to deploy. |
| Cover System | Like regularization — cover penalizes the attacker's accuracy (model capacity), preventing overfitting (guaranteed hits). More cover means more regularization, forcing the attacker to find creative solutions (flanking). |
| Fog of War (Unit Vision) | Like partial observability in reinforcement learning — the agent (player) does not see the full state, only a local observation around each unit. Policy must account for hidden information. |
| Initiative / Turn Order | Like batch processing vs. online learning — I-go-you-go processes all samples (unit actions) in one batch before updating, while alternating activation processes samples one at a time with immediate feedback. |
| Undo / Preview | Like running inference before committing to a training step — preview the gradient (attack outcome) before applying it, and discard (undo) if the result is unfavorable. |

### Discussion Questions

1. XCOM is famous for the "95% miss" — a nearly guaranteed shot that fails, often at the worst possible moment. Players remember these moments viscerally. Is this a design flaw or a feature? How does the 5-95% clamp on hit chance affect the player's relationship with probability?

2. Into the Breach shows you exactly what every enemy will do on their next turn. XCOM hides enemy intentions behind fog of war. How does the amount of information available change the type of thinking the game rewards? Which approach creates more interesting decisions?

3. Fire Emblem's permadeath means a fallen unit is gone forever. XCOM allows wounded soldiers to recover. How do different failure consequences change player behavior? At what point does consequence severity shift from "meaningful stakes" to "save-scumming"?

4. Turn-based strategy games give the player unlimited time to think per turn. Does this make them "easier" than real-time games, or does it make them harder by removing the excuse of "I didn't have time to think"? How does time pressure affect decision quality?
