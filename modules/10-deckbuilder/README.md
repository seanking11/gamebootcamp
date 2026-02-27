# Module 10: Card / Deckbuilder Game

**Weeks 19-20** | *Building and curating a system (your deck) that generates emergent strategy through the random order of card draws.*

---

## Prerequisites

- **Module 1 (Pong):** You need comfort with basic game state management, input handling, and game loop fundamentals.
- **Note:** This module is the most different from all others in the bootcamp. Every previous module has been real-time — continuous input, frame-by-frame physics, spatial collision. This module is **turn-based and UI-heavy**. The gameplay loop is: draw cards, evaluate options, play cards, resolve effects, end turn. The hard part is not the game logic — it is making the cards *feel* good to play through animation and UI.

---

## Week 1: History & Design Theory

### The Origin

**Magic: The Gathering** (Richard Garfield, Wizards of the Coast, 1993) invented the trading card game. Before Magic, games came in a box and every player had the same pieces. Garfield's breakthrough was that the game existed *between* the matches: you built your deck from a personal collection, choosing which cards to include based on strategy, synergy, and resource constraints. The mana system (land cards generate colored mana; spells cost mana) created a resource economy that forced tradeoffs every turn. A deck was not just a collection of powerful cards — it was a *system* with its own internal logic, card ratios, and win conditions. Magic proved that the metagame of construction could be as deep as the game itself, and it spawned an entire industry that continues three decades later.

### How the Genre Evolved

**Hearthstone** (Blizzard, 2014) proved that card games could thrive as digital-first experiences. Where Magic was designed for physical cards and adapted to digital, Hearthstone was built for screens from the start. It simplified Magic's complexity — no instant-speed responses during the opponent's turn, automatic mana growth each turn, a maximum of 7 minions on the board — making it accessible to players who would never walk into a game store. Crucially, Hearthstone demonstrated that digital cards could do things physical cards cannot: generate random outcomes, transform into other cards, create cards that never existed in the collection. The free-to-play model with card pack microtransactions also established the dominant business model for digital card games.

**Slay the Spire** (MegaCrit, 2019) created a new genre by merging deckbuilding with the roguelike structure. Instead of constructing a deck before the game, you *built your deck as you played* — starting with a weak set of basic cards and adding new ones as rewards after each combat encounter. This meant every run was different, and the skill was not just playing cards well but *choosing which cards to add to your deck*. Slay the Spire's key insight was that smaller decks are often better than larger ones — adding a mediocre card dilutes the probability of drawing your powerful cards. This turned deckbuilding into an editing problem: what you leave out matters as much as what you include. The game also introduced the "intent" system, where enemies telegraph their next action, turning combat into a puzzle of resource allocation under uncertainty.

**Balatro** (LocalThunk, 2024) exploded the assumption that deckbuilders need fantasy combat. Built around poker hands — pairs, straights, flushes — with modifier cards (Jokers) that transform scoring rules, Balatro proved that the deckbuilder structure works with *any* card system. It demonstrated that the joy of deckbuilders is not about the theme; it is about building a scoring engine and watching it compound. **Inscryption** (Daniel Mullins, 2021) pushed in a different direction, wrapping a deckbuilder inside a horror narrative that broke the fourth wall and redefined what the "cards" meant as the story progressed. Together, these games show that the deckbuilder format is a container — a structure for emergent system-building that can hold any content.

### What Makes Deckbuilders Great

A great deckbuilder makes you feel like an engineer. Your deck is a machine you are designing under constraints: limited resources to play cards, limited slots in your hand, limited opportunities to add new cards. The randomness of the draw order means your machine never runs exactly the same way twice, so you must build for *resilience* rather than a single perfect sequence. The best deckbuilders create moments where cards you added for different reasons accidentally combine into something powerful — emergent behavior from simple rules. This is the same satisfaction as watching a well-designed software system handle an unexpected edge case gracefully: you built the system well, and it rewarded you with behavior you did not explicitly program.

### The Essential Mechanic

Building and curating a system (your deck) that generates emergent strategy through the random order of card draws.

---

## Week 2: Build the MVP

### What You're Building

A single-player deckbuilder in the style of Slay the Spire: the player fights a series of enemies using a deck of cards, gaining new cards after each victory. Combat is turn-based with an energy system, and enemies telegraph their next action so the player can plan strategically.

