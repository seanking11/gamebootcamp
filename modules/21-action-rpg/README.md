# Module 21: Action RPG
**Real-time combat meets character progression | You died, but your gear survived**
> "The only way to do great work is to love what you do." — Steve Jobs. "You Died." — Dark Souls.
---

## Prerequisites

- **Module 3 (Shooter) or Module 8 (Fighting):** Real-time input handling, collision detection, frame-rate-independent movement, hit detection.
- **Module 7 (Roguelike):** Item/inventory systems, procedural generation concepts, entity management.

## Week 1: History & Design Theory

### The Origin

The action RPG was born from a desire to keep the progression systems of turn-based RPGs — levels, loot, stats — while replacing menu selection with real-time, skill-based combat. Early entries like Hydlide (1984) and The Legend of Zelda (1986) proved that exploration and combat could happen on the same screen without pausing for menus. But the genre truly crystallized when developers realized the magic formula: combine the dopamine of finding better gear with the satisfaction of skillful play, so that the player's character AND the player themselves grow more powerful over time. This dual progression — mechanical skill plus statistical power — is what separates action RPGs from both pure action games and pure RPGs.

### How the Genre Evolved

- **Diablo (Blizzard, 1997):** Blizzard North's dungeon crawler made loot the star of the show. Procedurally generated dungeons, randomized item properties, and tiered rarity (common through unique) created an addictive loop: kill monsters, find better gear, kill harder monsters. Diablo proved that loot tables — the weighted probability distributions behind item drops — were as important as level design. Its click-to-attack combat was deliberately simple because the complexity lived in build decisions and gear optimization.

- **Dark Souls (FromSoftware, 2011):** FromSoftware inverted the power fantasy. Instead of showering the player with loot, Dark Souls made every encounter dangerous and every victory earned. Its combat system — built on stamina management, dodge timing (invincibility frames), and reading enemy telegraph animations — demanded that player skill matter more than stats. Dark Souls proved that difficulty itself could be a design pillar, and that the action RPG could be as much about learning enemy patterns as about leveling up.

- **Elden Ring (FromSoftware, 2022):** The synthesis. Elden Ring merged Dark Souls' precise combat with an open world full of optional bosses, hidden dungeons, and build variety. It proved that the action RPG could scale to enormous scope without losing the moment-to-moment tension of each encounter. Its character build system — where players allocate stat points to define their playstyle (strength, dexterity, magic, faith) — showed that meaningful build diversity and challenging real-time combat could coexist.

### What Makes an Action RPG "Great"

A great action RPG makes the player feel two kinds of growth simultaneously. Statistical growth comes from levels, gear, and build choices — the numbers on your character sheet go up, and enemies that once seemed impossible become manageable. Skill growth comes from the player learning enemy patterns, mastering dodge timing, managing stamina, and making split-second decisions under pressure. The best games in the genre ensure that neither growth alone is sufficient: a perfectly built character piloted by a careless player will still die, and a skillful player with terrible gear will hit a wall. This tension between character power and player power is the beating heart of the action RPG.

### The Essential Mechanic

Real-time combat where stats, gear, and player skill both matter.

## Week 2: Build the MVP

### What You're Building

A top-down (or side-view) action game where the player character has stats (HP, attack, defense, stamina), fights enemies in real-time, collects loot drops with randomized properties, and can allocate stat points on level-up. The player should face 3-4 enemy types across 2-3 small zones, with at least one mini-boss that requires learning its attack patterns. Equipment changes should visibly affect combat performance.

### Core Concepts (Must Implement)

**1. Loot / Drop Table System**

When an enemy dies, it rolls against a weighted probability table to determine what it drops. Items have rarity tiers, and rarer items have better stats. The drop table is the economy of the game — it controls how quickly the player grows in power.

