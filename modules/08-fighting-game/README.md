# Module 08: Fighting Game / Beat 'em Up

**Weeks 15-16** | *Two enter, one leaves -- and the difference between victory and defeat is measured in sixtieths of a second.*

---

## Prerequisites

| Module | What You Used From It |
|---|---|
| Module 01 - Pong | Two-player input handling, collision detection, win/loss conditions, game state resets |
| Module 03 - Top-Down Shooter | Entity interaction, health systems, projectile spawning, damage resolution |

You should be comfortable with real-time game loops, basic collision detection between entities, and managing health as a game-state value.

---

## Week 1: History & Design Theory

### The Origin

**Street Fighter II: The World Warrior** (1991) -- Capcom, directed by Akira Nishitani and Akira Yasuda

Fighting games existed before Street Fighter II -- including Capcom's own Street Fighter (1987) and Karate Champ (1984) -- but SFII was the game that defined the genre's grammar. It introduced a cast of eight mechanically distinct characters, each with unique normal attacks, special moves, and strategic identities. The six-button layout (three punches, three kicks, each at light/medium/heavy strength) created a matrix of options that rewarded knowledge and precision. Special moves like Ryu's fireball (quarter-circle forward + punch) required specific joystick motions, adding an execution layer on top of strategic decision-making. But SFII's deepest contribution was something the developers did not even intend: combos. During development, testers discovered that certain attacks could chain into others if timed precisely, and the team decided to keep this behavior rather than patch it out. This happy accident -- emergent behavior from frame-level timing -- became the defining mechanic of the entire genre. SFII also proved the economic model: competitive two-player arcade cabinets generated massive revenue because losing players fed quarters to keep playing. The game created a global competitive scene that, three decades later, fills stadiums.

### How the Genre Evolved

**Mortal Kombat** (Midway, 1992) arrived one year after SFII and took a radically different approach. Where SFII used hand-drawn sprites, MK used digitized photographs of real actors, giving the game a visceral, pseudo-realistic look. Its infamous "Fatality" finishing moves -- graphic kill animations performed after defeating an opponent -- triggered a wave of media controversy that paradoxically made the game a cultural phenomenon. The resulting Congressional hearings directly led to the creation of the ESRB rating system in 1994. Mechanically, Mortal Kombat introduced the block button (SFII used "hold back to block") and a distinct emphasis on dial-a-combo systems where players input a memorized sequence rather than reacting to hit-confirms. MK proved that the fighting game formula could support dramatically different tonal and mechanical identities while remaining recognizably the same genre.

**Super Smash Bros.** (HAL Laboratory, 1999) asked: what if a fighting game did not have health bars? Smash replaced traditional life meters with a percentage system -- as your percentage rises, you fly farther when hit, until eventually you are knocked off the stage entirely. This, combined with a platform-based arena rather than a flat stage, created a fighting game that was spatially dynamic in ways traditional fighters were not. Movement and positioning became as important as frame data. Smash also simplified inputs: no quarter-circles, no six-button matrices, just a direction plus a button. This lowered the execution barrier without lowering the strategic ceiling, making the game simultaneously accessible to newcomers and deeply competitive at the highest level. The Smash series proved that "fighting game" is a broader design space than the SFII template suggests.

**Guilty Gear** (Arc System Works, 1998 onward) and the modern fighting game renaissance pushed the genre into increasingly technical territory while also confronting its biggest infrastructural problem: online play. Fighting games are uniquely sensitive to network latency because a single frame (16.67ms at 60fps) can determine whether an attack connects or whiffs. The community's adoption of **rollback netcode** -- a predictive networking model that runs the game forward on local input and corrects if the remote input differs -- transformed online play from unplayable to competitive. This shift, accelerated by the open-source GGPO library, became a litmus test for modern fighters. Games like Guilty Gear Strive (2021) and Street Fighter 6 (2023) ship with rollback as a baseline expectation, and the discourse around frame data, hitboxes, and netcode has made fighting game players some of the most technically literate in all of gaming.

### What Makes Fighting Games Great

The fighting game's core design insight is that **meaningful decisions happen at every timescale simultaneously**. In a single match, you are making strategic reads (my opponent likes to jump, so I should use anti-air attacks), tactical choices (they are in the corner, I should pressure with safe attacks), and frame-level execution decisions (I landed a hit, I have 3 frames to input my combo follow-up). Every action has startup, active, and recovery frames -- meaning every attack is a commitment with known risk and reward, and your opponent can see the commitment happening. This legibility is what separates fighting games from chaos: both players have full information about what every move does, so outplaying someone means understanding the game more deeply, not having more hidden information. It is pure competitive decision-making at inhuman speed.

