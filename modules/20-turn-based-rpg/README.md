# Module 20: Turn-Based RPG (JRPG)
**Menus, math, and party management | Your spreadsheet has a storyline**
> "In my experience, there is no such thing as luck." — Obi-Wan Kenobi
---

## Prerequisites

- **Module 7 (Roguelike):** Turn-based input handling, discrete game states, tile-based world representation.
- **Module 10 (Deckbuilder):** Turn phase structure, hand/resource management per turn, sequential decision-making.

## Week 1: History & Design Theory

### The Origin

The turn-based RPG crystallized in Japan during the late 1980s, when Dragon Quest (1986) and Final Fantasy (1987) translated Western tabletop RPG concepts — stats, levels, parties, random encounters — into a format designed for console controllers and television screens. The critical insight was replacing the freeform decision-making of tabletop games with menu-driven combat: the player selects from a fixed set of actions (Attack, Magic, Item, Defend), and the outcome is resolved through deterministic or semi-random formulas. This made complex role-playing accessible to millions of players who would never sit at a tabletop, and established a genre that dominated Japanese game development for decades.

### How the Genre Evolved

- **Final Fantasy VI (1994):** Squaresoft's masterpiece refined the Active Time Battle (ATB) system, where a per-character timer fills based on their Speed stat, and the player must act when the bar is full or lose their window. This injected urgency into turn-based combat without abandoning its strategic core. FFVI also set the standard for ensemble casts — fourteen playable characters, each with unique abilities — proving that party management and character specialization could carry emotional and mechanical depth simultaneously.

- **Chrono Trigger (1995):** Squaresoft and Enix's collaboration eliminated random encounters entirely, showing enemies on the overworld and letting the player choose (or avoid) engagement. Its "Dual Tech" and "Triple Tech" system — where party members combine abilities for powerful joint attacks — demonstrated that party composition was not just a stat optimization problem but a creative, expressive one. Chrono Trigger also pioneered multiple endings tied to player choices, expanding the RPG beyond linear storytelling.

- **Persona 5 (2016):** Atlus reimagined the JRPG for a modern audience by wrapping turn-based combat in a stylish, systems-rich social simulation. Its "One More" system — exploit an enemy's weakness and you get an extra turn — made elemental weakness tables feel dynamic and rewarding rather than rote. Persona 5 proved that turn-based combat could feel fast, flashy, and contemporary, silencing critics who argued the format was outdated.

### What Makes a Turn-Based RPG "Great"

A great JRPG makes every menu selection feel meaningful. The best entries in the genre ensure that "Attack" is rarely the optimal choice — the player must consider elemental weaknesses, party member roles, resource conservation (MP, items), status effects, and turn order to make the right call. The combat math must be transparent enough that the player can reason about it (I know fire is strong against ice enemies, so I will use my fire mage) yet deep enough that optimization is rewarding. Outside combat, the progression loop — gaining XP, leveling up, choosing equipment, building your party — must create a steady drumbeat of "I am getting stronger," giving the player both the motivation to continue and the tools to tackle harder challenges.

### The Essential Mechanic

Selecting actions from menus where stats, types, and party composition determine outcomes.

## Week 2: Build the MVP

### What You're Building

A combat encounter system where the player controls a party of 2-3 characters against groups of enemies, selecting actions from menus each turn. Characters have stats, elemental types, and abilities. Enemies have weaknesses. Victory grants XP that leads to level-ups. You do not need a full overworld — a sequence of 3-4 battles with a simple party screen between them is sufficient.

### Core Concepts (Must Implement)

**1. Turn Order / Initiative System**

A speed stat determines which characters and enemies act first each round. This creates a tactical layer before any action is chosen: fast characters act first but may be fragile; slow tanks hit hard but enemies may strike before them.

```
function calculate_turn_order(all_combatants):
    # Sort by speed stat, descending. Ties broken by random roll.
    sorted = all_combatants.sort_by(c => c.stats.speed + random(0, 5), descending)
    return sorted

function run_combat_round():
    turn_order = calculate_turn_order(party + enemies)
    for combatant in turn_order:
        if combatant.is_dead: continue
        if combatant.is_player_controlled:
            action = show_menu_and_wait_for_input(combatant)
        else:
            action = enemy_ai_choose_action(combatant)
        execute_action(action)
        check_for_battle_end()
```

**Why it matters:** Turn order transforms combat from simultaneous to sequential, creating information asymmetry. If the healer acts before the boss, you can pre-heal; if the boss acts first, you must react. Speed becomes as important as raw power.

**2. Stat-Based Damage Formulas**

The mathematical backbone of RPG combat. Attack power minus defense, multiplied by elemental modifiers, with variance for unpredictability. Every number on the character sheet feeds into this formula.

