# Module 24: Auto-Battler
**Strategic drafting meets hands-off combat | Digital Chess Club**
> "The fight is already over before it begins. Your job was five minutes ago."

---

## Prerequisites

- **Module 6: Tower Defense** -- You will need a solid understanding of wave-based pacing, spatial placement on a grid, and how entities interact without direct player control during execution phases. Tower defense taught you that where you place things matters; auto-battlers make that the entire game.
- **Module 10: Deckbuilder** -- The shop-and-draft loop in auto-battlers is a close cousin of deckbuilding. You will rely on your understanding of random offers, synergy construction, and the tension between building toward a plan and adapting to what is available.

---

## Week 1: History & Design Theory

### The Origin

The auto-battler genre emerged almost fully formed in January 2019 when a team of modders released *Dota Auto Chess* as a custom game mode inside Dota 2. Players drafted heroes from a shared pool, placed them on an 8x8 chessboard grid, and watched them fight automatically against other players' boards. Within weeks it had millions of daily players. The game fused the character-collecting satisfaction of gacha games with the positional strategy of chess and the economic pressure of poker. What made it revolutionary was the realization that combat itself did not need to be interactive -- all the meaningful decisions happened before the fight, in the draft and the positioning. The genre proved that a game could feel intensely competitive even when the player never presses a button during the action phase.

### How the Genre Evolved

- **Dota Auto Chess (2019)** -- The original mod that defined the genre. Eight players share a unit pool, spend gold in a shop to buy and upgrade heroes, place them on a grid, and watch rounds of automated combat. It established the core loop of draft-position-fight and introduced the economic system of saving gold for interest. Its rough edges and mod-based limitations inspired multiple studios to build standalone versions.

- **Teamfight Tactics (Riot Games, 2019)** -- Riot's response launched within months and brought the genre to a massive audience through the League of Legends client. TFT refined the item system (combining component items into completed items), introduced the carousel round (a shared draft where players physically move to grab units), and polished the synergy system with clear trait thresholds. It proved the genre could sustain a live-service model with rotating sets that completely change the unit roster every few months.

- **Super Auto Pets (2021)** -- A radical simplification that stripped the genre to its essence. Units are animals arranged in a single line instead of a grid. There are no items to combine, no carousel rounds, no hexes to worry about. What remains is pure draft economics and synergy construction. Its success demonstrated that the core auto-battler loop -- buy, arrange, watch, adapt -- is compelling even without the complexity that earlier entries assumed was necessary.

### What Makes It "Great"

A great auto-battler creates a constant tension between commitment and flexibility. Every round, the shop offers you a small random selection of units, and you must decide: do you buy that unit to chase a powerful synergy, or save your gold to earn interest for a stronger economy later? Do you commit to a strategy early and risk getting outbid for key units, or stay flexible and risk having a weak, unfocused team? The best auto-battlers make every single gold piece feel meaningful. They reward deep knowledge of the unit pool and synergy interactions while still generating novel situations through randomness. The automated combat is not a gimmick -- it is the design insight that lets the game focus entirely on the decisions that matter: resource allocation, risk assessment, and spatial reasoning.

### The Essential Mechanic

Drafting and positioning units that fight automatically -- strategy is in preparation, not execution.

---

## Week 2: Build the MVP

### What You're Building

A single-player auto-battler where you face a series of increasingly difficult AI opponents. Each round, you spend gold to buy units from a randomized shop, place them on a small grid, and watch them fight the enemy team automatically. Units of the same type grant synergy bonuses when you field enough of them. You can reroll the shop for new options, save gold to earn interest, and upgrade units by collecting duplicates. The game ends when you lose all your health or defeat the final wave.

### Core Concepts

**1. Draft / Shop System**

The shop presents a random selection of units each round. The player spends gold to buy units and can pay to reroll for a new selection. This is where the majority of strategic decisions happen.