### The Essential Mechanic

Reading your opponent and choosing the right action in a frame-tight window where every move has risk and reward encoded in its animation timing.

---

## Week 2: Build the MVP

### What You're Building

A two-player (or player vs. simple AI) fighting game where two characters face off on a stage with health bars, blocking, basic attacks, at least one special move, and a combo system. The game plays in best-of-3 rounds.

### Core Concepts (Must Implement)

#### 1. Hitbox/Hurtbox Separation

This is THE foundational concept of fighting game engineering. Every character has at least two types of collision boxes that serve entirely different purposes:

- **Hurtbox:** The region where the character can be hit. Roughly matches the character's visible body. Always active.
- **Hitbox:** The region where an attack deals damage. Only active during specific animation frames. Extends outward from the character during an attack.

These are completely separate from the **pushbox** (physics collision that prevents characters from overlapping).

```
class Fighter:
    pushbox   = { x: -15, y: -40, w: 30, h: 80 }   // physics body, always active
    hurtboxes = [                                      // vulnerable regions, always active
        { x: -12, y: -38, w: 24, h: 75, tag: "body" },
        { x: -8,  y: -48, w: 16, h: 12, tag: "head" }
    ]
    hitboxes  = []  // empty unless mid-attack

// During a punch attack (active on frames 4-6 of animation):
function onAttackFrame(fighter, frameIndex):
    if frameIndex >= 4 AND frameIndex <= 6:
        fighter.hitboxes = [
            { x: 15, y: -30, w: 25, h: 12, damage: 5, hitstun: 12 }
        ]
    else:
        fighter.hitboxes = []

// Collision check: attacker's hitbox vs. defender's hurtbox
function checkHit(attacker, defender):
    for each hitbox in attacker.hitboxes:
        for each hurtbox in defender.hurtboxes:
            if rectanglesOverlap(
                worldPosition(attacker, hitbox),
                worldPosition(defender, hurtbox)
            ):
                return { hit: true, damage: hitbox.damage,
                         hitstun: hitbox.hitstun }
    return { hit: false }
```

Hitboxes and hurtboxes are offset relative to the character's position and must flip horizontally when the character faces the other direction.

**Why it matters:** This is the separation of concerns principle applied to collision. Different collision layers serve different gameplay purposes -- physics separation (pushbox), vulnerability detection (hurtbox), and damage dealing (hitbox) are independent systems that happen to operate on the same entities. Keeping them separate makes each system simpler to reason about and debug.

---

#### 2. Frame Data and Animation-Driven Gameplay

In a fighting game, animations are not cosmetic -- they ARE the gameplay. Every attack is divided into three phases measured in frames (at 60fps, 1 frame = ~16.67ms):

- **Startup frames:** The wind-up. The attack is committed but not yet dangerous. The character is vulnerable.
- **Active frames:** The hitbox is live. This is when the attack can connect.
- **Recovery frames:** The follow-through. The hitbox is gone but the character cannot act yet. Vulnerable to punishment.

```
// Attack definition as frame data
attacks = {
    "light_punch": {
        startup: 4,      // frames 1-4: winding up
        active: 3,       // frames 5-7: hitbox is live
        recovery: 8,     // frames 8-15: returning to neutral
        totalFrames: 15,
        damage: 3,
        hitstun: 10,     // frames the opponent is frozen if hit
        blockstun: 5,    // frames the opponent is frozen if they block
        // "frame advantage on hit" = hitstun - recovery = 10 - 8 = +2
        // (you recover 2 frames before them -- you can act first)
    },
    "heavy_punch": {
        startup: 10,
        active: 4,
        recovery: 18,
        totalFrames: 32,
        damage: 12,
        hitstun: 20,
        blockstun: 8,
    }
}

function updateAttack(fighter, dt):
    if fighter.currentAttack == null:
        return

    fighter.attackFrame += 1
    attack = attacks[fighter.currentAttack]

    if fighter.attackFrame <= attack.startup:
        fighter.hitboxes = []                        // winding up, no threat
    else if fighter.attackFrame <= attack.startup + attack.active:
        fighter.hitboxes = attack.hitboxData          // LIVE -- can deal damage
    else if fighter.attackFrame <= attack.totalFrames:
        fighter.hitboxes = []                        // recovering, vulnerable
    else:
        fighter.currentAttack = null                 // attack complete
        fighter.hitboxes = []
        fighter.state = STANDING                     // return to neutral
```

