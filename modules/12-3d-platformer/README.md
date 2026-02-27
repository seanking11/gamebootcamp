# Module 12: 3D Platformer

**Weeks 23-24 | Camera control, spatial design, and the art of the jump in three dimensions**

> "In a 2D platformer, the camera is solved. In a 3D platformer, the camera IS the problem. Everything else is downstream of whether the player can see where they're going."

---

## Prerequisites

- **Module 2 (2D Platformer)** — gravity, jump arcs, grounded-state detection, tile collision, game feel
- **Module 11 (First-Person Game)** — 3D coordinate systems, transforms, 3D collision, basic lighting, working in an engine

---

## Week 1: History & Design Theory

### The Origin

Shigeru Miyamoto's team at Nintendo spent months on **Super Mario 64 (Nintendo, 1996)** doing something that sounds absurd: just making Mario feel good to move around. Before a single level was designed, before a single enemy was placed, they built a small room and tuned Mario's run, jump, triple-jump, long-jump, wall-jump, backflip, and ground-pound until the act of controlling him was intrinsically fun. The game shipped with the Nintendo 64's analog stick — hardware designed specifically to give players the graduated input that 3D movement demanded.

The camera system was revolutionary and openly acknowledged the problem it was solving. Lakitu, a character who had been a cloud-riding enemy in previous Mario games, was recast as a cameraman literally flying behind Mario with a camera on a fishing pole. When you adjusted the camera, you were directing Lakitu. This was not just a charming metaphor — it was Miyamoto telling the player: "Yes, the camera is a separate thing you manage. Here's a friendly face to make that feel natural."

Super Mario 64 defined 3D platforming. Nearly every solution it pioneered — analog movement, context-sensitive camera, multiple jump types, hub-world structure — became the genre's vocabulary.

### How the Genre Evolved

**Crash Bandicoot (Naughty Dog, 1996)** arrived the same year as Mario 64 and solved the camera problem through a completely different philosophy: constrain it. Rather than giving players a free camera, Crash's camera was mostly fixed — behind the player on rails for forward-running sections, pulled back for side-scrolling segments, and facing the player for chase sequences. By limiting the camera, Naughty Dog ensured the player always had a readable view. The tradeoff was reduced exploration, but the gain was reliable spatial clarity.

**Banjo-Kazooie (Rare, 1998)** expanded the collect-a-thon design that Mario 64 had introduced. Multiple move types (each mapped to button combinations), dozens of collectible types scattered across levels, and ability unlocks that opened new paths in previously visited worlds. Banjo-Kazooie demonstrated that 3D platformers could be about thorough exploration of dense spaces, not just reaching the end of a level.

**A Hat in Time (Gears for Breakfast, 2017)** and **Astro Bot (Team Asobi, 2024)** prove the genre is alive and still evolving. A Hat in Time brought back the joyful movement and collectathon structure with modern polish. Astro Bot pushed the boundaries of what a 3D platformer camera can do, with levels designed around dramatic camera angles and perspective shifts that turn the camera from a liability into a feature.

### What Makes 3D Platformers "Great"

The 3D platformer is a negotiation between two systems that are in constant tension: **character control** and **camera control**. The player needs to execute precise jumps, but they also need to see where they are jumping. These goals frequently conflict — the best angle for seeing the next platform is not always the best angle for judging the distance.

Great 3D platformers resolve this tension through a combination of generous player mechanics (double-jumps, air control, coyote time — the same "lies" from Module 2, now in 3D), smart camera behavior (auto-adjusting to show what matters, never clipping through walls), and level design that is readable from multiple angles (landmarks, color coding, lighting cues).

The result, when it works, is a feeling of freedom and fluidity that no other genre matches.

### The Essential Mechanic

**Jumping and landing on platforms while managing a camera that must make 3D space readable** — the marriage of character control and camera control. The player is simultaneously a performer (executing jumps) and a director (managing the camera), and the game must make both jobs feel natural.

---

## Week 2: Build the MVP

### What You're Building

A small 3D level with platforms at varying heights and positions that the player must jump between to reach a goal or collect items. The focus is on making the jump feel good, the camera feel helpful, and the space feel readable. This is not about scale — a tight, well-designed space with 10-15 platforms is more valuable than a sprawling empty world.

> **A note about 3D and engines:** Unlike 2D modules where raw code was viable, 3D development heavily benefits from an engine. Unity, Godot, or Unreal will handle rendering, lighting, and physics so you can focus on game-specific mechanics.

