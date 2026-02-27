# Module 11: First-Person Game (FPS)

**Weeks 21-22 | The leap into 3D — where the camera becomes the player**

> "You don't control a character in an FPS. You ARE the character. The camera isn't showing you the world — it is your eyes."

---

## Prerequisites

- **Module 1 (Pong)** — game loop, input handling, collision detection fundamentals
- **Module 3 (Top-Down Shooter)** — vector math, projectile systems, enemy spawning, aiming mechanics

---

## Week 1: History & Design Theory

### The Origin

John Carmack's **Wolfenstein 3D (id Software, 1992)** made 3D real-time gameplay possible on consumer hardware through a raycasting trick: the game world was actually a 2D grid, but by casting rays from the player's position and calculating wall distances, it rendered a convincing first-person perspective. The walls were always the same height. There was no looking up or down. It was an illusion — and it was enough to create an entirely new genre.

Carmack's technical insight was that you did not need true 3D to create the *feeling* of 3D. You needed clever math and the willingness to accept constraints.

### How the Genre Evolved

**Doom (id Software, 1993)** shattered Wolfenstein's limitations. Variable-height floors and ceilings, ambient lighting, non-orthogonal walls, and a new rendering engine created spaces that felt genuinely three-dimensional. Just as importantly, the WAD file system let anyone create and share custom levels and mods. Doom did not just define the FPS — it created the modding community, proving that giving players creative tools extends a game's lifespan by decades.

**Half-Life (Valve, 1998)** asked: what if an FPS told a story without ever taking control away from the player? No cutscenes. No text crawls. Every narrative beat happened in real-time while you held the controls. Scripted sequences played out around you — scientists argued, soldiers rappelled through skylights, an alien world bled into a research facility — and you experienced it all from Gordon Freeman's eyes. Half-Life proved the first-person camera was not just a combat interface but a storytelling device.

**Halo: Combat Evolved (Bungie, 2001)** solved the problem everyone said was unsolvable: FPS controls on a gamepad. The twin-stick layout (left stick moves, right stick looks) combined with generous aim assist and the "30 seconds of fun" design philosophy — every encounter should contain roughly 30 seconds of peak engagement, then reset — made console FPS a mainstream genre. Halo's sandbox combat arenas, where AI enemies reacted dynamically to the player's choices, replaced the scripted corridor shooting of its predecessors.

Modern competitive FPS design (Overwatch, Valorant) layers character-ability systems and team composition strategy on top of the mechanical aiming skill that has been the genre's core since Wolfenstein.

### What Makes FPS Games "Great"

The FPS is the most *embodied* genre in gaming. Because the camera is the player's eyes, every design decision — field of view, head bob, weapon sway, recoil — directly affects how the player physically feels. A well-tuned FPS creates a sense of presence that no third-person camera can match.

The genre's depth comes from the tension between precision and chaos. Aiming is a fine-motor skill, but the game is constantly disrupting your aim with movement, threats from multiple directions, and time pressure. Great FPS design balances the player's desire for control against the game's attempts to overwhelm that control.

### The Essential Mechanic

**Aiming and shooting in 3D space from a first-person perspective** — the player IS the camera. Every shot is cast from the center of the player's view into the world, making the act of looking and the act of aiming the same thing.

---

## Week 2: Build the MVP

### What You're Building

A first-person 3D environment where you can move, look around, and shoot at targets or enemies. This is a shooting gallery or simple arena — not a full campaign. The goal is to internalize 3D space, camera control, and raycasting for interaction.

> **A note about 3D and engines:** Unlike 2D modules where raw code was viable, 3D development heavily benefits from an engine. Unity, Godot, or Unreal will handle rendering, lighting, and physics so you can focus on game-specific mechanics.

### Core Concepts (Must Implement)

#### 1. 3D Coordinate Systems and Transforms

In 2D, you worked with (x, y). Now every object has a position (x, y, z), a rotation (pitch, yaw, roll), and a scale (sx, sy, sz) — collectively called a **transform**. The y-axis is typically "up" (Unity, Godot) or the z-axis is "up" (Unreal). Understanding which convention your environment uses is the first step.

Transforms are hierarchical: a gun attached to a hand inherits the hand's position and rotation. Moving the hand moves the gun automatically.

```
transform:
  position = (x, y, z)
  rotation = (pitch, yaw, roll)   // or a quaternion
  scale    = (sx, sy, sz)

// Child transforms are relative to their parent:
gun.worldPosition = hand.worldPosition + hand.rotation * gun.localPosition
```

