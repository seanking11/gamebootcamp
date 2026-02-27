# Module 16: Third-Person Shooter
**Shooting with spatial awareness of your own body | You are the action hero you can see**
> "The camera is the most important weapon in a third-person game."
---

## Prerequisites
- **Module 11 (First-Person Game):** 3D rendering, raycasting, and basic FPS controls are essential — this module extends those concepts with a visible player character and offset camera.
- **Module 3 (Top-Down Shooter):** Core shooting mechanics (projectiles, hit detection, enemy behavior) transfer directly, now applied in 3D space.

**Note:** This is a 3D module. A game engine (Unity, Unreal, Godot) is strongly recommended. The concepts are engine-agnostic, but implementing a third-person camera, animation blending, and cover system from scratch is prohibitively time-consuming.

## Week 1: History & Design Theory

### The Origin

*Resident Evil 4* (2005), directed by Shinji Mikami at Capcom, redefined third-person action by introducing the over-the-shoulder camera that has since become the genre standard. Previous third-person games used fixed cameras (*Resident Evil*, 1996), fully top-down views, or a distant chase camera that made precise aiming feel imprecise. Mikami's breakthrough was positioning the camera just behind and to the right of the protagonist Leon Kennedy's shoulder, close enough that the player felt embodied in the character while still seeing Leon's body in the environment. Combined with a laser-sight aiming system that required the player to stop moving to shoot, it created a moment-to-moment tension between spatial awareness and precision that had never existed in 3D shooters. Every major third-person shooter since — from *Gears of War* to *The Last of Us* — descends from this camera philosophy.

### How the Genre Evolved

- **Gears of War (2006):** Epic Games' Cliff Bleszinski and team codified the cover system for third-person shooters. Players could snap to waist-high walls, blind-fire over them, pop out to aim precisely, and vault over cover to advance. The "stop and pop" rhythm it created — sprint to cover, hunker down, pop out, shoot, advance — became the dominant template for the genre for a decade. Its "roadie run" camera (low, shaky, close to the ground) also demonstrated that camera behavior itself could convey gameplay state.

- **Splatoon (2015):** Nintendo's radical reinterpretation proved the genre could be joyful rather than grim. By replacing bullets with ink that coated the environment, Splatoon made territory control visible and traversal a shooting mechanic — players could swim through their own ink as a squid. It demonstrated that the third-person perspective's greatest strength is *seeing the consequences of your actions on the world around you*, something a first-person view inherently obscures.

- **Fortnite (2017):** Epic Games combined the third-person shooter with building mechanics, creating a game where the player constantly creates and destroys their own cover. This pushed the genre's spatial awareness to its extreme — players had to track enemy positions, manage building resources, and shoot accurately, all while maintaining awareness of their character's exposed body in a 3D environment. Its success proved the third-person camera's superiority for games requiring environmental awareness.

### What Makes Third-Person Shooters "Great"

The core design insight of the third-person shooter is **embodied spatial awareness**. Unlike a first-person game where the player *is* the camera, a third-person game lets the player see their character *in relation to* the environment. This seemingly simple difference has profound implications: the player can see if their body is exposed behind cover, can judge the distance of a jump by seeing their character's feet, and can read their own animations for feedback. The visible player character becomes both avatar and information source — you watch yourself dodge a bullet and feel the near-miss viscerally. This is why third-person shooters excel at making the player feel like the protagonist of an action movie: you are simultaneously the actor and the audience.

### The Essential Mechanic

**Shooting with spatial awareness of your character's body in the environment** — the offset camera creates a game where positioning, exposure, and spatial relationships matter as much as aiming precision.

## Week 2: Build the MVP

### What You're Building

A small 3D arena or corridor with waist-high cover objects, 3-5 enemy NPCs that take cover and shoot back, and a player character with over-the-shoulder camera, aim-down-sights, and a cover system. The focus is on the camera, cover mechanics, and crosshair alignment — not on realistic graphics or complex level design.

An engine (Unity, Unreal, Godot) is strongly recommended for this module.

### Core Concepts (Must Implement)

**1. Over-the-Shoulder Camera**

