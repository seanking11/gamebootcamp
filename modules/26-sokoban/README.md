# Module 26: Sokoban / Push-Block Puzzle
**Constrained movement, irreversible consequences | The Warehouse**
> "Every push closes a door. The puzzle is knowing which doors you can afford to close."

---

## Prerequisites

- **Module 5: Puzzle (for grid logic)** -- You will need a working understanding of grid-based game state, tile-based movement, and how to represent a discrete game world as a two-dimensional array. Sokoban is built on the same foundations but adds the constraint of objects that move in response to the player.
- **Module 7: Roguelike (for turn-based grid movement)** -- The movement model in Sokoban is identical to roguelike movement: the player occupies a grid cell and moves one step at a time in cardinal directions. Each move is a discrete turn. You will reuse the input-to-grid-movement mapping and the concept of checking what occupies the destination cell before moving.

---

## Week 1: History & Design Theory

### The Origin

Sokoban was created in 1981 by Hiroyuki Imabayashi, a college student in Japan, and published in 1982 by Thinking Rabbit. The name means "warehouse keeper," and the game is exactly that: you play a worker pushing crates onto marked storage locations in a warehouse. The rules fit on a napkin -- move in four directions, push one crate at a time, cannot pull, cannot push two crates at once. Yet from these minimal rules emerges staggering complexity. Some Sokoban levels have been proven to require hundreds of moves to solve and are studied in computer science as examples of PSPACE-complete problems. The game has been ported to virtually every computing platform that has ever existed and has inspired an entire subgenre of push-block puzzles. Its genius is the gap between the simplicity of its rules and the depth of its challenges: anyone can understand Sokoban in ten seconds, but the hardest levels can take expert players hours to solve.

### How the Genre Evolved

- **Sokoban (Hiroyuki Imabayashi, 1982)** -- The original defined the entire genre with a ruleset so tight it has barely been modified in forty years. Player pushes boxes onto targets on a grid. Cannot pull. Cannot push more than one box. That is the whole game. Its lasting influence comes from its purity: the constraint of push-only movement creates a design space so rich that new Sokoban levels are still being designed and solved by dedicated communities today.

- **Stephen's Sausage Roll (Increpare, 2016)** -- Transformed the push puzzle into a three-dimensional spatial reasoning challenge. Instead of boxes, you push sausages that occupy two tiles and must be grilled on all sides by rolling them over fire tiles. The sausages rotate and flip as they are pushed, adding a rotational dimension that makes the player think about orientation as well as position. It demonstrated that the Sokoban framework could be extended in directions nobody had imagined while preserving the core satisfaction of constrained spatial reasoning.

- **Baba Is You (Arvi Teikari, 2019)** -- Deconstructed the puzzle genre itself by making the rules of the game into pushable objects on the grid. "BABA IS YOU" is a sentence made of word-blocks; push "ROCK" into "IS" and "YOU" and suddenly you control the rocks instead. It won the Independent Games Festival Grand Prize and proved that the Sokoban grid could be a platform for meta-game design where the player does not just solve puzzles but rewrites the rules that define them.

### What Makes It "Great"

A great push-block puzzle respects the player's intelligence. There are no reflexes to test, no time pressure, no random elements -- just you and the grid and the consequences of your decisions. The satisfaction comes from the moment of insight: staring at a level for minutes, feeling stuck, and then suddenly seeing the one sequence of moves that threads every block to its target without trapping any of them. Great Sokoban-style games design levels where the solution feels impossible until it feels inevitable. Every wall is there for a reason. Every empty space matters. The designer is having a conversation with the player through the level layout, and the best designers make that conversation feel like a magic trick -- "How did you know I would try that? How did you make the only path forward be the one I would never think to try first?"

### The Essential Mechanic

Spatial reasoning where objects only push, never pull -- every move narrows your options.

---

## Week 2: Build the MVP

### What You're Building

A classic Sokoban game with 5-8 handcrafted levels of increasing difficulty. The player moves on a grid, pushes blocks onto target squares, and wins each level when all blocks are on targets. The game includes an undo system (so the player can take back moves without restarting), dead-state detection (warning when a block is stuck in an unsolvable position), and a level serialization format that makes it easy to add new levels as plain text.

### Core Concepts

**1. Push Mechanics**