### Core Concepts (Must Implement)

#### 1. Deck, Hand, and Discard as Data Structures

The core data model of a deckbuilder is three linked collections: the **draw pile** (a shuffled stack), the **hand** (an ordered array the player can see and interact with), and the **discard pile** (a stack of used cards). Drawing a card pops from the draw pile and pushes to the hand. Playing a card removes it from the hand and pushes to the discard pile. When the draw pile is empty and you need to draw, shuffle the discard pile and it *becomes* the new draw pile.

```
class DeckState:
    drawPile   = []   // Stack — draw from top (LIFO after shuffle)
    hand       = []   // Array — player sees all, selects by index
    discardPile = []  // Stack — played/discarded cards accumulate here

function shuffle(pile):
    // Fisher-Yates shuffle
    for i from pile.length - 1 down to 1:
        j = randomInt(0, i)
        swap(pile[i], pile[j])

function drawCard(state, count):
    for i in range(count):
        if state.drawPile.isEmpty():
            if state.discardPile.isEmpty():
                return  // No cards left anywhere
            state.drawPile = state.discardPile
            state.discardPile = []
            shuffle(state.drawPile)
        card = state.drawPile.pop()
        state.hand.append(card)

function playCard(state, handIndex):
    card = state.hand.removeAt(handIndex)
    state.discardPile.push(card)
    return card

function discardHand(state):
    while state.hand.isNotEmpty():
        state.discardPile.push(state.hand.pop())
```

**Why it matters:** This is a circular buffer system with three stages. Cards flow from draw pile to hand to discard pile, and when the draw pile empties, the discard pile is recycled back. The Fisher-Yates shuffle is also worth knowing -- it is the only correct O(n) shuffling algorithm, and using a naive approach (e.g., sort with random comparator) produces biased distributions. Understanding this cycle is essential because it means every card you add changes the probability of drawing every other card.

#### 2. Card Effect System Using the Command Pattern

Each card is a **command object** with an `execute(gameState)` method. A "Strike" card executes `dealDamage(enemy, 6)`. A "Defend" card executes `gainBlock(player, 5)`. A "Draw Two" card executes `drawCard(state, 2)`. This means cards are data, not code branches — you do not write `if card.name == "Strike"` anywhere.

```
// Card defined as a command object
class Card:
    name        = "Strike"
    cost        = 1           // Energy cost to play
    description = "Deal 6 damage."
    target      = "single_enemy"

    function execute(gameState, target):
        dealDamage(gameState, target, 6)

class DrawTwoCard:
    name        = "Offering"
    cost        = 0
    description = "Draw 2 cards."
    target      = "self"

    function execute(gameState, target):
        drawCard(gameState.deck, 2)

class PoisonCard:
    name        = "Noxious Fumes"
    cost        = 1
    description = "Apply 3 Poison."
    target      = "single_enemy"

    function execute(gameState, target):
        applyStatusEffect(target, "poison", 3)

// Playing a card — the game does not know or care what the card does
function playSelectedCard(gameState, handIndex, target):
    card = gameState.deck.hand[handIndex]
    if gameState.energy >= card.cost:
        gameState.energy -= card.cost
        card.execute(gameState, target)
        gameState.deck.discardPile.push(
            gameState.deck.hand.removeAt(handIndex)
        )
```

**Why it matters:** This is the **Command pattern** -- one of the most important patterns in software engineering. Each card encapsulates an action and its parameters in a self-contained object. The power is extensibility: adding a new card means adding a new class, not modifying a switch statement. This is the same principle behind any plugin system where modules conform to an interface and the host system calls `execute()` without knowing the implementation details.

#### 3. Turn Structure and Phase System

Each turn follows a strict sequence of phases: **Draw Phase** (draw 5 cards) -> **Action Phase** (player plays cards until out of energy or choice) -> **Enemy Intent Phase** (already resolved — enemies declared intent last turn) -> **Enemy Action Phase** (enemies execute their declared intent) -> **Discard Phase** (remaining hand cards go to discard). This is a state machine.