### Core Concepts (Must Implement)

#### 1. Third-Person Camera System

An orbit camera that follows the player at a fixed distance and can be rotated by the player (right stick or mouse). The camera must handle collision — if it would clip through a wall, it moves closer to the player. In tight spaces, the camera must gracefully adjust without jarring jumps.

```
// Orbit camera each frame:
yaw   += inputX * rotateSpeed
pitch += inputY * rotateSpeed
pitch  = clamp(pitch, -30, 60)   // limit vertical range

// Desired camera position: offset behind and above player
offset.x = -sin(yaw) * cos(pitch) * distance
offset.y =  sin(pitch) * distance
offset.z = -cos(yaw) * cos(pitch) * distance

desiredPosition = player.position + offset

// Camera collision: raycast from player to desired position
hit = raycast(player.position, direction_to(desiredPosition), distance)
if hit:
  camera.position = hit.point + hit.normal * skinWidth  // pull in front of wall
else:
  camera.position = desiredPosition

camera.lookAt(player.position + (0, 1, 0))  // look at player's head
```

**Why it matters:** The third-person camera is arguably the hardest unsolved problem in game design. No automatic system works perfectly in all situations, which is why nearly every 3D platformer gives the player manual camera control. Understanding camera collision and orbit math is essential for any third-person 3D game.

#### 2. 3D Character Controller with Jump

Extend the Module 11 character controller with a jump system. Gravity pulls the player down each frame. When grounded and the jump button is pressed, apply an upward velocity impulse. Ground detection uses a short downward raycast or sphere-cast to check if the player is standing on something, including the surface normal to handle slopes.

```
// Gravity:
velocity.y -= gravity * dt

// Ground detection:
groundHit = spherecast(player.position, DOWN, radius=0.3, distance=0.1)
isGrounded = groundHit != null

// Jump:
if isGrounded and jumpPressed:
  velocity.y = jumpForce

// Slope handling:
if isGrounded:
  slopeAngle = angle_between(groundHit.normal, UP)
  if slopeAngle > maxSlopeAngle:
    // Slide down steep slopes
    velocity += project_on_plane(DOWN * gravity, groundHit.normal) * dt

player.position += velocity * dt
```

**Why it matters:** The 3D jump is the direct evolution of Module 2's gravity and grounded-state detection. The core physics are identical — Euler integration of gravity, velocity impulse on jump — but ground normals and slope handling add complexity that does not exist on a flat 2D tilemap.

#### 3. Camera-Relative Movement

When the player pushes the stick forward, the character must move toward where the camera is facing, not toward a fixed world direction. This means converting stick input from the camera's local coordinate frame into world-space movement.

```
// Get camera's ground-plane directions:
camForward = camera.forward
camForward.y = 0
camForward = normalize(camForward)

camRight = camera.right
camRight.y = 0
camRight = normalize(camRight)

// Map input to camera-relative direction:
moveDir = camForward * stickY + camRight * stickX

if length(moveDir) > 0:
  moveDir = normalize(moveDir)
  player.rotation = look_rotation(moveDir)  // face movement direction
  player.position += moveDir * moveSpeed * dt
```

This is THE key UX insight of 3D platformers. Without camera-relative movement, the player would need to mentally translate between "push stick up" and "character moves world-north," which breaks down the moment the camera rotates. Camera-relative input makes "forward" always intuitive.

**Why it matters:** Camera-relative movement is what separates a playable 3D game from a frustrating one. This same pattern applies to every third-person game, from platformers to action-adventure to open-world games. It is one of the most universally applied concepts in 3D game development.

#### 4. 3D Spatial Design and Level Layout

Design platforms and spaces that are readable from a dynamic camera angle. Use landmarks (a tall, distinct object visible from many angles) for orientation. Use color and lighting to distinguish platforms from background geometry. Place platforms so the player can judge distance — gaps that look jumpable should be jumpable.

Key design principles:
- **Silhouette readability** — platforms should have distinct shapes visible from multiple angles
- **Consistent scale** — the player should be able to internalize how far they can jump and apply that knowledge throughout the level
- **Visual layering** — foreground (interactive) geometry should be visually distinct from background (decorative) geometry
- **Sightlines** — the player should usually be able to see their next goal before they reach it