The camera is positioned behind and offset to one side of the player character (typically right), providing a view that includes the character's upper body and the world ahead. The camera must follow the player's movement while allowing the player to rotate the view with mouse/stick input.

```
class ThirdPersonCamera:
    def __init__(self):
        self.distance = 3.0        # Distance behind the character
        self.height = 1.6          # Height above character's feet
        self.horizontal_offset = 0.6  # Offset to the right
        self.pitch = 0.0           # Vertical look angle
        self.yaw = 0.0             # Horizontal look angle

    def update(self, player_position, mouse_delta, dt):
        # Mouse input rotates the camera
        self.yaw += mouse_delta.x * SENSITIVITY
        self.pitch -= mouse_delta.y * SENSITIVITY
        self.pitch = clamp(self.pitch, -60, 60)

        # Calculate camera position relative to player
        yaw_rad = radians(self.yaw)
        pitch_rad = radians(self.pitch)

        # Camera sits behind the player along the yaw direction
        offset_back = Vector3(
            -sin(yaw_rad) * self.distance * cos(pitch_rad),
            self.height + self.distance * sin(pitch_rad),
            -cos(yaw_rad) * self.distance * cos(pitch_rad)
        )

        # Apply horizontal offset (perpendicular to look direction)
        right = Vector3(cos(yaw_rad), 0, -sin(yaw_rad))
        offset_side = right * self.horizontal_offset

        self.position = player_position + offset_back + offset_side
        self.look_target = player_position + Vector3(0, self.height, 0)

    def get_view_matrix(self):
        return look_at(self.position, self.look_target, UP)
```

A critical detail: the camera must handle collision with walls. If a wall is between the camera and the player, the camera should push forward to avoid clipping through geometry.

**Why it matters:** The camera is the player's window into the game world. In third-person, the camera defines the entire experience — how much of the character you see, how much spatial information you have, and how aiming feels. A bad camera makes an otherwise good game unplayable.

**2. Cover System**

The player can snap to cover objects (waist-high walls, pillars, crates) and take a protected position. From cover, the player can peek out to aim and shoot, blind-fire without exposing themselves, and leave cover to move freely.

```
class CoverSystem:
    def __init__(self):
        self.in_cover = false
        self.cover_object = null
        self.cover_side = "left"   # Which side of cover the player is on
        self.peeking = false

    def try_enter_cover(self, player, cover_objects):
        nearest = find_nearest_cover(player.position, cover_objects,
                                      max_distance=1.5)
        if nearest:
            self.in_cover = true
            self.cover_object = nearest
            self.cover_side = determine_side(player.position, nearest)
            # Snap player position to cover surface
            player.position = get_snap_position(nearest, self.cover_side)

    def update(self, player, input):
        if not self.in_cover:
            return

        if input.aim_button:
            self.peeking = true
            # Shift camera and player to peek over/around cover
            player.position = get_peek_position(self.cover_object,
                                                 self.cover_side)
        else:
            self.peeking = false
            player.position = get_snap_position(self.cover_object,
                                                 self.cover_side)

        # Leave cover
        if input.move_away_from_cover or input.roll_button:
            self.in_cover = false
            self.cover_object = null

    def is_player_exposed(self):
        return not self.in_cover or self.peeking

def find_nearest_cover(position, cover_objects, max_distance):
    best = null
    best_dist = max_distance
    for obj in cover_objects:
        dist = distance_to_surface(position, obj)
        if dist < best_dist:
            best = obj
            best_dist = dist
    return best
```

Cover objects need metadata: their height (waist-high vs. full), their shape (linear wall vs. pillar), and whether they can be peeked from either end or only over the top.

**Why it matters:** Cover transforms the pacing of combat from constant shooting to a rhythm of advance-and-engage. It gives the player agency over their exposure and creates meaningful spatial decisions: which cover to move to, when to peek, when to abandon a flanked position.

**3. Aim-Down-Sights / Zoom**

When the player holds the aim button, the camera transitions from the default over-the-shoulder view to a tighter, zoomed-in view that centers the crosshair for precision shooting. Movement speed typically decreases while aiming.

