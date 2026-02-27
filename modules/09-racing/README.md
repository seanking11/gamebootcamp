# Module 09: Racing Game

**Weeks 17-18** | *Controlling momentum through curves — the tension between speed and precision.*

---

## Prerequisites

- **Module 1 (Pong):** You need comfort with a game loop, real-time input handling, and basic collision detection.
- **Module 2 (Platformer):** You need familiarity with velocity, acceleration, gravity, and friction as forces applied per frame. Racing physics extend platformer physics from a side-view to a top-down (or pseudo-3D) perspective.

---

## Week 1: History & Design Theory

### The Origin

**Pole Position** (Namco, 1982) was the first racing game to feel like driving. Earlier games like *Night Driver* (1976) and *Sprint* (1977) had cars on tracks, but Pole Position introduced the rear-view perspective that would define the genre for decades: the player's car at the bottom of the screen, the track stretching out ahead with roadside objects scaling up as they approached. It was the first racing game based on a real circuit (Fuji Speedway), the first to feature a qualifying lap that determined your starting position, and the first to make speed itself feel dangerous. The game earned more revenue than any other arcade game in 1983. Its core insight was that racing games are not about steering a sprite — they are about the illusion of velocity.

### How the Genre Evolved

**Super Mario Kart** (Nintendo, 1992) shattered the assumption that racing games had to simulate real driving. Built on the SNES's Mode 7 hardware — a texture-mapping trick that rotated and scaled a flat image to create the illusion of a 3D plane — it introduced item pickups, weapons, and character-specific stats. You could be in first place and lose it to a well-timed red shell. This was a deliberate design choice: Mario Kart prioritized fun and social tension over pure skill. It invented the "kart racer" subgenre and established the template that items, catch-up mechanics, and accessible controls could make racing games appeal to everyone. The item system also introduced a core design problem the genre still wrestles with: how much should randomness override skill?

**Gran Turismo** (Polyphony Digital, 1997) swung the pendulum in the opposite direction. With over 140 real-world cars, each with unique handling characteristics derived from actual vehicle data, it created the "simulation racing" category on consoles. Gran Turismo introduced car tuning — adjusting suspension, gear ratios, tire compounds — turning the garage into a second game. Mario Kart has a simple car config object; Gran Turismo has a deeply parameterized physics model where each property meaningfully affects the simulation output. The game sold over 10 million copies and proved there was a massive audience for racing-as-engineering.

**Futuristic racers** like **F-Zero** (Nintendo, 1990) and **Wipeout** (Psygnosis, 1995) explored what racing becomes when you remove the constraints of real vehicles — anti-gravity ships, track designs impossible in physical space, speeds that demanded twitch-level precision. Modern games like **Forza Horizon** (Playground Games, 2012-present) blend the best of both worlds: simulation-grade physics underneath, but tuned for fun, set in open worlds where the track is wherever you point the car. The genre continues to evolve, but the core tension has remained constant since Pole Position: the faster you go, the less control you have.

### What Makes Racing Great

A great racing game creates a constant negotiation between aggression and precision. Every curve is a decision: brake early and lose time, or carry speed and risk losing control. This is what separates racing from other movement-based games — in a platformer, you want maximum speed almost always. In a racing game, speed is a resource you spend and manage. The best racing games make the track itself feel like an opponent, and every lap feels different because your relationship with the car's momentum changes as you learn the course.

### The Essential Mechanic

Controlling momentum through curves — the tension between speed and precision.

---

## Week 2: Build the MVP

### What You're Building

A top-down racing game where the player drives a car around a closed track, completing laps against AI opponents. The car uses a physics-based steering model (not grid movement), drifts on curves, and races against AI that follows waypoints with rubber-banding to keep races competitive.

### Core Concepts (Must Implement)

#### 1. Steering Model (Forward Thrust + Turning Angle)

Racing movement is fundamentally different from the grid-based or WASD movement you have used in other modules. A car cannot strafe. It moves forward (or backward) along its heading, and turning changes that heading. This is often modeled as a simplified "bicycle model" — the car has a position, a heading angle, and a speed. Acceleration pushes along the heading vector; steering rotates the heading.