```
function calculate_damage(attacker, defender, skill):
    # Base damage from stats
    base = (attacker.stats.attack * skill.power) / 100

    # Defense reduction
    reduced = base - (defender.stats.defense * 0.5)
    reduced = max(reduced, 1)   # Always deal at least 1 damage

    # Elemental multiplier
    type_mult = get_type_multiplier(skill.element, defender.element)
    # 2.0 = weak to, 1.0 = neutral, 0.5 = resists, 0.0 = immune

    # Critical hit check
    crit_roll = random(0, 100)
    crit_mult = 1.5 if crit_roll < attacker.stats.luck else 1.0

    # Variance (+/- 10%)
    variance = random(0.9, 1.1)

    final_damage = floor(reduced * type_mult * crit_mult * variance)
    return { damage: final_damage, was_crit: crit_mult > 1.0, type_effectiveness: type_mult }
```

**Why it matters:** The damage formula is the contract between the game and the player. When the player equips a stronger sword, they expect to see higher numbers. When they exploit a weakness, the payoff must be dramatic. Transparent math builds trust; opaque math breeds frustration.

**3. Experience / Leveling System**

After each battle, characters earn experience points. When XP exceeds a threshold, the character levels up, stats increase, and new abilities may unlock. The XP curve determines the game's pacing.

```
function xp_required_for_level(level):
    # Quadratic curve: each level requires more XP than the last
    return floor(100 * (level ^ 1.5))

function award_xp(party, enemies_defeated):
    total_xp = sum(e.xp_value for e in enemies_defeated)
    per_member = floor(total_xp / len(party))

    for character in party:
        character.xp += per_member
        while character.xp >= xp_required_for_level(character.level + 1):
            character.xp -= xp_required_for_level(character.level + 1)
            level_up(character)

function level_up(character):
    character.level += 1
    # Stat growth per level (varies by character class)
    character.stats.hp_max += character.growth_rates.hp
    character.stats.attack += character.growth_rates.attack
    character.stats.defense += character.growth_rates.defense
    character.stats.speed += character.growth_rates.speed
    character.stats.hp = character.stats.hp_max   # Full heal on level up

    # Check for new abilities
    for skill in character.learnable_skills:
        if skill.learn_level == character.level:
            character.skills.append(skill)
            show_message(character.name + " learned " + skill.name + "!")
```

**Why it matters:** The leveling system is the primary reward loop. It gives the player a tangible sense of growth — yesterday this enemy was terrifying, today it falls in two hits. XP curve design determines whether the game feels like a satisfying climb or a tedious grind.

**4. Party Management**

Multiple characters with different roles — a tank who absorbs damage, a healer who restores HP, a damage dealer who exploits weaknesses. The player decides who to bring and how to use them.

```
# Define party members with distinct roles
warrior = {
    name: "Kael", role: "tank",
    stats: { hp: 120, attack: 15, defense: 18, speed: 6, mp: 10 },
    skills: [
        { name: "Shield Bash", power: 80, element: "physical", mp_cost: 0 },
        { name: "Taunt", effect: "force_target_self", mp_cost: 5 }
    ]
}

mage = {
    name: "Lyra", role: "dps",
    stats: { hp: 55, attack: 8, defense: 7, speed: 12, mp: 50 },
    skills: [
        { name: "Fireball", power: 120, element: "fire", mp_cost: 8 },
        { name: "Ice Shard", power: 120, element: "ice", mp_cost: 8 }
    ]
}

healer = {
    name: "Sera", role: "healer",
    stats: { hp: 70, attack: 6, defense: 10, speed: 10, mp: 40 },
    skills: [
        { name: "Heal", effect: "restore_hp", power: 50, mp_cost: 6 },
        { name: "Cure", effect: "remove_status", mp_cost: 4 }
    ]
}

active_party = [warrior, mage, healer]   # Player chooses composition
```

**Why it matters:** Party management is where strategy lives between battles. Choosing who to bring, who to level, and how to distribute limited resources (items, equipment) adds a meta-layer of decision-making that persists across the entire game.

**5. Elemental Weakness Tables**

A rock-paper-scissors system of types where fire beats ice, ice beats wind, wind beats earth, and so on. Exploiting weaknesses deals bonus damage; hitting resistances is punished.

