# Module 25: 4X Strategy
**Explore, expand, exploit, exterminate -- civilization in miniature | One More Turn**
> "A great empire, like a great cake, is most easily diminished at the edges."

---

## Prerequisites

- **Module 22 (RTS) or Module 23 (TBS)** -- You will need familiarity with either real-time or turn-based strategic decision-making, unit management, and resource systems. 4X games are turn-based at their core, but the macro-level thinking from either module transfers directly. Understanding how to manage multiple objectives across a map is essential.
- **Module 6: Tower Defense (for economy)** -- The economic systems in tower defense -- income per wave, spending on defenses vs. saving for upgrades -- lay the groundwork for the much deeper per-turn economy in 4X. You will extend those principles to tile yields, city production, and maintenance costs.

---

## Week 1: History & Design Theory

### The Origin

The 4X genre gets its name from the four verbs that define it: explore, expand, exploit, exterminate. Coined by Alan Emrich in a 1993 review of *Master of Orion*, the label describes games where you guide a civilization from a single settlement to dominance over an entire world (or galaxy). The genre's roots stretch back to board games like *Civilization* (1980) and early computer games like *Empire* (1977), but it was Sid Meier's *Civilization* (1991) that established the template nearly every 4X game has followed since: a procedurally generated map, fog of war, technology research, city management, diplomacy, and multiple victory conditions. What makes 4X endure is its promise of consequence. Every decision -- where to found a city, which technology to research, whether to ally with or invade a neighbor -- echoes across hundreds of turns. The genre is famous for the "one more turn" compulsion: the feeling that you are always on the verge of something important.

### How the Genre Evolved

- **Civilization IV (Firaxis, 2005)** -- Widely regarded as the most refined entry in the series at the time of its release. Civ IV perfected the core loop of settling cities, researching technologies, and managing diplomacy. It introduced religion as a soft-power system, great people as milestone rewards, and civic policies that let players customize their government. Its lasting contribution was proving that a 4X game could be deeply complex without being impenetrable -- clear UI, detailed tooltips, and the Civilopedia in-game encyclopedia became industry standards.

- **Stellaris (Paradox Interactive, 2016)** -- Moved the 4X formula into real-time with pause, blending grand strategy with space exploration. Stellaris showed that the 4X loop works in a continuous time model, not just turn-based. More importantly, it introduced emergent storytelling through event chains, anomalies, and crisis events that made each playthrough feel like a unique science fiction narrative. It demonstrated that 4X games could be as much about the stories they generate as the systems they simulate.

- **Humankind (Amplitude Studios, 2021)** -- Challenged the Civilization formula by letting players change their civilization's culture every era, mixing and matching historical bonuses. Its territory system -- where outposts grow into cities that claim adjacent regions -- offered a fresh take on expansion. While it received mixed reviews for balance, it pushed the genre to reconsider fundamental assumptions about what a 4X game must be, proving the design space still has room for innovation.

### What Makes It "Great"

A great 4X game makes you feel like every decision matters -- not just now, but fifty turns from now. The interlocking systems (economy, military, research, diplomacy) create a web where pulling one thread tugs on all the others. Building a military costs production that could have gone toward infrastructure; researching weapons means delaying economic technologies; expanding aggressively angers neighbors who might have been trade partners. The best 4X games present you with a constant stream of meaningful trade-offs disguised as simple choices. "Where should I build my second city?" sounds straightforward until you realize the answer depends on resources, defensibility, rival proximity, terrain bonuses, and long-term strategic goals. This depth is what creates the "one more turn" phenomenon -- there is always another decision to make, another consequence to see unfold.

### The Essential Mechanic

Managing an empire across multiple interconnected systems where every choice has long-term consequences.

---

## Week 2: Build the MVP

### What You're Building

A miniature 4X game played on a small hex map. You start with one settler unit and must found a city, explore the map, research technologies, manage your economy, and achieve a victory condition -- all in about 30 minutes of play time. Think of this as "4X in miniature": a tiny map (maybe 10x10 hexes), one or two resources, a tech tree with 8-12 nodes, one AI opponent, and two victory conditions. The goal is to capture the essential 4X loop -- the feeling that every turn presents a meaningful choice -- without the hundred-hour scope of a full Civilization game.

### Core Concepts

**1. Hex Grid System**

Hex grids are the foundation of nearly every modern 4X game. Hexes have six equidistant neighbors (unlike squares, which have diagonal adjacency problems), making distance calculations uniform and movement intuitive. Cube coordinates are the cleanest way to do hex math.

