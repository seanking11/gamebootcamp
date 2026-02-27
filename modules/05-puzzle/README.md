# Module 05: Puzzle Game (Tetris-like)

**Weeks 9-10** | *Spatial arrangement under time pressure*

---

## Week 1: History & Design Theory

### The Origin

In 1984, Alexey Pajitnov -- a computer scientist at the Soviet Academy of Sciences in Moscow -- created **Tetris** on an Elektronika 60 terminal. He was researching speech recognition and artificial intelligence, but in his spare time he was fascinated by pentomino puzzles. He simplified the shapes from five squares to four (tetrominoes), added gravity so they fell from the top of the screen, and made completed rows disappear. That was it. No enemies, no story, no avatar. Just shapes, a grid, and a ticking clock. Tetris went on to become one of the most ported, most played, and most studied games in history. It launched the Game Boy into a cultural phenomenon, sparked an international legal battle over licensing rights that reads like a Cold War thriller, and proved that a game does not need narrative or graphics to be profoundly compelling. It is arguably the most important puzzle game ever made, and a strong candidate for the most important video game, period.

### How the Genre Evolved

**Dr. Mario** (Nintendo, 1990) kept Tetris's falling-piece structure but changed the objective. Instead of clearing lines, players matched colors: drop two-colored pill capsules onto a bottle full of viruses, and when four or more of the same color line up horizontally or vertically, they vanish. This was the first major demonstration that the "falling piece on a grid" template could be re-skinned with entirely different win conditions. Dr. Mario also introduced a stronger emphasis on chain reactions -- clearing one set of blocks could cause others to fall and trigger secondary clears, rewarding players who thought multiple moves ahead.

**Puyo Puyo** (Compile, 1991) pushed the chain-reaction idea further and added competitive multiplayer. Two players shared a screen, and triggering large chains would dump garbage blocks onto your opponent's board. This turned the puzzle game into a head-to-head sport where offense and defense happened simultaneously. The "send garbage to your opponent" mechanic became a genre staple, eventually making its way back into Tetris itself with games like Tetris 99 (2019), a 99-player battle royale.

**Bejeweled** (PopCap Games, 2001) broke away from falling pieces entirely and invented the match-3 subgenre. Players swapped adjacent gems on a static grid to create rows or columns of three or more matching colors. Bejeweled proved that the core puzzle-game loop -- pattern recognition, spatial reasoning, cascading clears -- did not require gravity or time pressure at all. Its DNA runs through Candy Crush Saga (King, 2012), which added level-based objectives and free-to-play monetization, becoming one of the highest-grossing games of all time. Together, Bejeweled and Candy Crush demonstrated that puzzle games could reach audiences far beyond traditional gamers.

### What Makes Puzzle Games Great

The best puzzle games create a flow state by balancing two opposing forces: the player's growing mastery and the game's increasing pressure. In Tetris, early levels are meditative -- you have time to think, to plan, to place pieces precisely. But the speed curve tightens, the stack grows, and suddenly you are making split-second spatial calculations that feel more like instinct than thought. The system's demands rise to meet and then exceed your capacity, and the pleasure comes from staying just barely in control. Puzzle games strip away everything except that negotiation between skill and pressure, which is why they have a shelf life measured in decades.

### The Essential Mechanic

**Spatial arrangement under time pressure** -- the player must organize pieces within a constrained grid before the system forces the next decision.

---

## Week 2: Build the MVP

### What You're Building

A single-player Tetris-style falling-block puzzle game. Tetrominoes drop from the top of a 10-wide, 20-tall grid. The player can move, rotate, and drop pieces. Completed rows clear, the score increases, and the speed gradually ramps up. The game ends when the stack reaches the top.

### Core Concepts (Must Implement)

#### 1. Grid as Gameplay Mechanic

In previous modules, you may have used grids for rendering (tilemaps, sprite alignment). Here, the grid **is** the game state. Every cell in a 10x20 two-dimensional array is either empty or occupied by a locked block. All game logic -- collision detection, line clearing, piece placement -- is a query or mutation against this array. The grid is your single source of truth.