The numbers define the game's entire balance. A fast light attack (4f startup) can interrupt a slow heavy attack (10f startup), but the heavy attack deals far more damage. This creates a constant risk-reward calculus.

**Why it matters:** Frame data is a contract. Every attack publishes exactly how long it takes to start, how long it threatens, and how long the attacker is vulnerable afterward. Understanding that every action has a cost measured in time -- and that your opponent can exploit your committed time -- is a foundational systems-thinking skill that applies far beyond fighting games.

---

#### 3. State Machine Depth

Module 02 (Platformer) introduced you to finite state machines with states like `IDLE`, `RUNNING`, `JUMPING`, `FALLING`. A fighting game demands a much deeper FSM with more states and stricter transition rules.

```
// Core fighter states
STATES = {
    STANDING,       // neutral, can do anything
    CROUCHING,      // holding down, different attacks available
    WALKING_FWD,    // advancing
    WALKING_BACK,   // retreating (also blocking if opponent attacks)
    JUMPING,        // airborne, limited options
    ATTACKING,      // committed to an attack animation
    BLOCKING_HIGH,  // absorbing a mid/high attack, reduced damage
    BLOCKING_LOW,   // absorbing a low attack
    HITSTUN,        // just got hit, cannot act for N frames
    BLOCKSTUN,      // just blocked, cannot act for N frames
    KNOCKDOWN,      // on the ground after a launcher/sweep
    GETTING_UP,     // invincible wakeup frames (design decision)
    KO              // health reached zero
}

function getValidTransitions(currentState):
    switch currentState:
        case STANDING:
            return [CROUCHING, WALKING_FWD, WALKING_BACK,
                    JUMPING, ATTACKING]
        case ATTACKING:
            return []           // LOCKED until attack animation ends
        case HITSTUN:
            return []           // LOCKED until hitstun timer expires
        case BLOCKSTUN:
            return []           // LOCKED until blockstun timer expires
        case KNOCKDOWN:
            return [GETTING_UP] // only after knockdown duration
        case JUMPING:
            return [ATTACKING]  // can attack mid-air, but cannot block
        // ... etc.

function transitionState(fighter, newState):
    if newState in getValidTransitions(fighter.state):
        fighter.previousState = fighter.state
        fighter.state = newState
        fighter.stateFrameCounter = 0
        onStateEnter(fighter, newState)
```

The critical design insight: **most states lock the player out of other actions.** When you are attacking, you cannot block. When you are in hitstun, you cannot do anything. This means every action is a commitment, and the state machine enforces that commitment.

**Why it matters:** This is a state machine with strict invariants. Define valid states, define valid transitions, and reject everything else. The fighting game FSM enforces commitment -- once you start an attack, you cannot block until the animation completes. This strictness is what makes every action meaningful and every mistake punishable.

---

#### 4. Input Command Parsing

A fighting game must read complex input sequences. A fireball is not "press a button" -- it is "down, down-forward, forward, punch" performed within a timing window. This requires an **input buffer** that stores recent inputs and a **command parser** that matches patterns.

```
// Store recent inputs in a ring buffer
class InputBuffer:
    maxLength = 60              // store 1 second of input at 60fps
    buffer = []                 // list of { direction, buttons, frame }

    function record(input, frameNumber):
        buffer.append({ dir: input.direction, btn: input.buttons,
                        frame: frameNumber })
        if buffer.length > maxLength:
            buffer.removeFirst()

// Command definitions as input sequences
commands = {
    "fireball": {
        sequence: [DOWN, DOWN_FORWARD, FORWARD],
        button: PUNCH,
        window: 15    // entire sequence must complete within 15 frames
    },
    "uppercut": {
        sequence: [FORWARD, DOWN, DOWN_FORWARD],
        button: PUNCH,
        window: 15
    }
}

// Check if a command was just completed
function checkCommand(command, buffer, currentFrame):
    // Work backwards through the buffer
    // The button press must be the most recent input
    lastInput = buffer.last()
    if NOT (command.button in lastInput.btn):
        return false

    // Walk backward through buffer matching the sequence in reverse
    seqIndex = command.sequence.length - 1
    for i from buffer.length - 2 down to 0:
        entry = buffer[i]

        // Too old -- outside the command window
        if currentFrame - entry.frame > command.window:
            return false

        if entry.dir == command.sequence[seqIndex]:
            seqIndex -= 1
            if seqIndex < 0:
                return true     // full sequence matched

    return false

// Priority system: check specials before normals
function parseInput(buffer, currentFrame):
    for each command in commands (ordered by priority):
        if checkCommand(command, buffer, currentFrame):
            return command.name

    // No special move matched -- check for normal attacks
    lastInput = buffer.last()
    if PUNCH in lastInput.btn:
        return "normal_punch"
    if KICK in lastInput.btn:
        return "normal_kick"

    return null
```