```
// Level design as data (conceptual):
platforms = [
  { position: (0, 0, 0),   size: (5, 0.5, 5),  color: "green"  },  // start
  { position: (4, 1, 3),   size: (2, 0.5, 2),  color: "green"  },  // step up
  { position: (8, 2.5, 1), size: (2, 0.5, 2),  color: "green"  },  // gap jump
  { position: (8, 4, 6),   size: (3, 0.5, 3),  color: "gold"   },  // goal
]
landmark = { position: (8, 0, 6), model: "tall_pillar" }  // visible from start
```

**Why it matters:** Level design in 3D is harder than in 2D because the player's viewpoint is variable. In a 2D platformer, you control exactly what the player sees. In 3D, you must design spaces that communicate effectively from many possible camera angles. This is a design skill, not just a technical one.

#### 5. Shadow / Blob Under Player

Project a dark circle (a "blob shadow") directly below the player onto whatever surface is underneath. This fake shadow tells the player exactly where they will land, solving the biggest problem in 3D platforming: judging vertical position over a surface.

```
// Each frame, cast a ray down from the player:
shadowHit = raycast(player.position, DOWN, maxDistance=50)

if shadowHit:
  blobShadow.position = shadowHit.point + shadowHit.normal * 0.01  // slightly above surface
  blobShadow.rotation = align_to_normal(shadowHit.normal)
  blobShadow.visible = true
  // Scale based on height (optional: smaller when higher up)
  height = player.position.y - shadowHit.point.y
  blobShadow.scale = max(0.5, 1.0 - height * 0.05)
else:
  blobShadow.visible = false   // over a void
```

**Why it matters:** Without a shadow, players cannot tell if they are directly above a platform or five meters to the left of it. This is a "generous lie" — real shadows are complex and expensive, but a simple blob projected downward solves the gameplay problem. Super Mario 64, Banjo-Kazooie, and nearly every 3D platformer uses this technique. It is one of the highest-leverage additions to 3D platforming feel.

#### 6. Moving Platforms in 3D

Create platforms that move along a path (back and forth, in a loop, or on a timer). When the player stands on a moving platform, they must move with it. This requires parent-child transform relationships: while standing on the platform, the player's movement is in the platform's local space.

```
// Moving platform update:
platform.t += speed * dt
platform.position = lerp(pointA, pointB, ping_pong(platform.t))

// When player lands on a moving platform:
if player.groundHit.object == platform:
  // Track the platform's movement delta and apply to player:
  platformDelta = platform.position - platform.previousPosition
  player.position += platformDelta

// Alternative: parent the player to the platform transform
// so the player inherits the platform's movement automatically
```

**Why it matters:** Moving platforms introduce the critical distinction between local space and world space. The player's "local" position on the platform stays constant, but their world position changes because the platform (their temporary parent) is moving. This parent-child transform relationship is the same pattern used for objects held by characters, vehicles carrying passengers, and any hierarchical attachment in 3D.

#### 7. Collectibles in 3D Space

Place items (coins, stars, gems) throughout the level to guide the player through 3D space. Collectibles serve as breadcrumbs — a trail of items leading toward a platform implicitly tells the player "jump here." They rotate slowly to catch the eye and trigger a sound and particle effect on pickup.

```
// Collectible behavior each frame:
collectible.rotation.y += spinSpeed * dt   // slow spin to catch light

// Pickup detection:
dist = distance(player.position, collectible.position)
if dist < pickupRadius:
  player.score += collectible.value
  play_sound("collect")
  spawn_particles(collectible.position)
  collectible.active = false

// Level design: place collectibles to guide the player
// A line of coins in the air shows the arc of a jump
// A cluster of items highlights an important platform
```

**Why it matters:** Collectibles solve a navigation problem unique to 3D: the player can get lost. In 2D, "go right" is almost always correct. In 3D, the player has freedom in every direction, and collectibles provide implicit wayfinding. They also give the player secondary objectives beyond reaching the end, encouraging exploration and rewarding spatial awareness.

#### 8. Double-Jump and Air Control

Give the player a second jump in mid-air and allow directional influence while airborne. Neither of these is physically realistic — real humans cannot change direction mid-jump or jump off of nothing — but both are essential for making 3D platforming feel responsive and forgiving.

