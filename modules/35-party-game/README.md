# Module 35: Party Game
**Build a game that turns a room full of people into a room full of rivals | The More the Merrier**
> "A great party game makes strangers into friends and friends into enemies -- temporarily."
---

## Prerequisites

- **Module 1: Pong** -- You need a working game loop and basic input handling. Party games extend this to multiple simultaneous players and rapid game-switching.

## Week 1: History & Design Theory

### The Origin

The party game genre was born from a simple observation: the best moments in gaming happen when people are in the same room laughing at each other. In 1998, Nintendo released **Mario Party** for the N64, packaging dozens of simple mini-games inside a board game wrapper. The individual games were trivial -- mash a button, steer a character, time a jump -- but the social layer transformed them. Winning a mini-game was not about mastery; it was about the look on your friend's face when you stole their star. Mario Party proved that games did not need deep mechanics to create deep experiences. They needed an audience, shared stakes, and low enough barriers that anyone could pick up a controller and compete within seconds.

### How the Genre Evolved

- **Mario Party (Nintendo, 1998)** -- Established the template: a meta-game (board game) that hosts a rotating selection of mini-games. Mario Party's genius was the variety. No single mini-game lasted more than 60 seconds, so even losing felt temporary. The board game layer added strategy and drama between rounds. Crucially, it proved that asymmetric skill -- where one player is great at action games but terrible at memory games -- kept the playing field level and the competition social.

- **Jackbox Party Pack (Jackbox Games, 2014)** -- Revolutionized input by letting players use their phones as controllers. This removed the hardware barrier entirely: no extra controllers, no split-screen squinting, and support for up to 8 or more players. Jackbox also shifted the genre toward creativity and humor (drawing games, joke games, bluffing games) rather than reflexes, broadening the audience far beyond traditional gamers. The "audience" feature let spectators participate, blurring the line between player and viewer.

- **Among Us (InnerSloth, 2018/2020)** -- While technically a social deduction game, Among Us functioned as a party game phenomenon. It demonstrated that party games could work over the internet, not just in living rooms. Its simple art style, minimal mechanics, and emphasis on voice chat conversation showed that the social interaction was the game. Among Us proved the genre could scale to global audiences and that streamers and viewers could share the party game experience remotely.

### What Makes It "Great"

A great party game is one where the worst player in the room is still having the best time. Rules must be learnable in seconds -- if you need to explain for more than 30 seconds, the game has already failed. The skill ceiling should be low enough that newcomers can win, but high enough that experienced players can show off. Rounds must be short so that losing stings for only a moment before the next chance arrives. And the game must create stories: the time someone won by accident, the impossible comeback, the betrayal in round five. These stories -- not scores -- are what make people want to play again. The framework matters more than any individual mini-game because it provides the structure that turns chaos into memorable moments.

### The Essential Mechanic

Variety and social interaction -- the framework that hosts many simple games is the game.

---

## Week 2: Build the MVP

### What You're Building

A party game shell that supports 2-4 players on a shared screen, with a lobby system for joining, a rotation of 3 mini-games, cumulative scoring across rounds, and a results screen. Each mini-game has distinct rules and mechanics, but they share a common input system and scoring interface. The framework handles transitions, scoring, and player management so that adding a new mini-game requires minimal boilerplate.

### Core Concepts

**1. Mini-game Framework**

The framework is the real product. It manages game state, loads and unloads mini-games, passes player data between them, and handles the lifecycle (intro, play, results) for each round. Individual mini-games are plugins that conform to a shared interface.