The player can push a block by moving into it, but only if the space behind the block is empty. The player cannot pull blocks, and pushing two blocks at once is not allowed. These constraints are what make the puzzles work.

```
WALL = '#'
FLOOR = '.'
TARGET = 'x'
BLOCK = 'B'
PLAYER = 'P'
BLOCK_ON_TARGET = 'O'

function try_move(state, direction):
    player_pos = state.player_position
    dest = player_pos + direction                   // one step in direction
    behind = dest + direction                        // two steps in direction

    tile_at_dest = state.grid[dest.y][dest.x]

    if tile_at_dest == WALL:
        return state                                 // cannot move into wall

    if tile_at_dest == BLOCK or tile_at_dest == BLOCK_ON_TARGET:
        // trying to push a block
        tile_behind = state.grid[behind.y][behind.x]
        if tile_behind == WALL or tile_behind == BLOCK or tile_behind == BLOCK_ON_TARGET:
            return state                             // cannot push into wall or another block
        // push succeeds
        new_state = state.clone()
        move_block(new_state, dest, behind)
        move_player(new_state, player_pos, dest)
        return new_state

    // empty floor or target: just move
    new_state = state.clone()
    move_player(new_state, player_pos, dest)
    return new_state
```

*Why it matters:* The push-only constraint is the entire game. If you could pull blocks, most Sokoban puzzles would become trivial. If you could push two blocks, the design space would collapse into chaos. The constraint that you can only push one block forward one space creates a system where every move has consequences: once you push a block against a wall, it might be stuck there forever. This is what makes each move feel weighty.

**2. Undo System**

Every move pushes the entire game state onto a history stack. Pressing undo pops the most recent state and restores it. This is essential for puzzle games -- without undo, a single mistake forces a full restart, which destroys the experimental mindset the game depends on.

```
class UndoableGame:
    current_state: GameState
    history: Stack<GameState> = []
    redo_stack: Stack<GameState> = []

function make_move(game, direction):
    new_state = try_move(game.current_state, direction)
    if new_state != game.current_state:          // move actually changed something
        game.history.push(game.current_state)
        game.current_state = new_state
        game.redo_stack.clear()                  // redo invalidated by new move

function undo(game):
    if game.history.is_empty(): return
    game.redo_stack.push(game.current_state)
    game.current_state = game.history.pop()

function redo(game):
    if game.redo_stack.is_empty(): return
    game.history.push(game.current_state)
    game.current_state = game.redo_stack.pop()

function restart_level(game):
    game.history.clear()
    game.redo_stack.clear()
    game.current_state = load_level(game.current_level)
```

*Why it matters:* Undo transforms puzzle games from frustrating trial-and-error into satisfying experimentation. When the player can freely undo, they are willing to try risky moves and explore possibilities. The stack-based approach is clean: every state is an immutable snapshot, so undo is just swapping which snapshot is active. This is also a practical lesson in state management that applies far beyond games -- any application that supports undo/redo uses a similar pattern.

**3. Puzzle State Validation**

The game checks whether the current state is a win (all blocks on targets) after every move. This is a simple but critical loop-closing check that gives the player immediate feedback.

```
function is_level_complete(state):
    for target_pos in state.target_positions:
        if state.grid[target_pos.y][target_pos.x] != BLOCK_ON_TARGET:
            return false
    return true

    // alternative: count blocks on targets
    // return count(BLOCK_ON_TARGET in grid) == len(target_positions)

function after_move(game):
    if is_level_complete(game.current_state):
        display_victory(moves=game.history.length)
        advance_to_next_level(game)
```

*Why it matters:* State validation is the feedback loop that makes the game satisfying. The instant the last block slides onto the last target, the player needs to know they won. The check must be reliable (no false positives or negatives) and immediate (checked every single move, not on a timer). This is the simplest concept in the module, but getting it wrong breaks the entire experience.

**4. Level Design for Puzzles**

Designing good Sokoban levels is a craft. Each level should have a unique solution path (or a small number of paths), a clear difficulty curve, and an "aha moment" where the player discovers the key insight. Levels are built by working backward from the solved state.