```
// Jump state tracking:
jumpsRemaining = maxJumps   // 2 for double-jump

if jumpPressed and jumpsRemaining > 0:
  velocity.y = jumpForce
  jumpsRemaining -= 1

// Reset on landing:
if isGrounded:
  jumpsRemaining = maxJumps

// Air control: allow direction changes while airborne
if not isGrounded:
  airMoveDir = camForward * stickY + camRight * stickX
  airMoveDir = normalize(airMoveDir) * airControlStrength
  velocity.x += airMoveDir.x * dt
  velocity.z += airMoveDir.z * dt
  // Optional: cap horizontal air speed
  horizontalSpeed = length(velocity.x, velocity.z)
  if horizontalSpeed > maxAirSpeed:
    velocity.x *= maxAirSpeed / horizontalSpeed
    velocity.z *= maxAirSpeed / horizontalSpeed
```

**Why it matters:** These are the same "generous lies" from Module 2 (coyote time, variable jump height), evolved for 3D. The added dimension makes precise jumping harder, so the game compensates by giving the player more tools. Double-jump is a second chance. Air control allows course correction. Neither is realistic, but both are necessary for the game to feel fair. This principle — sacrificing physical accuracy for player agency — is at the heart of platformer design in any dimension.

### Stretch Goals (If Time Allows)

- **Wall-jump** — Detect when the player is sliding against a wall during a fall and allow a jump off of it. Requires wall-normal detection (which direction to launch the player) and a brief input lockout to prevent infinite wall-climbing. The same mechanic from 2D platformers, but the wall normal can face any direction in 3D.
- **Checkpoints and respawn** — When the player falls into a void, respawn at the last checkpoint rather than restarting the entire level. Store checkpoint positions and smoothly transition the player back. Reduces frustration in a genre where falling is frequent.
- **Camera auto-adjustment** — In addition to manual camera control, have the camera gently rotate to show upcoming platforming challenges. This is the "cinematic camera" technique — briefly overriding player camera control to ensure they see something important, then smoothly returning control.
- **Character animation states** — Idle, run, jump-rise, jump-apex, fall, land-recovery animations driven by the character's state machine. A landing "squash" animation and a brief speed penalty on hard landings add physicality and weight.

### MVP Spec

| Feature | Required |
|---------|----------|
| Third-person orbit camera with collision | Yes |
| 3D character with gravity and jump | Yes |
| Camera-relative movement (forward = toward camera facing) | Yes |
| At least 10 platforms at varying heights with readable layout | Yes |
| Blob shadow under the player | Yes |
| At least one moving platform | Yes |
| Collectibles that guide the player through the space | Yes |
| Double-jump or air control | Yes |
| Wall-jump | Stretch |
| Checkpoints / respawn on fall | Stretch |
| Camera auto-adjustment for key moments | Stretch |
| Character animation state machine | Stretch |

### Deliverable

- A playable 3D platformer level with camera control, jumping, and collectibles
- Write-up: What did you learn? How does designing for 3D space differ from 2D? What was your biggest camera challenge?

---

## Analogies by Background

> These analogies map 3D platformer concepts to patterns you already know. Find your background below.

### For Backend Developers

| Concept | Analogy |
|---------|---------|
| Third-Person Camera System | Like a load balancer health check that maintains a connection but adapts to obstacles — the camera tracks the player but must detect and avoid collisions with the environment, adjusting distance dynamically |
| 3D Character Controller with Jump | Like a state machine managing a connection lifecycle (IDLE, ACTIVE, CLOSING) — the character transitions between grounded, jumping, and falling states, each with different physics rules |
| Camera-Relative Movement | Like resolving relative paths — `./forward` is interpreted relative to the current working directory (camera orientation), not the filesystem root (world axes) |
| 3D Spatial Design / Level Layout | Like API design and documentation — the level must communicate its structure and affordances to the player, just as a well-designed API communicates its capabilities through intuitive naming, consistent patterns, and clear documentation |
| Shadow / Blob Under Player | Like a lightweight status probe — a constant downward raycast that returns "here is where you'd land," giving the player real-time position feedback the way a health endpoint gives real-time service status |
| Moving Platforms in 3D | Like a container orchestration parent-child relationship — the player is a process running inside the platform's container, inheriting its network namespace (position), so when the container moves between hosts, the process moves with it |
| Collectibles in 3D Space | Like breadcrumb logging or distributed tracing — items placed to guide the player through a complex 3D space, the same way trace IDs guide a developer through a complex request path across services |
| Double-Jump / Air Control | Like retry policies with backoff — the system gives you a second attempt (double-jump) and allows course correction (air control) rather than failing hard on the first missed input, prioritizing user success over strict enforcement |