```
// Turn phase state machine
enum TurnPhase:
    DRAW, ACTION, ENEMY_ACTION, DISCARD, CHECK_WIN_LOSS

function advancePhase(gameState):
    switch gameState.phase:
        case DRAW:
            gameState.energy = MAX_ENERGY  // Reset energy
            drawCard(gameState.deck, CARDS_PER_DRAW)
            tickStatusEffects(gameState.player, "turnStart")
            gameState.phase = ACTION
            // Wait for player input — do not auto-advance

        case ACTION:
            // Triggered by player clicking "End Turn"
            gameState.phase = ENEMY_ACTION

        case ENEMY_ACTION:
            for enemy in gameState.enemies:
                executeIntent(enemy, gameState)
                chooseNextIntent(enemy)  // Decide what to telegraph next turn
            gameState.phase = DISCARD

        case DISCARD:
            discardHand(gameState.deck)
            tickStatusEffects(gameState.player, "turnEnd")
            for enemy in gameState.enemies:
                tickStatusEffects(enemy, "turnEnd")
            gameState.phase = CHECK_WIN_LOSS

        case CHECK_WIN_LOSS:
            if gameState.player.hp <= 0:
                triggerGameOver()
            else if allEnemiesDead(gameState):
                triggerVictory()
            else:
                gameState.phase = DRAW
                advancePhase(gameState)  // Auto-advance to next draw
```

**Why it matters:** This is a finite state machine with strict phase ordering. The key insight is that the Action phase is the only phase that waits for external input; all other phases are automatic transitions. The strict ordering prevents an entire class of bugs: you cannot play cards during the enemy phase, you cannot draw during the discard phase. The state machine enforces invariants, and any time you find yourself writing `if (phase != ACTION) return` scattered throughout your code, it is a sign you should centralize that logic in the phase transitions.

#### 4. Energy/Mana Resource System

The player has a limited amount of energy each turn (typically 3). Each card has a cost. Playing a card deducts its cost from available energy. When energy hits zero, the player can still end their turn but cannot play more cards (unless a card costs 0). Energy resets at the start of each turn.

```
// Energy management
gameState.maxEnergy = 3
gameState.energy = gameState.maxEnergy  // Reset each turn

function canPlayCard(gameState, card):
    return gameState.energy >= card.cost

function spendEnergy(gameState, amount):
    assert gameState.energy >= amount
    gameState.energy -= amount
    // Update UI to reflect remaining energy
```

**Why it matters:** This is a resource budgeting system. Each turn, the player has a budget (energy) and must decide how to allocate it across competing demands (attack, defense, card draw, buff). The strategic depth comes from scarcity: if every card cost 0, there would be no decisions. Constraints create gameplay. The energy system also interacts with deck composition -- a deck full of expensive cards will waste energy on turns when you only draw one playable card.

#### 5. Enemy Intent / Telegraph System

Enemies declare what they will do *next* turn, and this information is visible to the player. An enemy might show a sword icon with "12" (it will attack for 12 damage next turn) or a shield icon (it will defend). The player uses this information to decide: do I play defensive cards to absorb the incoming 12 damage, or do I go all-in on attack hoping to kill the enemy before it strikes?

```
// Enemy intent system
class Enemy:
    hp = 40
    block = 0
    intent = null       // What I will do this turn
    statusEffects = {}

function chooseNextIntent(enemy):
    // Simple pattern: alternate attack and defend
    // More complex: weighted random, HP-threshold behavior
    roll = random()
    if roll < 0.6:
        enemy.intent = { type: "attack", value: 12, icon: "sword" }
    else if roll < 0.85:
        enemy.intent = { type: "defend", value: 8, icon: "shield" }
    else:
        enemy.intent = { type: "buff", value: 3, effect: "strength", icon: "flame" }

function executeIntent(enemy, gameState):
    switch enemy.intent.type:
        case "attack":
            damage = calculateDamage(enemy.intent.value, enemy, gameState.player)
            applyDamage(gameState.player, damage)
        case "defend":
            enemy.block += enemy.intent.value
        case "buff":
            addStatusEffect(enemy, enemy.intent.effect, enemy.intent.value)
```

**Why it matters:** This is **information design** -- deliberately exposing internal state to an external actor so they can make informed decisions. The intent system transforms combat from a guessing game into a planning puzzle. Without it, the player cannot make strategic decisions -- they are just gambling. With it, every turn becomes a resource allocation problem with known constraints. The principle holds broadly: the more visible a system's state, the better decisions its users can make.

#### 6. UI-Driven Gameplay