```
rarity_tiers = {
    "common":    { color: "white",  stat_range: [1, 3],  weight: 60 },
    "uncommon":  { color: "green",  stat_range: [3, 6],  weight: 25 },
    "rare":      { color: "blue",   stat_range: [6, 10], weight: 10 },
    "legendary": { color: "orange", stat_range: [10, 15], weight: 5 }
}

drop_tables = {
    "skeleton": [
        { item_type: "sword",  drop_chance: 30 },
        { item_type: "shield", drop_chance: 15 },
        { item_type: "potion", drop_chance: 50 },
        { item_type: "nothing", drop_chance: 5 }
    ],
    "boss_knight": [
        { item_type: "sword",  drop_chance: 40, rarity_override: "rare" },
        { item_type: "armor",  drop_chance: 40, rarity_override: "rare" },
        { item_type: "potion", drop_chance: 20 }
    ]
}

function roll_drop(enemy_type):
    table = drop_tables[enemy_type]
    roll = random(0, 100)
    cumulative = 0
    for entry in table:
        cumulative += entry.drop_chance
        if roll < cumulative:
            if entry.item_type == "nothing": return null
            rarity = entry.rarity_override or roll_rarity()
            return generate_item(entry.item_type, rarity)

function roll_rarity():
    roll = random(0, 100)
    cumulative = 0
    for tier_name, tier_data in rarity_tiers:
        cumulative += tier_data.weight
        if roll < cumulative:
            return tier_name

function generate_item(item_type, rarity):
    tier = rarity_tiers[rarity]
    bonus = random(tier.stat_range[0], tier.stat_range[1])
    return { type: item_type, rarity: rarity, bonus: bonus, name: rarity + " " + item_type }
```

**Why it matters:** The drop table is the core reward system. It controls the player's power curve, creates anticipation (will THIS enemy drop something good?), and generates the "just one more" loop that keeps players engaged. Getting the weights right is the difference between a satisfying progression and a frustrating grind.

**2. Stat System with Equipment**

The player has base stats that are modified by equipped gear. Every piece of equipment adds to one or more stats, and the player's effective combat power is the sum of base stats plus all gear bonuses.

```
player = {
    base_stats: { hp_max: 100, attack: 10, defense: 8, speed: 5, stamina_max: 100 },
    equipment: { weapon: null, armor: null, accessory: null },
    level: 1, xp: 0
}

function get_effective_stat(stat_name):
    base = player.base_stats[stat_name]
    gear_bonus = 0
    for slot, item in player.equipment:
        if item and stat_name in item.stat_bonuses:
            gear_bonus += item.stat_bonuses[stat_name]
    return base + gear_bonus

function equip_item(item):
    slot = get_slot_for_type(item.type)    # sword -> weapon, armor -> armor, etc.
    old_item = player.equipment[slot]
    player.equipment[slot] = item
    if old_item:
        add_to_inventory(old_item)
    recalculate_derived_stats()

function calculate_damage(attacker_attack, defender_defense):
    raw = attacker_attack - (defender_defense * 0.5)
    return max(floor(raw * random(0.9, 1.1)), 1)
```

**Why it matters:** The stat system is what makes loot meaningful. A sword is not just a sword — it is +5 attack that changes the damage formula output. Equipment creates a constant stream of micro-decisions: is +3 attack better than +5 defense? The answer depends on your playstyle, your build, and what you are fighting next.

**3. Stamina / Resource Management in Combat**

Attacks, dodges, and blocks cost stamina. When stamina is depleted, the player is vulnerable. This creates a risk/reward tension: aggressive play deals more damage but leaves you exposed.

```
STAMINA_REGEN_RATE = 20     # per second
ATTACK_STAMINA_COST = 25
DODGE_STAMINA_COST = 30
BLOCK_STAMINA_COST = 15     # per second while blocking

function update_stamina(dt):
    if player.state == "blocking":
        player.stamina -= BLOCK_STAMINA_COST * dt
        if player.stamina <= 0:
            player.stamina = 0
            break_block()    # Guard broken — player staggered
    elif player.state == "idle" or player.state == "moving":
        # Regenerate when not acting
        player.stamina = min(player.stamina + STAMINA_REGEN_RATE * dt,
                             get_effective_stat("stamina_max"))

function try_attack():
    if player.stamina >= ATTACK_STAMINA_COST:
        player.stamina -= ATTACK_STAMINA_COST
        start_attack_animation()
        return true
    else:
        show_feedback("Not enough stamina!")
        return false

function try_dodge():
    if player.stamina >= DODGE_STAMINA_COST:
        player.stamina -= DODGE_STAMINA_COST
        start_dodge(player.facing_direction)
        return true
    return false
```

**Why it matters:** Stamina prevents optimal play from being "attack as fast as possible." It forces the player to create rhythms — attack, attack, back off, regenerate, attack again. This cadence is what makes action RPG combat feel like a dance rather than a button-mash.