### For Frontend Developers

| Concept | Analogy |
|---------|---------|
| Third-Person Camera System | Like implementing a scroll-follow with intersection observers — the camera follows the player but must detect when it would overlap (occlude) other elements and adjust its position, similar to a sticky header that repositions when it collides with other fixed elements |
| 3D Character Controller with Jump | Like a CSS transition with `cubic-bezier` easing — the jump arc is a curve defined by initial velocity and gravity, and the grounded state check is like detecting when a transition has completed |
| Camera-Relative Movement | Like resolving CSS `transform-origin` — "forward" is relative to the camera's coordinate system, just as `translateX(100px)` moves relative to the element's current transform, not the page origin |
| 3D Spatial Design / Level Layout | Like responsive design and visual hierarchy — the level must be readable at different camera angles, just as a page must be readable at different viewport sizes. Landmarks are like persistent navigation elements that orient the user |
| Shadow / Blob Under Player | Like a tooltip or cursor follower projected onto a surface — a simple visual indicator that tracks position and provides spatial context, similar to a hover state that shows "you are here" |
| Moving Platforms in 3D | Like a child element inside a CSS-transformed parent — the child has its own position, but its screen position changes when the parent's `transform` updates. `position: relative` on the parent, `position: absolute` on the child |
| Collectibles in 3D Space | Like visual affordances in UI — a spinning, glowing item says "interact with me" just as a colored, underlined text says "click me." Collectible trails guide the eye through 3D space like visual flow guides the eye through a page |
| Double-Jump / Air Control | Like undo/redo in a text editor — the system gives you a second chance and allows correction after committing to an action. The user expects forgiveness, not punishment for imprecise input |

### For Data / ML Engineers

| Concept | Analogy |
|---------|---------|
| Third-Person Camera System | Like a constrained optimization problem — the camera's ideal position minimizes distance to a target (behind the player) subject to constraints (no wall intersection, pitch limits), solved each frame by projecting the solution onto the feasible set |
| 3D Character Controller with Jump | Like numerical integration of a differential equation — velocity accumulates gravity each timestep (Euler method), and the jump is an impulse (initial condition change). Ground detection is a boundary condition |
| Camera-Relative Movement | Like a change of basis — input is expressed in the camera's basis vectors (forward, right) and transformed to world coordinates via a basis matrix, identical to converting between coordinate systems in linear algebra |
| 3D Spatial Design / Level Layout | Like feature engineering for interpretability — the level must present information so the player (model) can make good decisions. Landmarks reduce the dimensionality of the navigation problem, just as good features reduce the dimensionality of a learning problem |
| Shadow / Blob Under Player | Like a projection onto a lower-dimensional subspace — the player's 3D position is projected straight down onto the 2D ground surface, collapsing one dimension to provide a readable 2D indicator of lateral position |
| Moving Platforms in 3D | Like reference frame transformations in physics simulation — the player's position is expressed in the platform's local frame, and the platform's world-space transformation is composed to get the player's world position. Frame composition via matrix multiplication |
| Collectibles in 3D Space | Like placing training signal in a sparse environment — collectibles are reward shaping that guides the player toward the goal, reducing the exploration problem from an open 3D space to a guided path, analogous to reward shaping in reinforcement learning |
| Double-Jump / Air Control | Like regularization or soft constraints — instead of hard physical rules (one jump, no air control), the system relaxes constraints to allow the player to find better solutions. The same tradeoff as L2 regularization: accept some physical inaccuracy to get better generalization (playability) |

---

### Discussion Questions

1. Super Mario 64 and Crash Bandicoot launched the same year with opposite approaches to the camera: free control vs. constrained rails. What are the tradeoffs of each approach? When would you choose one over the other?
2. The blob shadow is a "fake" — it does not come from the lighting system. Why is this acceptable? What other "lies" does your game tell the player to make the experience better?
3. Compare your 2D platformer from Module 2 to this 3D platformer. Which concepts transferred directly, and which required fundamentally different solutions? What surprised you about the transition?
4. Camera-relative movement means "forward" changes meaning whenever the camera rotates. What happens if the camera rotates while the player is holding forward? How do commercial games handle this gracefully?