```
SHOP_SIZE = 5
REROLL_COST = 2

function generate_shop(tier_odds, unit_pool):
    shop = []
    for i in 0..SHOP_SIZE:
        tier = weighted_random(tier_odds)          // e.g., {1: 70%, 2: 25%, 3: 5%}
        available = unit_pool.filter(u => u.tier == tier AND u.copies_remaining > 0)
        unit = random_choice(available)
        shop.append(unit)
    return shop

function buy_unit(player, shop_index):
    unit = shop[shop_index]
    if player.gold >= unit.cost:
        player.gold -= unit.cost
        add_to_bench(player, unit)
        shop[shop_index] = EMPTY
        check_for_upgrade(player, unit.type)

function reroll_shop(player):
    if player.gold >= REROLL_COST:
        player.gold -= REROLL_COST
        return_units_to_pool(current_shop)
        player.shop = generate_shop(tier_odds_for_level(player.level), unit_pool)
```

*Why it matters:* The shop is the primary interface between randomness and player agency. Every auto-battler lives or dies by how its shop feels. Too random and players feel helpless; too predictable and there is no adaptation. The reroll mechanic gives players a pressure valve -- they can spend resources to fight bad luck, but at a cost.

**2. Synergy / Tribal Bonuses**

Units belong to one or more types (tribes, traits, origins). When you field enough units of the same type, the entire team receives a bonus. Thresholds create breakpoints that drive drafting decisions.

```
synergy_definitions = {
    "warrior": {2: {armor: +5}, 4: {armor: +15}, 6: {armor: +25}},
    "mage":    {2: {spell_power: +20}, 4: {spell_power: +50}},
    "beast":   {2: {attack_speed: +15%}, 4: {attack_speed: +30%}}
}

function calculate_active_synergies(board_units):
    type_counts = {}
    for unit in board_units:
        for type in unit.types:
            type_counts[type] = type_counts.get(type, 0) + 1

    active_buffs = []
    for type, count in type_counts:
        thresholds = synergy_definitions[type].keys().sort(descending)
        for threshold in thresholds:
            if count >= threshold:
                active_buffs.append(synergy_definitions[type][threshold])
                break   // only highest reached threshold applies
    return active_buffs

function apply_synergies(board_units, active_buffs):
    for unit in board_units:
        for buff in active_buffs:
            unit.stats = unit.stats.merge(buff)     // add bonus stats
```

*Why it matters:* Synergies transform the draft from "pick the strongest individual unit" into "build a team that is greater than the sum of its parts." The threshold system (2/4/6) creates natural decision points: do you splash two warriors for a small bonus or commit to six for a massive one? This is the system that gives each game a unique strategic identity.

**3. Board Placement Strategy**

Before combat begins, the player arranges their units on a grid. Where a unit stands determines who it fights first, who it protects, and whether it survives long enough to use its abilities.

```
BOARD_ROWS = 4
BOARD_COLS = 7

function place_unit(player, unit, row, col):
    if row < 0 OR row >= BOARD_ROWS OR col >= BOARD_COLS:
        return false
    if board[row][col] is not EMPTY:
        return false
    board[row][col] = unit
    unit.position = {row, col}
    return true

function get_frontline_units(board):
    // units in the rows closest to the enemy
    return board.filter(u => u.position.row == 0 or u.position.row == 1)

function get_backline_units(board):
    return board.filter(u => u.position.row == 2 or u.position.row == 3)

// placement heuristic: tanks in front, damage dealers in back
function auto_place(player):
    tanks = player.units.filter(u => u.role == "tank").sort_by(hp, descending)
    damage = player.units.filter(u => u.role == "damage").sort_by(attack, descending)
    place_in_rows(tanks, rows=[0, 1])       // front rows
    place_in_rows(damage, rows=[2, 3])      // back rows
```

*Why it matters:* Placement is the spatial puzzle within the auto-battler. Two players with identical units and synergies will get different results based on positioning. Putting a fragile damage dealer in the front row means it dies immediately; hiding it in a corner means it might never get attacked. This is where the "chess" in auto chess comes from.