**4. Dodge / Invincibility Frames (I-Frames)**

During a dodge animation, there is a brief window where the player cannot be hit. This rewards precise timing and creates a high-skill escape option that pure stats cannot replace.

```
DODGE_DURATION = 0.4         # seconds
IFRAME_START = 0.05          # i-frames begin 50ms into dodge
IFRAME_END = 0.25            # i-frames end 250ms into dodge
DODGE_SPEED = 300            # pixels/second during dodge

function start_dodge(direction):
    player.state = "dodging"
    player.dodge_timer = 0
    player.dodge_direction = direction

function update_dodge(dt):
    if player.state != "dodging": return

    player.dodge_timer += dt

    # Move player in dodge direction
    player.position += player.dodge_direction * DODGE_SPEED * dt

    # Check if in i-frame window
    player.invulnerable = (player.dodge_timer >= IFRAME_START and
                           player.dodge_timer <= IFRAME_END)

    if player.dodge_timer >= DODGE_DURATION:
        player.state = "idle"
        player.invulnerable = false

function try_damage_player(damage, source):
    if player.invulnerable:
        # Dodged! Optional: play a satisfying "whoosh" sound
        return 0
    actual = calculate_damage(damage, get_effective_stat("defense"))
    player.hp -= actual
    return actual
```

**Why it matters:** I-frames are the purest expression of skill-based defense in action RPGs. A player who masters dodge timing can fight enemies far above their stat level. This is what makes action RPGs feel fair even when they are brutally difficult — if you die, it is because you dodged too late, not because your numbers were too low.

**5. Enemy Telegraphs and Attack Windows**

Enemies signal their attacks with visible wind-up animations before the damage lands. The player reads these telegraphs to know when to dodge, block, or back away, and exploits the recovery period after the attack to deal damage.

```
enemy_attacks = {
    "overhead_smash": {
        telegraph_duration: 0.8,    # Wind-up: enemy raises weapon (DODGE NOW)
        active_duration: 0.2,       # Damage frames: weapon comes down
        recovery_duration: 0.6,     # Recovery: enemy is vulnerable (ATTACK NOW)
        damage: 30,
        hitbox: { width: 40, height: 60, offset_y: -30 }
    }
}

function update_enemy_attack(enemy, dt):
    enemy.attack_timer += dt
    attack = enemy_attacks[enemy.current_attack]

    if enemy.attack_phase == "telegraph":
        # Visual cue: enemy glows red, raises weapon, etc.
        show_telegraph_indicator(enemy)
        if enemy.attack_timer >= attack.telegraph_duration:
            enemy.attack_phase = "active"
            enemy.attack_timer = 0

    elif enemy.attack_phase == "active":
        # Damage is live — check if player is in hitbox
        if not player.invulnerable and overlaps(attack.hitbox, player.hitbox):
            try_damage_player(attack.damage, enemy)
        if enemy.attack_timer >= attack.active_duration:
            enemy.attack_phase = "recovery"
            enemy.attack_timer = 0

    elif enemy.attack_phase == "recovery":
        # Enemy is vulnerable — player's window to attack
        enemy.can_be_staggered = true
        if enemy.attack_timer >= attack.recovery_duration:
            enemy.attack_phase = "idle"
            enemy.can_be_staggered = false
            enemy.attack_timer = 0
```

**Why it matters:** Telegraphs are the language of action RPG combat. They transform fights from reaction-speed tests into pattern-recognition puzzles. The player learns to read an enemy's body language: "that arm raise means a sweep attack in 0.5 seconds." This learning is the skill growth that complements statistical growth.

**6. Area / Zone Transitions**

The game world is divided into discrete zones connected by transition points. Moving between zones loads a new environment, enemy set, and potentially a different tileset or backdrop.