```
// The grid is a 2D array. 0 = empty, non-zero = color/piece ID.
grid = Array(20, Array(10, 0))

// Check if a cell is occupied:
function isOccupied(row, col):
    return grid[row][col] != 0

// Lock a piece into the grid:
function lockPiece(piece, row, col):
    for each (r, c) in piece.cells:
        grid[row + r][col + c] = piece.colorId
```

**Why it matters:** This is the difference between data-driven architecture and render-driven architecture. The grid is your canonical data store. Rendering reads from it; input writes to it. If you can query and mutate the grid correctly, everything else -- display, scoring, physics -- follows. This pattern -- authoritative state separated from presentation -- is foundational across software engineering.

---

#### 2. Piece Representation and Rotation

Each tetromino is a 2D array describing which cells in a small bounding box are filled. The I-piece, for example, is a 4x4 matrix with one row of filled cells. Rotation is not animation -- it is a matrix operation. Rotate clockwise by transposing the matrix (swap rows and columns) and then reversing each row.

```
// T-piece in its default orientation:
T_PIECE = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
]

// Rotate clockwise: transpose, then reverse each row.
function rotateCW(matrix):
    size = matrix.length
    transposed = Array(size, Array(size, 0))
    for r in 0..size-1:
        for c in 0..size-1:
            transposed[c][r] = matrix[r][c]
    for row in transposed:
        row.reverse()
    return transposed
```

**Why it matters:** This is pure data transformation -- no game engine magic, no sprite rotation. You are manipulating an array, checking it against the grid for collisions, and writing it back. The "wall kick" system in modern Tetris (where the game tries alternate positions if a rotation would collide) is essentially a retry strategy with fallback offsets -- try the default position first, and if it collides, attempt a series of alternate placements before giving up.

---

#### 3. Gravity Within the Grid

Every tick of the game's drop timer, the active piece moves down one row. When it can no longer move down (it would collide with the floor or a locked block), it locks into the grid. After locking, any fully completed rows are detected and cleared, and every row above the cleared rows shifts downward to fill the gap. This is "gravity" but it has nothing to do with physics engines -- it is array manipulation.

```
// Drop the active piece by one row:
function applyGravity(piece):
    if canMove(piece, piece.row + 1, piece.col):
        piece.row += 1
    else:
        lockPiece(piece)
        clearLines()
        spawnNextPiece()

// After clearing rows, shift everything above down:
function collapseRows(clearedRows):
    for row in clearedRows (sorted descending):
        grid.removeAt(row)
        grid.insertAt(0, Array(10, 0))   // empty row at top
```

**Why it matters:** This is a scheduled job with side effects. Every N milliseconds, the drop timer executes a state transition. The cascade (clear rows, shift rows, check for new clears) is a pipeline with dependent steps. Getting the ordering right (lock, then detect clears, then collapse, then spawn) is critical -- reorder these steps and the game breaks in subtle ways.

---

#### 4. Line/Match Clearing with Cascade Detection

After every piece locks, scan every row of the grid. If every cell in a row is occupied, that row is cleared. In a basic Tetris clone, this is straightforward: check, clear, collapse. But cascade detection matters when you extend the design: in games like Puyo Puyo or match-3 variants, clearing one group can cause blocks to fall and form new matches. Even in Tetris, clearing multiple lines at once (a "Tetris" is four lines) must be detected as a single event for scoring purposes.

```
function getCompletedRows():
    completed = []
    for row in 0..ROWS-1:
        if all(cell != 0 for cell in grid[row]):
            completed.append(row)
    return completed

function clearLines():
    completed = getCompletedRows()
    if completed.length > 0:
        linesCleared = completed.length
        updateScore(linesCleared)
        collapseRows(completed)
```