**4. Automated Combat Resolution**

Once the player finalizes their board, combat plays out without any input. Units select targets based on simple rules (nearest enemy, lowest HP enemy), attack on cooldowns, and use abilities when their mana is full.

```
function resolve_combat(team_a, team_b):
    all_units = team_a + team_b
    for unit in all_units:
        unit.current_hp = unit.max_hp
        unit.mana = 0

    while team_a.has_living_units() AND team_b.has_living_units():
        for unit in all_units.sort_by(attack_speed):
            if unit.is_dead(): continue

            target = find_target(unit, get_enemies(unit))
            if target == null: continue

            if not in_range(unit, target):
                move_toward(unit, target)
            else:
                damage = calculate_damage(unit.attack, target.armor)
                target.current_hp -= damage
                unit.mana += MANA_PER_ATTACK

                if unit.mana >= unit.max_mana:
                    cast_ability(unit, get_enemies(unit))
                    unit.mana = 0

                if target.current_hp <= 0:
                    mark_dead(target)

    return {winner: surviving_team(), damage: count_surviving_units(winner)}

function find_target(unit, enemies):
    living = enemies.filter(e => e.is_alive())
    return living.sort_by(distance_to(unit)).first()    // nearest enemy
```

*Why it matters:* Automated combat is the defining feature of the genre. By removing execution from the player's hands, the game shifts all skill expression to preparation. The combat system must be readable -- the player needs to watch a fight, understand why they lost, and know what to change. Simple targeting rules (nearest enemy) create emergent complexity when combined with positioning.

**5. Shared Pool Drafting**

All players draw from the same finite pool of units. When one player buys a unit, there are fewer copies available for everyone else. This creates indirect competition during the draft phase.

```
function initialize_unit_pool():
    pool = {}
    for unit_type in all_unit_types:
        // higher-tier units have fewer copies
        copies = {1: 29, 2: 22, 3: 16, 4: 12, 5: 10}
        pool[unit_type] = copies[unit_type.tier]
    return pool

function buy_from_pool(pool, unit_type):
    if pool[unit_type] > 0:
        pool[unit_type] -= 1
        return unit_type
    return null     // no copies left

function return_to_pool(pool, unit_type):
    pool[unit_type] += 1    // when player sells or is eliminated

// scouting: check what opponents are building
function contested_types(opponents):
    counts = {}
    for opponent in opponents:
        for unit in opponent.board + opponent.bench:
            counts[unit.type] = counts.get(unit.type, 0) + 1
    return counts.sort_by(value, descending)
```

*Why it matters:* The shared pool transforms what could be a solo optimization puzzle into a competitive resource game. If three players are all building "mage" synergy, the mage units become scarce and expensive to find. Smart players scout opponents and pivot to uncontested strategies. For the MVP, you can simulate this with a single shared pool that an AI opponent also draws from.

**6. Economy Management**

Gold is earned each round from a base income, interest on savings, and win/loss streak bonuses. The interest system creates a fundamental tension: spend now for power or save for compound returns.

```
BASE_INCOME = 5
INTEREST_RATE = 0.1      // 10% of saved gold
MAX_INTEREST = 5          // cap at 50 gold saved
STREAK_BONUS = {0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5+: 3}

function calculate_round_income(player):
    base = BASE_INCOME
    interest = min(floor(player.gold * INTEREST_RATE), MAX_INTEREST)
    streak = STREAK_BONUS[player.current_streak_length]
    bonus = 1 if player.won_last_round else 0
    return base + interest + streak + bonus

function end_of_round(player):
    player.gold += calculate_round_income(player)

// economic strategy: "econ" vs "aggro"
// econ:  save to 50 gold quickly, earn 5 interest per round, level slowly
// aggro: spend everything each round, reroll aggressively, win through early power
```