```
// Level design process (done by hand, not in code):
// 1. Place blocks on targets in the solved configuration
// 2. Work backward: "un-push" blocks by pulling them away from targets
// 3. Add walls to constrain movement and force specific solution paths
// 4. Place the player's start position
// 5. Test: solve it yourself. If there are multiple easy solutions, add walls.
// 6. Test: is there a dead state the player can reach? If unintentional, adjust.

// Difficulty progression framework:
level_design_principles = {
    "level_1": "Teach pushing: 1 block, 1 target, straight line",
    "level_2": "Teach turning: 1 block, 1 target, requires L-shaped push",
    "level_3": "Introduce order: 2 blocks, 2 targets, must push in correct order",
    "level_4": "Dead states: 2 blocks, wall corners, wrong push = stuck",
    "level_5": "Multi-step: 3 blocks, requires temporary parking of blocks",
    "level_6": "Bottleneck: narrow corridor forces precise sequencing",
    "level_7": "Full puzzle: 4+ blocks, all concepts combined"
}
```

*Why it matters:* A Sokoban engine without good levels is like a piano without music. The code is just the instrument; the levels are the composition. Understanding how to design levels -- working backward from the solution, using walls to eliminate unintended shortcuts, controlling difficulty through the number of blocks and the tightness of the space -- is as important as the code itself. For the MVP, you will design 5-8 levels by hand, and each one will teach you something about how constraints create challenge.

**5. Dead-State Detection**

A dead state occurs when a block is in a position from which it can never reach any target, making the puzzle unsolvable. The simplest case: a block pushed into a corner with no target there. Detecting dead states early saves the player from wasting moves on a doomed configuration.

```
function is_simple_deadlock(state, block_pos):
    // Corner deadlock: block is against two perpendicular walls
    // and the block is not on a target
    if is_on_target(state, block_pos): return false

    blocked_horizontal = (is_wall(state, block_pos + LEFT) or
                          is_wall(state, block_pos + RIGHT))
    blocked_vertical =   (is_wall(state, block_pos + UP) or
                          is_wall(state, block_pos + DOWN))

    if blocked_horizontal AND blocked_vertical:
        return true       // stuck in a corner, no target here = dead

    return false

function is_wall_deadlock(state, block_pos):
    // Block against a wall with no target along that wall
    // If block is against north wall, check if any target exists
    // along that wall row that the block could slide to
    for direction in [UP, DOWN, LEFT, RIGHT]:
        if is_wall(state, block_pos + direction):
            wall_axis = perpendicular(direction)
            targets_along_wall = find_targets_along(state, block_pos, wall_axis)
            if len(targets_along_wall) == 0:
                return true
    return false

function check_deadlocks(state):
    for block_pos in state.block_positions:
        if is_simple_deadlock(state, block_pos):
            highlight_block(block_pos, color=RED)
            show_warning("This block is stuck!")
```

*Why it matters:* Dead-state detection is the difference between a frustrating puzzle game and a fair one. Without it, the player might spend ten minutes trying to solve a puzzle that became unsolvable on their third move. Even simple corner detection catches the most common and most frustrating deadlocks. Advanced detection (freeze deadlocks, corral deadlocks) is a deep algorithmic problem, but the basic version is straightforward and dramatically improves the player experience.

**6. Rules-as-Objects**

Inspired by *Baba Is You*, this concept treats game rules as entities on the grid that can be pushed, rearranged, and combined. "BLOCK IS PUSH" is a sentence made of three word-tiles; pushing "IS" away breaks the rule, and blocks are no longer pushable.

```
// Word tiles are pushable objects on the grid
// Sentences are formed by adjacent word tiles in a row or column
// Format: NOUN IS PROPERTY  (e.g., "WALL IS STOP", "BLOCK IS PUSH")

function parse_rules(grid):
    rules = []
    // scan horizontal sentences
    for row in grid.rows:
        for col in 0..row.length - 2:
            if is_noun(row[col]) AND is_verb(row[col+1]) AND is_property(row[col+2]):
                rules.append({subject: row[col], property: row[col+2]})
    // scan vertical sentences (same logic, column-wise)
    for col in grid.cols:
        for row in 0..col.length - 2:
            if is_noun(grid[row][col]) AND is_verb(grid[row+1][col]) AND is_property(grid[row+2][col]):
                rules.append({subject: grid[row][col], property: grid[row+2][col]})
    return rules

function apply_rules(game_state, rules):
    // reset all properties
    for entity_type in all_entity_types:
        entity_type.properties = {}
    // apply parsed rules
    for rule in rules:
        entity_type = resolve_noun(rule.subject)
        entity_type.properties[rule.property] = true
    // "YOU" determines what the player controls
    // "STOP" means the entity blocks movement
    // "PUSH" means the entity can be pushed
    // "WIN" means touching this entity wins the level
```