```
// Mini-game interface that all games must implement
interface MiniGame:
    function getName() -> string
    function getRules() -> string          // one-sentence description
    function getMaxDuration() -> seconds
    function initialize(players[]) -> void
    function update(deltaTime, inputs[]) -> void
    function render(screen) -> void
    function isFinished() -> boolean
    function getResults() -> PlayerResult[] // [{playerId, score, rank}]
    function cleanup() -> void

// Framework game loop
class PartyGameFramework:
    miniGames = [ButtonMashGame, DodgeGame, CollectGame]
    currentRound = 0
    cumulativeScores = {}

    function startRound():
        game = selectNextMiniGame()
        showRulesScreen(game.getName(), game.getRules(), duration: 3 seconds)
        game.initialize(players)
        runGameLoop(game)
        results = game.getResults()
        updateCumulativeScores(results)
        game.cleanup()
        showRoundResults(results, cumulativeScores)
        currentRound += 1

    function selectNextMiniGame():
        // Avoid repeats, optionally randomize
        available = miniGames.filter(g => g != lastPlayedGame)
        return random(available)
```

**Why it matters:** Without a clean framework, adding a new mini-game means duplicating scoring logic, input handling, and transition code every time. The framework is what makes a party game scalable -- you can ship with 3 mini-games and grow to 30 without rewriting the shell.

**2. Multi-player Input Handling**

Multiple players need distinct inputs on the same device. This means splitting the keyboard into zones, supporting multiple controllers, or using networked devices (phones) as controllers. The input system must map physical inputs to abstract player actions.

```
// Input mapping for shared keyboard
INPUT_MAPS:
    player1: { left: "A", right: "D", up: "W", down: "S", action: "Space" }
    player2: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp",
               down: "ArrowDown", action: "Enter" }
    player3: { left: "J", right: "L", up: "I", down: "K", action: "H" }
    player4: { left: "Numpad4", right: "Numpad6", up: "Numpad8",
               down: "Numpad2", action: "Numpad0" }

// Abstract input system
class InputManager:
    function getPlayerInput(playerId) -> PlayerInput:
        mapping = INPUT_MAPS[playerId]
        return PlayerInput(
            horizontal: isKeyDown(mapping.right) - isKeyDown(mapping.left),
            vertical:   isKeyDown(mapping.up) - isKeyDown(mapping.down),
            action:     isKeyPressed(mapping.action)
        )

    // Alternative: controller support
    function getPlayerInputFromGamepad(playerId) -> PlayerInput:
        pad = getGamepad(playerId)
        return PlayerInput(
            horizontal: pad.leftStick.x,
            vertical:   pad.leftStick.y,
            action:     pad.buttonA.pressed
        )
```

**Why it matters:** If two players press keys at the same time and the game only registers one, the experience breaks. Input handling must be simultaneous, responsive, and clearly mapped so players know which keys are theirs without confusion.

**3. Shared-Screen Multiplayer**

All players see the same screen. The camera or view must accommodate everyone, whether they are in the same area or spread across the play field. This includes split-screen as a fallback and HUD elements that are readable from couch distance.

```
// Option A: Single camera that frames all players
function updateCamera(players[]):
    // Find bounding box of all players
    minX = min(p.x for p in players) - PADDING
    maxX = max(p.x for p in players) + PADDING
    minY = min(p.y for p in players) - PADDING
    maxY = max(p.y for p in players) + PADDING

    centerX = (minX + maxX) / 2
    centerY = (minY + maxY) / 2

    // Zoom out to fit all players
    requiredWidth = maxX - minX
    requiredHeight = maxY - minY
    zoom = min(SCREEN_WIDTH / requiredWidth, SCREEN_HEIGHT / requiredHeight)
    zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM)

    camera.setPosition(centerX, centerY)
    camera.setZoom(zoom)

// Option B: Fixed arena (no camera movement needed)
// Many party mini-games use a fixed-size arena that fits on screen
ARENA = Rectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

// HUD: player indicators visible at distance
function drawPlayerHUD(players[]):
    for each player in players:
        drawColoredArrow(above: player.position, color: player.color)
        drawScoreCorner(corner: player.index, score: player.score)
```

**Why it matters:** Shared-screen is what makes a party game a party. Everyone sees the same thing at the same time, which means reactions are shared, trash talk is immediate, and spectators can follow along. The camera must never lose a player or make the action too small to read.