```
// Simplified bicycle steering model
function updateCar(car, input, deltaTime):
    // Steering only works when moving
    if input.left:
        car.steerAngle = -MAX_STEER_ANGLE
    else if input.right:
        car.steerAngle = MAX_STEER_ANGLE
    else:
        car.steerAngle = 0

    if input.accelerate:
        car.speed = min(car.speed + ACCELERATION * deltaTime, MAX_SPEED)
    else if input.brake:
        car.speed = max(car.speed - BRAKING_FORCE * deltaTime, -MAX_REVERSE_SPEED)
    else:
        // Coast: friction slows the car naturally
        car.speed = car.speed * (1 - DRAG * deltaTime)

    // Turning radius depends on speed — faster = wider turns
    turnRadius = WHEELBASE / sin(car.steerAngle)  // only if steerAngle != 0
    angularVelocity = car.speed / turnRadius
    car.heading += angularVelocity * deltaTime

    // Move along heading
    car.x += cos(car.heading) * car.speed * deltaTime
    car.y += sin(car.heading) * car.speed * deltaTime
```

**Why it matters:** This is a constrained physics simulation. The car's heading is state that persists between frames and constrains future movement. Unlike grid movement where any direction is available, the steering model means your current state (heading, speed) determines what states you can reach next. This is true of any physically-grounded movement system -- boats, planes, and spaceships all share this property.

#### 2. Friction and Drift

Different surfaces (road, grass, dirt) apply different friction coefficients. When the car's lateral velocity exceeds its grip threshold, it enters a drift state — sliding sideways while the player can steer into the skid. This is the core skill expression of racing games.

```
// Surface friction model
function applyFriction(car, surface):
    gripFactor = surface.grip  // 1.0 for road, 0.4 for grass, 0.6 for dirt

    // Decompose velocity into forward and lateral components
    forwardVelocity = dotProduct(car.velocity, car.forwardVector)
    lateralVelocity = dotProduct(car.velocity, car.rightVector)

    // Lateral friction (what keeps you on the road)
    maxLateralGrip = gripFactor * LATERAL_GRIP_BASE
    if abs(lateralVelocity) > maxLateralGrip:
        car.isDrifting = true
        // Reduce lateral grip but don't eliminate it (slide, don't spin)
        lateralVelocity = lateralVelocity * DRIFT_FRICTION
    else:
        car.isDrifting = false
        lateralVelocity = lateralVelocity * gripFactor

    // Reconstruct velocity
    car.velocity = forwardVelocity * car.forwardVector
                  + lateralVelocity * car.rightVector
```

**Why it matters:** This is a pipeline of transformations applied to a velocity vector. Each layer (surface type, drift state, braking) transforms the data flowing through. The threshold-based state transition -- grip vs. drift triggered by lateral velocity exceeding a limit -- is a pattern that appears throughout physics simulation. Tuning these thresholds is what makes a car feel "grippy" or "slidey," and it is one of the most important feel adjustments in any racing game.

#### 3. Track and Checkpoint System

The track is defined as a closed loop. Checkpoints are invisible gates placed around the track in order. Each racer must pass through checkpoints sequentially to complete a valid lap. This prevents shortcutting (driving backward through one gate to skip half the track).

```
// Checkpoint system
class CheckpointTracker:
    checkpoints = [gate0, gate1, gate2, ..., gateN]  // ordered around track
    nextCheckpointIndex = 0
    lapCount = 0

    function onRacerCrossesGate(racer, gateIndex):
        if gateIndex == this.nextCheckpointIndex:
            this.nextCheckpointIndex += 1
            if this.nextCheckpointIndex >= checkpoints.length:
                this.nextCheckpointIndex = 0
                this.lapCount += 1
                if this.lapCount >= TOTAL_LAPS:
                    triggerFinish(racer)
        // If wrong checkpoint, do nothing — racer must hit them in order
```

**Why it matters:** This is a sequence validation problem. A racer must pass through checkpoints in a defined order, and skipping steps invalidates the result. The checkpoint system is a finite state machine where each gate is a state and only forward transitions are legal. It also cleanly separates the visual track (what the player sees) from the logical track (what the game validates) -- an important architectural distinction that makes both systems easier to modify independently.

#### 4. Lap Management and Race State

The race itself is a state machine: countdown, racing, finished. During the race, you track each racer's progress — current lap, last checkpoint, total elapsed time, and split times. Position (1st, 2nd, 3rd) is computed by comparing racers on a combined metric of lap count and checkpoint progress.