*Why it matters:* The economy system is what gives auto-battlers their strategic depth beyond the draft. Interest on saved gold means that every purchase has a hidden cost: the future interest you will not earn. A player who saves to 50 gold quickly earns 5 bonus gold per round -- but they also have a weaker board and may lose health. This creates distinct strategic archetypes (greedy vs aggressive) and forces constant cost-benefit evaluation.

**7. Round Structure**

The game progresses through a sequence of rounds: PvE rounds against neutral creeps, PvP rounds against other players' boards, and special rounds like carousels. Each round has a preparation phase and a combat phase.

```
round_sequence = [
    {type: "pve", enemies: creep_wave_1},    // round 1
    {type: "pve", enemies: creep_wave_2},    // round 2
    {type: "pve", enemies: creep_wave_3},    // round 3
    {type: "pvp"},                            // round 4+
    // every N rounds: carousel or special event
]

function run_round(round, player):
    // PREPARATION PHASE (timed)
    player.shop = generate_shop(...)
    start_timer(PREP_TIME)                   // 30 seconds for MVP
    // player buys, sells, places units during this time
    wait_for_timer_or_ready()

    // COMBAT PHASE
    if round.type == "pve":
        enemy_board = round.enemies
    else:
        enemy_board = select_opponent(player).board.clone()

    result = resolve_combat(player.board, enemy_board)

    if result.winner != player:
        player.hp -= result.damage

    update_streak(player, result.winner == player)
    end_of_round(player)

    if player.hp <= 0:
        game_over(player)
```

*Why it matters:* The round structure provides rhythm and pacing. PvE rounds at the start give players time to learn the systems without competitive pressure. The preparation-then-combat loop creates a heartbeat: tension as you scramble to improve your board, then release as you watch the fight play out. The timed preparation phase prevents analysis paralysis and forces gut decisions.

### Stretch Goals

- **Unit upgrades:** Buying three copies of the same unit automatically combines them into a stronger two-star version. Three two-stars combine into a three-star. This adds a collecting dimension to the draft.
- **Item system:** Defeated PvE rounds drop items that can be equipped on units, granting bonus stats or special abilities. Item combinations add another layer of optimization.
- **Multiple opponents:** Expand from one AI opponent to a full lobby of simulated opponents, each with their own AI strategy and board, all drawing from the shared pool.
- **Carousel round:** A special round where units with items circle on a conveyor belt and each player picks one. Lower-health players pick first, providing a catch-up mechanic.

### MVP Spec

| Element | Scope |
|---|---|
| Grid | 4x7 board for the player, mirrored for the opponent |
| Units | 8-10 unit types across 3 tiers and 3-4 synergy types |
| Shop | 5 slots, reroll for 2 gold, refreshes each round |
| Economy | Base income + interest (10%, capped at 5) + streak bonus |
| Synergies | 3-4 types with 2/4 thresholds |
| Combat | Automated: nearest-target, attack on cooldown, abilities at full mana |
| Opponent | 1 AI opponent with a pre-built or randomly drafted board that scales per round |
| Rounds | 3 PvE rounds then PvP rounds until one side reaches 0 HP |
| Health | Player starts at 100 HP, loses HP equal to surviving enemy units on a loss |
| Win condition | Survive all rounds or reduce AI opponent's HP to 0 |
| Rendering | 2D grid view with unit icons, synergy panel, shop panel, gold display |

### Deliverable