**4. Round / Turn Rotation**

The game cycles through mini-games, managing transitions between rounds. Each round has phases: rules display, countdown, gameplay, and results. The framework controls pacing so the energy stays high.

```
// Round state machine
ROUND_PHASES: RULES_DISPLAY -> COUNTDOWN -> PLAYING -> ROUND_OVER -> SCORES

class RoundManager:
    phase = RULES_DISPLAY
    timer = 0

    function update(deltaTime):
        timer -= deltaTime
        switch phase:
            case RULES_DISPLAY:
                showRulesOverlay(currentGame.getRules())
                if timer <= 0:
                    phase = COUNTDOWN
                    timer = 3  // "3... 2... 1... GO!"

            case COUNTDOWN:
                showCountdown(ceil(timer))
                if timer <= 0:
                    phase = PLAYING
                    timer = currentGame.getMaxDuration()
                    currentGame.initialize(players)

            case PLAYING:
                currentGame.update(deltaTime, inputs)
                if timer <= 0 OR currentGame.isFinished():
                    phase = ROUND_OVER
                    timer = RESULTS_DISPLAY_TIME

            case ROUND_OVER:
                results = currentGame.getResults()
                showRoundResults(results)
                if timer <= 0:
                    phase = SCORES
                    timer = SCORES_DISPLAY_TIME
                    updateCumulativeScores(results)

            case SCORES:
                showCumulativeScores()
                if timer <= 0:
                    advanceToNextRound()
```

**Why it matters:** Pacing is everything in a party game. The countdown builds anticipation. The rules screen prevents confusion. The results screen creates celebration (or groaning). Without managed transitions, the game feels like a janky playlist instead of a curated experience.

**5. Lobby / Player Join System**

Before the game starts, players must be able to join, choose a color or avatar, and signal they are ready. The lobby handles variable player counts and ensures everyone is set before the first round begins.

```
class Lobby:
    players = []
    MAX_PLAYERS = 4
    MIN_PLAYERS = 2

    function update(inputs):
        // Listen for new players pressing their "join" key
        for each mapping in INPUT_MAPS:
            if isKeyPressed(mapping.action) AND mapping.playerId NOT in players:
                newPlayer = Player(
                    id: mapping.playerId,
                    color: assignNextColor(),
                    ready: false
                )
                players.add(newPlayer)
                showJoinAnimation(newPlayer)

        // Existing players can toggle ready
        for each player in players:
            if isKeyPressed(player.mapping.action):
                player.ready = NOT player.ready

        // Check start conditions
        if players.length >= MIN_PLAYERS AND allPlayersReady(players):
            startCountdown()

    function render():
        for i in range(MAX_PLAYERS):
            if i < players.length:
                drawPlayerSlot(i, players[i].color, players[i].ready)
            else:
                drawEmptySlot(i, "Press [key] to join!")

        if allReady:
            drawStartPrompt("Starting in 3...")
```

**Why it matters:** The lobby is the first impression. A confusing join process kills the energy before the game even starts. It must be instant, visual, and foolproof -- press a button, see yourself appear on screen, press again to ready up. No menus, no text entry, no friction.

**6. Scoring / Ranking Across Rounds**

Cumulative scoring tracks performance across all mini-games and determines the overall winner. The scoring system must feel fair, create drama, and keep trailing players in contention.