The input buffer also enables **input leniency**: accepting slightly imprecise inputs (e.g., skipping `DOWN_FORWARD` if `DOWN` and `FORWARD` are close enough) so the game does not feel unresponsive.

**Why it matters:** This is pattern matching on a time-windowed stream of events. The input buffer stores recent history, and the command parser scans it for known sequences within a timing window. Getting this right determines whether the game feels responsive or frustrating -- leniency tuning is one of the most important "feel" adjustments in a fighting game.

---

#### 5. Combo System

A combo occurs when one attack connects and the attacker follows up with another attack before the opponent recovers from hitstun. The combo system links individual attacks into chains.

```
// When an attack lands, check if a follow-up is allowed
comboRoutes = {
    "light_punch":  { canCancelInto: ["light_punch", "medium_punch", "fireball"] },
    "medium_punch": { canCancelInto: ["heavy_punch", "fireball", "uppercut"] },
    "heavy_punch":  { canCancelInto: ["fireball", "uppercut"] },  // only specials
    "fireball":     { canCancelInto: [] },     // combo ender
    "uppercut":     { canCancelInto: [] }      // combo ender
}

class ComboTracker:
    currentCombo = []
    hitCount = 0
    totalDamage = 0
    hitstunDecay = 0        // reduces hitstun per hit to prevent infinites

    function onHit(attackName, baseDamage, baseHitstun):
        hitCount += 1

        // Damage and hitstun scale down with each hit in a combo
        scaledDamage  = baseDamage * (1.0 - (hitCount - 1) * 0.1)
        scaledHitstun = baseHitstun - (hitCount - 1) * 2

        // Minimum hitstun prevents infinite combos
        scaledHitstun = max(scaledHitstun, MIN_HITSTUN)

        totalDamage += scaledDamage
        currentCombo.append(attackName)

        return { damage: scaledDamage, hitstun: scaledHitstun }

    function onComboDropped():
        // Opponent recovered -- combo is over
        if hitCount > 1:
            displayComboCounter(hitCount, totalDamage)
        reset()

function tryComboCancel(fighter, newAttack):
    currentAttack = fighter.currentAttack
    routes = comboRoutes[currentAttack]

    if newAttack in routes.canCancelInto:
        // Cancel current attack recovery into new attack startup
        fighter.startAttack(newAttack)
        return true
    return false
```

**Hitstun decay** is critical: each successive hit in a combo applies less hitstun, which means eventually the opponent recovers before you can follow up. This creates a natural combo limit and prevents infinite loops.

**Why it matters:** The combo system is a directed acyclic graph (DAG) of valid transitions. Light attacks flow into mediums, mediums into heavies, heavies into specials. Hitstun decay is a natural throttle -- the system progressively limits extended chains to prevent infinite loops. Designing the combo graph is one of the most impactful balance decisions in a fighting game.

---

#### 6. Blocking and Counter-Play

Blocking creates the fighting game's core strategic layer. Without blocking, the game is just "who hits first wins." With blocking, a rock-paper-scissors dynamic emerges:

- **Attacks** beat **throws** (the attack interrupts the throw startup).
- **Throws** beat **blocking** (throws are unblockable).
- **Blocking** beats **attacks** (blocked attacks deal reduced or zero damage).