A playable single-player auto-battler with a shop phase where you buy units from a randomized selection, place them on a grid, and watch automated combat resolve against an AI opponent. The game must include at least three synergy types with visible bonuses, an economy system with interest on saved gold, and a clear win/loss state. The player should be able to complete a full game in under 15 minutes.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Draft / Shop System | Like a service registry where available instances are drawn from a pool -- each request depletes availability, rerolling is re-querying with a cost |
| Synergy / Tribal Bonuses | Like middleware chains that activate only when enough compatible services are registered -- reaching a threshold enables a new capability across the system |
| Board Placement Strategy | Like configuring load balancer topology -- placing heavy-duty services in front to absorb traffic while fragile workers stay behind |
| Automated Combat Resolution | Like a CI/CD pipeline executing after you commit -- you set up the conditions and watch the system run, intervening only in the next cycle |
| Shared Pool Drafting | Like a connection pool shared across microservices -- one service hogging connections starves the others, and you must monitor contention |
| Economy Management | Like capacity planning with compound returns -- investing in infrastructure now reduces future costs, but over-investing means you cannot handle current load |
| Round Structure | Like a cron-scheduled batch processing pipeline -- each cycle has distinct phases (ingest, process, report) that must complete in order |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Draft / Shop System | Like a component marketplace where you browse available UI widgets, purchase the ones you need, and refresh the listing to see new options |
| Synergy / Tribal Bonuses | Like CSS utility classes that stack -- applying enough "flex" utilities triggers a layout bonus, and crossing a threshold activates a whole new behavior |
| Board Placement Strategy | Like CSS Grid layout -- you are positioning elements into specific grid cells and the arrangement determines how they interact visually and functionally |
| Automated Combat Resolution | Like the browser render pipeline after you commit DOM changes -- you set up the state and the engine resolves layout, paint, and composite without further input |
| Shared Pool Drafting | Like a shared npm registry with version limits -- if another team locks a package version, fewer are available for you |
| Economy Management | Like a performance budget -- you can spend rendering time now for visual richness or save it for smoother interactions later, and overspending compounds into jank |
| Round Structure | Like the React lifecycle -- mount (preparation), render (combat), and cleanup (round end) phases repeat in a predictable cycle |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Draft / Shop System | Like hyperparameter search with a budget -- each evaluation costs compute, rerolling is re-sampling the search space, and you are optimizing under constraints |
| Synergy / Tribal Bonuses | Like feature interactions in a model -- individual features are useful, but specific combinations produce non-linear boosts to prediction power |
| Board Placement Strategy | Like feature vector ordering in a sequence model -- the spatial arrangement of inputs affects how the model processes and weights them |
| Automated Combat Resolution | Like launching a training run -- you configure the hyperparameters and architecture, hit start, and observe the loss curve without intervening |
| Shared Pool Drafting | Like a shared GPU cluster -- other teams' jobs compete for the same resources, and scheduling decisions affect everyone's throughput |
| Economy Management | Like compute budget allocation across experiments -- saving budget for later enables larger runs, but spending early may find a good result faster |
| Round Structure | Like an epoch-based training loop -- each epoch consists of forward pass, loss calculation, and backpropagation in a fixed sequence |

---

## Discussion Questions

1. **The Preparation Paradox:** Auto-battlers remove all player input during combat, yet players report feeling more responsible for outcomes than in games where they control every action. Why does limiting agency during execution increase the feeling of ownership over results? How does this compare to other systems where you "set and forget" (CI pipelines, automated trading, scheduled jobs)?

2. **Economic Depth vs. Accessibility:** The interest-on-gold system creates rich strategic depth (econ vs aggro playstyles), but it is also the single hardest concept for new players to grasp. If you had to teach economy management without a tutorial, how would you design the UI and feedback systems so players discover the interest mechanic naturally?

3. **The Shared Pool Problem:** In a multiplayer auto-battler, the shared unit pool creates fascinating emergent competition -- but in a single-player MVP, there is only one opponent drawing from the pool. How do you simulate the competitive pressure of a full lobby? Is it better to fake it (hidden draws from the pool) or simplify it (separate pools)?

4. **Randomness as Content:** Auto-battlers generate replayability almost entirely through randomness in the shop. The unit roster and synergies stay the same, but each game feels different because of what the shop offers. How much randomness is enough to create variety, and at what point does it feel like the game is playing you instead of the other way around?
