# Module 15: Run and Gun
**Side-scrolling action with relentless firepower | Never stop moving, never stop shooting**
> "One more quarter, one more try."
---

## Prerequisites
- **Module 2 (Platformer):** Solid platformer movement, gravity, and collision detection are the foundation — a run and gun is a platformer with weapons.
- **Module 3 (Top-Down Shooter):** Projectile systems, enemy spawning, and hit detection carry over directly, but now applied in a side-scrolling context.

## Week 1: History & Design Theory

### The Origin

*Contra* (1987), developed by Konami and directed by Shigeharu Umezaki, established the run and gun genre for a generation of arcade and console players. Released first as an arcade cabinet and then ported to the NES in 1988, *Contra* combined side-scrolling platforming with eight-directional shooting, one-hit-kill difficulty, and two-player simultaneous co-op. Its genius was in economy: the player could run, jump, and aim in any of eight directions, but a single enemy bullet meant death. This created a game where every second demanded spatial awareness, pattern recognition, and reflexes. The Konami Code became famous precisely because *Contra* was so punishing — 30 lives felt generous. It proved that combining fluid movement with constant gunfire against authored enemy encounters could sustain an entire genre.

### How the Genre Evolved

- **Metal Slug (1996):** SNK's Neo Geo masterpiece elevated the genre through lavish hand-drawn animation, destructible environments, and vehicles the player could commandeer. It added weapon pickups with limited ammunition (Heavy Machine Gun, Rocket Launcher, Shotgun) that encouraged constant cycling, and its hostage-rescue mechanic gave players a reason to explore rather than just sprint forward. Metal Slug demonstrated that authored spectacle — a boss that fills the entire screen, a tank you can drive for thirty seconds before it explodes — could coexist with tight mechanical gameplay.

- **Gunstar Heroes (1993):** Treasure's Genesis classic introduced a weapon combination system where the player could hold two weapon types and combine them for unique effects (fire + lightning = a homing flame). This added a layer of strategic choice to a genre typically defined by reflex alone, and showed that run and gun games could have deep mechanical variety without sacrificing their breakneck pace.

- **Cuphead (2017):** Studio MDHR brought the genre to a new audience by pairing 1930s hand-drawn animation with punishing boss-rush gameplay. Its contribution was focus: Cuphead stripped levels down to boss encounters with multi-phase patterns, proving that the boss fight — the genre's climactic moments — could sustain an entire game. Its parry mechanic (slapping pink objects to build super meter) added a risk/reward layer that rewarded aggressive, precise play.

### What Makes Run and Gun "Great"

The core design insight of the run and gun genre is **authored tension**. Unlike genres where difficulty emerges from systems (roguelikes, strategy), a run and gun game is a choreographed experience — every enemy placement, every platform, every boss attack is hand-designed to create a specific moment of pressure. The designer controls exactly when the player will face three enemies from the left while jumping a pit, exactly when a boss will telegraph its beam attack. This authorship means the game can escalate difficulty with precision, creating a rhythm of tension and release that feels almost musical. The player's mastery is not over a system but over a *performance* — memorizing the choreography until execution becomes fluid.

### The Essential Mechanic

**Simultaneous movement and shooting through authored encounter spaces** — the player must navigate platforming challenges while aiming and firing at enemies placed to create specific pressure moments.

## Week 2: Build the MVP

### What You're Building

A single side-scrolling level with enemy encounters that the player must shoot through, ending with a multi-phase boss fight. The player can move, jump, and aim in at least 4 directions (up, forward, diagonal up, diagonal down) while firing. Include at least one weapon pickup and a lives system.

This module is 2D. No engine is required.

### Core Concepts (Must Implement)

**1. Multi-Directional Aiming While Moving**

The player character must be able to aim in multiple directions (at minimum: forward, up, diagonal-up-forward, diagonal-down-forward) while running and jumping. Aiming direction and movement direction are controlled independently — the player can run right while shooting diagonally upward.

```
# Aim direction based on input
def get_aim_direction(input):
    aim_x = 0
    aim_y = 0

    if input.aim_up:
        aim_y = -1
    if input.aim_down:
        aim_y = 1

    # Default horizontal aim is the direction the player faces
    if not input.aim_up or not input.aim_down:
        aim_x = player.facing_direction  # -1 or 1

    # If only aiming up (no horizontal), shoot straight up
    if input.aim_up and not input.move_left and not input.move_right:
        aim_x = 0

    return normalize(aim_x, aim_y)

def fire_bullet(player, aim_dir):
    bullet = Bullet(
        x = player.x + aim_dir.x * GUN_OFFSET,
        y = player.y + aim_dir.y * GUN_OFFSET,
        vx = aim_dir.x * BULLET_SPEED,
        vy = aim_dir.y * BULLET_SPEED
    )
    bullets.append(bullet)
```