```
// Block detection: walking backward when an attack connects = blocking
function resolveHit(attacker, defender, hitData):
    if isBlocking(defender, hitData):
        // Blocked -- reduced damage, apply blockstun
        damage = hitData.damage * BLOCK_DAMAGE_RATIO   // e.g., 0.1 (chip damage)
        defender.enterState(BLOCKSTUN, hitData.blockstun)
        return { blocked: true, damage: damage }
    else:
        // Clean hit
        defender.enterState(HITSTUN, hitData.hitstun)
        return { blocked: false, damage: hitData.damage }

function isBlocking(defender, hitData):
    // Must be in a blocking state (holding back)
    if defender.state != WALKING_BACK AND defender.state != CROUCHING:
        return false

    // High/low mixup: block type must match attack type
    if hitData.hitLevel == "low" AND defender.state != CROUCHING:
        return false    // must crouch-block low attacks
    if hitData.hitLevel == "overhead" AND defender.state == CROUCHING:
        return false    // must stand-block overheads

    return true

// Throws: unblockable, but short range and slow startup
function attemptThrow(attacker, defender):
    distance = abs(attacker.x - defender.x)
    if distance > THROW_RANGE:
        return { success: false }   // whiffed throw -- very punishable

    if defender.state == HITSTUN OR defender.state == BLOCKSTUN:
        return { success: false }   // can't throw someone already reeling

    if defender.throwTechWindow > 0:
        return { teched: true }     // defender broke the throw

    return { success: true, damage: THROW_DAMAGE }
```

The high/low **mixup** is key: low attacks must be crouch-blocked, overhead attacks must be stand-blocked. This means the defender must predict the attack type, not just react to it. This prediction layer is what gives fighting games their psychological depth.

**Why it matters:** This is a game-theoretic system with incomplete information under time constraints. The attacker chooses high or low; the defender chooses stand-block or crouch-block. Both choices happen simultaneously. Implementing this teaches you that systems with multiple interacting agents require fundamentally different design thinking than single-agent systems -- both players are constantly adapting to each other's patterns.

---

#### 7. Screen-Relative Facing and Positioning

Fighting game characters must always face each other. When one player crosses over the other (jumps behind them), both characters flip. Attacks, input commands, and hitboxes are all affected by which direction the character faces.

```
function updateFacing(fighter1, fighter2):
    if fighter1.x < fighter2.x:
        fighter1.facing = RIGHT
        fighter2.facing = LEFT
    else:
        fighter1.facing = LEFT
        fighter2.facing = RIGHT

// "Forward" and "back" are relative to facing direction
function resolveDirection(inputDirection, facing):
    if facing == RIGHT:
        return inputDirection           // raw input matches screen direction
    else:
        // Mirror horizontal inputs for left-facing character
        if inputDirection == LEFT:  return FORWARD
        if inputDirection == RIGHT: return BACK
        if inputDirection == DOWN_LEFT:  return DOWN_FORWARD
        if inputDirection == DOWN_RIGHT: return DOWN_BACK
        // ... etc.
    return inputDirection

// Hitboxes must flip based on facing
function worldPosition(fighter, box):
    if fighter.facing == RIGHT:
        return { x: fighter.x + box.x, y: fighter.y + box.y,
                 w: box.w, h: box.h }
    else:
        return { x: fighter.x - box.x - box.w, y: fighter.y + box.y,
                 w: box.w, h: box.h }

// Camera must keep both players in view
function updateCamera(fighter1, fighter2):
    centerX = (fighter1.x + fighter2.x) / 2
    distance = abs(fighter1.x - fighter2.x)
    zoom = clamp(distance / STAGE_WIDTH, MIN_ZOOM, MAX_ZOOM)
    camera.position = centerX
    camera.zoom = zoom
```

Also enforce **stage boundaries**: characters cannot walk past the edges, and the camera constrains the playfield. Corner pressure (trapping your opponent at the edge) is a legitimate strategic tool.

**Why it matters:** Relative coordinate systems are fundamental whenever you have multiple frames of reference. The concept of "forward/back" being contextual (depending on facing direction) means inputs, hitboxes, and animations all need to transform correctly when a character flips. Getting this wrong produces subtle, hard-to-diagnose bugs where attacks whiff in one direction but connect in the other.

---

#### 8. Health Bars and Round Structure

Fighting games are structured as a series of rounds, typically best-of-3. Each round resets position and health but not the match score.