**Why it matters:** This is event detection and propagation. You scan for a condition, emit an event (lines cleared), and trigger side effects (score update, row collapse, possible combo tracking). A state change in one part of the system triggers a cascade of downstream updates. Getting the detection loop right (especially if you later add chain/cascade scoring) is an exercise in recursive or iterative event processing.

---

#### 5. Piece Preview Queue

The player needs to see what piece is coming next (and ideally the next several pieces). This is a queue data structure. Modern Tetris uses a "bag" randomization system: take all 7 unique tetrominoes, shuffle them into a bag, and deal them out one at a time. When the bag is empty, generate a new shuffled bag. This guarantees that you never go more than 12 pieces without seeing any given shape, preventing the frustrating "drought" of early random implementations.

```
ALL_PIECES = [I, O, T, S, Z, J, L]

pieceQueue = []

function refillBag():
    bag = shuffle(copy(ALL_PIECES))
    pieceQueue.addAll(bag)

function getNextPiece():
    if pieceQueue.length < 7:
        refillBag()
    return pieceQueue.dequeue()
```

**Why it matters:** The bag system is a fairness-constrained random scheduler. The preview queue itself is a classic FIFO buffer. The design insight is that pure randomness often feels unfair; constrained randomness feels both unpredictable and fair. This principle -- bounding randomness to guarantee distribution properties -- applies far beyond games.

---

#### 6. Lock Delay and Soft/Hard Drop

When a piece lands on a surface, it should not lock instantly. **Lock delay** gives the player a brief window (typically 500ms) to slide or rotate the piece before it commits. **Soft drop** increases the fall speed while the player holds down; **hard drop** instantly places the piece at the lowest valid position and locks it immediately. Hard drop requires a "ghost piece" calculation: scan downward from the piece's current position until it would collide, and that is the landing spot.

```
// Ghost piece / hard drop target:
function getDropRow(piece):
    testRow = piece.row
    while canMove(piece, testRow + 1, piece.col):
        testRow += 1
    return testRow

// Lock delay timer:
function onPieceLanded():
    startLockTimer(500ms)

function onLockTimerExpired():
    if not canMove(piece, piece.row + 1, piece.col):
        lockPiece(piece)    // still on surface, commit
    // else: piece was moved off surface, cancel lock
```

**Why it matters:** Lock delay is a grace period that separates "intent" (the player pressed drop) from "commitment" (the piece is locked) with a validation step in between. The hard drop's ghost piece calculation is a lookahead query: "given the current state, what is the terminal position?" These are small systems, but the pattern of intent-then-validate-then-commit appears throughout software engineering wherever premature commitment is costly.

---

#### 7. Scoring with Combos

Basic scoring awards points for clearing lines: 1 line = 100, 2 = 300, 3 = 500, 4 (a "Tetris") = 800. But modern scoring systems reward **skill expression**: T-spins (rotating a T-piece into a tight gap), back-to-back Tetrises, and multi-move combos (clearing lines on consecutive piece placements) all award bonus multipliers. The scoring system becomes a rules engine that tracks recent history and applies conditional bonuses.

```
BASE_SCORES = { 1: 100, 2: 300, 3: 500, 4: 800 }

function calculateScore(linesCleared, level, isTSpin, isBackToBack):
    base = BASE_SCORES[linesCleared]
    if isTSpin:
        base = base * 2
    if isBackToBack:
        base = base * 1.5
    return base * level

// Combo tracking: consecutive clears increase a combo counter.
comboCount = 0
function onLinesClear(count):
    comboCount += 1
    bonus = 50 * comboCount * level
    score += calculateScore(count, level, ...) + bonus

function onPieceLockWithoutClear():
    comboCount = 0   // combo broken
```

**Why it matters:** This is a rules engine with stateful context. The scoring system must remember recent events (was the last clear a Tetris? is the combo alive?) and apply conditional logic. The key insight is that "score" is not just an incrementing counter -- it is the output of a stateful pipeline that evaluates each event against accumulated context.

---

#### 8. Speed Curve / Level Progression