```
class AimSystem:
    def __init__(self):
        self.aim_lerp = 0.0   # 0 = hip, 1 = fully aimed
        self.AIM_SPEED = 8.0  # Lerp speed for smooth transition

    def update(self, input, camera, dt):
        target = 1.0 if input.aim_button else 0.0
        self.aim_lerp = lerp(self.aim_lerp, target, self.AIM_SPEED * dt)

        # Interpolate camera parameters
        camera.distance = lerp(3.0, 1.5, self.aim_lerp)
        camera.horizontal_offset = lerp(0.6, 0.4, self.aim_lerp)
        camera.fov = lerp(75, 50, self.aim_lerp)

        # Movement speed reduction while aiming
        player.move_speed = lerp(BASE_SPEED, AIM_SPEED, self.aim_lerp)

    def get_crosshair_size(self):
        # Tighter crosshair when fully aimed
        return lerp(CROSSHAIR_LARGE, CROSSHAIR_SMALL, self.aim_lerp)
```

The transition between hip-fire and aimed modes should be smooth (interpolated over ~0.2 seconds), never instant. This gives the player a feel of "settling into" the aim, and it creates a meaningful tradeoff between mobility and precision.

**Why it matters:** The hip/aim duality creates two distinct modes of play within the same game: exploration mode (fast, wide view, imprecise shooting) and combat mode (slow, zoomed, precise). This modality is what gives third-person shooters their distinctive rhythm.

**4. Character Animation Blending**

The character's upper body and lower body must animate independently. The lower body plays movement animations (idle, walk, run, crouch) while the upper body plays aim and shoot animations oriented toward the crosshair direction. These two animation layers blend together on the character's skeleton.

```
class AnimationBlender:
    def __init__(self, skeleton):
        self.skeleton = skeleton
        # Define which bones belong to which layer
        self.lower_body_bones = ["hips", "left_leg", "right_leg", "spine_base"]
        self.upper_body_bones = ["spine_mid", "spine_top", "left_arm",
                                  "right_arm", "head", "neck"]

    def update(self, movement_state, aim_direction, is_firing):
        # Lower body: movement animation
        if movement_state == "idle":
            lower_pose = self.sample_animation("idle_lower")
        elif movement_state == "walk":
            lower_pose = self.sample_animation("walk")
        elif movement_state == "run":
            lower_pose = self.sample_animation("run")

        # Upper body: aim direction
        aim_pitch = angle_from_horizontal(aim_direction)
        # Blend between aim_up, aim_forward, aim_down based on pitch
        if aim_pitch > 0:
            upper_pose = blend(
                self.sample_animation("aim_forward"),
                self.sample_animation("aim_up"),
                aim_pitch / 90.0
            )
        else:
            upper_pose = blend(
                self.sample_animation("aim_forward"),
                self.sample_animation("aim_down"),
                abs(aim_pitch) / 90.0
            )

        # Layer if firing
        if is_firing:
            upper_pose = blend_additive(upper_pose,
                                         self.sample_animation("fire_recoil"))

        # Combine layers
        final_pose = {}
        for bone in self.skeleton.bones:
            if bone.name in self.upper_body_bones:
                final_pose[bone.name] = upper_pose[bone.name]
            else:
                final_pose[bone.name] = lower_pose[bone.name]

        self.skeleton.apply_pose(final_pose)
```

**Why it matters:** In a third-person game, the player is always watching their character. If the character faces forward while shooting to the right, or freezes while aiming, the illusion breaks entirely. Animation blending is what makes the character feel like a living entity rather than a puppet.

**5. Third-Person Crosshair Alignment**

The crosshair is drawn at the center of the screen, but the bullets originate from the character's gun, which is offset from the camera. A raycast from the camera through the crosshair into the world determines the *target point*, and the bullet is then fired from the gun *toward that target point*.