```
class Match:
    bestOf = 3
    roundsToWin = 2     // ceil(bestOf / 2)
    winsP1 = 0
    winsP2 = 0
    currentRound = 1
    roundTimer = 99      // seconds (traditional FGC convention)

    function startRound():
        fighter1.reset(startPositionLeft)
        fighter2.reset(startPositionRight)
        fighter1.health = MAX_HEALTH
        fighter2.health = MAX_HEALTH
        roundTimer = 99
        state = ROUND_INTRO           // "Round 1 -- FIGHT!"

    function updateRound(dt):
        if state == FIGHTING:
            roundTimer -= dt

            if fighter1.health <= 0:
                endRound(winner=fighter2)
            else if fighter2.health <= 0:
                endRound(winner=fighter1)
            else if roundTimer <= 0:
                // Time out -- player with more health wins
                endRound(winner=higherHealth(fighter1, fighter2))

    function endRound(winner):
        state = ROUND_END
        if winner == fighter1:
            winsP1 += 1
        else:
            winsP2 += 1

        if winsP1 >= roundsToWin:
            state = MATCH_OVER     // "Player 1 Wins!"
        else if winsP2 >= roundsToWin:
            state = MATCH_OVER     // "Player 2 Wins!"
        else:
            currentRound += 1
            after ROUND_END_DELAY:
                startRound()

// Health bar rendering
function renderHealthBar(fighter, side):
    healthPercent = fighter.health / MAX_HEALTH
    barWidth = HEALTH_BAR_MAX_WIDTH * healthPercent

    if side == LEFT:
        drawRect(x=MARGIN, y=TOP, width=barWidth, fillFromLeft)
    else:
        drawRect(x=SCREEN_WIDTH - MARGIN - barWidth, y=TOP,
                 width=barWidth, fillFromRight)

    // Show round win indicators (dots or icons)
    for i in 0 to roundsToWin - 1:
        if i < fighter.matchWins:
            drawFilledCircle(...)    // won round
        else:
            drawEmptyCircle(...)     // not yet won
```

The round timer adds urgency: a player with a health lead is incentivized to play defensively and run out the clock, while the losing player must take risks. This creates dynamic strategic shifts within a single round.

**Why it matters:** The match/round structure is a nested state machine -- the match contains rounds, rounds contain gameplay, gameplay contains individual interactions. This hierarchical state management is a pattern you will see in any system with multiple levels of lifecycle, and mastering it here prepares you for tournament brackets, campaign structures, and multiplayer lobby flows.

---

### Stretch Goals

1. **Second playable character** -- a character with different normals, specials, and frame data. Even minor stat differences (faster light attack, slower heavy) create meaningfully different play experiences and test how well your system is data-driven vs. hardcoded.
2. **Basic AI opponent** -- an AI that blocks when the player attacks, punishes unsafe moves (recovery frames > threshold), and performs simple combos. Start with a reactive rule-based system before attempting prediction.
3. **Rollback-style input handling** -- store game state snapshots every frame. When you detect that a "remote" input was late (simulate this with artificial delay), rewind to the snapshot, apply the corrected input, and re-simulate forward. This is the core of rollback netcode and an excellent exercise in deterministic state management.
4. **Hit effects and screen shake** -- freeze both characters for 2-3 frames on hit (called "hitfreeze" or "hitstop") to add impact. Add camera shake proportional to damage. These juice effects transform the game feel without changing mechanics.

---

### MVP Spec

| Element | Requirement |
|---|---|
| Characters | 2 fighters (can be identical stats/moves to start) |
| Attacks | At least 3 normal attacks (light, medium, heavy) with distinct frame data |
| Special moves | At least 1 command-input special move per character (e.g., quarter-circle + button) |
| Hitbox/Hurtbox | Visually debug-toggleable so you can see the boxes during testing |
| State machine | At least 8 states: standing, crouching, jumping, attacking, blocking, hitstun, knockdown, KO |
| Blocking | Hold-back-to-block with at least high/low distinction |
| Combos | At least one 3-hit combo route (e.g., light -> medium -> special) |
| Health bars | Visible for both players, depleting on damage |
| Round structure | Best-of-3 rounds with reset between rounds |
| Round timer | 99-second countdown, time-out awards round to leader |
| Facing | Characters always face each other; crossing over triggers a flip |
| Input | Two-player local input (keyboard split or keyboard + gamepad) |

### Deliverable