```
class ScoringSystem:
    cumulativeScores = { playerId: 0 for each player }
    roundHistory = []

    function scoreRound(results):
        roundScores = {}
        // Award points based on placement
        PLACEMENT_POINTS = [10, 6, 3, 1]  // 1st, 2nd, 3rd, 4th

        sortedResults = sortByScore(results, descending)
        for i, result in enumerate(sortedResults):
            points = PLACEMENT_POINTS[i]
            cumulativeScores[result.playerId] += points
            roundScores[result.playerId] = points

        roundHistory.append(roundScores)

    // Optional: rubber banding to keep it competitive
    function applyRubberBanding():
        leader = getMaxScore(cumulativeScores)
        trailer = getMinScore(cumulativeScores)
        gap = leader - trailer
        if gap > RUBBER_BAND_THRESHOLD:
            // Give trailing players a bonus multiplier next round
            for playerId, score in cumulativeScores:
                if score < leader:
                    deficit = leader - score
                    bonusMultiplier[playerId] = 1 + (deficit / leader) * 0.5

    function getFinalRankings():
        return sortByScore(cumulativeScores, descending)

    function render():
        drawPodium(getFinalRankings())  // visual ranking display
        drawScoreGraph(roundHistory)     // line chart of scores over rounds
```

**Why it matters:** If the winner is obvious by round 3 of 7, the remaining players check out. Good scoring systems keep everyone in contention. Placement-based points (instead of raw scores) compress the gap. Optional rubber-banding or "bonus star" mechanics create come-from-behind moments that make the final round matter.

**7. Accessibility of Rules**

Rules must be learned in seconds, not minutes. Visual tutorials, animated demonstrations, and one-sentence descriptions replace text-heavy instruction screens. If a player does not understand the rules, it is the game's fault.

```
// Rule communication hierarchy
function showMiniGameRules(game):
    // Layer 1: One-sentence text
    drawCenteredText(game.getRules())
    // e.g., "Collect the most coins!" or "Last one standing wins!"

    // Layer 2: Animated visual demo (3-second loop)
    playRuleAnimation(game.getRuleAnimation())
    // Show AI players demonstrating the mechanic

    // Layer 3: Visual input prompt
    drawInputHint(game.getControls())
    // Show the actual keys/buttons with arrows

// Design rules for rule design:
RULES_GUIDELINES:
    - Maximum 1 sentence of text
    - The goal must be obvious from the visual (collect, avoid, reach)
    - Use color and shape to communicate (green = good, red = bad)
    - First 5 seconds of gameplay should teach by doing
    - No fail state in the first 3 seconds (grace period)

// In-game affordances
function drawGameplayHints(game, player):
    if game.elapsedTime < HINT_DURATION:
        drawArrowToward(player, game.getObjective())   // "go here"
        pulseHighlight(game.getInteractables())         // "touch these"
```

**Why it matters:** The defining constraint of party games is that a new player must understand what to do immediately. Every second spent explaining rules is a second of lost momentum. A great party game teaches through play, not through reading. If your playtesters ask "what do I do?" the design has failed.

### Stretch Goals

- Add a 4th and 5th mini-game to the rotation.
- Implement phone-as-controller input using a local web server and WebSockets.
- Add character/avatar selection in the lobby.
- Create a "board game" meta-layer between mini-game rounds (spaces, events, items).
- Add an audience mode where spectators can vote to influence mini-games.
- Implement replay/highlight clips after dramatic round endings.

### MVP Spec

| Element | Scope |
|---|---|
| **Players** | 2-4 players on shared keyboard (or controllers) |
| **Lobby** | Join screen with press-to-join, color assignment, ready-up |
| **Mini-games** | 3 distinct mini-games: one reflex-based, one collection-based, one avoidance-based |
| **Round structure** | Rules display (3s) -> Countdown (3s) -> Gameplay (15-30s) -> Results (5s) |
| **Scoring** | Placement-based points per round, cumulative leaderboard, final results screen |
| **Game length** | 5-7 rounds total, rotating through the mini-game pool |
| **Mini-game interface** | Each game implements initialize, update, render, isFinished, getResults |
| **Visual clarity** | Distinct player colors, large text readable from couch distance, animated transitions |
| **Input** | Abstract input system supporting keyboard zones (controller optional) |
| **Audio cues** | Countdown beeps, round-start fanfare, victory jingle (sound effects optional but encouraged) |

### Deliverable