```
// Race position calculation
function calculatePositions(racers):
    for racer in racers:
        // Progress = laps completed + fraction of current lap
        racer.progress = racer.lapCount
                       + (racer.lastCheckpoint / TOTAL_CHECKPOINTS)

    // Sort descending by progress, then ascending by time for ties
    racers.sortBy(r => (-r.progress, r.elapsedTime))

    for i, racer in enumerate(racers):
        racer.position = i + 1  // 1st, 2nd, 3rd...
```

**Why it matters:** This is a leaderboard system -- a ranking derived from composite sort keys (progress first, then time for tiebreaking). The race state machine (countdown -> racing -> finished) defines which operations are valid in each phase: you cannot cross the finish line during countdown, and you cannot accelerate after finishing. This phased lifecycle pattern appears in any game with distinct setup, play, and result phases.

#### 5. AI Racing with Waypoints

AI racers follow a predefined path of waypoints placed along the ideal racing line. Each AI car steers toward its next waypoint, adjusting speed based on the angle to the upcoming waypoint (sharp turn ahead = slow down, straight = speed up).

```
// AI waypoint following
function updateAIRacer(ai, waypoints, deltaTime):
    target = waypoints[ai.currentWaypointIndex]
    directionToTarget = normalize(target.position - ai.position)
    angleToTarget = angleBetween(ai.forwardVector, directionToTarget)

    // Steer toward waypoint
    if angleToTarget > STEER_THRESHOLD:
        ai.steerAngle = MAX_STEER_ANGLE * sign(angleToTarget)
    else:
        ai.steerAngle = angleToTarget / STEER_THRESHOLD * MAX_STEER_ANGLE

    // Look ahead: slow down for sharp upcoming turns
    nextTarget = waypoints[(ai.currentWaypointIndex + 1) % waypoints.length]
    turnSharpness = angleBetween(directionToTarget,
                    normalize(nextTarget.position - target.position))
    targetSpeed = lerp(MAX_SPEED, CORNER_SPEED, turnSharpness / PI)
    ai.speed = moveToward(ai.speed, targetSpeed, ACCELERATION * deltaTime)

    // Advance waypoint when close enough
    if distance(ai.position, target.position) < WAYPOINT_RADIUS:
        ai.currentWaypointIndex = (ai.currentWaypointIndex + 1) % waypoints.length
```

**Why it matters:** This is a goal-seeking agent -- the simplest form of autonomous behavior. The AI does not "know" the whole track; it only knows its next waypoint and peeks one waypoint ahead for speed planning. The look-ahead pattern for speed adjustment is a general technique: inspecting upcoming conditions to optimize current behavior. This same approach scales to more complex AI behaviors in other game genres.

#### 6. Rubber-Banding / Catch-Up AI

Racers who fall behind get a speed boost; racers who pull far ahead get slightly slowed. This keeps races competitive regardless of player skill. It is a deliberate, controversial design choice — simulation purists reject it, but it dramatically improves the experience for casual players.

```
// Rubber-banding system
function applyRubberBanding(racer, allRacers):
    leader = allRacers.maxBy(r => r.progress)
    trailer = allRacers.minBy(r => r.progress)
    totalSpread = leader.progress - trailer.progress

    if totalSpread == 0:
        return 1.0  // No adjustment needed

    // Where is this racer in the pack? 0 = last, 1 = first
    normalizedPosition = (racer.progress - trailer.progress) / totalSpread

    // Trailing racers get a boost, leaders get a slight penalty
    // Range: 1.15 (last place) to 0.95 (first place)
    speedMultiplier = lerp(BOOST_MAX, PENALTY_MIN, normalizedPosition)
    return speedMultiplier
```

**Why it matters:** This is dynamic difficulty adjustment -- an algorithm that modifies system parameters based on observed performance. The tradeoff is fairness vs. engagement: do you let the fastest car win unchallenged, or do you ensure every racer has a competitive experience? Understanding that this is a *design decision* rather than a *technical necessity* is the lesson. Rubber-banding is controversial precisely because it is a value judgment encoded in code.

#### 7. Camera Modes (Chase Cam)

The camera follows behind the player's car, smoothly interpolating its position and rotation to match the car's heading. Without smoothing, the camera snaps instantly and feels jarring. With too much smoothing, it feels sluggish and disconnects the player from the car.