The character sprite should rotate or swap to reflect the current aim direction, giving the player clear visual feedback about where their shots will go.

**Why it matters:** Multi-directional aiming is what separates a run and gun from a platformer that happens to shoot. The ability to aim independently of movement creates the core skill expression — managing two degrees of freedom simultaneously under pressure.

**2. Scrolling Level Design with Enemy Placement**

The level scrolls horizontally as the player advances. Enemies are placed at authored positions within the level and activate when they scroll into view (or when the player crosses a trigger line). The level is defined as a sequence of encounter segments.

```
level_data = {
  segments: [
    {
      start_x: 0, end_x: 800,
      platforms: [ { x: 200, y: 300, w: 100, h: 20 }, ... ],
      enemies: [
        { type: "soldier", x: 400, y: 380, trigger_x: 200,
          behavior: "run_and_shoot" },
        { type: "turret", x: 700, y: 200, trigger_x: 500,
          behavior: "aim_at_player" },
      ]
    },
    {
      start_x: 800, end_x: 1600,
      enemies: [ ... ]
    }
  ]
}

# Camera follows player, clamped to level bounds
camera_x = clamp(player.x - SCREEN_WIDTH / 2, 0, LEVEL_WIDTH - SCREEN_WIDTH)

# Activate enemies as player progresses
for enemy in inactive_enemies:
    if player.x >= enemy.trigger_x:
        enemy.active = true
        active_enemies.append(enemy)
```

**Why it matters:** Authored enemy placement is the authorial voice of the genre. Unlike spawner-based systems, each encounter is a hand-crafted challenge. The trigger system ensures enemies appear at the right moment to create intended pressure without overwhelming or underwhelming the player.

**3. Boss Pattern Design**

The end-of-level boss uses a multi-phase state machine with telegraphed attacks and vulnerability windows. Each phase has distinct attack patterns, and the boss transitions to the next phase at health thresholds.

```
class Boss:
    def __init__(self):
        self.health = 100
        self.phase = 1
        self.state = "idle"
        self.state_timer = 0
        self.vulnerable = false

    def update(self, dt):
        self.state_timer -= dt

        # Phase transitions
        if self.health <= 60 and self.phase == 1:
            self.phase = 2
            self.enter_state("phase_transition")
        if self.health <= 25 and self.phase == 2:
            self.phase = 3
            self.enter_state("phase_transition")

        # State machine per phase
        if self.state == "telegraph_attack":
            # Flash/glow for 0.8 seconds — player reads the warning
            if self.state_timer <= 0:
                self.enter_state("attack")

        elif self.state == "attack":
            self.execute_attack(self.phase)
            if self.state_timer <= 0:
                self.enter_state("vulnerable")

        elif self.state == "vulnerable":
            self.vulnerable = true
            # Boss is open to damage for 1.5 seconds
            if self.state_timer <= 0:
                self.vulnerable = false
                self.enter_state("telegraph_attack")

        elif self.state == "phase_transition":
            # Brief invincibility, new visual, screen shake
            if self.state_timer <= 0:
                self.enter_state("telegraph_attack")

    def execute_attack(self, phase):
        if phase == 1:
            fire_spread_bullets(count=3, spread_angle=30)
        elif phase == 2:
            fire_spread_bullets(count=5, spread_angle=45)
            spawn_minion()
        elif phase == 3:
            fire_laser_beam(sweep_speed=2.0)
```

**Why it matters:** Boss fights are the genre's defining moments — the climax that all the level design builds toward. The telegraph-attack-vulnerability loop is the fundamental rhythm that lets players learn a boss through observation and repetition rather than memorization of opaque mechanics.

**4. Co-op / Two-Player Simultaneous Play**

Two players share the same screen, each controlling an independent character with their own position, aim direction, health, and lives. The camera must accommodate both players, and gameplay systems (enemies, bullets, pickups) must handle two player entities.