```
// Cube coordinates: each hex has (q, r, s) where q + r + s = 0
class HexCoord:
    q, r, s    // constraint: q + r + s == 0

function hex_distance(a, b):
    return max(abs(a.q - b.q), abs(a.r - b.r), abs(a.s - b.s))

function hex_neighbors(hex):
    directions = [
        {+1, -1, 0}, {+1, 0, -1}, {0, +1, -1},
        {-1, +1, 0}, {-1, 0, +1}, {0, -1, +1}
    ]
    return [HexCoord(hex.q + d.q, hex.r + d.r, hex.s + d.s) for d in directions]

function hex_to_pixel(hex, size):
    x = size * (3/2 * hex.q)
    y = size * (sqrt(3)/2 * hex.q + sqrt(3) * hex.r)
    return {x, y}

function pixel_to_hex(x, y, size):
    q = (2/3 * x) / size
    r = (-1/3 * x + sqrt(3)/3 * y) / size
    return cube_round(q, r, -q - r)     // round to nearest hex
```

*Why it matters:* Hex math is the skeleton of the entire game. Every system -- movement, territory, fog of war, combat range -- builds on hex distance and neighbor calculations. Cube coordinates eliminate the offset-grid headaches that plague square grids and make algorithms like pathfinding, range queries, and line-of-sight calculations clean and predictable. Get this right and everything else is easier.

**2. City / Settlement Founding and Territory**

Cities are the economic engine of a 4X game. When a settler founds a city, it claims the surrounding hexes as its territory. Each hex provides yields (food, production, gold) based on its terrain. The city grows and its borders expand as its culture increases.

```
INITIAL_BORDER_RADIUS = 1     // city claims 1-ring of hexes at founding
MAX_BORDER_RADIUS = 3

class City:
    position: HexCoord
    territory: Set<HexCoord>
    population: int = 1
    food_stockpile: float = 0
    culture: float = 0
    buildings: list = []

function found_city(player, settler_unit, hex):
    city = City(position=hex)
    city.territory = hexes_in_range(hex, INITIAL_BORDER_RADIUS)
    player.cities.append(city)
    remove_unit(settler_unit)
    // mark territory hexes as owned by this player
    for tile in city.territory:
        tile.owner = player

function process_city_turn(city):
    yields = sum(get_tile_yield(tile) for tile in city.territory)
    city.food_stockpile += yields.food - city.population     // food minus consumption
    if city.food_stockpile >= growth_threshold(city.population):
        city.population += 1
        city.food_stockpile = 0
    city.culture += yields.culture
    if city.culture >= border_expansion_cost(city):
        expand_borders(city)      // add adjacent unclaimed hexes

function get_tile_yield(tile):
    base = terrain_yields[tile.terrain]    // e.g., grassland: {food:2, prod:1}
    bonus = resource_bonus(tile.resource)  // e.g., wheat: {food:+1}
    return base + bonus
```

*Why it matters:* Cities turn the hex map from a static landscape into a contested economic engine. The founding decision is one of the most consequential in the game: a city placed on a river with wheat and hills will outperform one on desert for the entire game. Territory creates natural borders and conflict zones. This is where the "expand" in 4X becomes tangible -- every new city is a bet on a piece of land paying off over dozens of turns.

**3. Tech Tree / Research System**

Players spend accumulated science points to unlock technologies. Each technology takes multiple turns to research and may unlock new buildings, units, or abilities. The tree has branching paths so players must prioritize.

```
tech_tree = {
    "agriculture":  {cost: 20, prereqs: [],              unlocks: ["granary"]},
    "mining":       {cost: 20, prereqs: [],              unlocks: ["mine"]},
    "bronze_working":{cost: 40, prereqs: ["mining"],     unlocks: ["warrior"]},
    "writing":      {cost: 40, prereqs: ["agriculture"], unlocks: ["library"]},
    "mathematics":  {cost: 60, prereqs: ["writing"],     unlocks: ["walls"]},
    "iron_working": {cost: 80, prereqs: ["bronze_working"], unlocks: ["swordsman"]},
    "astronomy":    {cost: 100, prereqs: ["mathematics", "mining"], unlocks: ["science_victory"]}
}

function start_research(player, tech_name):
    tech = tech_tree[tech_name]
    if all(prereq in player.researched for prereq in tech.prereqs):
        player.current_research = tech_name
        player.research_progress = 0

function process_research(player):
    if player.current_research == null: return
    science_per_turn = sum(city.science_output for city in player.cities)
    player.research_progress += science_per_turn
    if player.research_progress >= tech_tree[player.current_research].cost:
        player.researched.add(player.current_research)
        apply_unlocks(player, tech_tree[player.current_research].unlocks)
        player.current_research = null
```