```
// Chase camera with smooth follow
function updateChaseCamera(camera, car, deltaTime):
    // Desired position: behind the car along its heading
    offset = -car.forwardVector * FOLLOW_DISTANCE
    desiredPosition = car.position + offset

    // Smooth interpolation (lerp toward desired position)
    smoothFactor = 1.0 - pow(CAMERA_LAG, deltaTime)
    camera.position = lerp(camera.position, desiredPosition, smoothFactor)

    // Camera looks at a point slightly ahead of the car
    lookTarget = car.position + car.forwardVector * LOOK_AHEAD_DISTANCE
    camera.rotation = smoothLookAt(camera.rotation, lookTarget, smoothFactor)
```

**Why it matters:** This is an exponential moving average applied to position and rotation. The `CAMERA_LAG` parameter controls how much history influences the current value: too responsive and the camera feels jittery, too smooth and it feels sluggish and disconnected. The chase camera is also a clean example of the observer pattern -- the camera does not control the car; it reacts to the car's state with a defined transformation. Tuning camera smoothing is one of the highest-impact "game feel" adjustments you can make.

#### 8. Minimap

The minimap renders a simplified top-down view of the track with dots for each racer's position. It is a second viewport — a different projection of the same game state. The track outline is pre-rendered or drawn from checkpoint positions, and racer positions are mapped from world coordinates to minimap coordinates.

```
// Minimap rendering
function renderMinimap(track, racers, minimapRect):
    // Map world coordinates to minimap coordinates
    function worldToMinimap(worldPos):
        normalizedX = (worldPos.x - track.bounds.left) / track.bounds.width
        normalizedY = (worldPos.y - track.bounds.top) / track.bounds.height
        return (
            minimapRect.x + normalizedX * minimapRect.width,
            minimapRect.y + normalizedY * minimapRect.height
        )

    // Draw track outline
    for i in range(track.checkpoints.length):
        p1 = worldToMinimap(track.checkpoints[i].position)
        p2 = worldToMinimap(track.checkpoints[(i+1) % track.checkpoints.length].position)
        drawLine(p1, p2, COLOR_TRACK)

    // Draw racer dots
    for racer in racers:
        minimapPos = worldToMinimap(racer.position)
        color = COLOR_PLAYER if racer.isPlayer else COLOR_AI
        drawCircle(minimapPos, DOT_RADIUS, color)
```

**Why it matters:** The minimap is a coordinate transformation -- mapping one coordinate space to another. It is also a practical example of the "second view" pattern: the same underlying data (racer positions) rendered in two completely different ways (the main game view and the minimap) without duplicating the data. This principle -- one source of truth, multiple projections -- keeps your architecture clean and prevents synchronization bugs.

### Stretch Goals

1. **Drift boost:** Reward successful drifts with a speed burst when the player straightens out, adding a risk/reward skill mechanic on top of the physics system.
2. **Item pickups (kart-racer style):** Add item boxes on the track that grant random powerups (speed boost, oil slick, missile). This requires an inventory slot system and projectile/hazard logic.
3. **Multiple track surfaces:** Visually distinct road, dirt, and grass zones with different friction values. Cars kick up particles on non-road surfaces.
4. **Ghost replay:** Record the player's inputs each frame and replay them as a ghost car on subsequent runs. This is a command log -- you can reconstruct the entire race from the initial state plus the sequence of inputs.

### MVP Spec

| Element | Requirement |
|---|---|
| **Track** | One closed-loop track with at least 4 curves of varying sharpness |
| **Player car** | Steering model with acceleration, braking, and turning (not grid movement) |
| **Friction** | At least 2 surface types (road and grass/dirt) with different grip values |
| **Drift** | Car visibly slides when lateral velocity exceeds grip; player can steer through it |
| **Checkpoints** | At least 6 checkpoint gates enforcing sequential lap completion |
| **Laps** | 3-lap race with lap counter and total time display |
| **AI opponents** | At least 2 AI racers following waypoints with speed adjustment at curves |
| **Rubber-banding** | Trailing racers receive a speed boost; leading racers are slightly slowed |
| **Position display** | HUD shows current position (1st/2nd/3rd), current lap, and elapsed time |
| **Camera** | Chase camera that follows behind the player car with smooth interpolation |
| **Minimap** | Top-down minimap showing track outline and all racer positions |
| **Win/Lose** | Race ends when player completes 3 laps; final standings displayed |

### Deliverable

A playable top-down (or pseudo-3D) racing game with physics-based steering, at least two AI opponents, a checkpoint-validated lap system, and a minimap. The player must feel the difference between road and off-road surfaces, and AI racers must provide a competitive experience through waypoint following and rubber-banding. Submit the project along with a brief writeup (3-5 sentences) describing how you tuned the steering feel and what tradeoffs you made between simulation accuracy and fun.