```
zones = {
    "village": {
        enemies: [],
        exits: [{ position: [15, 0], target_zone: "forest", entry_point: [1, 10] }],
        tilemap: "village_map"
    },
    "forest": {
        enemies: ["skeleton", "wolf"],
        exits: [
            { position: [0, 10], target_zone: "village", entry_point: [14, 0] },
            { position: [15, 5], target_zone: "dungeon", entry_point: [1, 5] }
        ],
        tilemap: "forest_map"
    },
    "dungeon": {
        enemies: ["skeleton", "ghost", "boss_knight"],
        exits: [{ position: [0, 5], target_zone: "forest", entry_point: [14, 5] }],
        tilemap: "dungeon_map"
    }
}

current_zone = "village"

function check_zone_transition(player_position):
    for exit in zones[current_zone].exits:
        if distance(player_position, exit.position) < 1.0:
            load_zone(exit.target_zone, exit.entry_point)

function load_zone(zone_name, entry_point):
    # Clear current zone state
    clear_entities()
    # Load new zone
    current_zone = zone_name
    load_tilemap(zones[zone_name].tilemap)
    spawn_enemies(zones[zone_name].enemies)
    player.position = entry_point
    # Persist player state (HP, inventory, equipment) across zones
```

**Why it matters:** Zone transitions create the feeling of a larger world from small, manageable pieces. Each zone can have its own difficulty curve, enemy set, and visual identity. For the MVP, zones are the simplest way to create a sense of progression and exploration without building a continuous open world.

**7. Character Build / Skill System**

When the player levels up, they receive stat points to allocate. These choices define their playstyle: invest in strength for heavy melee damage, dexterity for speed and dodge effectiveness, or vitality for survivability.

```
STAT_POINTS_PER_LEVEL = 3

build_stats = {
    "strength":  { description: "Increases attack damage", affects: "attack", per_point: 2 },
    "dexterity": { description: "Increases speed and stamina", affects: ["speed", "stamina_max"],
                   per_point: [1, 5] },
    "vitality":  { description: "Increases HP", affects: "hp_max", per_point: 10 },
    "luck":      { description: "Increases crit chance and drop rates", affects: "luck",
                   per_point: 1 }
}

function on_level_up():
    player.level += 1
    remaining_points = STAT_POINTS_PER_LEVEL

    while remaining_points > 0:
        choice = show_stat_allocation_menu(build_stats, remaining_points)
        apply_stat_point(choice)
        remaining_points -= 1

function apply_stat_point(stat_name):
    info = build_stats[stat_name]
    if is_list(info.affects):
        for i, stat in enumerate(info.affects):
            player.base_stats[stat] += info.per_point[i]
    else:
        player.base_stats[info.affects] += info.per_point

# Example builds after 10 levels (30 points):
# "Glass Cannon": 20 STR, 5 DEX, 0 VIT, 5 LCK — hits hard, dies fast
# "Tank": 5 STR, 5 DEX, 20 VIT, 0 LCK — survives everything, slow kills
# "Balanced": 10 STR, 10 DEX, 10 VIT, 0 LCK — no extremes
```

**Why it matters:** Build allocation gives the player ownership over their character's identity. Two players can fight the same boss with completely different strategies because they invested their points differently. This is the RPG half of "action RPG" — the choices that persist beyond any single encounter.

### Stretch Goals

- **Weapon types with different movesets:** Swords swing fast, hammers swing slow but stagger enemies, daggers have short range but low stamina cost. Each weapon changes the combat rhythm.
- **Status effects on gear:** A "Burning Sword" that applies a damage-over-time effect, a "Frozen Shield" that slows attackers on block.
- **Boss with multiple phases:** At 50% HP, the boss changes its attack patterns, telegraph timings, and weakness, forcing the player to adapt mid-fight.
- **NPC shop:** Spend gold (dropped by enemies) to buy potions, basic gear, or stat reset items.

### MVP Spec

| Element | Minimum Viable Version |
|---|---|
| **Player** | Character with HP, stamina, attack, defense, speed stats |
| **Equipment** | Weapon and armor slots; equipping items modifies stats |
| **Combat** | Real-time attack, dodge (with i-frames), and block |
| **Enemies** | 3-4 types with different telegraph patterns and drop tables |
| **Loot** | Random drops with at least 3 rarity tiers |
| **Zones** | 2-3 connected areas with zone transition |
| **Leveling** | XP from kills, stat point allocation on level-up |
| **Boss** | 1 mini-boss with distinct attack patterns and a guaranteed rare drop |
| **HUD** | HP bar, stamina bar, equipped item display |

### Deliverable