```
players = [Player(id=0), Player(id=1)]

# Input mapping: each player has their own controls
input_maps = {
    0: { "left": KEY_A, "right": KEY_D, "up": KEY_W, "jump": KEY_SPACE,
         "fire": KEY_F },
    1: { "left": KEY_LEFT, "right": KEY_RIGHT, "up": KEY_UP,
         "jump": KEY_RCTRL, "fire": KEY_RSHIFT }
}

def update_camera():
    # Camera follows the player who is furthest ahead
    lead_x = max(p.x for p in players if p.alive)
    camera_x = clamp(lead_x - SCREEN_WIDTH * 0.4, 0,
                      LEVEL_WIDTH - SCREEN_WIDTH)
    # If a player falls behind the camera, they lose a life and respawn
    for p in players:
        if p.alive and p.x < camera_x - RESPAWN_MARGIN:
            p.die()
            p.respawn_at(lead_x - 50)

def check_bullet_hits():
    for bullet in enemy_bullets:
        for player in players:
            if player.alive and collides(bullet, player):
                player.die()
                remove(bullet)
```

**Why it matters:** Co-op transforms the experience from a solo test of skill into a shared spectacle. It also introduces genuine design challenges: the camera must serve two players, difficulty must scale, and both players must feel they are contributing rather than getting in each other's way.

**5. Limited Lives / Continue System**

Each player starts with a fixed number of lives. Dying costs one life and respawns the player at their current position (or the nearest safe spot) after a brief delay. When all lives are exhausted, the player gets a continue prompt. Continues may reset the player to the beginning of the current level segment.

```
class LifeSystem:
    def __init__(self, starting_lives=3, max_continues=3):
        self.lives = starting_lives
        self.continues = max_continues

    def on_death(self, player):
        self.lives -= 1
        if self.lives > 0:
            player.respawn(delay=1.5)
            return "respawn"
        elif self.continues > 0:
            return "continue_prompt"
        else:
            return "game_over"

    def use_continue(self, player, checkpoint):
        self.continues -= 1
        self.lives = 3  # Reset lives on continue
        player.respawn_at(checkpoint)
```

**Why it matters:** The lives system creates stakes. In a genre built on memorization and practice, the threat of losing progress is what makes each attempt feel meaningful. Too punishing drives players away; too lenient removes tension. The continue system is the pressure valve that balances these forces.

**6. Weapon Switching / Power-Up Cycling**

The player can pick up weapon power-ups that replace or augment their default gun. Each weapon has distinct characteristics (fire rate, damage, spread pattern). Picking up a new weapon replaces the current one.

```
WEAPONS = {
    "default":      { fire_rate: 0.15, damage: 1, pattern: "single" },
    "spread":       { fire_rate: 0.25, damage: 1, pattern: "fan_5" },
    "laser":        { fire_rate: 0.05, damage: 0.5, pattern: "continuous" },
    "missile":      { fire_rate: 0.6, damage: 5, pattern: "single_explosive" },
}

class WeaponPickup:
    def __init__(self, weapon_type, x, y):
        self.weapon_type = weapon_type
        self.x = x
        self.y = y

def on_pickup_collected(player, pickup):
    player.current_weapon = pickup.weapon_type
    player.fire_cooldown = 0  # Ready to fire immediately
    show_weapon_name_popup(pickup.weapon_type)

def fire_weapon(player, aim_dir):
    weapon = WEAPONS[player.current_weapon]
    if player.fire_cooldown > 0:
        return
    player.fire_cooldown = weapon.fire_rate

    if weapon.pattern == "single":
        spawn_bullet(player.pos, aim_dir, weapon.damage)
    elif weapon.pattern == "fan_5":
        for angle_offset in [-30, -15, 0, 15, 30]:
            rotated = rotate_vector(aim_dir, angle_offset)
            spawn_bullet(player.pos, rotated, weapon.damage)
    elif weapon.pattern == "continuous":
        spawn_laser_segment(player.pos, aim_dir, weapon.damage)
```

**Why it matters:** Weapon variety gives the player tactical choices within the moment-to-moment action. Different weapons excel against different enemy configurations, and the decision of whether to pick up a new weapon (losing your current one) adds a layer of risk assessment to a genre dominated by reflex.

### Stretch Goals (If Time Allows)

- **Vehicle section:** A brief segment where the player rides a vehicle (tank, jetpack) with different movement and firepower, breaking up the pacing of on-foot gameplay.
- **Screen-clearing bomb:** A limited-use "smart bomb" that destroys all on-screen enemies and bullets, giving the player an emergency escape valve during overwhelming encounters.
- **Score and ranking system:** Track kills, accuracy, time, and deaths to assign a letter grade (S/A/B/C/D) at level end, encouraging replay for mastery.
- **Destructible environment pieces:** Certain terrain elements (crates, walls, platforms) can be destroyed by gunfire, revealing pickups or alternate paths.

### MVP Spec