A playable two-player fighting game with distinct attack strengths, at least one special move input, blocking, a basic combo route, and a best-of-3 round structure. Submit your project along with the frame data table for your character(s) (listing startup, active, recovery, damage, hitstun, and blockstun for every attack) and a brief write-up (3-5 sentences) describing the biggest state machine challenge you encountered and how you solved it.

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Hitbox/Hurtbox Separation | Separation of concerns like authentication vs. authorization -- different validation layers gating access for different purposes |
| Frame Data and Animation-Driven Gameplay | API SLAs and rate limit cooldowns -- startup latency, processing window, and recovery period before the next request |
| State Machine Depth | Order processing workflows -- an order in SHIPPED state cannot transition to PENDING; strict invariants enforced on every transition |
| Input Command Parsing | Complex event processing (CEP) -- fraud detection rules matching patterns in a sliding time window of events |
| Combo System | Build pipeline stages (compile -> test -> deploy) as a DAG; hitstun decay is backpressure/rate limiting on extended chains |
| Blocking and Counter-Play | Nash equilibrium reasoning in adversarial systems -- auction design, pricing strategy, and security threat modeling |
| Screen-Relative Facing | Coordinate transforms in geofencing and multi-viewport rendering -- relative references that depend on the observer's frame |
| Health Bars and Round Structure | Nested session management: application -> user session -> request -> transaction, each with its own lifecycle |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Hitbox/Hurtbox Separation | Like separating click targets from visual elements -- a button's hover area, visible boundary, and ripple effect are independent layers |
| Frame Data and Animation-Driven Gameplay | CSS animation keyframes with precise timing -- each phase (ease-in, active, ease-out) maps to startup, active, and recovery |
| State Machine Depth | Complex component state like a multi-step form wizard -- each step restricts which transitions are valid (cannot submit before filling required fields) |
| Input Command Parsing | Gesture recognition on touch events -- tracking a sequence of touchstart, touchmove, and touchend within a timing window to detect swipes or pinches |
| Combo System | Chained CSS transitions or animation sequences where each animation triggers the next -- a choreographed UI flow |
| Blocking and Counter-Play | Modal dialogs vs. inline interactions -- choosing which UI pattern to use is a tradeoff with known costs, like blocking vs. attacking |
| Screen-Relative Facing | CSS transforms with `scaleX(-1)` to flip elements; RTL layout support where "forward" and "back" reverse based on reading direction |
| Health Bars and Round Structure | Nested route/view hierarchy -- app layout wraps page layout wraps component state, each with its own mount/unmount lifecycle |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Hitbox/Hurtbox Separation | Separate collision matrices for different interaction types -- like maintaining distinct adjacency matrices for different relationship types in a graph |
| Frame Data and Animation-Driven Gameplay | Time-series windows with defined phases -- similar to defining training, validation, and cooldown periods in an online learning system |
| State Machine Depth | State transitions in a Markov chain with forbidden transitions -- the transition matrix has hard zeros enforcing game rules |
| Input Command Parsing | Sequence pattern detection in time-series data -- sliding window matching like detecting anomaly signatures in streaming sensor data |
| Combo System | DAG-based pipeline orchestration where each stage feeds valid downstream stages; decay is a dampening function on successive iterations |
| Blocking and Counter-Play | Game theory and Nash equilibria in multi-agent reinforcement learning -- each agent's optimal strategy depends on the other's policy |
| Screen-Relative Facing | Coordinate frame transformations like rotating reference frames in robotics or normalizing feature vectors relative to an anchor point |
| Health Bars and Round Structure | Nested cross-validation loops -- outer loop (match) contains inner folds (rounds), each with its own initialization and evaluation |

---

### Discussion Questions

1. **Frame data as a contract:** Every attack publishes its startup, active, and recovery frames -- a public contract that both players can reason about. How is this similar to API contracts and SLAs? What happens to competitive balance when a contract (frame data) changes in a patch?

2. **The input parsing tradeoff:** Strict input parsing (exact motions required) rewards execution skill but frustrates beginners. Lenient parsing (accept approximate motions) is accessible but can cause unintended special moves. How do you tune this? What is the analog in API design -- strict schema validation vs. Postel's Law ("be liberal in what you accept")?

3. **Determinism as a feature:** Fighting games MUST be deterministic -- given the same inputs on the same frame, the result must be identical. This is what makes rollback netcode possible. What other systems require determinism (distributed consensus, event sourcing, simulation testing)? What are the constraints this imposes on your code (no random floats, no frame-rate-dependent logic)?

4. **Balancing a system with interacting agents:** Unlike a single-player game where you balance the player against the environment, a fighting game is balanced player-against-player. If one move is too strong, human opponents will exploit it until the meta warps around it. How is this different from balancing a PvE game? What does the fighting game community's concept of "tiers" teach you about emergent behavior in multi-agent systems?

---