*Why it matters:* The tech tree is the strategic backbone of a 4X game. It forces long-term planning: researching military technology means delaying economic improvements. The branching structure means two players starting with the same map and resources will diverge based on their research choices. In the MVP, a compact tree of 8-12 technologies is enough to create meaningful choices without overwhelming the player.

**4. Diplomacy Basics**

AI opponents have attitudes toward the player based on game events. Actions like expanding near their borders or building a large military change their disposition. Diplomacy enables trade deals and alliance offers -- or provokes war.

```
ATTITUDE_THRESHOLDS = {friendly: 50, neutral: 0, hostile: -50}

class AIPlayer:
    attitude_toward: dict = {}    // player_id -> int

function update_attitude(ai, player, event):
    modifiers = {
        "settled_near_border": -20,
        "declared_war": -50,
        "trade_deal": +15,
        "gifted_gold": +10,
        "military_buildup": -10,
        "shared_enemy": +20
    }
    ai.attitude_toward[player.id] += modifiers.get(event, 0)
    clamp(ai.attitude_toward[player.id], -100, 100)

function ai_diplomacy_decision(ai, player):
    attitude = ai.attitude_toward[player.id]
    if attitude >= ATTITUDE_THRESHOLDS.friendly:
        maybe_propose_trade(ai, player)
    elif attitude <= ATTITUDE_THRESHOLDS.hostile:
        if ai.military_strength > player.military_strength * 0.8:
            declare_war(ai, player)
    // neutral: do nothing, watch and wait

function propose_trade(ai, player):
    // simple: exchange gold per turn for resources
    offer = {gives: {gold_per_turn: 5}, wants: {resource: "iron"}}
    present_trade_to_player(player, offer)
```

*Why it matters:* Diplomacy transforms the AI from a faceless obstacle into a character with motivations. Even a simple attitude system (a single number that goes up or down based on your actions) creates meaningful moments: "I want to settle near that iron deposit, but the AI has territory nearby and is already nervous about my expansion." For the MVP, a single AI opponent with basic attitude tracking is enough to add this dimension.

**5. Turn-Based Macro Economy**

Each turn, every city generates yields from its tiles: food for population growth, production for building things, gold for maintenance and purchasing, science for research. The economy operates at a per-turn granularity with income and expenses.

```
function process_economy(player):
    total_income = 0
    total_expenses = 0

    for city in player.cities:
        yields = calculate_city_yields(city)
        city.food_stockpile += yields.food - (city.population * FOOD_PER_POP)
        city.production_stockpile += yields.production
        total_income += yields.gold

    // maintenance costs
    for unit in player.units:
        total_expenses += unit.maintenance_cost
    for city in player.cities:
        for building in city.buildings:
            total_expenses += building.maintenance_cost

    player.gold += total_income - total_expenses
    if player.gold < 0:
        // deficit: units disband or buildings shut down
        disband_most_expensive_unit(player)
        player.gold = 0

function calculate_city_yields(city):
    base = sum(get_tile_yield(tile) for tile in city.worked_tiles)
    // buildings modify yields
    for building in city.buildings:
        base = building.apply_modifier(base)   // e.g., library: +2 science
    return base
```

*Why it matters:* The economy is what connects every other system. Military units cost gold to maintain, so a large army is a constant drain. Buildings cost production to build and gold to maintain. Expanding to new cities increases income but also increases expenses. This creates the fundamental 4X tension: growth has costs, and unchecked expansion can bankrupt an empire. The per-turn model makes consequences visible -- you can see exactly how each decision changes your bottom line.

**6. Victory Conditions**

Multiple victory conditions give players different strategic goals to pursue. Each condition is checked at the start of every turn. Having more than one victory path means the player (and the AI) must decide which to pursue and which to defend against.

```
victory_conditions = {
    "domination": {
        check: (player, game) => all other players have 0 cities
    },
    "science": {
        check: (player, game) => "astronomy" in player.researched
                                 AND player.has_built("space_program")
    },
    "culture": {
        check: (player, game) => player.total_culture >= CULTURE_VICTORY_THRESHOLD
    }
}

function check_victory(game):
    for player in game.players:
        for name, condition in victory_conditions:
            if condition.check(player, game):
                return {winner: player, type: name}
    return null

function end_of_turn(game):
    result = check_victory(game)
    if result:
        display_victory_screen(result.winner, result.type)
        end_game()
    else:
        // also check defeat
        for player in game.players:
            if len(player.cities) == 0 AND len(player.units) == 0:
                eliminate_player(player)
```