| Feature | Required |
|---|---|
| Player movement with platforming (run, jump) | Yes |
| Multi-directional aiming (4+ directions) | Yes |
| Firing projectiles in aim direction | Yes |
| Scrolling level with authored enemy placements | Yes |
| At least 3 enemy types with distinct behaviors | Yes |
| Multi-phase boss at level end | Yes |
| Boss telegraph and vulnerability windows | Yes |
| Two-player co-op on shared screen | Yes |
| Lives system with respawn | Yes |
| At least 2 weapon pickups | Yes |
| Vehicle section | Stretch |
| Screen-clearing bomb | Stretch |
| Score / ranking system | Stretch |
| Destructible environment | Stretch |

### Deliverable

Submit your playable run and gun level with source code, including the boss fight. Include a short write-up (300-500 words) answering: *How did you design your boss's phases to teach the player its patterns? Describe the telegraph-attack-vulnerability loop for each phase and how difficulty escalates between phases.*

## Analogies by Background
> These analogies map game dev concepts to patterns you already know.

### For Backend Developers

| Game Dev Concept | Backend Analogy |
|---|---|
| Multi-directional aiming | A request router that resolves two independent parameters simultaneously (resource path + HTTP method) to a single handler |
| Scrolling level with enemy placement | A queue-based job system — work items (enemies) are pre-authored and activate when they reach the front of the processing window |
| Boss pattern design | A circuit breaker with states — closed (attacking), open (vulnerable), half-open (telegraph) — cycling through a defined state machine |
| Co-op / two-player | Multi-tenant architecture — two independent users sharing the same runtime, each with isolated state but shared infrastructure (camera, enemies) |
| Limited lives / continue system | Retry policies with exponential backoff — a fixed number of automatic retries before requiring manual intervention (continue) |
| Weapon switching / power-ups | Strategy pattern — swapping the active algorithm (firing behavior) at runtime based on configuration (weapon pickup) |

### For Frontend Developers

| Game Dev Concept | Frontend Analogy |
|---|---|
| Multi-directional aiming | A drag-and-drop handler that tracks both cursor position and modifier keys independently to determine the final action |
| Scrolling level with enemy placement | Virtualized list rendering — elements activate and render only when they scroll into the viewport |
| Boss pattern design | A multi-step animation sequence — keyframes with transitions between states, each state triggering different CSS/JS behaviors |
| Co-op / two-player | Split state management — two independent component trees sharing a single layout container, each with their own reducer |
| Limited lives / continue system | Form validation retry limits — a fixed number of submission attempts before locking the form and showing a recovery option |
| Weapon switching / power-ups | Theme switching — swapping a configuration object that changes the behavior and appearance of the same base component |

### For Data / ML Engineers

| Game Dev Concept | Data / ML Analogy |
|---|---|
| Multi-directional aiming | Multi-objective optimization — simultaneously optimizing two independent axes (position, aim) that combine into a single output (bullet trajectory) |
| Scrolling level with enemy placement | Windowed stream processing — events (enemies) are pre-positioned in the data stream and activate when they enter the processing window |
| Boss pattern design | A state machine in a Markov chain — defined transition probabilities between states (attack, vulnerable, telegraph) with deterministic phase triggers |
| Co-op / two-player | Multi-agent simulation — two independent agents operating in a shared environment with shared observations but independent action spaces |
| Limited lives / continue system | Training budget — a fixed compute allocation (lives) before the run terminates, with checkpointing (continues) allowing partial restarts |
| Weapon switching / power-ups | Hyperparameter swapping mid-run — changing the model configuration (learning rate, optimizer) during training to adapt to the current phase |

---

### Discussion Questions

1. **Authored vs. emergent difficulty:** Run and gun games hand-place every enemy encounter, while roguelikes procedurally generate them. What are the advantages and disadvantages of each approach from both a design and development perspective? Which is more respectful of the player's time?

2. **The camera problem in co-op:** When two players share a screen but can move independently, the camera must make compromises. What happens when one player rushes ahead and the other falls behind? How does your camera solution balance freedom of movement against keeping both players on screen?

3. **Fairness in one-hit-kill design:** Classic run and gun games kill the player in one hit, yet players accept this. What design elements (telegraphing, enemy placement, respawn speed) make one-hit kills feel fair rather than frustrating? How does this compare to difficulty in modern games?

4. **Boss readability:** A boss with three phases needs to teach the player its patterns without explicit tutorials. How do you use visual and audio telegraphs to communicate "this attack is coming" and "the boss is vulnerable now" without breaking the game's pacing with text or cutscenes?