*Why it matters:* Rules-as-objects is a stretch concept that demonstrates how a simple grid system can support meta-game mechanics. It is included because it shows the expressive range of the Sokoban framework: the same push-and-grid foundation that supports a warehouse crate game can support a game where you rewrite reality by rearranging words. For the MVP, this is optional, but even implementing one or two rule-tiles gives a taste of how powerful the concept is.

**7. Level Serialization**

Levels are stored as compact text strings that can be loaded, saved, and shared. The standard Sokoban format uses single characters for each tile type, making levels human-readable and trivially parseable.

```
// Standard Sokoban level format:
// # = wall, . = target, $ = block, @ = player
// * = block on target, + = player on target, (space) = floor

level_string = """
  #####
###   #
#.@$  #
### $.#
#.##$ #
# # . ##
#$ *$$.#
#   .  #
########
"""

function parse_level(level_string):
    state = GameState()
    rows = level_string.split('\n')
    for y, row in enumerate(rows):
        for x, char in enumerate(row):
            match char:
                '#': state.grid[y][x] = WALL
                '.': state.grid[y][x] = FLOOR
                       state.target_positions.add({x, y})
                '$': state.grid[y][x] = FLOOR
                       state.block_positions.add({x, y})
                '@': state.grid[y][x] = FLOOR
                       state.player_position = {x, y}
                '*': state.grid[y][x] = FLOOR
                       state.target_positions.add({x, y})
                       state.block_positions.add({x, y})
                ' ': state.grid[y][x] = FLOOR
    return state

function serialize_level(state):
    output = ""
    for y in 0..state.height:
        for x in 0..state.width:
            if {x,y} == state.player_position:
                output += '+' if {x,y} in state.target_positions else '@'
            elif {x,y} in state.block_positions:
                output += '*' if {x,y} in state.target_positions else '$'
            elif {x,y} in state.target_positions:
                output += '.'
            elif state.grid[y][x] == WALL:
                output += '#'
            else:
                output += ' '
        output += '\n'
    return output
```

*Why it matters:* Level serialization is what makes your puzzle game extensible. With a text-based format, anyone can create new levels in a text editor and load them into your game. The standard Sokoban format has been used for decades, and there are thousands of community-made levels available in this format. Building a parser for it is trivial and immediately gives your game access to a vast library of content. It also opens the door to a level editor, clipboard sharing, and procedural level generation.

### Stretch Goals

- **Level editor:** Let the player place walls, blocks, targets, and the player start position on an empty grid, then test their level immediately. Save custom levels using the serialization format.
- **Step counter and par score:** Track the number of moves per level and display a par score (minimum known moves). Encourage the player to optimize after solving.
- **Animated transitions:** Instead of snapping to new positions, have the player and blocks slide smoothly between grid cells. This makes the game feel polished without changing any logic.
- **Rules-as-objects mode:** Implement a small set of Baba Is You-style rule tiles for 2-3 bonus levels that demonstrate the concept.

### MVP Spec

| Element | Scope |
|---|---|
| Grid | Variable size per level, up to 12x12 |
| Tiles | Wall, floor, target, block, player |
| Movement | 4-directional (up/down/left/right), one cell per move |
| Push rules | Push one block at a time, only into empty floor or target, no pulling |
| Undo | Full undo/redo stack, unlimited depth |
| Dead-state detection | Corner deadlock detection with visual warning |
| Levels | 5-8 handcrafted levels with progressive difficulty |
| Level format | Standard Sokoban text format, loaded from strings or files |
| Win condition | All blocks on targets |
| HUD | Move counter, level number, undo/redo/restart buttons |
| Rendering | 2D grid with distinct tile graphics, block highlight when on target |

### Deliverable