```
def calculate_shot(camera, player_gun_position):
    # Step 1: Raycast from camera center into the world
    ray_origin = camera.position
    ray_direction = camera.forward  # Center of screen

    hit = raycast(ray_origin, ray_direction, max_distance=1000)

    if hit:
        target_point = hit.position
    else:
        target_point = ray_origin + ray_direction * 1000

    # Step 2: Fire bullet from gun toward target point
    bullet_direction = normalize(target_point - player_gun_position)

    spawn_bullet(
        origin=player_gun_position,
        direction=bullet_direction,
        speed=BULLET_SPEED
    )

    # Step 3: At very close range, check for obstructions
    # between gun and target (shooting into nearby cover, etc.)
    obstruction = raycast(player_gun_position, bullet_direction,
                           max_distance=distance(player_gun_position,
                                                  target_point))
    if obstruction and obstruction.distance < 0.5:
        # Bullet hits the nearby obstruction, not the target
        apply_damage_at(obstruction.position)
```

This two-step raycast (camera-to-world, then gun-to-target) is essential. Without it, bullets will visibly miss what the crosshair is pointing at, especially at close range or when shooting past the edge of cover.

**Why it matters:** Crosshair alignment is the single most common source of "the game feels broken" bugs in third-person shooters. If the player's crosshair is on an enemy but the bullet hits a wall because it originated from the gun at a different angle, trust is destroyed. This is a solved problem, but only if you implement the two-raycast approach deliberately.

**6. Environmental Destruction / Interaction**

Certain objects in the environment respond to being shot: crates splinter, glass shatters, cover degrades over time. Destructible objects have a health value and change visual state as they take damage.

```
class DestructibleObject:
    def __init__(self, max_health, provides_cover=true):
        self.health = max_health
        self.max_health = max_health
        self.provides_cover = provides_cover
        self.destruction_stage = 0  # 0=intact, 1=damaged, 2=destroyed

    def take_damage(self, amount):
        self.health -= amount
        # Update visual stage
        health_ratio = self.health / self.max_health
        if health_ratio <= 0:
            self.destruction_stage = 2
            self.provides_cover = false
            spawn_debris_particles(self.position)
            remove_from_cover_objects(self)
        elif health_ratio <= 0.5:
            self.destruction_stage = 1
            swap_mesh(self, "damaged_mesh")
            spawn_chip_particles(self.position)

class CoverManager:
    def update_cover_validity(self):
        # Re-evaluate if a player's current cover is still valid
        for player in players:
            if player.cover_system.in_cover:
                cover = player.cover_system.cover_object
                if hasattr(cover, 'provides_cover') and not cover.provides_cover:
                    player.cover_system.force_leave_cover()
                    show_feedback("Cover destroyed!")
```

**Why it matters:** Destructible environments turn static arenas into evolving tactical spaces. Cover that degrades forces the player to reposition, preventing the "sit behind wall and peek forever" strategy. It also provides satisfying visual feedback — seeing bullet impacts chip away at the world makes weapons feel powerful.

### Stretch Goals (If Time Allows)

- **Blind-fire from cover:** The player can fire without peeking, with significantly reduced accuracy but no exposure to enemy fire.
- **Roll/dodge mechanic:** A quick dodge roll between cover points with brief invincibility frames, enabling aggressive repositioning.
- **Enemy flanking AI:** Enemies attempt to move to positions that negate the player's cover advantage, forcing the player to reposition.
- **Shoulder swap:** Allow the player to toggle the camera offset between left and right shoulder, enabling peeking from both sides of cover.

### MVP Spec

| Feature | Required |
|---|---|
| Over-the-shoulder camera with collision | Yes |
| Player movement in 3D space (walk, run) | Yes |
| Cover system (snap, peek, leave) | Yes |
| Aim-down-sights with camera transition | Yes |
| Animation blending (upper/lower body) | Yes |
| Crosshair-aligned shooting (two-raycast) | Yes |
| 3-5 enemy NPCs that shoot back | Yes |
| At least 2 destructible cover objects | Yes |
| Waist-high cover objects in arena | Yes |
| Blind-fire from cover | Stretch |
| Roll/dodge between cover | Stretch |
| Enemy flanking behavior | Stretch |
| Shoulder swap toggle | Stretch |

### Deliverable

Submit your playable third-person shooter arena with source code. Include a short write-up (300-500 words) answering: *What was the most difficult part of getting the camera to feel right? Describe how you solved crosshair alignment and what happens when the player shoots at an object that is between the camera and the character.*

## Analogies by Background
> These analogies map game dev concepts to patterns you already know.