```
# Type effectiveness chart
# Rows = attack type, Columns = defender type
weakness_table = {
    "fire":    { "fire": 0.5, "ice": 2.0, "wind": 1.0, "earth": 1.0 },
    "ice":     { "fire": 0.5, "ice": 0.5, "wind": 2.0, "earth": 1.0 },
    "wind":    { "fire": 1.0, "ice": 1.0, "wind": 0.5, "earth": 2.0 },
    "earth":   { "fire": 2.0, "ice": 1.0, "wind": 0.5, "earth": 0.5 },
    "physical":{ "fire": 1.0, "ice": 1.0, "wind": 1.0, "earth": 1.0 }
}

function get_type_multiplier(attack_element, defender_element):
    if attack_element in weakness_table and defender_element in weakness_table[attack_element]:
        return weakness_table[attack_element][defender_element]
    return 1.0

# Display effectiveness to the player
function show_damage_result(result):
    if result.type_effectiveness >= 2.0:
        display("Super effective!")
    elif result.type_effectiveness <= 0.5:
        display("Not very effective...")
```

**Why it matters:** Weakness tables add a knowledge layer to combat. The player who remembers that the ice boss is weak to fire will have an easier time than the player who button-mashes Attack. This rewards learning and encourages the player to experiment with different party compositions and skills.

**6. Menu-Based Combat UI**

The interface through which the player selects actions: Attack, Magic, Item, Defend, Flee. Each option branches into sub-menus (which spell? which item? which target?). The menu IS the gameplay.

```
function show_combat_menu(character):
    # Top-level choices
    choice = show_menu([
        "Attack",    # Basic physical attack
        "Magic",     # Opens spell submenu
        "Item",      # Opens inventory submenu
        "Defend",    # Halve incoming damage this turn
        "Flee"       # Attempt to escape battle
    ])

    if choice == "Attack":
        target = select_target(enemies_alive)
        return { type: "attack", user: character, target: target }

    elif choice == "Magic":
        usable_spells = character.skills.filter(s => s.mp_cost <= character.stats.mp)
        spell = show_menu(usable_spells)   # Show spell name + MP cost
        target = select_target(get_valid_targets(spell))
        return { type: "magic", user: character, skill: spell, target: target }

    elif choice == "Item":
        item = show_menu(inventory.filter(i => i.usable_in_battle))
        target = select_target(get_valid_targets(item))
        return { type: "item", user: character, item: item, target: target }

    elif choice == "Defend":
        character.defending = true   # Defense doubled until next turn
        return { type: "defend", user: character }

    elif choice == "Flee":
        # Flee chance based on party speed vs enemy speed
        flee_chance = average(party.speed) / average(enemies.speed) * 50
        if random(0, 100) < flee_chance:
            end_battle("fled")
        else:
            show_message("Couldn't escape!")
            return { type: "flee_failed", user: character }
```

**Why it matters:** The menu is the player's interface with the entire combat system. Good menu design surfaces relevant information (MP remaining, spell elements, enemy weaknesses already discovered) and allows quick navigation. A clunky menu makes even brilliant combat math feel tedious.

**7. Random Encounters / Encounter Rate**

When and how battles trigger from the overworld. A step counter or random roll determines when enemies appear, with rates varying by area.

```
steps_since_encounter = 0

# Each area defines its own encounter rate and enemy pool
area_data = {
    "forest": {
        base_encounter_rate: 20,   # Average steps between encounters
        enemy_pool: [
            { enemies: ["slime", "slime"], weight: 40 },
            { enemies: ["goblin"], weight: 35 },
            { enemies: ["wolf", "wolf", "wolf"], weight: 25 }
        ]
    }
}

function on_player_step(current_area):
    steps_since_encounter += 1
    # Probability increases with each step (no encounter droughts)
    encounter_chance = steps_since_encounter / area_data[current_area].base_encounter_rate

    if random(0.0, 1.0) < encounter_chance:
        steps_since_encounter = 0
        enemy_group = weighted_random(area_data[current_area].enemy_pool)
        start_battle(enemy_group)

function weighted_random(pool):
    total_weight = sum(entry.weight for entry in pool)
    roll = random(0, total_weight)
    cumulative = 0
    for entry in pool:
        cumulative += entry.weight
        if roll < cumulative:
            return entry.enemies
```

**Why it matters:** Encounter rate is one of the most delicate balance points in JRPG design. Too frequent, and the player feels harassed. Too rare, and they are underleveled for the boss. The distribution of encounters paces the entire game — it determines how strong the player is at every narrative beat.

### Stretch Goals

- **Status effects:** Poison (damage over time), sleep (skip turn), blind (reduced accuracy). Adds another tactical dimension beyond damage.
- **Active Time Battle (ATB):** Replace pure turn-based with per-character timers that fill at different rates, creating time pressure.
- **Equipment system:** Weapons and armor that modify stats, with an equipment screen for swapping gear between battles.
- **Boss encounter:** A multi-phase boss with changing weaknesses or attack patterns that tests everything the player has learned.

### MVP Spec