A playable Sokoban game with 5-8 levels of increasing difficulty. The player pushes blocks onto target squares using four-directional movement. The game must include a working undo system (at minimum undo, ideally undo and redo), dead-state detection for corner deadlocks with a visual indicator, and levels loaded from a text-based serialization format. Each level should take between 30 seconds and 5 minutes to solve, and the full set should demonstrate a clear difficulty progression.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Push Mechanics | Like a message queue where you can only enqueue, never dequeue from the front -- once data is pushed through, you cannot pull it back |
| Undo System | Like an event-sourced system -- every state change is an event on a log, and "undo" means replaying all events except the last one (or maintaining snapshots) |
| Puzzle State Validation | Like a health check that runs after every deployment -- a simple predicate confirms all services (blocks) are in their expected positions (targets) |
| Level Design for Puzzles | Like designing test cases -- each level is a carefully constructed scenario that exercises specific behaviors and has exactly one correct solution path |
| Dead-State Detection | Like detecting circular dependencies or deadlocks in a locking system -- certain resource configurations are provably unresolvable and should be flagged early |
| Rules-as-Objects | Like configuration-as-code -- the rules governing system behavior are not hardcoded but are data that can be modified, versioned, and deployed at runtime |
| Level Serialization | Like infrastructure-as-code (Terraform, CloudFormation) -- the entire state of a system is described in a declarative text format that can be version-controlled and shared |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Push Mechanics | Like DOM element positioning where you can only push elements rightward/downward in flow -- reflowing content in one direction without the ability to pull it back |
| Undo System | Like the browser's history API -- pushState adds to the stack, back pops it, and the current URL/state is always the top of the stack |
| Puzzle State Validation | Like form validation that checks on every input change -- a simple function tests whether all required fields (targets) have valid values (blocks) |
| Level Design for Puzzles | Like designing a user flow -- each screen (level) presents a specific challenge, the user must discover the correct sequence of interactions, and difficulty ramps up gradually |
| Dead-State Detection | Like detecting impossible form states -- a combination of selections that makes the submit button permanently unreachable should trigger a warning |
| Rules-as-Objects | Like a CMS where the page layout rules are editable content, not code -- the user can rearrange what "is a heading" and "is clickable" by dragging components |
| Level Serialization | Like saving and loading component state as JSON -- the entire UI configuration is a serializable string that can be shared via URL parameters or local storage |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Push Mechanics | Like a write-once data pipeline -- once data flows through a transformation, the original cannot be retrieved from the output without re-running from source |
| Undo System | Like checkpointing in model training -- each epoch's weights are saved, and "undo" means rolling back to a previous checkpoint |
| Puzzle State Validation | Like a convergence check -- after each training step, verify whether the loss (distance from solution) has reached the target threshold |
| Level Design for Puzzles | Like curating a benchmark dataset -- each example is selected to test a specific capability, and the set as a whole should have a measurable difficulty gradient |
| Dead-State Detection | Like detecting that a gradient has vanished -- certain parameter configurations are provably unable to reach the optimum and should trigger an early stop |
| Rules-as-Objects | Like AutoML or neural architecture search -- the rules of the model (layer types, connections) are themselves parameters being optimized, not fixed code |
| Level Serialization | Like storing dataset splits as CSV or Parquet -- a standardized text format that any tool can read, enabling sharing, versioning, and reproducibility |

---

## Discussion Questions

1. **The Undo Dilemma:** Unlimited undo makes Sokoban less punishing, but it also reduces the weight of each decision. Some designers argue that limited or no undo is more "pure." Where do you draw the line? Does the undo system change the nature of the puzzle, or does it just change the player's emotional experience of solving it?

2. **Designing for One Solution:** The best Sokoban levels have exactly one solution (or very few). But how do you verify this without exhaustive search? If you build a level editor, should it include a solver that verifies uniqueness? What are the computational implications of solving Sokoban levels programmatically?

3. **The Dead-State UX Problem:** When a puzzle becomes unsolvable, should the game tell the player immediately, wait for them to figure it out, or never say anything? Each choice has trade-offs: immediate feedback is helpful but removes the "figuring out what went wrong" experience. How would you handle this in your MVP?

4. **Physical Intuition vs. Abstract Rules:** Classic Sokoban uses the physical metaphor of pushing crates in a warehouse. Baba Is You uses abstract word-tiles that change reality. Does the physical metaphor make the game easier to learn? Does the abstract approach make it more interesting? What does this tell you about the role of metaphor in game design?