### For Backend Developers

| Game Dev Concept | Backend Analogy |
|---|---|
| Over-the-shoulder camera | A reverse proxy that sits in front of the actual server (player), adding its own headers (offset, FOV) while forwarding the underlying request (player's aim direction) |
| Cover system | Connection pooling with keep-alive — the player "binds" to a cover resource, uses it for multiple operations (peeks), and explicitly releases it when moving on |
| Aim-down-sights / zoom | Feature toggles with transition — switching between a fast-response mode (hip-fire) and a thorough-validation mode (ADS), with graceful transition between the two |
| Animation blending | Request middleware layering — independent middleware (upper body, lower body) each contribute their transformation to the final response (character pose) |
| Crosshair alignment (two-raycast) | DNS resolution then direct connection — first resolve the name (camera ray to find target point), then connect directly (gun ray to target), because the resolution path differs from the data path |
| Environmental destruction | Database soft-delete with state degradation — records transition through states (intact, damaged, destroyed) rather than binary existence, and dependent queries update accordingly |

### For Frontend Developers

| Game Dev Concept | Frontend Analogy |
|---|---|
| Over-the-shoulder camera | A CSS transform with `perspective` and `translateZ` — positioning the viewport at an offset from the content while maintaining a specific focal point |
| Cover system | A modal or drawer component — the player "opens" cover (snaps in), interacts within it (peeks, shoots), and "closes" it (leaves), with the UI constraining available actions while active |
| Aim-down-sights / zoom | A CSS transition between two layout states — smoothly interpolating properties (zoom, offset, speed) when toggling between exploration and combat modes |
| Animation blending | Independent CSS animations on different DOM elements composited together — a header animates separately from the body, but both render as one coherent page |
| Crosshair alignment (two-raycast) | Event coordinate mapping — translating a click position in viewport space to a position in the document (camera ray), then dispatching the actual event to the element at that position (gun ray) |
| Environmental destruction | Progressive enhancement degradation — a component with multiple fallback states that degrades gracefully as features (health) are removed, eventually reaching a minimal (destroyed) state |

### For Data / ML Engineers

| Game Dev Concept | Data / ML Analogy |
|---|---|
| Over-the-shoulder camera | An observation function in reinforcement learning — the agent (player) does not observe the raw state; instead, a camera function transforms the world state into a partial observation with a specific perspective bias |
| Cover system | Feature gating in a pipeline — the player binds to a cover object, which gates (blocks) incoming damage features while allowing outgoing attack features to pass through selectively |
| Aim-down-sights / zoom | Resolution scaling in image processing — dynamically switching between a low-resolution, wide-field view and a high-resolution, narrow-field view depending on the task (exploration vs. targeting) |
| Animation blending | Ensemble model output — multiple independent models (animation layers) each produce predictions for their domain, and a blending function combines them into a single output (final pose) |
| Crosshair alignment (two-raycast) | Two-stage retrieval — a fast, approximate nearest-neighbor search (camera ray) identifies the target region, then a precise similarity computation (gun ray) finds the exact hit point |
| Environmental destruction | Feature importance decay — as a feature (cover object) loses importance (health), it contributes less to the model's decision (tactical value) until it is pruned (destroyed) entirely |

---

### Discussion Questions

1. **Camera as game design:** The shift from first-person to third-person fundamentally changes how a player relates to their character. What information does the third-person camera give the player that first-person cannot? What does it take away? How did these tradeoffs influence your design decisions?

2. **The cover paradox:** Cover systems slow down gameplay but add tactical depth. Some modern games (Fortnite, Splatoon) reject traditional cover entirely. What are the design arguments for and against a snap-to-cover system, and when does cover enhance versus hinder a shooter?

3. **The crosshair lies:** In your MVP, did you encounter situations where the crosshair pointed at something the bullet could not actually hit? How does the two-raycast approach solve this, and are there edge cases where it still fails?

4. **Animation sells the fantasy:** How much did animation quality affect the "feel" of your game? Could you identify moments where a missing or wrong animation broke the sense of controlling a real character? What is the minimum viable animation set for a third-person shooter to feel responsive?
