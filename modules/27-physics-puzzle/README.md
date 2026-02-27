# Module 27: Physics Puzzle
**Design the cause, let physics deliver the effect | Chain Reaction**
> "You don't solve a physics puzzle. You set up the conditions for it to solve itself."

---

## Prerequisites

- **Module 2: Platformer (for physics basics)** -- You will need a working understanding of basic physics concepts: gravity, velocity, acceleration, collision detection, and how a physics step loop works (fixed timestep, position integration). Physics puzzles take those foundations and move them from the background (invisible forces acting on a player character) to the foreground (physics is the entire game).

---

## Week 1: History & Design Theory

### The Origin

Physics puzzles became a mainstream genre with the release of *Angry Birds* in 2009, but the lineage runs deeper. *The Incredible Machine* (1993) let players build Rube Goldberg contraptions from gears, ropes, and trampolines. *Crush the Castle* (2009) pioneered the slingshot-and-destruction formula that *Angry Birds* would refine into a cultural phenomenon. What all these games share is a design philosophy: the player sets up conditions, then watches physics resolve the outcome. The satisfaction comes not from precise execution (like a platformer) but from prediction and surprise -- you think you know what will happen when you launch that projectile, and then the structure collapses in a way that is completely logical but not quite what you expected. Physics puzzles turned real-world intuition into a game mechanic. Everyone understands that heavy things fall, that stacked objects are unstable, that momentum carries things forward. By letting a physics engine do the heavy lifting, these games made their systems instantly legible to anyone who has ever knocked over a stack of blocks.

### How the Genre Evolved

- **World of Goo (2D Boy, 2008)** -- A construction-based physics puzzle where you build structures from living goo balls that serve as both building material and structural joints. The physics simulation governs whether your tower stands or collapses, creating a tense building experience where every goo ball placement changes the weight distribution. It proved that physics puzzles could be artistic, emotional, and mechanically deep simultaneously, and its bridge-building challenges became iconic examples of emergent physics gameplay.

- **Angry Birds (Rovio, 2009)** -- Simplified the physics puzzle to its most accessible form: aim a slingshot, launch a bird, destroy a structure full of pigs. Each bird type has a unique ability (splitting into three, exploding, accelerating), but the core mechanic is always the same: set a trajectory and let physics handle the rest. It became one of the best-selling mobile games in history by making physics intuitive and the feedback loop immediate. Its level design mastery -- structures that look sturdy but have hidden weak points -- set the standard for the genre.

- **Cut the Rope (ZeptoLab, 2010)** -- Inverted the typical physics puzzle by giving the player a tool of subtraction rather than addition. Instead of launching something, you cut ropes that suspend a candy above a frog's mouth, and gravity plus momentum do the rest. It expanded the genre's vocabulary: not every physics puzzle needs a projectile. Sometimes the puzzle is about removing the right constraint at the right moment and letting gravity take over.

- **Human: Fall Flat (No Brakes Games, 2016)** -- Brought physics puzzles into 3D with a wobbly ragdoll character whose imprecise controls are the point. The physics simulation applies to the player's body, not just the environment, creating comedy and challenge from the same system. It proved that physics-based interaction does not need to be precise to be engaging -- sometimes the fun is in the unpredictability.

### What Makes It "Great"

A great physics puzzle trusts its physics engine. The player should be able to look at a level, form a hypothesis about what will happen if they take an action, and then test that hypothesis. When the result matches their prediction, they feel smart. When it surprises them, the surprise should be explainable -- "Of course the tower fell that way, the base was off-center." The best physics puzzles create levels where the obvious approach almost works, forcing the player to think more carefully about angles, force, and structure. They also embrace the emergent chaos of physics: no two attempts play out identically because tiny differences in trajectory or impact point cascade into different results. This makes every attempt feel fresh, even on the same level, and turns failures into entertainment rather than frustration.

### The Essential Mechanic

Setting up conditions and letting physics resolve the outcome -- the player designs the cause, physics delivers the effect.