The game gets faster as the player clears lines. Every 10 lines cleared advances the level by one, and each level reduces the drop interval. The classic NES Tetris formula is well-known, but any curve works as long as the early game feels accessible and the late game feels urgent. The drop interval is the tick rate of your gravity scheduler.

```
// Classic-style speed curve (frames per drop at 60fps):
function getDropInterval(level):
    // Attempt a curve that feels smooth:
    // Level 0: 800ms, Level 9: 100ms, Level 19+: ~17ms (1 frame)
    intervals = [800, 720, 630, 550, 470, 380, 300, 220, 130, 100,
                 83, 83, 83, 67, 67, 67, 50, 50, 50, 33, ...]
    return intervals[min(level, intervals.length - 1)]

function onLinesClear(count):
    totalLines += count
    level = floor(totalLines / 10)
    dropTimer.setInterval(getDropInterval(level))
```

**Why it matters:** This is dynamic configuration of a scheduled process. The speed curve is a difficulty function, and designing it well is a form of system tuning: too aggressive and the game feels unfair; too gentle and it feels boring. The math is simple, but the feel requires iteration and testing.

---

### Stretch Goals

1. **Ghost piece rendering** -- Show a translucent outline at the hard-drop landing position so the player can see exactly where a piece will land. This is the visual representation of the lookahead query you already computed for hard drop.

2. **Hold piece** -- Let the player stash the current piece and swap it back later. This adds a single-slot buffer and introduces interesting strategic decisions about when to save a useful piece.

3. **Competitive garbage rows** -- Implement a second board (AI or second player) and send incomplete rows to the opponent when clearing multiple lines. "Lines cleared" events on one board produce "garbage received" events on the other, turning a solo puzzle into a head-to-head system.

4. **T-spin detection** -- Implement the 3-corner rule for detecting T-spins (check if 3 of 4 corners around the T-piece center are occupied after rotation). This is a pattern-matching problem against the grid state.

### MVP Spec

| Feature | Required? |
|---|---|
| 10x20 grid with cell-based state | Yes |
| All 7 tetrominoes with rotation | Yes |
| Gravity (timed drop) | Yes |
| Collision detection (walls, floor, locked blocks) | Yes |
| Line clear detection and row collapse | Yes |
| Piece preview (next piece) | Yes |
| Soft drop and hard drop | Yes |
| Lock delay | Yes |
| Scoring (line-based, level multiplier) | Yes |
| Level progression with speed increase | Yes |
| Game over detection (stack reaches top) | Yes |
| Ghost piece | Stretch |
| Hold piece | Stretch |
| Bag randomization (7-bag system) | Stretch |
| Combo / back-to-back bonus scoring | Stretch |
| T-spin detection | Stretch |

### Deliverable