| Element | Minimum Viable Version |
|---|---|
| **Party** | 2-3 characters with distinct stats, roles, and 2-3 skills each |
| **Enemies** | 3-4 enemy types with different elements, stats, and XP values |
| **Combat** | Turn-based with initiative, menu selection, damage formulas |
| **Weakness Table** | At least 3 elements with a clear strength/weakness cycle |
| **Leveling** | XP gain after battle, level-ups that increase stats |
| **Encounters** | 3-4 sequential battles (can be a simple "next encounter" flow) |
| **UI** | Combat menu with Attack / Magic / Item / Defend options |
| **Win/Lose** | Party wipe = game over, final battle victory = win screen |

### Deliverable

A playable turn-based combat game where the player commands a party through a sequence of battles, selecting actions from menus, exploiting elemental weaknesses, managing MP and items, and gaining levels between fights. The final battle should require the player to use what they have learned about the weakness system and party roles to succeed.

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Turn Order / Initiative | Like a priority queue — tasks (combatants) are processed in order of their priority (speed stat), not insertion order. |
| Stat-Based Damage Formulas | Like a business rules engine — multiple inputs (attack, defense, element, crit) are processed through a deterministic formula to produce an output (damage). |
| Experience / Leveling | Like cache warming or connection pool scaling — the system starts cold and gradually increases capacity (stats) as it processes more work (battles). |
| Party Management | Like microservice architecture — each service (party member) has a specialized role (auth, storage, compute), and the system works best when roles are well-distributed. |
| Elemental Weakness Table | Like a routing table or compatibility matrix — given input type A and target type B, look up the correct multiplier/handler. |
| Menu-Based Combat UI | Like a CLI with nested subcommands — `combat attack --target slime` or `combat magic fireball --target boss`. Each command routes to a different handler. |
| Random Encounters | Like a probabilistic rate limiter — the chance of an event (encounter) increases over time, ensuring it eventually fires while maintaining randomness. |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Turn Order / Initiative | Like z-index or rendering order — elements are processed in a specific stacking order, and position in that order determines who "appears" first. |
| Stat-Based Damage Formulas | Like CSS specificity calculations — multiple properties (inline, ID, class) combine through a formula to determine the final computed style. |
| Experience / Leveling | Like progressive enhancement — the base experience starts simple, and capabilities are unlocked as the user (player) demonstrates readiness. |
| Party Management | Like component composition — each component (character) has a responsibility, and the page (party) works best when components complement each other. |
| Elemental Weakness Table | Like a theme token lookup — given a context (element) and a target (defender element), resolve to the correct value (multiplier). |
| Menu-Based Combat UI | Like a nested dropdown menu — the top level shows categories, each category expands to specific options, and selecting an option triggers an action. |
| Random Encounters | Like showing a modal after N scroll events — the longer the user engages, the higher the probability of triggering the encounter. |

### Data/ML Developers

| Core Concept | Analogy |
|---|---|
| Turn Order / Initiative | Like job scheduling in a compute cluster — tasks with higher priority (speed stat) are allocated resources (their turn) first. |
| Stat-Based Damage Formulas | Like a linear regression with multiple features — attack, defense, element, and crit are input features, and damage is the predicted output. The formula is the model. |
| Experience / Leveling | Like training epochs — each battle is an epoch, XP is the loss reduction, and level-up is when the model crosses a performance threshold and gains new capability. |
| Party Management | Like an ensemble model — each member (sub-model) specializes in a different aspect, and the ensemble (party) outperforms any individual. |
| Elemental Weakness Table | Like a confusion matrix or lookup table — given a predicted class (attack element) and actual class (defender element), retrieve the corresponding metric (multiplier). |
| Menu-Based Combat UI | Like a decision tree — at each node, the player selects a branch (Attack/Magic/Item), traverses to the next node (target selection), and arrives at a leaf (action execution). |
| Random Encounters | Like Poisson process sampling — events (encounters) occur with a certain expected rate, with the probability increasing as the interval since the last event grows. |

### Discussion Questions

1. JRPGs live or die on their damage formulas, yet most players never see the math. How transparent should the numbers be? Should the game show exact formulas, or is "Super effective!" enough? What are the tradeoffs?

2. Random encounters were a hardware limitation solution (limited overworld enemy rendering), but many modern RPGs keep them or variations of them. What does randomness add to the experience that visible enemies on the map do not?

3. The "holy trinity" of tank/healer/DPS appears in JRPGs, MMOs, and even team shooters. Why is this role structure so persistent across genres? Can you design a compelling party system without these archetypes?

4. Persona 5's "One More" system (exploit a weakness, get a bonus turn) makes the weakness table feel urgent and rewarding. How does layering a bonus on top of a multiplier change player behavior compared to just dealing extra damage?