## Analogies by Background

> These analogies map game dev concepts to patterns you already know. Find your background below.

### For Backend Developers
| Concept | Analogy |
|---------|---------|
| Steering Model | State machine where current state constrains future transitions -- like a saga pattern where each step limits what can happen next |
| Friction and Drift | Middleware pipeline transforming a request; threshold-based drift is a circuit breaker tripping when a continuous metric exceeds a limit |
| Track and Checkpoint System | Saga orchestration -- a workflow that must complete steps in order; skipping steps invalidates the process |
| Lap Management and Race State | Leaderboard ranking with composite sort keys; race lifecycle mirrors a long-running process (pending -> running -> complete) |
| AI Racing with Waypoints | Queue consumer with peek-ahead -- process the current message, inspect the next to plan resource allocation |
| Rubber-Banding / Catch-Up AI | Autoscaling -- allocate more resources to services falling behind, throttle overprovisioned ones |
| Camera Modes (Chase Cam) | Exponential moving average used in monitoring dashboards and EMA-based alerting thresholds |
| Minimap | CQRS (Command Query Responsibility Segregation) -- one write model (racer positions), multiple read projections (main view, minimap) |

### For Frontend Developers
| Concept | Analogy |
|---------|---------|
| Steering Model | Like a CSS `transform: rotate()` that persists -- each frame applies a delta rotation rather than setting an absolute direction |
| Friction and Drift | CSS transition easing functions -- friction is like `ease-out` decelerating movement; drift is when inertia overrides the easing curve |
| Track and Checkpoint System | Multi-step form validation -- the user must complete steps in order, and the progress bar only advances for valid completions |
| Lap Management and Race State | Page lifecycle states (loading -> interactive -> complete) with a progress indicator derived from scroll position or step completion |
| AI Racing with Waypoints | requestAnimationFrame-driven animation along a predefined path of SVG waypoints, adjusting easing based on upcoming path curvature |
| Rubber-Banding / Catch-Up AI | Responsive design breakpoints that adapt the experience based on viewport size -- struggling small screens get simpler layouts |
| Camera Modes (Chase Cam) | Smooth scroll-to with `scroll-behavior: smooth` -- the viewport follows the target element with configurable interpolation |
| Minimap | A `position: fixed` overview widget showing the full page structure while the main viewport scrolls -- same data, two projections |

### For Data / ML Engineers
| Concept | Analogy |
|---------|---------|
| Steering Model | Differential equations integrated over time steps -- the car's state vector (position, heading, speed) evolves via numerical integration |
| Friction and Drift | Damping coefficients in a physics simulation; drift threshold is a decision boundary in feature space |
| Track and Checkpoint System | Validation gates in a data pipeline DAG -- each stage must complete before the next begins, and order is enforced |
| Lap Management and Race State | Composite ranking metrics like sorting by multiple columns in a DataFrame -- primary key (laps), secondary key (time) |
| AI Racing with Waypoints | Greedy optimization -- the agent pursues the locally optimal waypoint while using one-step lookahead for speed planning |
| Rubber-Banding / Catch-Up AI | Normalization or rebalancing of a skewed distribution -- compressing the spread to keep all values within a useful range |
| Camera Modes (Chase Cam) | Exponential moving average (EMA) for time-series smoothing -- the same `alpha` parameter tradeoff between responsiveness and noise |
| Minimap | Dimensionality reduction for visualization -- projecting the full game state into a simplified 2D representation, like PCA or t-SNE |

---

### Discussion Questions

1. **Rubber-banding is controversial.** Mario Kart uses aggressive catch-up mechanics; Gran Turismo uses none. What are the arguments for and against? How does this map to "fairness" in backend systems — should rate limiting treat all users equally, or should struggling users get more resources?

2. **The bicycle steering model is a simplification of real car physics.** Where would you draw the line between simulation accuracy and player feel? Have you made similar simplification tradeoffs in backend systems (e.g., approximate algorithms, eventual consistency)?

3. **Your checkpoint system is a sequence validator.** What happens if a racer legitimately drives backward (spun out, recovering)? How would you handle edge cases without false-flagging valid play? How does this relate to idempotency and retry handling in distributed systems?

4. **The minimap and the main view render the same data differently.** When is it better to maintain two projections of the same data versus one canonical view? What are the consistency challenges?

---