This is the first module where the **UI is the gameplay**, not just a HUD overlay. The player interacts with cards visually: cards fan out in the hand, hovering over a card shows its details, clicking or dragging a card plays it. Targeting requires selecting an enemy. The layout of cards, enemies, and UI elements *is* the game board.

```
// Card hand layout (fan arrangement)
function layoutHand(hand, screenWidth, handY):
    cardWidth = 120
    maxSpread = screenWidth * 0.6
    totalWidth = min(hand.length * cardWidth, maxSpread)
    spacing = totalWidth / max(hand.length - 1, 1)
    startX = (screenWidth - totalWidth) / 2

    for i, card in enumerate(hand):
        card.x = startX + i * spacing
        card.y = handY
        // Fan angle: cards at edges are slightly rotated
        centerIndex = (hand.length - 1) / 2
        card.rotation = (i - centerIndex) * FAN_ANGLE_PER_CARD

        // Hover: lift the card up and enlarge it
        if card.isHovered:
            card.y -= HOVER_LIFT
            card.scale = 1.3
            card.zIndex = 100  // Draw on top of other cards

// Card play interaction
function onCardClicked(gameState, card):
    if not canPlayCard(gameState, card):
        showMessage("Not enough energy")
        return
    if card.target == "single_enemy":
        gameState.targetingMode = true
        gameState.selectedCard = card
        // Wait for enemy click
    else:
        executeCardPlay(gameState, card, null)

function onEnemyClicked(gameState, enemy):
    if gameState.targetingMode:
        executeCardPlay(gameState, gameState.selectedCard, enemy)
        gameState.targetingMode = false
        gameState.selectedCard = null
```

**Why it matters:** In every previous module, the game state was rendered as sprites in a spatial world and the player interacted through real-time controls (move, jump, shoot). In a deckbuilder, the player interacts through **UI components** — clickable cards, hover states, targeting cursors. This is essentially building an interactive application where the UI *is* the game. State management, event handlers, conditional rendering, and z-index stacking are all critical. The card fan layout is also a good exercise in procedural UI layout -- computing positions and rotations mathematically rather than placing elements manually.

#### 7. Status Effects and Modifier Stacking

Status effects like Poison, Strength, Vulnerability, and Block are **stateful modifiers** attached to an entity (player or enemy). They have a value, an optional duration, and stacking rules. When damage is dealt, the calculation passes through a chain of modifiers: base damage -> modified by attacker's Strength -> modified by target's Vulnerability -> reduced by target's Block.

```
// Status effect system
class StatusEffect:
    name = "poison"
    value = 3           // Stacks: applying 3 more poison adds to value
    duration = null     // Poison is permanent until cleansed; others may have duration

function applyStatusEffect(target, effectName, value):
    if effectName in target.statusEffects:
        target.statusEffects[effectName].value += value  // Stack
    else:
        target.statusEffects[effectName] = StatusEffect(effectName, value)

// Damage calculation pipeline
function calculateDamage(baseDamage, attacker, target):
    damage = baseDamage

    // Attacker modifiers
    if "strength" in attacker.statusEffects:
        damage += attacker.statusEffects["strength"].value

    // Target modifiers
    if "vulnerable" in target.statusEffects:
        damage = floor(damage * 1.5)

    return max(damage, 0)

function applyDamage(target, damage):
    // Block absorbs damage first
    if target.block > 0:
        absorbed = min(target.block, damage)
        target.block -= absorbed
        damage -= absorbed

    target.hp -= damage

// Tick effects at end of turn
function tickStatusEffects(entity, phase):
    if phase == "turnEnd":
        if "poison" in entity.statusEffects:
            entity.hp -= entity.statusEffects["poison"].value
            entity.statusEffects["poison"].value -= 1
            if entity.statusEffects["poison"].value <= 0:
                delete entity.statusEffects["poison"]

        // Block resets at start of turn (not end)
    if phase == "turnStart":
        entity.block = 0
```

**Why it matters:** This is a **modifier pipeline**. Damage enters as a raw value and passes through a chain of transformations (strength adds, vulnerability multiplies, block subtracts) before reaching the final target. Each modifier is independent and composable. The stacking rules are a state accumulation problem: applying the same effect multiple times must have well-defined behavior (additive? multiplicative? max-of?). Getting these rules wrong produces subtle bugs that are hard to reproduce and often discovered only when multiple effects interact in untested combinations.

