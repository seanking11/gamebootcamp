# Module 14: Metroidvania
**Interconnected exploration with ability-gated progression | The world is the puzzle**
> "The measure of a hero is not in the strength of their arm, but in the doors they can finally open."
---

## Prerequisites
- **Module 2 (Platformer):** You need comfortable platformer movement, gravity, and collision before layering exploration systems on top.
- **Module 7 (Roguelike):** Familiarity with inventory concepts and persistent game state will help with ability tracking and save systems.

## Week 1: History & Design Theory

### The Origin

*Super Metroid* (1994), developed by Nintendo R&D1 and Intelligent Systems and directed by Yoshio Sakamoto, defined the template for interconnected exploration games. While the original *Metroid* (1986) introduced the concept of a large, non-linear world gated by ability pickups, *Super Metroid* perfected the formula by giving players an atmospheric, labyrinthine map where every room connected meaningfully to others, environmental storytelling replaced exposition, and newly acquired abilities — the Morph Ball, Grapple Beam, Speed Booster — constantly recontextualized spaces the player had already traversed. It proved that a 2D side-scroller could deliver the satisfaction of an open world by making the map itself the central puzzle.

### How the Genre Evolved

- **Castlevania: Symphony of the Night (1997):** Koji Igarashi fused the Metroid exploration structure with RPG systems — experience points, equipment, leveling, and a vast bestiary. This added a second motivation loop: you explored not just for abilities but for loot and character growth. The inverted castle doubled the game's content by literally flipping the world. The game's success coined the second half of the genre name and proved that layering progression systems onto exploration created extraordinary replay value.

- **Hollow Knight (2017):** Team Cherry's debut showed that the Metroidvania could thrive in the indie era. It introduced a massive, hand-crafted interconnected world with a Souls-like difficulty philosophy, a charm system for build customization, and an emphasis on combat depth alongside exploration. Critically, it demonstrated that the map itself could be a discoverable item — you had to find the cartographer in each area before your minimap would populate, making exploration feel genuinely uncertain.

- **Ori and the Blind Forest (2015):** Moon Studios brought a focus on kinetic movement and emotional storytelling. The "bash" ability — redirecting projectiles to launch yourself — showed that movement abilities could be both traversal tools and combat mechanics simultaneously, blurring the line between ability-gating and skill-gating.

### What Makes Metroidvania "Great"

The core design insight of the Metroidvania is **delayed gratification through spatial memory**. The genre works because it trusts the player to notice a ledge they cannot reach, a wall they cannot break, or a gap they cannot cross — and to *remember* it. When the player finally acquires the ability that unlocks that area, the satisfaction is doubled: the joy of the new power itself, plus the accumulated anticipation of every locked door they mentally catalogued. This creates a compounding loop where each new ability doesn't just open one path — it opens dozens of previously glimpsed possibilities across the entire world, making the player feel increasingly powerful not through stats but through *access*.

### The Essential Mechanic

**Ability-gated exploration** — you see areas you cannot reach yet, then return with new powers to unlock them, transforming the entire world map into a puzzle that unfolds over time.

## Week 2: Build the MVP

### What You're Building

A small interconnected world of 8-12 rooms arranged as a graph, where the player starts with basic movement and must find 2-3 abilities (such as double jump and dash) to reach new areas and eventually arrive at a final room. The focus is on the world structure, ability-gating logic, and a minimap — not on enemy AI or combat polish.

This module is 2D. No engine is required, but one may simplify room transitions and map rendering.

### Core Concepts (Must Implement)

**1. World Map as a Graph**

The interconnected world is represented as a graph data structure where each room is a node and each door or passage is an edge. Edges carry metadata indicating which direction they connect and what ability (if any) is required to traverse them.