---

## Week 2: Build the MVP

### What You're Building

An Angry Birds-style physics puzzle game where the player launches projectiles from a slingshot at destructible structures. The game uses a physics engine (Box2D, Matter.js, or your engine's built-in physics) to simulate rigid bodies, collisions, and destruction. Levels consist of structures made from blocks of different materials (wood, stone, ice) that break apart when hit with enough force. The goal is to destroy all target objects in each level using a limited number of projectiles. Scoring is based on efficiency: fewer shots earn more stars.

### Core Concepts

**1. Physics Engine Integration**

A physics engine handles rigid body simulation: objects have mass, velocity, and angular velocity. They collide with each other, stack under gravity, and respond to applied forces. You create physics bodies, set their properties, and let the engine simulate each frame.

```
// Setting up the physics world
function create_physics_world():
    world = PhysicsWorld(gravity={x: 0, y: -9.81})
    return world

// Creating rigid bodies
function create_block(world, x, y, width, height, material):
    body = world.create_body(
        type: DYNAMIC,
        position: {x, y},
        shape: Rectangle(width, height),
        density: material.density,       // kg/m^2
        friction: material.friction,
        restitution: material.bounciness // 0 = no bounce, 1 = perfect bounce
    )
    body.material = material
    body.health = material.health         // how much impact it can absorb
    return body

function create_ground(world):
    world.create_body(
        type: STATIC,                    // does not move
        position: {0, 0},
        shape: Rectangle(LEVEL_WIDTH, 1),
        friction: 0.8
    )

// Materials with different properties
materials = {
    "wood":  {density: 0.5, friction: 0.6, bounciness: 0.1, health: 50},
    "stone": {density: 2.0, friction: 0.8, bounciness: 0.05, health: 150},
    "ice":   {density: 0.3, friction: 0.1, bounciness: 0.2, health: 25}
}

function physics_step(world, delta_time):
    world.step(delta_time)               // advance simulation by delta_time seconds
    // physics engine resolves all collisions, forces, and constraints
```

*Why it matters:* The physics engine is the core of the entire game. You are not writing collision detection or force resolution from scratch -- you are using an existing engine as a tool. Understanding how to configure rigid bodies (density, friction, restitution), choose between static and dynamic bodies, and step the simulation at a fixed timestep is the fundamental skill. The physics engine is doing the "gameplay" -- your job is to set up the pieces and let it run.

**2. Trajectory Prediction / Aiming Arc**

Before the player releases the slingshot, the game shows a predicted trajectory as a dotted line. This helps the player aim without guessing. The prediction simulates the projectile's path under gravity without actually launching it.

```
PREDICTION_STEPS = 60
PREDICTION_TIMESTEP = 0.05    // seconds per step

function calculate_trajectory(launch_position, launch_velocity):
    points = []
    pos = launch_position.copy()
    vel = launch_velocity.copy()

    for i in 0..PREDICTION_STEPS:
        points.append(pos.copy())
        // basic projectile motion (no air resistance)
        vel.y += GRAVITY * PREDICTION_TIMESTEP
        pos.x += vel.x * PREDICTION_TIMESTEP
        pos.y += vel.y * PREDICTION_TIMESTEP

        // stop prediction if it goes below ground
        if pos.y <= GROUND_Y:
            points.append({pos.x, GROUND_Y})
            break

    return points

function draw_trajectory(points):
    for i in 0..points.length:
        if i % 3 == 0:    // draw every third point for dotted effect
            draw_circle(points[i], radius=2, color=WHITE, alpha=0.5)

function update_aiming(slingshot_anchor, pointer_position):
    pull_vector = slingshot_anchor - pointer_position
    launch_velocity = pull_vector * LAUNCH_FORCE_MULTIPLIER
    trajectory = calculate_trajectory(slingshot_anchor, launch_velocity)
    draw_trajectory(trajectory)
```

*Why it matters:* The aiming arc bridges the gap between the player's intent and the physics simulation. Without it, aiming is pure guesswork and the game feels random. With it, the player can reason about trajectories, adjust angles precisely, and make informed decisions. The prediction only simulates gravity (not collisions with structures), so the player knows where the projectile will go but not exactly what it will hit or how the impact will cascade -- preserving the surprise that makes physics puzzles satisfying.

**3. Destructible Structures**

Blocks in the structure have a health value. When a collision applies enough force, the block takes damage. If its health reaches zero, it breaks apart. Different materials have different health thresholds, creating structures with strong and weak points.

```
function on_collision(body_a, body_b, collision_info):
    impact_force = collision_info.impulse_magnitude

    for body in [body_a, body_b]:
        if body.has("health"):
            damage = calculate_damage(impact_force, body.material)
            body.health -= damage

            if body.health <= 0:
                destroy_block(body)
            else:
                // visual feedback: cracks appear
                crack_level = 1.0 - (body.health / body.material.max_health)
                update_crack_sprite(body, crack_level)

function calculate_damage(impact_force, material):
    // force below threshold does no damage
    if impact_force < material.damage_threshold:
        return 0
    return (impact_force - material.damage_threshold) * material.damage_multiplier

function destroy_block(body):
    spawn_debris_particles(body.position, body.material)
    physics_world.remove_body(body)
    add_score(body.material.score_value)

    // the removal of this block may cause the structure above to collapse
    // (the physics engine handles this automatically -- gravity does the work)
```

*Why it matters:* Destructible structures are what turn a projectile launcher into a puzzle game. The player must read the structure: stone blocks at the base are hard to destroy directly, but if you can knock out the wooden supports, gravity will collapse the stone onto the targets below. The cascading destruction -- where removing one block causes a chain reaction of collapses -- is the emergent gameplay that makes physics puzzles replayable. No two collapses are exactly alike.

**4. Material Properties**

Different materials behave differently under physics simulation. Wood is light and breaks easily. Stone is heavy and durable but devastating when it falls on things. Ice is fragile and slippery. These properties are data-driven: each material is a set of numbers, not a separate code path.

```
material_definitions = {
    "wood": {
        density: 0.5,            // light
        friction: 0.6,           // moderate grip
        restitution: 0.1,        // barely bounces
        health: 50,              // breaks with moderate force
        damage_threshold: 10,    // minimum force to cause damage
        damage_multiplier: 1.0,
        score_value: 100,
        color: BROWN,
        debris_count: 4
    },
    "stone": {
        density: 2.0,            // heavy
        friction: 0.8,           // good grip
        restitution: 0.05,       // almost no bounce
        health: 150,             // very durable
        damage_threshold: 40,    // needs heavy impact
        damage_multiplier: 0.5,  // takes less damage per hit
        score_value: 300,
        color: GRAY,
        debris_count: 6
    },
    "ice": {
        density: 0.3,            // very light
        friction: 0.1,           // slippery
        restitution: 0.2,        // slightly bouncy
        health: 25,              // shatters easily
        damage_threshold: 5,     // almost any impact damages
        damage_multiplier: 2.0,  // takes extra damage
        score_value: 50,
        color: LIGHT_BLUE,
        debris_count: 8          // shatters into many pieces
    }
}

function create_block_from_material(world, x, y, w, h, material_name):
    mat = material_definitions[material_name]
    body = create_block(world, x, y, w, h, mat)
    body.sprite = load_sprite(material_name + "_block")
    return body
```

*Why it matters:* Data-driven material properties mean you can tune the entire game's feel by changing numbers, not code. Want stone to be even tougher? Increase its health and damage_threshold. Want ice to shatter more dramatically? Increase debris_count and damage_multiplier. This approach also makes it trivial to add new materials -- rubber, metal, glass -- without writing new collision logic. The material system is a lesson in separating data from behavior, a principle that applies to every software domain.

**5. Scoring Based on Efficiency**

The player earns a score based on how efficiently they complete each level. Fewer projectiles used means a higher score. Star ratings (1-3 stars) provide clear goals and encourage replay.

```
MAX_STARS = 3

function calculate_score(level, projectiles_used, targets_destroyed, total_targets):
    if targets_destroyed < total_targets:
        return {score: 0, stars: 0}      // did not complete level

    // base score for completion
    base_score = 1000

    // bonus for unused projectiles
    unused = level.max_projectiles - projectiles_used
    projectile_bonus = unused * 500

    // bonus for collateral destruction (non-target blocks destroyed)
    destruction_bonus = blocks_destroyed * 50

    total = base_score + projectile_bonus + destruction_bonus
    return {score: total, stars: calculate_stars(projectiles_used, level)}

function calculate_stars(projectiles_used, level):
    // star thresholds defined per level
    if projectiles_used <= level.three_star_threshold:
        return 3
    elif projectiles_used <= level.two_star_threshold:
        return 2
    else:
        return 1     // completed = at least 1 star

// Example level definition with star thresholds:
// level.max_projectiles = 5
// level.three_star_threshold = 1   (complete in 1 shot = 3 stars)
// level.two_star_threshold = 3     (complete in 2-3 shots = 2 stars)
// otherwise = 1 star
```

*Why it matters:* Scoring transforms a binary puzzle (solved or not) into a spectrum of mastery. A player who completes a level in five shots knows they succeeded, but they also know that someone could do it in two. The star rating system provides a clear, universal language for quality of solution -- everyone understands that three stars is better than one. This encourages replay without forcing it: casual players move on after one star, competitive players chase three stars on every level.

**6. Level Clear Detection**

The game must determine when a level is complete: all targets are destroyed and the physics simulation has settled. The "settled" part is critical -- you cannot check for victory while blocks are still mid-air from a collapse.

```
SETTLE_VELOCITY_THRESHOLD = 0.1     // below this, a body is "at rest"
SETTLE_CHECK_DELAY = 2.0            // seconds after last projectile impact
TARGET_TAG = "target"

function is_physics_settled(world):
    for body in world.dynamic_bodies:
        speed = body.velocity.magnitude()
        angular_speed = abs(body.angular_velocity)
        if speed > SETTLE_VELOCITY_THRESHOLD or angular_speed > SETTLE_VELOCITY_THRESHOLD:
            return false
    return true

function check_level_clear(world, level):
    // don't check while things are still moving
    if not is_physics_settled(world):
        return PENDING

    remaining_targets = world.bodies.filter(b => b.tag == TARGET_TAG AND b.alive)
    if len(remaining_targets) == 0:
        return VICTORY
    elif player.projectiles_remaining == 0:
        return DEFEAT        // no ammo left and targets survive
    else:
        return PENDING       // still have ammo, can try again

function update_game(world, delta_time):
    physics_step(world, delta_time)

    if time_since_last_launch > SETTLE_CHECK_DELAY:
        result = check_level_clear(world, current_level)
        if result == VICTORY:
            show_victory_screen(calculate_score(...))
        elif result == DEFEAT:
            show_retry_screen()
```

*Why it matters:* Level clear detection must be patient. If you check immediately after the projectile hits, the structure might still be collapsing -- blocks falling from a destroyed support could land on a target that was not directly hit. The settled-check pattern (wait until all bodies are nearly at rest, then evaluate) is a common technique in physics-based games. Getting this wrong leads to premature victory declarations or, worse, the player watching a target get crushed by falling debris after the "defeat" screen has already appeared.

**7. Slingshot / Launch Mechanic**

The player drags backward from the slingshot to set the angle and power of the launch. The drag distance and direction map directly to the launch force vector. Releasing fires the projectile.

```
SLINGSHOT_POSITION = {x: 100, y: 300}
MAX_PULL_DISTANCE = 150
LAUNCH_FORCE_MULTIPLIER = 10.0

class Slingshot:
    anchor: Vector2 = SLINGSHOT_POSITION
    is_aiming: bool = false
    pull_vector: Vector2 = {0, 0}
    current_projectile: PhysicsBody = null

function on_pointer_down(position):
    if distance(position, slingshot.anchor) < GRAB_RADIUS:
        slingshot.is_aiming = true
        slingshot.current_projectile = create_projectile(slingshot.anchor)

function on_pointer_move(position):
    if not slingshot.is_aiming: return
    pull = slingshot.anchor - position
    // clamp to max pull distance
    if pull.magnitude() > MAX_PULL_DISTANCE:
        pull = pull.normalized() * MAX_PULL_DISTANCE
    slingshot.pull_vector = pull
    // move projectile to pulled position (visual feedback)
    slingshot.current_projectile.position = slingshot.anchor - pull
    // show trajectory preview
    launch_velocity = pull * LAUNCH_FORCE_MULTIPLIER
    trajectory = calculate_trajectory(slingshot.anchor, launch_velocity)
    draw_trajectory(trajectory)

function on_pointer_release():
    if not slingshot.is_aiming: return
    slingshot.is_aiming = false
    launch_velocity = slingshot.pull_vector * LAUNCH_FORCE_MULTIPLIER
    slingshot.current_projectile.apply_impulse(launch_velocity)
    slingshot.current_projectile = null
    player.projectiles_remaining -= 1
```

*Why it matters:* The slingshot mechanic is the player's only point of interaction with the physics world. The drag-and-release input maps human gesture to physics force vector in a way that feels natural: pull back farther for more power, change the angle by dragging in a different direction. The rubber-band visual of the slingshot stretching provides immediate feedback about force and direction. This input method was pioneered by *Angry Birds* and has become the standard for mobile physics games because it works perfectly with touch input -- but it translates just as well to mouse or even gamepad.

### Stretch Goals

- **Multiple projectile types:** Different projectiles with unique abilities (one that splits into three mid-flight, one that explodes on impact, one that accelerates forward). The player selects which to use for each shot.
- **Joints and constraints:** Connect blocks with breakable joints (hinges, springs) so structures sway and deform before breaking apart. This adds a whole new dimension to structural design.
- **Slow-motion replay:** After each shot, offer a slow-motion replay of the destruction so the player can appreciate the chaos in detail.
- **Level editor:** Let the player place blocks, targets, and the slingshot position to create custom levels.

### MVP Spec

| Element | Scope |
|---|---|
| Physics | Engine-provided rigid body simulation with gravity, collision, and friction |
| Slingshot | Drag-and-release input mapped to force vector, visual pull-back feedback |
| Trajectory | Dotted-line preview of projectile path during aiming |
| Structures | 5-8 levels with pre-built block structures |
| Materials | 3 types: wood (light, weak), stone (heavy, strong), ice (light, fragile) |
| Targets | Tagged objects within or behind structures that must be destroyed |
| Destruction | Health-based block breaking on collision impact, debris particles |
| Scoring | Star rating (1-3) based on projectiles used, displayed on level complete |
| Clear detection | Wait for physics to settle, then check if all targets are destroyed |
| Projectiles | 3-5 projectiles per level (adjustable per level) |
| Rendering | 2D side-view with slingshot on the left, structure on the right, ground plane |

### Deliverable

A playable physics puzzle game with 5-8 levels where the player launches projectiles from a slingshot at destructible structures. The game must use a physics engine for simulation (not hand-rolled collision), include at least three material types with different properties, show a trajectory preview while aiming, detect level completion only after physics settles, and display a star rating based on efficiency. A full playthrough of all levels should take approximately 15-20 minutes.

---

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Physics Engine Integration | Like using a database engine -- you do not write the storage layer, you configure schemas (bodies), set properties (density, friction), and let the engine handle queries (collisions, forces) |
| Trajectory Prediction | Like a dry-run mode for database migrations -- simulate the operation without committing to see what the result would be, then decide whether to execute |
| Destructible Structures | Like cascading deletes in a relational database -- removing one entity (block) causes dependent entities to be cleaned up (collapse), and the cascade can be deeper than you expect |
| Material Properties | Like configuration profiles for different deployment environments -- the same service code runs differently based on the config (dev/staging/prod), just as the same collision code behaves differently based on material parameters |
| Scoring Based on Efficiency | Like performance benchmarking -- the task must complete (all targets destroyed), but the quality metric is resource consumption (fewer requests, less compute, fewer projectiles) |
| Level Clear Detection | Like eventual consistency checks -- you cannot verify the final state until all in-flight operations have settled, so you poll until the system quiesces, then read |
| Slingshot / Launch Mechanic | Like an API request builder -- the user composes the request (angle, force) with visual feedback, then sends it, and the response (physics result) is processed asynchronously |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Physics Engine Integration | Like using a layout engine (Flexbox, CSS Grid) -- you declare what you want (positions, sizes, constraints) and the engine calculates the actual pixel positions |
| Trajectory Prediction | Like a live preview in a WYSIWYG editor -- as you adjust settings, the preview updates in real time to show the approximate result before you commit |
| Destructible Structures | Like a DOM tree where removing a parent element causes all children to reflow and potentially disappear -- structural changes cascade through the hierarchy |
| Material Properties | Like design tokens -- a centralized set of values (colors, spacing, typography) that control how components look and behave without changing the component code |
| Scoring Based on Efficiency | Like Lighthouse performance scoring -- the page must load (level cleared), but the score depends on how efficiently it loads (fewer requests, smaller bundles, fewer projectiles) |
| Level Clear Detection | Like waiting for all animations and transitions to complete before measuring layout -- you cannot assert the final state until the rendering pipeline has settled |
| Slingshot / Launch Mechanic | Like a drag-and-drop interaction -- the user grabs an element, drags to set position and direction, and releases to trigger an action with the gesture as input |

### Data / ML Engineers

| Core Concept | Analogy |
|---|---|
| Physics Engine Integration | Like using a numerical solver library (SciPy, NumPy) -- you define the system of equations (bodies, forces, constraints) and the solver computes the next state |
| Trajectory Prediction | Like forward-propagating a model without backprop -- you run the inference to see the output but do not commit any parameter updates |
| Destructible Structures | Like pruning a neural network -- removing nodes (blocks) causes dependent connections to collapse, and the cascade can dramatically change the network's structure |
| Material Properties | Like hyperparameter configurations -- the same architecture (block shape) produces different behaviors based on parameter values (learning rate = density, batch size = friction) |
| Scoring Based on Efficiency | Like model evaluation where accuracy is the pass/fail but efficiency metrics (FLOPs, parameter count, inference time) determine the ranking |
| Level Clear Detection | Like waiting for a distributed training step to synchronize across all workers before evaluating the aggregated result |
| Slingshot / Launch Mechanic | Like setting initial conditions for a simulation -- the input parameters (angle, magnitude) fully determine the trajectory, and the result is a deterministic (or near-deterministic) function of the input |

---

## Discussion Questions

1. **Determinism vs. Chaos:** Physics engines can produce slightly different results from the same initial conditions due to floating-point precision and solver iterations. Should a physics puzzle be perfectly deterministic (same input always produces the same result), or is slight variation acceptable? How does this affect the player's ability to learn from failed attempts?

2. **Readability of Failure:** When a player's shot fails, they need to understand why. But physics simulations can be fast and chaotic -- blocks fly everywhere in a split second. How do you design the visual feedback so that the player can read what happened and adjust their next shot? What role does slow motion, camera tracking, or replay play?

3. **The Tutorial Problem:** Physics puzzles seem intuitive ("just launch the bird"), but players often struggle with the relationship between drag distance and force, or how different materials behave. How would you teach these concepts through level design rather than text tutorials? What would your first three levels look like?

4. **Physics as Content:** In a traditional puzzle game, every challenge is hand-authored. In a physics puzzle, the physics engine generates emergent outcomes that the designer did not explicitly script. How does this change the designer's role? Are you designing puzzles, or are you designing the conditions for puzzles to emerge?