#### 8. Reward and Deck Growth

After winning a combat, the player is offered a choice of 3 new cards to add to their deck (or skip). This is the **draft** mechanic — the moment where the player shapes their deck's strategy. The critical design insight is that *adding a card is not always good*. Every card you add dilutes your draw probability for every other card. A focused 15-card deck that draws its key combo every 3 turns is often stronger than a bloated 30-card deck that never finds the right card.

```
// Post-combat reward system
function generateRewardCards(playerClass, combatDifficulty):
    cardPool = getCardsForClass(playerClass)

    // Weight by rarity: common 60%, uncommon 30%, rare 10%
    // Higher difficulty encounters shift weights toward rarer cards
    weights = adjustWeightsByDifficulty(BASE_WEIGHTS, combatDifficulty)

    rewards = []
    for i in range(3):
        rarity = weightedRandomChoice(["common", "uncommon", "rare"], weights)
        card = randomChoice(cardPool.filter(c => c.rarity == rarity))
        rewards.append(card)

    return rewards

function presentRewardScreen(gameState, rewards):
    // Player sees 3 cards and can pick one or skip
    gameState.phase = REWARD_SELECTION
    gameState.rewardOptions = rewards
    // Wait for player input

function onRewardSelected(gameState, chosenCard):
    if chosenCard != null:  // null means skip
        gameState.deck.discardPile.push(chosenCard)  // Added to discard, drawn later
    advanceToNextCombat(gameState)
```

**Why it matters:** This is a **system design decision with probability implications**. Adding a card to your deck changes the statistical distribution of every future draw. The "skip" option is the most interesting design element -- sometimes the best decision is to *not* add something, even if it looks appealing in isolation. A focused deck that reliably draws its key cards is often stronger than a bloated deck with more raw options. This is a lesson in restraint that applies far beyond card games.

### Stretch Goals

1. **Card upgrades:** Allow the player to upgrade a card at rest sites (e.g., "Strike" becomes "Strike+" dealing 9 instead of 6). This requires a card mutation or card-variant system — each card definition has a base and upgraded version.
2. **Relics / passive items:** Persistent items that modify rules globally (e.g., "Start each combat with 1 extra energy," "Whenever you play 3 attacks in a turn, draw a card"). These are event listeners attached to the game's event bus.
3. **Card removal:** Allow the player to remove a card from their deck at a shop or event, making the deck leaner. This directly surfaces the "smaller decks are better" strategic lesson.
4. **Multiple enemy encounters:** Fights with 2-3 enemies simultaneously, requiring area-of-effect cards and target prioritization decisions.

### MVP Spec

| Element | Requirement |
|---|---|
| **Deck** | Starting deck of 10 cards (5 Strikes, 5 Defends) with draw pile, hand, and discard pile |
| **Card types** | At least 5 distinct cards: attack, defend, card draw, buff, and debuff |
| **Command pattern** | Cards execute effects through a shared interface, not conditional branches |
| **Turn structure** | Draw -> Action -> Enemy Action -> Discard phases as a state machine |
| **Energy** | 3 energy per turn; cards cost 1-3 energy; energy resets each turn |
| **Enemy intent** | Enemies display their next action; at least 3 different intent types |
| **Enemies** | At least 3 sequential combat encounters with different enemies |
| **UI** | Cards displayed as a hand fan; click or drag to play; hover to inspect |
| **Targeting** | Single-target cards require clicking an enemy to select the target |
| **Status effects** | At least 3 status effects (e.g., Poison, Strength, Vulnerable) with stacking |
| **Damage pipeline** | Damage modified by attacker buffs, target debuffs, and block in correct order |
| **Rewards** | After each combat, choose 1 of 3 cards to add (or skip) |
| **Win/Lose** | Player wins by defeating all encounters; loses if HP reaches 0 |

### Deliverable