*Why it matters:* Multiple victory conditions are what make 4X strategy truly strategic. A player pursuing a science victory must still maintain enough military to not be conquered. A domination player must be aware that a quiet opponent might be about to win through culture. Victory conditions turn the game from a single optimization problem into a multi-axis competition where you must balance offense, defense, and development simultaneously.

**7. Fog of War at Civilization Scale**

The map starts unexplored (black). As units move, they reveal terrain around them. Explored but unoccupied areas become "shrouded" -- you can see the terrain but not current enemy positions. Only areas within vision range of your units and cities show real-time information.

```
VISION_RANGE_UNIT = 2
VISION_RANGE_CITY = 3

enum TileVisibility: UNEXPLORED, SHROUDED, VISIBLE

function update_fog_of_war(player, hex_map):
    // reset all visible tiles to shrouded (keep explored status)
    for tile in hex_map:
        if tile.visibility[player] == VISIBLE:
            tile.visibility[player] = SHROUDED

    // mark tiles around units and cities as visible
    visible_sources = player.units + player.cities
    for source in visible_sources:
        range = VISION_RANGE_CITY if source is City else VISION_RANGE_UNIT
        for hex in hexes_in_range(source.position, range):
            tile = hex_map.get(hex)
            if tile:
                tile.visibility[player] = VISIBLE
                // first-time exploration
                if tile.exploration_state[player] == UNEXPLORED:
                    tile.exploration_state[player] = EXPLORED
                    reveal_terrain(player, tile)

function render_tile(tile, player):
    if tile.visibility[player] == UNEXPLORED:
        draw_black()
    elif tile.visibility[player] == SHROUDED:
        draw_terrain_darkened(tile.terrain)       // no units shown
    else:
        draw_terrain(tile.terrain)
        draw_units(tile.units)
        draw_improvements(tile.improvements)
```

*Why it matters:* Fog of war creates information asymmetry -- the most important ingredient in strategic tension. You know your opponent expanded east because you saw it three turns ago, but you do not know if they have since built an army there. This uncertainty forces scouting, drives paranoia, and makes diplomacy meaningful (you must sometimes trust what you cannot verify). At the civilization scale, fog of war also makes exploration genuinely exciting: every revealed hex might contain a critical resource, a natural wonder, or a hostile neighbor.

### Stretch Goals

- **Multiple AI opponents:** Add a second AI player to create three-way diplomatic dynamics (alliances against the leader, two-front wars, betrayals).
- **Unit combat system:** Implement simple combat between military units with rock-paper-scissors unit types (spearmen beat cavalry, cavalry beat archers, archers beat spearmen).
- **City production queue:** Let cities queue multiple buildings and units for construction, automatically starting the next item when the current one finishes.
- **Map generation:** Procedurally generate the hex map with continents, oceans, mountains, and resource placement using noise functions.

### MVP Spec

| Element | Scope |
|---|---|
| Map | 10x10 hex grid with 3-4 terrain types (grassland, hills, forest, water) |
| Resources | 2 resource types (e.g., iron, wheat) placed on specific hexes |
| Cities | Found cities with settlers, cities claim surrounding hexes, population grows from food |
| Tech tree | 8-12 technologies in a branching tree, each unlocking a building or unit |
| Economy | Per-turn yields: food, production, gold, science. Maintenance costs for units and buildings |
| Diplomacy | 1 AI opponent with attitude tracking (friendly/neutral/hostile), basic trade offers |
| Victory | 2 conditions: domination (capture all enemy cities) and science (research final tech + build project) |
| Fog of war | Unexplored/shrouded/visible states, units and cities provide vision range |
| Units | 3 types: settler (founds cities), warrior (fights), scout (explores with extended vision) |
| Turns | Full turn cycle: move units, manage cities, process economy, check victory |
| Rendering | 2D hex grid with terrain colors, unit icons, city markers, fog overlay, and a simple HUD for yields |

### Deliverable