**Why it matters:** Every object in a 3D game exists as a transform. This is the atomic unit of 3D game development — the equivalent of (x, y) in 2D, but with the added complexity of rotation in three dimensions.

#### 2. First-Person Camera

The camera is a perspective projection: objects farther away appear smaller, creating depth. The player controls pitch (looking up/down) and yaw (looking left/right) with the mouse. Pitch must be clamped to prevent the camera from flipping upside down.

```
// Mouse-look each frame:
yaw   += mouseX * sensitivity
pitch += mouseY * sensitivity
pitch  = clamp(pitch, -89, +89)  // prevent gimbal flip

camera.rotation = quaternion_from_euler(pitch, yaw, 0)

// Perspective projection (handled by engine):
// fov = 60-90 degrees, aspect = screen width/height
// near clip = 0.1, far clip = 1000
```

Field of view (FOV) has a dramatic effect on game feel: narrow FOV (60 degrees) feels zoomed-in and claustrophobic; wide FOV (100+ degrees) gives peripheral awareness but distorts edges. Most FPS games default to 80-90 degrees.

**Why it matters:** The first-person camera IS the player's interface with the game. Every other system (aiming, movement, UI) depends on the camera working correctly. Understanding perspective projection explains why objects scale with distance and why FOV changes how the game feels.

#### 3. 3D Character Controller

Movement must be relative to the camera's facing direction, not the world axes. When the player presses "forward," they move in the direction the camera is looking (projected onto the ground plane). Strafing moves perpendicular to that direction.

```
// Get camera's forward and right vectors, flattened to ground plane:
forward = camera.forward
forward.y = 0
forward = normalize(forward)

right = camera.right
right.y = 0
right = normalize(right)

// Combine input with camera-relative directions:
moveDir = forward * inputVertical + right * inputHorizontal
moveDir = normalize(moveDir) * moveSpeed

// Apply to player position:
player.position += moveDir * dt
```

**Why it matters:** Camera-relative movement is what makes 3D controls feel intuitive. If "forward" always meant world-north regardless of where the player was looking, the controls would feel broken. This is the defining UX pattern of first-person games.

#### 4. Raycasting for Shooting

When the player fires, cast an invisible ray from the camera's center point straight forward into the scene. Check what the ray intersects first — that is what gets hit. This is conceptually identical to Module 3's projectile collision, but instead of a moving bullet, you use an instantaneous line test.

```
// On fire input:
ray.origin    = camera.position
ray.direction = camera.forward

hit = raycast(ray.origin, ray.direction, maxDistance)

if hit:
  if hit.object.hasComponent("Health"):
    hit.object.takeDamage(weaponDamage)
  spawn_impact_effect(hit.point, hit.normal)
```

**Why it matters:** Raycasting is the fundamental spatial query in 3D games. Beyond shooting, it is used for ground detection, line-of-sight checks, mouse picking, and AI perception. Mastering raycasting unlocks a huge number of 3D gameplay mechanics.

#### 5. 3D Collision and Physics