```
# World definition
rooms = {
  "start":    { edges: [{ to: "cave_l", dir: "right", requires: null }] },
  "cave_l":   { edges: [
                  { to: "start", dir: "left", requires: null },
                  { to: "cave_u", dir: "up", requires: "double_jump" },
                  { to: "shaft", dir: "right", requires: null }
                ]},
  "cave_u":   { edges: [{ to: "cave_l", dir: "down", requires: null },
                         { to: "peak", dir: "right", requires: "dash" }] },
  "shaft":    { edges: [{ to: "cave_l", dir: "left", requires: null },
                         { to: "ability_room_1", dir: "down", requires: null }] },
  "ability_room_1": { edges: [...], grants_ability: "double_jump" },
  ...
}
```

This structure lets you validate traversal, generate minimaps, and reason about progression paths algorithmically.

**Why it matters:** The graph is the backbone of the entire game. Every system — gating, minimap, save state, non-linear progression — reads from this structure. Getting the world representation right makes everything else straightforward.

**2. Ability-Gating**

Each edge in the world graph may specify a required ability. When the player attempts to traverse an edge, the system checks whether the player's acquired abilities satisfy the requirement. Abilities are stored as a set on the player entity.

```
function can_traverse(player, edge):
    if edge.requires is null:
        return true
    return edge.requires in player.abilities

function attempt_door(player, edge):
    if can_traverse(player, edge):
        transition_to_room(edge.to)
    else:
        show_feedback("You need " + edge.requires + " to pass.")
```

Visual cues are critical: a gate the player cannot pass should look visibly different from one they can, even before they know which ability is needed. Color coding, particle effects, or distinct door sprites all work.

**Why it matters:** Ability-gating is what transforms a collection of rooms into a Metroidvania. Without it, you have a platformer with room transitions. The gates create the "I'll come back later" moments that define the genre.

**3. Backtracking-Friendly Level Design**

Rooms must be designed so that returning to them with new abilities feels rewarding rather than tedious. This means rooms should have multiple exits gated at different ability levels, shortcuts that open from one side, and visual hints of unreachable areas.

```
# Room layout principle:
# Each room has a "base path" accessible on first visit
# and "gated paths" visible but blocked.

room_cave_l = {
  platforms: [
    { x: 0, y: 0, w: 300, h: 20 },          # ground floor (always accessible)
    { x: 200, y: -120, w: 80, h: 20 },       # high ledge (needs double_jump)
  ],
  doors: [
    { x: 290, y: 0, leads_to: "shaft", requires: null },
    { x: 220, y: -120, leads_to: "cave_u", requires: "double_jump" },
  ],
  visual_hints: [
    { type: "glow", position: {x: 220, y: -120}, color: "blue" }  # signals a gate
  ]
}
```

**Why it matters:** Backtracking is the most common criticism of the genre when done poorly. Good backtracking design ensures the player always sees something new or reaches something previously inaccessible on a return trip, turning repetition into discovery.

**4. Minimap / Map System**

A minimap tracks which rooms the player has visited and displays them relative to the current room. Each room is represented as a rectangle on a grid, with connections drawn between adjacent rooms. Unvisited rooms can be hidden or shown as outlines.

```
class MiniMap:
    def __init__(self, world_graph):
        self.world = world_graph
        self.visited = set()
        self.room_positions = {}   # room_id -> (grid_x, grid_y)
        self.assign_grid_positions()

    def visit_room(self, room_id):
        self.visited.add(room_id)

    def render(self, current_room, screen, corner_x, corner_y):
        for room_id, (gx, gy) in self.room_positions.items():
            if room_id not in self.visited:
                continue
            rx = corner_x + gx * CELL_SIZE
            ry = corner_y + gy * CELL_SIZE
            color = COLOR_CURRENT if room_id == current_room else COLOR_VISITED
            draw_rect(screen, color, rx, ry, CELL_SIZE, CELL_SIZE)
        # Draw edges between visited rooms
        for room_id in self.visited:
            for edge in self.world[room_id].edges:
                if edge.to in self.visited:
                    draw_line_between(room_id, edge.to)

    def assign_grid_positions(self):
        # BFS from start room, assigning grid coordinates
        # based on edge directions (right -> +1 x, up -> -1 y, etc.)
        queue = [("start", 0, 0)]
        while queue:
            room_id, gx, gy = queue.pop(0)
            if room_id in self.room_positions:
                continue
            self.room_positions[room_id] = (gx, gy)
            for edge in self.world[room_id].edges:
                dx, dy = direction_to_offset(edge.dir)
                queue.append((edge.to, gx + dx, gy + dy))
```