A playable action RPG where the player moves through 2-3 zones, fights enemies in real-time using attacks, dodges, and blocks, collects randomized loot, equips gear that changes their stats, levels up and allocates stat points, and defeats a mini-boss. The player should feel both kinds of growth: statistical (better gear, higher stats) and personal (learning enemy patterns, mastering dodge timing).

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Loot / Drop Tables | Like weighted load balancing — requests (drops) are distributed across servers (item types) according to configured weights, with some servers (legendaries) receiving traffic rarely but handling high-value work. |
| Stat System with Equipment | Like environment variable overrides — base configuration (base stats) is merged with deployment-specific overrides (equipment bonuses) to produce the final runtime config. |
| Stamina Management | Like rate limiting with a token bucket — each action consumes tokens (stamina), tokens regenerate over time, and when the bucket is empty, requests (attacks) are rejected until it refills. |
| Dodge / I-Frames | Like a circuit breaker in "open" state — during the brief open window, all incoming requests (damage) are rejected. The window closes automatically after a timeout. |
| Enemy Telegraphs | Like health check probes with predictable timing — the system signals its state (telegraph) before the actual event (attack) fires, giving observers time to react. |
| Zone Transitions | Like microservice boundaries — each zone is an independent service with its own data (enemies, layout), and transitions are API calls that pass player state between them. |
| Character Build System | Like compile-time feature flags — choices made at build time (stat allocation) determine runtime behavior, and different flag combinations produce fundamentally different binaries. |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Loot / Drop Tables | Like A/B test variant allocation — users (enemies) are assigned to variants (drop outcomes) based on configured weights, with rare variants (legendaries) appearing at low percentages. |
| Stat System with Equipment | Like CSS cascade — base styles (base stats) are overridden by more specific rules (equipment), and the computed style (effective stats) is the merge of all layers. |
| Stamina Management | Like debouncing — rapid inputs (attacks) are throttled so that the system does not process more than it can handle, with a cooldown before the next batch is accepted. |
| Dodge / I-Frames | Like `pointer-events: none` applied temporarily — for a brief window, the element (player) ignores all interaction (damage), then re-enables. |
| Enemy Telegraphs | Like CSS transition delays — the visual change (telegraph) begins, a delay passes, and then the final state (attack) resolves. The delay gives the user time to anticipate. |
| Zone Transitions | Like client-side route changes — the URL (zone) changes, the component tree (tilemap, entities) is replaced, but global state (player data) persists across navigations. |
| Character Build System | Like theming choices at app initialization — selecting a theme (build) at startup affects every component's appearance and behavior throughout the entire session. |

### Data/ML Developers

| Core Concept | Analogy |
|---|---|
| Loot / Drop Tables | Like sampling from a categorical distribution — each category (item type) has a probability weight, and each enemy kill is an independent draw from that distribution. |
| Stat System with Equipment | Like feature vectors with additive components — base features (stats) are augmented by additional features (gear bonuses), and the combined vector feeds into the model (damage formula). |
| Stamina Management | Like GPU memory budgeting — each operation (attack, dodge) consumes memory (stamina), and exceeding the budget causes a stall until resources are freed. |
| Dodge / I-Frames | Like dropout during training — for a random subset of frames, incoming signals (damage) are ignored, preventing the system from over-relying on any single defense strategy. |
| Enemy Telegraphs | Like data pipeline latency — there is a known, consistent delay between data arriving (telegraph) and processing completing (attack landing). Downstream consumers (players) can use this latency window to prepare. |
| Zone Transitions | Like switching between dataset partitions — each zone is a shard with its own distribution of enemies and items, and moving between shards changes what the model (player) encounters. |
| Character Build System | Like hyperparameter tuning — allocating stat points is choosing hyperparameters (learning rate, batch size, etc.) that define the model's behavior profile. Different configs produce different performance characteristics. |

### Discussion Questions

1. Dark Souls is famous for being "hard but fair." How do i-frames and enemy telegraphs create a sense of fairness that pure stat-based difficulty (just making enemies hit harder) does not? What happens when telegraphs are unclear or i-frame windows are inconsistent?

2. Diablo's loot system is often compared to slot machines. At what point does a random reward system cross from "engaging gameplay loop" to "exploitative design"? How do drop rate tuning and rarity tiers affect this boundary?

3. In most action RPGs, the player can eventually out-level any challenge. Should a game allow the player to become so powerful that previously difficult content becomes trivial, or should difficulty scale with the player? What are the emotional tradeoffs of each approach?

4. Stamina systems force players to not act — to wait, back off, and regenerate. Why is "forced inaction" a valuable design tool? How does it differ from cooldown timers on abilities?