In 3D, colliders are volumes: boxes (AABB or oriented), spheres, or capsules. The player is typically a capsule (upright cylinder with rounded ends). Gravity pulls downward each frame, and ground detection (a short downward raycast from the player's feet) determines whether the player is grounded.

```
// Gravity:
velocity.y -= gravity * dt

// Ground detection:
groundHit = raycast(player.position, DOWN, playerHeight/2 + skinWidth)
if groundHit:
  isGrounded = true
  velocity.y = max(velocity.y, 0)   // stop falling
  player.position.y = groundHit.point.y + playerHeight/2

// Apply movement:
player.position += velocity * dt
```

**Why it matters:** 3D collision is the same concept as 2D AABB from Module 1, extended by one dimension. The capsule collider and ground-detection raycast are the standard approach used by virtually every 3D game with a walking character.

#### 6. Basic Lighting

Place at least an ambient light (base illumination so nothing is pure black) and a directional light (simulating the sun — parallel rays casting shadows in one direction). Lighting transforms a flat-looking scene into one with depth, mood, and readability.

```
// Minimal lighting setup:
ambientLight:
  color = (0.2, 0.2, 0.3)       // slight blue tint for shadow areas
  intensity = 0.3

directionalLight:
  direction = normalize(-1, -1, -0.5)  // angled downward
  color = (1.0, 0.95, 0.8)      // warm sunlight
  intensity = 0.7
  castsShadows = true
```

**Why it matters:** Lighting is one of the biggest differences between "programmer art that looks flat" and "a scene that feels like a place." Even basic two-light setups dramatically improve readability and atmosphere. Lighting also communicates gameplay information — bright areas feel safe, dark areas feel dangerous.

#### 7. Level Geometry and BSP Concepts

3D levels are built from meshes — collections of triangles that form walls, floors, ceilings, and obstacles. The concept of BSP (Binary Space Partitioning), pioneered by Doom, recursively divides space into regions to determine what is visible from any given point, allowing the engine to skip rendering geometry the player cannot see.

In a modern engine, you build levels by placing 3D primitives (cubes, planes, cylinders) or importing meshes and arranging them. The engine handles visibility culling for you, but understanding that it happens explains why complex scenes can still run at 60fps.

```
// Conceptual BSP: split space with a plane
if player is in front of dividing plane:
  render front geometry first, then back
else:
  render back geometry first, then front

// In practice, engines use:
// - Frustum culling (skip objects outside camera view)
// - Occlusion culling (skip objects behind other objects)
// - LOD (Level of Detail) — simpler meshes at distance
```

**Why it matters:** Understanding how 3D space is organized explains why level design is both an art and a technical discipline. Knowing that the engine is constantly deciding what to render (and what to skip) helps you design levels that perform well and read clearly.

#### 8. HUD Overlay

Game UI (health bar, crosshair, ammo count) is rendered in **screen space** — fixed to the camera's output, not positioned in the 3D world. This creates two rendering layers: the 3D scene and the 2D overlay on top of it.

```
// Screen-space UI (drawn after 3D scene):
draw_crosshair(screen.center)
draw_text("HP: " + player.health, position=(10, 10))
draw_text("Ammo: " + weapon.ammo, position=(10, 40))

// Optional: world-space UI (exists in 3D scene):
// e.g., a health bar floating above an enemy
enemy.healthBar.position = enemy.position + (0, 2, 0)
enemy.healthBar.lookAt(camera.position)  // always faces player
```

**Why it matters:** The distinction between screen space and world space is fundamental to 3D game UI. Screen-space elements are always visible and consistently sized. World-space elements exist in the scene and are affected by perspective and occlusion. Most games use both.

### Stretch Goals (If Time Allows)

- **Weapon model and animation** — A 3D model visible in the lower-right of the screen that plays a fire animation. This is a separate "viewmodel" camera technique: the weapon is rendered by a second camera with a different FOV to prevent it from clipping through walls.
- **Enemy AI with navigation** — Enemies that move toward the player using simple pathfinding or direct pursuit. Introduces NavMesh concepts (pre-computed walkable surface data).
- **Sound spatialization** — 3D audio where sounds have position and attenuate with distance. A gunshot behind you sounds different from one in front. Engines handle this natively with audio listener and audio source components.
- **Multiple weapon types** — A hitscan weapon (raycast, instant) vs. a projectile weapon (spawns a moving object with travel time). Two fundamentally different shooting models.

### MVP Spec

| Feature | Required |
|---------|----------|
| 3D environment you can walk around in | Yes |
| First-person camera with mouse-look | Yes |
| WASD movement relative to camera direction | Yes |
| Shooting via raycasting (click to fire, hit detection) | Yes |
| Targets or enemies that take damage and react | Yes |
| 3D colliders preventing the player from walking through walls | Yes |
| Basic lighting (ambient + directional) | Yes |
| HUD with crosshair, health, and score/ammo | Yes |
| Weapon viewmodel | Stretch |
| Enemy AI with movement | Stretch |
| 3D spatial audio | Stretch |
| Multiple weapon types | Stretch |

### Deliverable

- A playable first-person 3D game with movement, shooting, and hit detection
- Write-up: What did you learn? What was the hardest part of the transition from 2D to 3D?

---

## Analogies by Background

> These analogies map 3D game dev concepts to patterns you already know. Find your background below.

### For Backend Developers

| Concept | Analogy |
|---------|---------|
| 3D Coordinate Systems & Transforms | Like nested namespaces or hierarchical routing — a child's position is relative to its parent, like `/api/users/:id/posts/:postId` nesting context |
| First-Person Camera | Like a database view or projection — the same underlying 3D world data, filtered and transformed into a 2D output based on the camera's position and parameters |
| 3D Character Controller | Like request routing with middleware context — the "forward" direction is resolved relative to the current session state (camera orientation), not a fixed global route |
| Raycasting for Shooting | Like a database query with a spatial index — "find the first row that intersects this line" is a nearest-hit query against a spatial data structure |
| 3D Collision & Physics | Like connection validation with constraints — the capsule collider is an acceptance boundary, gravity is a continuous background process, ground detection is a health check |
| Basic Lighting | Like log levels or monitoring dashboards — ambient light is your baseline (INFO), directional light highlights specific areas (DEBUG), and the combination reveals the full picture of the scene |
| Level Geometry / BSP | Like a B-tree index for spatial data — BSP partitions space to enable fast lookups ("what's visible from here?"), just as a B-tree partitions keys for fast range queries |
| HUD Overlay | Like a response wrapper — the 3D scene is the payload, the HUD is the metadata envelope (headers, status codes) layered on top before sending to the client |

### For Frontend Developers

| Concept | Analogy |
|---------|---------|
| 3D Coordinate Systems & Transforms | Like nested CSS transforms — a child element's `transform` is relative to its parent's coordinate system, just as `translate3d` composes through the DOM hierarchy |
| First-Person Camera | Like a Three.js `PerspectiveCamera` — FOV, aspect ratio, near/far clipping planes define what the viewport renders, just as a CSS `perspective` property affects how 3D transforms appear |
| 3D Character Controller | Like making scroll direction relative to the viewport, not the document — "forward" is determined by the current view orientation, not a fixed page direction |
| Raycasting for Shooting | Like `document.elementFromPoint(x, y)` or Three.js `Raycaster` — cast from screen coordinates into the scene and return whatever is hit first |
| 3D Collision & Physics | Like collision detection in drag-and-drop with `getBoundingClientRect()`, extended to 3D volumes. Gravity is like a CSS `animation` that constantly pulls elements downward |
| Basic Lighting | Like CSS lighting effects — `ambient` is a global `filter: brightness()`, directional light is like a `box-shadow` or `drop-shadow` that implies a light source direction |
| Level Geometry / BSP | Like virtual scrolling or windowing (react-window) — only rendering the DOM nodes visible in the viewport, not the entire list. BSP decides which geometry to render based on the camera's position |
| HUD Overlay | Like a `position: fixed` overlay on top of a 3D canvas — the HUD is a 2D HTML layer composited over the WebGL scene, exactly how many web-based 3D apps work |

### For Data / ML Engineers

| Concept | Analogy |
|---------|---------|
| 3D Coordinate Systems & Transforms | Like affine transformation matrices — position, rotation, and scale compose into 4x4 matrices. Hierarchical transforms are matrix multiplication chains, just as in robot kinematics or 3D point cloud processing |
| First-Person Camera | Like a projection from 3D to 2D — the perspective matrix maps 3D world coordinates to 2D screen coordinates, identical to camera projection matrices in computer vision (pinhole camera model) |
| 3D Character Controller | Like transforming a velocity vector from a local coordinate frame to world coordinates — the camera defines a basis (forward, right, up), and input is expressed in that basis before being applied in world space |
| Raycasting for Shooting | Like a line-intersection query on a KD-tree or BVH — find the nearest object along a parametric ray, the same spatial query used in ray tracing and computational geometry |
| 3D Collision & Physics | Like constraint satisfaction with continuous simulation — Euler integration of forces (gravity) is the same numerical method used in physics simulations and differential equation solvers |
| Basic Lighting | Like the Phong reflection model — ambient + diffuse + specular terms computed as dot products between surface normals and light direction vectors, fundamentally linear algebra |
| Level Geometry / BSP | Like spatial partitioning structures (KD-trees, octrees) used for nearest-neighbor search — BSP divides space along hyperplanes for efficient visibility queries, analogous to how KD-trees partition feature space |
| HUD Overlay | Like plotting annotations on top of a 3D visualization — the 3D scene is the scatter plot, the HUD is the axis labels and legend rendered in a separate 2D coordinate system |

---

### Discussion Questions

1. Wolfenstein 3D faked 3D with raycasting on a 2D map. How does knowing this change how you think about the relationship between a game's internal data representation and what the player sees?
2. Why does field of view matter so much in an FPS? Try playing the same scene at 60 FOV vs. 110 FOV — how does it change the feel of movement, aiming, and spatial awareness?
3. Half-Life told its story entirely through the first-person camera without ever taking control away. What are the advantages and limitations of this approach compared to cutscenes?
4. The transition from 2D to 3D adds one axis, but the complexity increase is not linear. What specific problems did you encounter that do not exist in 2D?