A playable single-player falling-block puzzle game. Pieces spawn at the top, the player can move/rotate/drop them, completed lines clear, the speed increases with level, and the game ends when the board fills up. The game should be satisfying to play at low levels and feel increasingly tense as the speed ramps up. Submit a screen recording or playable link alongside your source code.

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Grid as Gameplay Mechanic | A database table where every row and column has meaning -- the grid is your canonical data store, like event sourcing with an authoritative state |
| Piece Representation and Rotation | Transform a data structure, validate it against constraints, persist it -- wall kicks are a retry strategy with fallback offsets, like a connection pool trying alternative hosts |
| Gravity Within the Grid | A cron-like scheduler with side effects -- the drop timer fires every N ms, and the cascade is a pipeline like message queue consumers or database trigger chains |
| Line/Match Clearing with Cascade Detection | Database triggers or event-driven workflows -- a state change triggers downstream updates, like cascading side effects in transaction processing |
| Piece Preview Queue | Weighted round-robin load balancing or A/B test assignment ensuring even distribution; the queue itself is a FIFO buffer like a task queue or message broker |
| Lock Delay and Soft/Hard Drop | Connection timeout with retry window; the ghost piece is a dry-run/lookahead query like simulated execution in a transaction planner |
| Scoring with Combos | Stateful rules engine -- loyalty point calculations, tiered pricing, or SLA breach detection that evaluates events against accumulated context |
| Speed Curve / Level Progression | Adaptive rate limiting or auto-scaling thresholds -- dynamically reconfiguring a scheduled process based on cumulative load |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Grid as Gameplay Mechanic | Separating state from the DOM -- like a Redux/Zustand store that is the single source of truth, with React components rendering from it |
| Piece Representation and Rotation | CSS `transform: rotate()` but implemented as a data operation -- transpose and reverse a matrix, then diff against the grid like virtual DOM reconciliation |
| Gravity Within the Grid | `setInterval` or `requestAnimationFrame` driving a state update each tick -- the cascade is like a chain of `useEffect` hooks triggering sequential re-renders |
| Line/Match Clearing with Cascade Detection | Event bubbling and propagation -- one DOM event triggers handlers that modify state, which triggers further re-renders |
| Piece Preview Queue | A component rendering from a queue data structure, like a notification stack -- items are consumed from the front and new items are pushed to the back |
| Lock Delay and Soft/Hard Drop | Debounce function on an input handler -- delay commitment until the user stops interacting, then commit; ghost piece is a preview/dry-run render |
| Scoring with Combos | Derived state in a state manager -- the score is computed from a history of recent actions, not just the latest event |
| Speed Curve / Level Progression | Dynamically adjusting a `setInterval` duration based on state -- like adaptive polling or throttling in a real-time dashboard |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Grid as Gameplay Mechanic | A 2D NumPy array or tensor where each cell holds a categorical value -- all game logic is vectorized queries and mutations on this matrix |
| Piece Representation and Rotation | Matrix transpose followed by row reversal -- a standard NumPy operation (`np.rot90`); collision checking is element-wise comparison against the grid tensor |
| Gravity Within the Grid | A simulation step in a time-series model -- each tick advances the state by one step, and the cascade is a multi-step pipeline like a DAG in Airflow |
| Line/Match Clearing with Cascade Detection | Row-wise aggregation (check if all elements are non-zero) followed by array deletion and insertion -- like filtering rows from a DataFrame and re-indexing |
| Piece Preview Queue | Sampling without replacement from a finite population (the 7-bag), like stratified sampling that guarantees representation of every class within a window |
| Lock Delay and Soft/Hard Drop | A convergence check in an optimization loop -- keep iterating (sliding the piece) until the state stabilizes, then commit the result |
| Scoring with Combos | A stateful feature-engineering pipeline -- the score depends on a rolling window of recent events, like computing a moving average with conditional bonuses |
| Speed Curve / Level Progression | A learning-rate schedule (step decay) -- the system parameter changes at defined thresholds, controlling the pace of the process |

### Discussion Questions

1. **Grid as state vs. grid as display.** In this module, the grid array is the authoritative game state and the renderer just draws it. How does this compare to how you handle state in a typical web application? What would break if the renderer held state that the grid did not?

2. **Randomness and fairness.** The 7-bag system ensures every piece type appears at least once per 7 pieces. Where in backend systems have you had to constrain randomness to ensure fairness or distribution guarantees? (Think load balancing, A/B testing, shuffle algorithms.)

3. **Difficulty curves as system tuning.** The speed curve determines how the game feels over a 5-minute session. How is designing this curve similar to tuning auto-scaling policies, rate limits, or retry backoff strategies? What metrics would you use to evaluate whether your curve is well-tuned?

4. **Cascade side effects.** Clearing a line triggers row collapse, which could (in extended versions) trigger further clears. How do you manage cascading side effects in your backend systems? What patterns (event sourcing, saga pattern, idempotent handlers) help keep them predictable?

---

## Prerequisites

- **Module 01 (Pong) -- recommended.** Pong introduces the game loop, input handling, and basic collision detection. The puzzle module builds on all of these but applies them to a grid-based system rather than continuous 2D space.