A playable miniature 4X game on a hex map where you found cities, research technologies, manage an economy, interact with one AI opponent through basic diplomacy, and pursue one of two victory conditions. A complete game should take approximately 30 minutes. The player must be able to feel the core 4X loop: explore the map, expand with new cities, exploit resources through buildings and research, and exterminate (or outpace) the AI opponent.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Hex Grid System | Like a distributed hash ring -- nodes are evenly spaced, each responsible for a region, and neighbor lookups use consistent coordinate math |
| City / Settlement Founding | Like provisioning a new server in a region -- it claims resources, serves nearby requests, and has ongoing operational costs |
| Tech Tree / Research | Like a dependency graph in a build system -- you cannot build a target until its prerequisites are satisfied, and choosing what to build first determines your capabilities |
| Diplomacy Basics | Like API rate limiting with reputation -- well-behaved clients get higher quotas, abusive ones get throttled, and the relationship is tracked with a rolling score |
| Turn-Based Macro Economy | Like a billing system with per-cycle invoicing -- each cycle tallies income from services, subtracts infrastructure costs, and a negative balance triggers resource reclamation |
| Victory Conditions | Like SLA compliance checks -- multiple metrics are evaluated each cycle, and meeting any one of several thresholds triggers a state change (alert, promotion, termination) |
| Fog of War | Like service discovery with TTL -- known endpoints go stale if not refreshed, and you only have real-time status for services you are actively monitoring |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Hex Grid System | Like a CSS hex grid layout -- each cell has a defined position, neighbors are calculated from coordinates, and pixel placement follows a mathematical formula |
| City / Settlement Founding | Like creating a new component scope -- the component claims its DOM territory, manages its own state, and communicates yields up to the parent application |
| Tech Tree / Research | Like a feature flag dependency chain -- enabling a flag requires its prerequisites to be active, and the order you enable them shapes the user experience |
| Diplomacy Basics | Like user sentiment tracking -- interactions (clicks, time-on-page, rage-clicks) shift a score that determines what UI the system presents next |
| Turn-Based Macro Economy | Like a render budget -- each frame has income (available milliseconds) and expenses (layout, paint, script), and overspending causes visible degradation |
| Victory Conditions | Like analytics goal tracking -- multiple conversion funnels are monitored simultaneously, and any one reaching its threshold triggers a success event |
| Fog of War | Like lazy loading with placeholder content -- unloaded sections show a skeleton (shrouded), loaded sections show real data (visible), and never-visited sections show nothing |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Hex Grid System | Like a spatial index structure -- coordinates enable efficient neighbor queries, range searches, and distance calculations over a two-dimensional dataset |
| City / Settlement Founding | Like placing a new compute node in a cluster -- it claims local data shards, processes them for yields, and has ongoing resource overhead |
| Tech Tree / Research | Like a DAG of data pipeline stages -- downstream transformations cannot run until upstream dependencies complete, and prioritizing one branch delays another |
| Diplomacy Basics | Like a reinforcement learning reward signal -- the AI's attitude is a running score updated by events, and it drives policy decisions (cooperate, compete, attack) |
| Turn-Based Macro Economy | Like a data pipeline cost model -- each stage consumes resources (compute, storage, bandwidth), income comes from output value, and a deficit forces pipeline pruning |
| Victory Conditions | Like early stopping criteria in training -- multiple metrics (loss, accuracy, F1) are checked each epoch, and hitting any threshold ends the run with a result classification |
| Fog of War | Like data freshness in a warehouse -- recently ingested data is "visible," stale data is "shrouded" (schema known but values may be outdated), and unprocessed sources are "unexplored" |

---

## Discussion Questions

1. **Scope as the Enemy:** 4X games are notorious for scope creep -- every system connects to every other system, and cutting one feature feels like it collapses the whole design. How do you decide which systems are essential for the core loop and which can be cut? What is the smallest set of interlocking systems that still feels like a 4X game?

2. **The AI Problem:** A 4X game with a stupid AI opponent feels pointless, but a competent 4X AI is one of the hardest problems in game development. For the MVP, what is the minimum AI behavior that makes the game feel like a contest rather than a sandbox? Is a scripted sequence of actions (found city on turn 5, build army on turn 15, attack on turn 30) good enough?

3. **The Pacing Trap:** 4X games often start exciting (exploration, first city) and become tedious in the midgame (managing six cities, waiting for research). How would you design a 30-minute 4X game that keeps the pacing tight throughout? What can you learn from auto-battlers (Module 24) about structuring rounds to maintain engagement?

4. **Information Overload:** A 4X game presents the player with dozens of numbers per turn (food, production, gold, science, culture, military strength, diplomatic status). How do you surface the right information at the right time without overwhelming the player? What UI patterns from other domains (dashboards, monitoring tools, data visualization) could help?