**Why it matters:** Without a map, players get lost and frustrated. The minimap transforms spatial confusion into spatial mastery — it is the primary feedback system that tells players how much of the world they have explored and where gated doors remain.

**5. Save / Checkpoint System**

The game must persist the player's state — current room, acquired abilities, visited rooms, and any collected items — so the player can quit and resume. Designated "save rooms" in the world graph serve as checkpoints.

```
class GameState:
    def __init__(self):
        self.current_room = "start"
        self.abilities = set()
        self.visited_rooms = set()
        self.items_collected = set()

    def to_dict(self):
        return {
            "current_room": self.current_room,
            "abilities": list(self.abilities),
            "visited_rooms": list(self.visited_rooms),
            "items_collected": list(self.items_collected),
        }

    def from_dict(self, data):
        self.current_room = data["current_room"]
        self.abilities = set(data["abilities"])
        self.visited_rooms = set(data["visited_rooms"])
        self.items_collected = set(data["items_collected"])

def save_game(state, filepath):
    write_json(filepath, state.to_dict())

def load_game(filepath):
    data = read_json(filepath)
    state = GameState()
    state.from_dict(data)
    return state
```

Save rooms should be placed strategically: before difficult sections, at intersections of multiple paths, and near ability pickups so the player does not lose progress after major discoveries.

**Why it matters:** Metroidvanias are long-form experiences. Without persistence, the genre cannot function — players need to be able to leave and return across multiple sessions while retaining their sense of progress and world knowledge.

**6. Non-Linear Progression**

The world graph should support multiple valid orderings for acquiring abilities. This means no single forced sequence through the game; instead, at least two abilities should be reachable from the starting area, and the player chooses which to pursue first.

```
# Validate that the world has multiple valid paths
def find_all_completion_orders(world, start, goal):
    """BFS/DFS to find all orderings of ability acquisition that reach the goal."""
    results = []

    def explore(current_room, abilities, visited, path):
        if current_room == goal:
            results.append(path[:])
            return
        for edge in world[current_room].edges:
            if edge.to in visited:
                continue
            if edge.requires and edge.requires not in abilities:
                continue
            new_abilities = abilities.copy()
            if hasattr(world[edge.to], 'grants_ability'):
                new_abilities.add(world[edge.to].grants_ability)
            explore(edge.to, new_abilities, visited | {edge.to},
                    path + [edge.to])

    explore(start, set(), {start}, [start])
    return results

# If len(results) > 1, the world supports non-linear progression
```

**Why it matters:** Non-linearity gives players agency. Two players can compare notes and realize they played the same game in different orders — this is what separates a Metroidvania from a linear platformer with keys and locks.

### Stretch Goals (If Time Allows)

- **Hidden breakable walls:** Certain room tiles can be destroyed with a specific ability (e.g., a missile or charged attack), revealing secret passages not shown on the map until discovered.
- **Ability-based combat:** Enemies in certain rooms can only be damaged by specific abilities, giving combat encounters a puzzle-like quality.
- **Map item collectibles:** Place percentage-tracked collectibles (like energy tanks or lore items) throughout the world to reward thorough exploration.
- **Fast travel between save rooms:** Once the player has visited multiple save rooms, allow instant travel between them to reduce late-game backtracking tedium.

### MVP Spec

| Feature | Required |
|---|---|
| World graph with 8-12 rooms | Yes |
| Player movement (walk, jump) | Yes |
| 2-3 ability pickups (e.g., double jump, dash) | Yes |
| Ability-gated doors/passages | Yes |
| Room transitions on door entry | Yes |
| Minimap showing visited rooms | Yes |
| Save/load game state to file | Yes |
| Save room mechanic | Yes |
| At least 2 valid paths to the final room | Yes |
| Visual cues for gated passages | Yes |
| Hidden breakable walls | Stretch |
| Enemies with ability-specific weaknesses | Stretch |
| Collectibles with completion percentage | Stretch |
| Fast travel between save rooms | Stretch |