A playable single-player deckbuilder with at least 3 combat encounters, a working card effect system using the Command pattern, a turn-based phase state machine, an enemy intent system, and post-combat card rewards. The UI must support card selection from a hand, energy tracking, and status effect display. Submit the project along with a brief writeup (3-5 sentences) explaining your card effect architecture and how you would extend it to support 50+ unique cards without modifying existing code.

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Deck, Hand, and Discard | Message processing pipeline -- draw pile is the message queue, hand is the processing buffer, discard pile is the completed queue; recycling is connection pool rotation |
| Card Effect System (Command Pattern) | Job queue workers -- each job encapsulates its own execution logic; also database migrations with `up`/`down` methods |
| Turn Structure and Phase System | Order processing state machine (placed -> paid -> shipped -> delivered) or CI/CD pipeline (build -> test -> deploy) with sync and async steps |
| Energy/Mana Resource System | API rate limiting -- N requests per time window; also scheduler CPU budgets and cloud cost caps |
| Enemy Intent / Telegraph System | Health check endpoints and observability dashboards -- exposing internal state so operators can make informed decisions |
| UI-Driven Gameplay | Admin dashboard or form-heavy CRUD UI -- state management, event handlers, conditional rendering, and validation |
| Status Effects and Modifier Stacking | Express.js / Django middleware pipeline -- each middleware transforms the request/response; stacking rules mirror transaction isolation levels |
| Reward and Deck Growth | A/B test variant management -- adding a new variant changes probabilities for all others; dependency management where each addition changes the system's risk profile |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Deck, Hand, and Discard | State management with multiple collections -- like a Redux store with `queue`, `active`, and `archive` slices that cards cycle through |
| Card Effect System (Command Pattern) | React component render props or Vue slots -- each card is a self-contained component with its own render and behavior logic |
| Turn Structure and Phase System | Multi-step wizard or checkout flow -- each step enables specific interactions and disables others based on the current phase |
| Energy/Mana Resource System | Budget-constrained UI like a drag-and-drop dashboard with limited widget slots -- users allocate finite space across competing widgets |
| Enemy Intent / Telegraph System | Tooltip previews and hover states -- showing what will happen before the user commits to an action |
| UI-Driven Gameplay | This IS frontend development -- card fan layout uses CSS transforms/rotations, hover states lift cards with transitions, z-index manages stacking, and drag-and-drop APIs handle targeting |
| Status Effects and Modifier Stacking | CSS cascade and specificity -- multiple style rules (modifiers) stacking on an element in a defined priority order |
| Reward and Deck Growth | Feature toggles in a UI -- adding a new toggle increases the combinatorial state space the UI must handle |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Deck, Hand, and Discard | Sampling without replacement from a finite population -- the draw pile is the remaining sample space, and reshuffling resets the distribution |
| Card Effect System (Command Pattern) | Pluggable transform functions in a data pipeline -- each card is a transformation applied to the game state tensor |
| Turn Structure and Phase System | DAG-based pipeline orchestration (Airflow, Prefect) -- tasks execute in strict phase order with defined dependencies |
| Energy/Mana Resource System | Compute budget in optimization -- limited function evaluations per iteration, like Bayesian optimization with a fixed query budget |
| Enemy Intent / Telegraph System | Observable state in a simulation -- the intent system provides partial observability, turning the problem into a POMDP (partially observable Markov decision process) |
| UI-Driven Gameplay | Interactive data visualization dashboards (Plotly, Streamlit) -- state-driven rendering with click handlers and hover tooltips |
| Status Effects and Modifier Stacking | Feature transformation pipeline -- base value passes through a chain of vectorized operations (add strength, multiply vulnerability, subtract block) |
| Reward and Deck Growth | Adding features to a model -- each new card changes the probability distribution of draws, just as each new feature changes the model's decision boundary and increases dimensionality |

---

### Discussion Questions

1. **The Command pattern makes cards data-driven.** How would you implement a card that says "Deal damage equal to the number of cards in your discard pile"? What about "Copy the last card you played and play it again"? Where does the Command pattern break down, and how would you handle these edge cases?

2. **Smaller decks are often better than larger decks.** This is counterintuitive — more options should be better, right? How does this map to software architecture? When has adding a feature, dependency, or service made your system *worse* overall?

3. **The damage calculation pipeline passes through multiple modifiers.** What happens when you need to add a new modifier that interacts with existing ones (e.g., "double all Poison damage")? How do you manage ordering and priority? How does this compare to middleware ordering issues in backend frameworks?

4. **Enemy intent gives the player perfect information about the next turn but uncertainty about the turn after.** How does this balance of known and unknown information create strategic depth? Where in backend engineering do you deliberately expose partial information (e.g., rate limit headers, retry-after, health check responses)?

---