A playable party game framework with a lobby where 2-4 players join via shared keyboard, a rotation of 3 mini-games with distinct mechanics, smooth transitions between rounds with rule displays and countdowns, cumulative scoring across all rounds, and a final results screen showing the winner. A playtester who has never seen the game should be able to join and play a mini-game without verbal instruction.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Mini-game framework | Like a plugin architecture or middleware pipeline -- the shell defines the lifecycle, and each mini-game is a plugin that conforms to a contract |
| Multi-player input handling | Like handling concurrent requests from multiple clients -- each player is an independent input stream that must be processed simultaneously without blocking |
| Shared-screen multiplayer | Like a shared database dashboard -- all clients see the same real-time state, and the view must accommodate all active entities |
| Round / turn rotation | Like a job scheduler rotating through a task queue -- each round is a job with defined phases (setup, execute, teardown) |
| Lobby / player join system | Like service discovery and health checks -- nodes register themselves, signal readiness, and the system waits for quorum before proceeding |
| Scoring / ranking across rounds | Like aggregation queries across multiple tables -- accumulating metrics from independent events into a final ranking |
| Accessibility of rules | Like writing API documentation with clear examples -- if the consumer (player) cannot understand the interface in seconds, adoption fails |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Mini-game framework | Like a component library with a consistent API -- each mini-game is a component with props (players), lifecycle hooks (init, update, cleanup), and render methods |
| Multi-player input handling | Like handling multiple touch points simultaneously on a multi-touch screen -- each input must be tracked independently and mapped to the correct action |
| Shared-screen multiplayer | Like responsive design for a dashboard that must display all widgets at once without scroll -- everything must fit and remain readable |
| Round / turn rotation | Like a multi-step wizard or onboarding flow -- each step has a defined sequence, transitions, and progress indicators |
| Lobby / player join system | Like a real-time collaborative editing lobby (e.g., Google Docs join screen) -- users appear as they connect and signal ready |
| Scoring / ranking across rounds | Like a real-time analytics dashboard with cumulative charts -- data flows in per round and the visualization updates progressively |
| Accessibility of rules | Like UX writing and microcopy -- the interface must communicate its purpose instantly through visual hierarchy, not through manuals |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Mini-game framework | Like an ML experiment framework (MLflow, Weights & Biases) -- each experiment (mini-game) follows a protocol but has unique parameters and logic |
| Multi-player input handling | Like processing multiple data streams in parallel -- each stream (player) has its own schema but feeds into a shared processing pipeline |
| Shared-screen multiplayer | Like a shared monitoring dashboard for a cluster -- all nodes are visible, and the view auto-scales to fit the active set |
| Round / turn rotation | Like cross-validation folds -- each round is an independent evaluation, and the overall score is aggregated across all folds |
| Lobby / player join system | Like distributed worker registration in a compute cluster -- workers join, signal availability, and the coordinator waits for minimum quorum |
| Scoring / ranking across rounds | Like model leaderboard scoring across multiple benchmarks -- each benchmark (round) contributes to an overall ranking with weighted aggregation |
| Accessibility of rules | Like writing clear docstrings for a function -- the purpose, inputs, and outputs should be obvious from a glance, not from reading the source |

---

## Discussion Questions

1. **The "Mario Kart problem":** Party games often include catch-up mechanics (blue shells, rubber-banding) that help trailing players stay competitive. This makes the game more fun for groups but less rewarding for skilled players. How do you balance competitive integrity with social fun? Should the best player always win?

2. **Designing for the non-gamer:** Your player base includes people who rarely play games. How does this constraint shape input design, rule communication, and game duration? What mechanics work for a mixed group of gamers and non-gamers that would not work for an all-gamer group?

3. **The framework vs. the content:** Is the value of a party game in the framework (lobby, scoring, transitions) or in the individual mini-games? Could a polished framework with 3 mediocre mini-games be more fun than a rough framework with 10 excellent ones?

4. **Remote party games:** Among Us and Jackbox proved party games can work online, but something is lost without the shared physical space. What specific design changes would you make to preserve the "party" feel when players are on a video call instead of a couch?