### Deliverable

Submit your playable Metroidvania MVP with source code and a **world map diagram** (hand-drawn or generated) showing all rooms as nodes, edges with their gate requirements, and the locations of ability pickups. Include a short write-up (300-500 words) answering: *How did you decide which rooms to gate with which abilities, and what tradeoffs did you make between linearity (guiding the player) and non-linearity (giving the player freedom)?*

## Analogies by Background
> These analogies map game dev concepts to patterns you already know.

### For Backend Developers

| Game Dev Concept | Backend Analogy |
|---|---|
| World map as a graph | A microservice topology or network graph — nodes are services, edges are API calls with auth requirements |
| Ability-gating | Role-based access control (RBAC) — a user can only access endpoints if they have the required permission |
| Backtracking design | Database migration rollbacks — revisiting previous states with new schema capabilities reveals new possibilities |
| Minimap / map system | Service discovery and health dashboards — a live view of which nodes are reachable and their status |
| Save / checkpoint system | Database snapshots or transaction savepoints — serializing full application state to durable storage for recovery |
| Non-linear progression | Eventual consistency — multiple valid orderings of operations that all converge to the same final state |

### For Frontend Developers

| Game Dev Concept | Frontend Analogy |
|---|---|
| World map as a graph | A single-page app's route graph — pages are nodes, navigation links are edges, some routes are protected |
| Ability-gating | Route guards or feature flags — certain UI routes are only accessible when the user meets specific conditions |
| Backtracking design | Browser history with progressive enhancement — revisiting a page with new user state reveals previously hidden UI |
| Minimap / map system | A site map or breadcrumb navigation — showing the user where they are and where they have been |
| Save / checkpoint system | localStorage or sessionStorage persistence — saving the full app state so the user can close the browser and return |
| Non-linear progression | Flexible user flows — a multi-step form where sections can be completed in any order before final submission |

### For Data / ML Engineers

| Game Dev Concept | Data / ML Analogy |
|---|---|
| World map as a graph | A computation DAG (like Airflow or Spark) — nodes are tasks, edges are dependencies with preconditions |
| Ability-gating | Feature dependencies in a pipeline — a downstream transformation only runs if a required upstream feature is available |
| Backtracking design | Iterative model refinement — re-examining the same dataset with a better model reveals previously hidden patterns |
| Minimap / map system | Experiment tracking dashboards (MLflow, W&B) — visualizing which runs have been completed and their locations in hyperparameter space |
| Save / checkpoint system | Model checkpointing during training — serializing weights and optimizer state so training can resume from a known point |
| Non-linear progression | Hyperparameter search — multiple valid paths through the search space that can all reach a good solution |

---

### Discussion Questions

1. **The "Aha!" moment:** Metroidvanias rely on the player remembering locked doors across potentially hours of play. How would you design visual and audio cues to ensure that a player who sees a gated door at hour 1 still remembers it at hour 4 when they get the right ability? What role does the map system play?

2. **Linearity vs. freedom:** If you make the world too open, players may get lost or sequence-break in ways that trivialize content. If you make it too linear, you lose the genre's appeal. Where on this spectrum did your MVP land, and how did the graph structure help you reason about this tradeoff?

3. **The backtracking problem:** Many players cite backtracking as the worst part of Metroidvanias. What design techniques can mitigate the tedium of revisiting rooms (shortcuts, fast travel, new enemies, environmental changes) without eliminating the satisfaction of returning with new abilities?

4. **Difficulty and gating:** Some Metroidvanias use skill-gates (you *could* get through if you were good enough) alongside ability-gates (you literally cannot proceed without the item). How does mixing these two types of gating change the player experience, and what are the risks of over-relying on one or the other?
