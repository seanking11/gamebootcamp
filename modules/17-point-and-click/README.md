# Module 17: Point-and-Click Adventure
**Puzzle-solving through object interaction and conversation | Every item is a question; every combination is an answer**
> "I'm selling these fine leather jackets."
---

## Prerequisites
- **Module 1 (Pong):** Basic game loop, rendering, and state management. Point-and-click adventures are mechanically simple but architecturally demanding — you need a solid foundation in game state, not advanced physics or movement.

## Week 1: History & Design Theory

### The Origin

*The Secret of Monkey Island* (1990), designed by Ron Gilbert and Tim Schafer at LucasArts, perfected the point-and-click adventure formula by solving the genre's greatest problem: unfair death. Sierra On-Line's earlier adventures (*King's Quest*, 1984) punished players with frequent, often unpredictable deaths and dead-end states where the game became unwinnable without the player knowing. Gilbert's philosophy, codified in his "Why Adventure Games Suck" manifesto, insisted that the player should never die and should never be able to reach a dead end. *Monkey Island* implemented this by designing every puzzle as a contained logical problem with discoverable solutions, using humor to make failed attempts entertaining rather than punishing, and building an inventory-combination system where the fun was in experimentation. The SCUMM engine (Script Creation Utility for Maniac Mansion) gave designers a verb-based interaction system — Look At, Pick Up, Use, Talk To — that made every screen a dense web of discoverable interactions.

### How the Genre Evolved

- **Myst (1993):** Cyan Worlds' Rand and Robyn Miller stripped away the verb interface, inventory, and dialogue entirely, replacing them with environmental puzzles embedded in hauntingly beautiful pre-rendered worlds. Players clicked to move between static viewpoints and manipulated mechanisms directly. *Myst* proved that point-and-click adventure did not require inventory or conversation — pure environmental observation and logical deduction could sustain an entire game. It became the best-selling PC game of its era, demonstrating mainstream appetite for thoughtful, non-violent interactive experiences.

- **Disco Elysium (2019):** ZA/UM's masterwork reimagined the adventure game through the lens of a tabletop RPG. Instead of combining physical objects, the player combined *ideas* in an internalized "thought cabinet." Every conversation was a potential puzzle, with 24 distinct skills (from "Electrochemistry" to "Inland Empire") functioning as inner voices that provided clues, opinions, and sometimes unreliable advice. It demonstrated that the core loop of point-and-click — observe, gather information, combine knowledge to progress — could be applied to dialogue and character psychology rather than physical inventory puzzles.

### What Makes Point-and-Click "Great"

The core design insight of the point-and-click adventure is **lateral thinking as gameplay**. The genre asks the player to look at the world not as it is but as it *could be* — a rubber chicken is not just a rubber chicken but a potential tool when combined with a pulley. This trains a specific cognitive skill: the ability to hold multiple unrelated objects in mind and ask "what if these go together?" The best adventure games design puzzles where the solution, once discovered, feels obvious in retrospect ("of *course* you use the monkey as a wrench") — this retrospective clarity is the "aha!" moment that drives the entire genre. The puzzle dependency graph ensures these moments build on each other, creating a chain of small revelations that sustains engagement over hours.

### The Essential Mechanic

**Combining found objects and information to solve environmental puzzles** — the player observes, collects, reasons about connections, and applies items or knowledge to overcome obstacles.

## Week 2: Build the MVP

### What You're Building

A 3-5 room adventure game with an inventory system, at least one item-combination puzzle, a dialog tree with a single NPC, and a puzzle dependency chain where solving one puzzle unlocks the next. The player clicks to interact with hotspots, collects items, and combines them to progress.

This module is 2D. No engine is required.

### Core Concepts (Must Implement)

**1. Inventory System with Item Combination**

The player carries a collection of items represented as objects with properties (name, description, icon, use-cases). Items can be used on hotspots in the world or combined with each other in the inventory to produce new items.

```
class Item:
    def __init__(self, id, name, description, icon):
        self.id = id
        self.name = name
        self.description = description
        self.icon = icon

class Inventory:
    def __init__(self):
        self.items = {}  # id -> Item

    def add(self, item):
        self.items[item.id] = item

    def remove(self, item_id):
        del self.items[item_id]

    def has(self, item_id):
        return item_id in self.items

    def try_combine(self, item_a_id, item_b_id):
        key = frozenset([item_a_id, item_b_id])
        if key in COMBINATION_RECIPES:
            result = COMBINATION_RECIPES[key]
            self.remove(item_a_id)
            self.remove(item_b_id)
            self.add(result)
            return result
        return None

COMBINATION_RECIPES = {
    frozenset(["rope", "hook"]): Item("grapple", "Grappling Hook",
        "A hook tied to a rope. Could reach high places.", "grapple.png"),
    frozenset(["key_half_a", "key_half_b"]): Item("full_key", "Complete Key",
        "Both halves joined together.", "full_key.png"),
}
```

The inventory UI should display items as clickable icons. Clicking an item selects it; clicking another item while one is selected attempts a combination. Clicking a hotspot in the world while an item is selected attempts to use that item on the hotspot.

**Why it matters:** The inventory is the player's toolkit. Every puzzle in the game is ultimately solved by having the right item and applying it in the right place. The combination system multiplies puzzle possibilities exponentially — N items yield N*(N-1)/2 potential combinations, each of which is a potential puzzle.

**2. Puzzle Dependency Graph**

The game's puzzles form a directed acyclic graph (DAG) where each puzzle has prerequisites (items, flags, or other puzzles). Designing this graph up front ensures puzzles are solvable in a valid order and prevents dead ends.

```
# Puzzle dependency graph definition
puzzle_graph = {
    "get_rope": {
        requires: [],
        grants: ["rope"],
        description: "Pick up rope from the dock"
    },
    "talk_to_fisherman": {
        requires: [],
        grants: ["flag:fisherman_talked"],
        description: "Learn that the fisherman lost his hook"
    },
    "get_hook": {
        requires: ["flag:fisherman_talked"],
        grants: ["hook"],
        description: "Fisherman gives you his spare hook"
    },
    "make_grapple": {
        requires: ["rope", "hook"],
        grants: ["grapple"],
        description: "Combine rope + hook = grappling hook"
    },
    "climb_tower": {
        requires: ["grapple"],
        grants: ["flag:reached_tower_top"],
        description: "Use grappling hook to reach the tower top"
    },
    "get_key": {
        requires: ["flag:reached_tower_top"],
        grants: ["key"],
        description: "Find the key at the top of the tower"
    },
    "open_gate": {
        requires: ["key"],
        grants: ["flag:game_complete"],
        description: "Use key on the locked gate — victory!"
    }
}

# Validate: ensure no cycles and all requirements can be met
def validate_puzzle_graph(graph):
    # Topological sort to detect cycles
    visited = set()
    order = []

    def visit(node_id):
        if node_id in visited:
            return
        visited.add(node_id)
        for req in graph[node_id].requires:
            # Find which puzzle grants this requirement
            for other_id, other in graph.items():
                if req in other.grants:
                    visit(other_id)
        order.append(node_id)

    for node_id in graph:
        visit(node_id)
    return order  # Valid solve order
```

**Why it matters:** The puzzle dependency graph is the game's blueprint. Without it, designers risk creating unsolvable states, circular dependencies, or puzzles where the player has no idea what to do next. It is the structural backbone that makes the difference between a fair puzzle game and an inscrutable one.

**3. Dialog Trees**

Conversations with NPCs are represented as a graph of dialog nodes. Each node contains NPC text and a list of player response options. Selecting a response may lead to another dialog node, set a game state flag, give the player an item, or end the conversation.

```
dialog_fisherman = {
    "start": {
        npc_text: "Ahoy! I'd be fishing, but I lost my best hook overboard.",
        options: [
            { text: "That's too bad.", next: "sympathy" },
            { text: "Do you have a spare?", next: "spare_hook" },
            { text: "Goodbye.", next: null }  # null = end conversation
        ]
    },
    "sympathy": {
        npc_text: "Aye, it's been a rough week. Say, you look resourceful...",
        options: [
            { text: "Do you have a spare hook?", next: "spare_hook" },
            { text: "I should go.", next: null }
        ]
    },
    "spare_hook": {
        npc_text: "Matter of fact, I do. Here, take it — I can't throw a line "
                  "with this old arm anyway.",
        options: [
            { text: "Thanks!", next: null }
        ],
        on_enter: [
            { action: "give_item", item: "hook" },
            { action: "set_flag", flag: "fisherman_talked", value: true }
        ]
    }
}

class DialogRunner:
    def __init__(self, dialog_data):
        self.data = dialog_data
        self.current_node = null

    def start(self):
        self.current_node = "start"
        self.execute_on_enter()
        return self.get_current_display()

    def choose_option(self, option_index):
        options = self.data[self.current_node]["options"]
        chosen = options[option_index]
        self.current_node = chosen["next"]
        if self.current_node is null:
            return null  # Conversation ended
        self.execute_on_enter()
        return self.get_current_display()

    def execute_on_enter(self):
        node = self.data[self.current_node]
        for action in node.get("on_enter", []):
            if action["action"] == "give_item":
                player.inventory.add(ITEMS[action["item"]])
            elif action["action"] == "set_flag":
                game_state.set_flag(action["flag"], action["value"])

    def get_current_display(self):
        node = self.data[self.current_node]
        return {
            "npc_text": node["npc_text"],
            "options": [opt["text"] for opt in node["options"]]
        }
```

**Why it matters:** Dialog is the primary way adventure games deliver narrative, character, and puzzle clues. The tree structure lets designers create conversations that feel responsive to the player's curiosity while ensuring that essential information is always reachable through at least one path.

**4. Hotspot Interaction System**

Each scene contains clickable hotspots — regions of the screen that the player can interact with. Hotspots have a position, a bounding area, and responses for different interaction types (look, use, use-item-on). The cursor changes to indicate when it is over a hotspot.

```
class Hotspot:
    def __init__(self, id, name, bounds, interactions):
        self.id = id
        self.name = name
        self.bounds = bounds          # {x, y, width, height}
        self.interactions = interactions  # dict of action -> response
        self.active = true

    def contains(self, mouse_x, mouse_y):
        b = self.bounds
        return (b.x <= mouse_x <= b.x + b.width and
                b.y <= mouse_y <= b.y + b.height)

# Interaction responses
hotspot_locked_gate = Hotspot(
    id="locked_gate",
    name="Locked Gate",
    bounds={"x": 500, "y": 200, "width": 80, "height": 120},
    interactions={
        "look": { "text": "A heavy iron gate. It's locked tight." },
        "use": { "text": "It won't budge without a key." },
        "use_item": {
            "key": {
                "text": "The key turns with a satisfying click!",
                "action": "set_flag",
                "flag": "gate_opened",
                "remove_item": "key",
                "change_scene": "victory_room"
            },
            "default": { "text": "That doesn't work on the gate." }
        }
    }
)

def handle_click(mouse_x, mouse_y, current_scene, selected_item):
    for hotspot in current_scene.hotspots:
        if not hotspot.active or not hotspot.contains(mouse_x, mouse_y):
            continue

        if selected_item:
            # Try to use selected item on this hotspot
            use_item = hotspot.interactions.get("use_item", {})
            response = use_item.get(selected_item.id, use_item.get("default"))
        else:
            # Default interaction (look or use)
            response = hotspot.interactions.get("look")

        execute_response(response)
        return

    # Clicked on nothing — deselect item or walk to position
    deselect_item()

def update_cursor(mouse_x, mouse_y, current_scene, selected_item):
    for hotspot in current_scene.hotspots:
        if hotspot.active and hotspot.contains(mouse_x, mouse_y):
            if selected_item:
                set_cursor("use_item")
            else:
                set_cursor("interact")
            show_tooltip(hotspot.name)
            return
    set_cursor("default")
```

**Why it matters:** Hotspots are the player's primary interface with the game world. They transform a static background image into an interactive space. The cursor feedback is critical — the player must be able to discover what is interactive without clicking blindly on every pixel.

**5. Scene / Room Management**

The game is organized into discrete scenes (rooms), each with its own background image, hotspots, NPCs, and entry/exit points. A scene manager handles loading scenes, running transitions between them, and maintaining per-scene state.

```
class Scene:
    def __init__(self, id, background, hotspots, npcs, exits):
        self.id = id
        self.background = background   # Image path
        self.hotspots = hotspots       # List of Hotspot objects
        self.npcs = npcs               # List of NPC objects
        self.exits = exits             # Dict: exit_id -> target_scene_id

class SceneManager:
    def __init__(self):
        self.scenes = {}               # id -> Scene
        self.current_scene = null
        self.transition_state = "none" # "none", "fading_out", "fading_in"
        self.fade_alpha = 0.0

    def register(self, scene):
        self.scenes[scene.id] = scene

    def change_scene(self, target_id):
        self.transition_state = "fading_out"
        self.next_scene_id = target_id

    def update(self, dt):
        if self.transition_state == "fading_out":
            self.fade_alpha += dt * FADE_SPEED
            if self.fade_alpha >= 1.0:
                self.current_scene = self.scenes[self.next_scene_id]
                self.apply_scene_state(self.current_scene)
                self.transition_state = "fading_in"

        elif self.transition_state == "fading_in":
            self.fade_alpha -= dt * FADE_SPEED
            if self.fade_alpha <= 0.0:
                self.fade_alpha = 0.0
                self.transition_state = "none"

    def apply_scene_state(self, scene):
        # Update hotspot visibility based on game state flags
        for hotspot in scene.hotspots:
            if hasattr(hotspot, 'visible_when'):
                hotspot.active = game_state.check_flag(hotspot.visible_when)

    def render(self, screen):
        draw_image(screen, self.current_scene.background)
        for hotspot in self.current_scene.hotspots:
            if hotspot.active and DEBUG_MODE:
                draw_rect_outline(screen, hotspot.bounds)  # Debug only
        # Draw fade overlay
        if self.fade_alpha > 0:
            draw_rect(screen, BLACK, full_screen, alpha=self.fade_alpha)
```

**Why it matters:** Scene management is the architecture that holds the entire game together. Each room is a self-contained puzzle space, and the transitions between them create the rhythm of exploration. Clean scene management also makes the game trivially extensible — adding a new room means defining a new data object, not modifying core logic.

**6. Game State Flags**

A centralized flag system tracks everything the player has done, seen, and said. Flags are boolean or string values keyed by name. Hotspots, dialog options, and puzzle logic all read from and write to this shared state.

```
class GameStateFlags:
    def __init__(self):
        self.flags = {}

    def set_flag(self, name, value=true):
        self.flags[name] = value

    def get_flag(self, name, default=false):
        return self.flags.get(name, default)

    def check_flag(self, name):
        return self.flags.get(name, false)

    def check_condition(self, condition):
        """Evaluate a condition expression against flags.
           Supports: flag_name, !flag_name, AND, OR"""
        if " AND " in condition:
            parts = condition.split(" AND ")
            return all(self.check_condition(p.strip()) for p in parts)
        if " OR " in condition:
            parts = condition.split(" OR ")
            return any(self.check_condition(p.strip()) for p in parts)
        if condition.startswith("!"):
            return not self.check_flag(condition[1:])
        return self.check_flag(condition)

    def to_dict(self):
        return dict(self.flags)

    def from_dict(self, data):
        self.flags = dict(data)

# Usage in dialog
dialog_node = {
    "npc_text": "Did you find the hook I gave you useful?",
    "condition": "fisherman_talked AND gate_opened",
    # This node only appears if both flags are set
}

# Usage in hotspots
hotspot_secret_door = Hotspot(
    id="secret_door",
    visible_when="found_secret_note",  # Only appears after finding the note
    ...
)
```

**Why it matters:** Flags are the memory of the game world. They are how the game tracks cause and effect across rooms, conversations, and time. Without a centralized flag system, tracking what the player has done becomes a tangled mess of ad-hoc variables scattered across the codebase.

### Stretch Goals (If Time Allows)

- **Character walking:** Instead of instant scene interaction, the player character walks to the clicked hotspot before interacting, with simple pathfinding around obstacles.
- **Verb interface:** Add a classic verb bar (Look At, Pick Up, Use, Talk To) where the player selects a verb before clicking a hotspot, producing different responses per verb.
- **Conditional dialog options:** Dialog options that only appear when certain flags are set, creating conversations that evolve based on the player's actions elsewhere in the game.
- **Hint system:** A progressive hint system that provides increasingly specific clues when the player is stuck, tracking time since last puzzle solve.

### MVP Spec

| Feature | Required |
|---|---|
| 3-5 scenes with background images | Yes |
| Clickable hotspots with look/use responses | Yes |
| Inventory UI with item collection | Yes |
| At least one item combination puzzle | Yes |
| Use-item-on-hotspot interaction | Yes |
| At least one NPC with dialog tree | Yes |
| Scene transitions (fade or cut) | Yes |
| Game state flags driving conditional content | Yes |
| Puzzle dependency chain of 4+ steps | Yes |
| Context-sensitive cursor | Yes |
| Character walking animation | Stretch |
| Verb bar interface | Stretch |
| Conditional dialog options | Stretch |
| Hint system | Stretch |

### Deliverable

Submit your playable adventure game with source code and a **puzzle dependency graph diagram** showing all puzzles as nodes, their prerequisites as edges, and the items/flags each puzzle grants. Include a short write-up (300-500 words) answering: *How did you design your puzzle chain to be solvable without a walkthrough? What clues did you embed in dialog, item descriptions, and environmental details to guide the player toward solutions?*

## Analogies by Background
> These analogies map game dev concepts to patterns you already know.

### For Backend Developers

| Game Dev Concept | Backend Analogy |
|---|---|
| Inventory with item combination | A key-value store with composite key lookups — items are values, combinations are queries against a recipe table, producing new entries |
| Puzzle dependency graph | A task DAG (like Airflow or Makefile targets) — each task has prerequisites that must complete before it can execute, and the DAG guarantees no circular dependencies |
| Dialog trees | A state machine for request handling — each state presents a response and a set of valid transitions, with side effects (flag setting) triggered on state entry |
| Hotspot interaction system | A URL router with method handling — each hotspot is a route, each interaction type (look, use, use-item) is an HTTP method, and the response depends on both |
| Scene / room management | Microservice orchestration — each scene is an independent service with its own state, and the scene manager is the API gateway routing between them |
| Game state flags | A feature flag service (LaunchDarkly, etc.) — a centralized boolean/string store that all services query to determine behavior, updated by events throughout the system |

### For Frontend Developers

| Game Dev Concept | Frontend Analogy |
|---|---|
| Inventory with item combination | Shopping cart with bundle logic — items in the cart can be combined into bundles (combos), producing a new line item that replaces the originals |
| Puzzle dependency graph | Component dependency tree — components (puzzles) can only render (solve) when their required props (items/flags) are provided by parent components (earlier puzzles) |
| Dialog trees | A multi-step wizard/form — each step shows content and options, the selected option determines the next step, and side effects (API calls) fire on transition |
| Hotspot interaction system | Event delegation on a composite UI — clickable regions within an image map, each with hover states (cursor changes) and context-dependent click handlers |
| Scene / room management | Client-side routing — each scene is a route/page, the scene manager is the router, and transitions are animated route changes with data loading |
| Game state flags | Global application state (Redux/Zustand) — a centralized store of booleans and strings that components subscribe to, enabling conditional rendering throughout the app |

### For Data / ML Engineers

| Game Dev Concept | Data / ML Analogy |
|---|---|
| Inventory with item combination | Feature engineering — raw features (items) are combined through defined transformations (recipes) to produce derived features (combined items) that are more useful downstream |
| Puzzle dependency graph | A data pipeline DAG (Airflow, dbt) — each node is a transformation with defined inputs, and the DAG ensures correct execution order with no cycles |
| Dialog trees | A decision tree classifier — each node splits on a player choice, leaf nodes produce outcomes (items, flags), and the tree structure determines which information the player receives |
| Hotspot interaction system | Labeled training data — each hotspot is an annotated region in an image with associated metadata, and interaction type is the query that selects which label to return |
| Scene / room management | Dataset partitioning — each scene is a partition of the total game data, loaded independently, with a coordinator managing which partition is active |
| Game state flags | Experiment tracking metadata — a centralized log of which experiments (actions) have been run, queried by downstream processes to determine what to do next |

---

### Discussion Questions

1. **Fair puzzles vs. obscure puzzles:** Classic adventure games were notorious for illogical puzzles (the "cat hair mustache" problem). How do you design puzzles that are challenging but fair? What is the role of the puzzle dependency graph in ensuring the player always has enough information to reason toward the solution?

2. **The dead-end problem:** Ron Gilbert's manifesto argued that adventure games should never create unwinnable states. How does your puzzle dependency graph guarantee this? Could a game intentionally use dead ends as a design tool, or is it always a flaw?

3. **Dialog as puzzle:** In games like *Disco Elysium*, dialog itself is the puzzle — saying the right things in the right order matters. How does this differ from using dialog purely as a clue-delivery system? What are the design implications of making conversation interactive rather than informational?

4. **The hint economy:** When a player is stuck, they will either consult a walkthrough (leaving your game) or quit. How would you design an in-game hint system that helps stuck players without spoiling the satisfaction of solving puzzles for players who do not need hints?
