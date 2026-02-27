# Module 19: Walking Simulator / Exploration Game
**Narrative through environment, not combat | The space is the story**
> "The world is full of obvious things which nobody by any chance ever observes." — Arthur Conan Doyle
---

## Prerequisites

- **Module 1 (Pong):** Core game loop, input handling, rendering basics.
- **Optional — Module 11 (FPS):** If building in 3D, first-person camera and movement help. A 2D top-down or side-scrolling version works perfectly fine.

## Week 1: History & Design Theory

### The Origin

The walking simulator emerged from a provocative question: what happens when you strip combat, scores, and fail states from a first-person game? Early experiments like Dear Esther (2012) proved that simply moving through a carefully crafted space could be emotionally powerful. The genre challenged assumptions about what "gameplay" means, arguing that exploration, discovery, and atmosphere are mechanics in their own right. Critics initially dismissed the form — "it's not a game" — but audiences responded to the intimacy these experiences offered, and the genre became one of the most important developments in narrative game design.

### How the Genre Evolved

- **Gone Home (2013):** Fullbright's debut placed the player in an empty house, piecing together a family's story through letters, objects, and environmental clues. It proved that domestic spaces could be as compelling as alien worlds, and that the player's imagination — filling in gaps between discovered artifacts — was a more powerful storytelling tool than cutscenes. Gone Home established the template: a contained space, no enemies, and narrative delivered entirely through exploration.

- **Firewatch (2016):** Campo Santo expanded the genre's emotional range by adding a real-time conversation system between the player and a voice on a walkie-talkie. Set in the Wyoming wilderness, Firewatch demonstrated that walking simulators could sustain tension and mystery without combat. Its use of environmental contrast — vast, beautiful landscapes against a claustrophobic emotional story — showed how level design itself could mirror narrative themes.

- **What Remains of Edith Finch (2017):** Giant Sparrow took environmental storytelling to its furthest extreme. Each room in the Finch family house became a completely different gameplay vignette — a comic book, a dream sequence, a bath scene — all unified by the act of walking through a single home. It proved that the genre could be mechanically inventive without betraying its core promise: the space tells the story.

### What Makes a Walking Simulator "Great"

A great walking simulator rewards curiosity. Every object the player chooses to examine, every room they enter in a particular order, every ambient sound they pause to listen to — all of it feels intentional. The best entries in the genre create a sense of presence so strong that the player forgets they are "playing" and begins to feel they are "inhabiting." This requires extraordinary attention to environmental detail, precise pacing (knowing when to give the player information and when to let silence do the work), and trust — trusting the player to look, to wonder, and to draw their own conclusions.

### The Essential Mechanic

Moving through a space and discovering narrative through the environment.

## Week 2: Build the MVP

### What You're Building

A small explorable environment (a house, an apartment, a campsite) where the player moves freely and discovers a short story by examining objects, entering rooms, and triggering audio or text events. There are no enemies, no health bars, no scores — just a space with a story hidden inside it.

### Core Concepts (Must Implement)

**1. Environmental Storytelling**

Conveying narrative through object placement and level design rather than dialog or cutscenes. A half-eaten meal on a table, a packed suitcase by the door, a child's drawing on the fridge — these tell a story without a single word of exposition.

```
# Place objects that imply narrative
scene_objects = [
    { type: "note", position: [3, 1], content: "I'll be back before midnight." },
    { type: "suitcase", position: [5, 2], state: "packed" },
    { type: "photo_frame", position: [2, 4], state: "face_down" },
    { type: "calendar", position: [1, 3], marked_date: "March 15" }
]

# Objects don't need explicit narration — their placement IS the narrative
# The player connects the dots: someone was leaving, someone else didn't want them to
```

**Why it matters:** This is the fundamental design philosophy of the genre. Every object is a sentence in a story the player assembles themselves, creating a more personal and memorable narrative than pre-scripted dialog.

**2. Trigger Zones for Narrative Beats**

Invisible regions in the world that fire events — voiceover, music changes, UI prompts — when the player enters them. These are the backbone of pacing in an exploration game.

```
trigger_zones = [
    { id: "front_door", bounds: { x: 0, y: 0, w: 2, h: 2 },
      on_enter: play_audio("welcome_home.wav"), once: true },
    { id: "bedroom_hall", bounds: { x: 5, y: 3, w: 1, h: 3 },
      on_enter: set_music("tense_theme"), once: true },
    { id: "ending_zone", bounds: { x: 8, y: 7, w: 2, h: 2 },
      on_enter: start_ending_sequence(), once: true }
]

function check_triggers(player_position):
    for zone in trigger_zones:
        if not zone.triggered and point_in_rect(player_position, zone.bounds):
            zone.on_enter()
            if zone.once:
                zone.triggered = true
```

**Why it matters:** Trigger zones let the designer control pacing without taking control away from the player. The player feels free, but the designer is quietly orchestrating the emotional arc based on where the player goes.

**3. Audio as Narrative Tool**

Using ambient sound, music cues, and voiceover triggered by location to build atmosphere and deliver story. Sound tells the player how to feel about a space before they consciously process what they are seeing.

```
audio_layers = {
    ambient: { track: "rain_on_roof.wav", volume: 0.3, loop: true },
    music: { track: null, volume: 0.0 },
    voiceover: { track: null, volume: 1.0 }
}

function transition_music(new_track, fade_duration):
    # Crossfade to avoid jarring cuts
    old_volume = audio_layers.music.volume
    for t in 0 to fade_duration:
        progress = t / fade_duration
        audio_layers.music.volume = old_volume * (1 - progress)
    audio_layers.music.track = new_track
    for t in 0 to fade_duration:
        progress = t / fade_duration
        audio_layers.music.volume = 0.6 * progress

function play_voiceover(clip):
    # Duck other audio while VO plays
    audio_layers.ambient.volume = 0.1
    audio_layers.music.volume = audio_layers.music.volume * 0.4
    audio_layers.voiceover.track = clip
    audio_layers.voiceover.play()
    on_complete: restore_volumes()
```

**Why it matters:** In a game with no combat or score, audio carries an enormous share of the emotional weight. A creaking floorboard, a distant phone ringing, a shift from silence to a minor-key piano — these are the "mechanics" of tension and release in a walking simulator.

**4. Non-Combat First-Person / Third-Person Movement**

Exploration-focused movement without threat. The player walks, looks around, and interacts — but there is nothing chasing them. Pacing is driven by curiosity, not fear.

```
WALK_SPEED = 3.0        # Deliberately slower than an FPS
LOOK_SPEED = 0.002
INTERACT_RANGE = 1.5

function update_movement(dt):
    # Simple directional movement
    move_input = get_input_vector()   # WASD / stick
    player.position += move_input * WALK_SPEED * dt

    # Mouse / stick look
    look_delta = get_look_input()
    player.facing += look_delta * LOOK_SPEED

    # Interaction raycast / proximity check
    if input_pressed("interact"):
        target = find_nearest_interactable(player.position, player.facing, INTERACT_RANGE)
        if target:
            target.interact()

# Note: No sprint. No jump (unless needed for traversal).
# Slower speed encourages looking at the environment.
```

**Why it matters:** The walk speed IS a design decision. Walking simulators are deliberately slow because the designer wants the player to look, not rush. Every aspect of the movement system should encourage observation and presence.

**5. Object Inspection System**

The ability to pick up objects, rotate them, read notes, and examine details up close. This transforms passive observation into active investigation.

```
inspecting = null

function start_inspection(object):
    inspecting = object
    inspecting.original_position = object.position
    # Move object to "inspection view" (centered, close to camera)
    inspecting.position = screen_center()
    inspecting.scale = 2.0
    disable_player_movement()

function update_inspection(dt):
    if inspecting == null: return

    # Rotate with mouse / stick
    rotation_input = get_look_input()
    inspecting.rotation_y += rotation_input.x * 2.0
    inspecting.rotation_x += rotation_input.y * 2.0

    # Check for "readable" side (e.g., back of a photo has writing)
    if inspecting.has_detail and facing_detail_side(inspecting):
        show_detail_text(inspecting.detail_text)

    if input_pressed("cancel"):
        end_inspection()

function end_inspection():
    inspecting.position = inspecting.original_position
    inspecting.scale = 1.0
    inspecting = null
    enable_player_movement()
```

**Why it matters:** Inspection turns the player from a passive viewer into an active detective. The act of physically rotating an object and discovering hidden text or details creates a moment of personal discovery that pre-rendered cutscenes cannot replicate.

**6. Narrative Pacing Through Level Design**

Using the physical layout of the space to gate discovery and create a rhythm of quiet moments and emotional peaks. Hallways slow the player down. Open rooms invite exploration. Locked doors defer revelations.

```
# Define the flow of the space
rooms = {
    "foyer":    { connects_to: ["living_room", "hallway"], locked: false },
    "hallway":  { connects_to: ["bedroom", "bathroom"], locked: false },
    "living_room": { connects_to: ["kitchen"], locked: false },
    "kitchen":  { connects_to: ["basement_door"], locked: false },
    "basement_door": { connects_to: ["basement"], locked: true,
                       unlock_condition: "found_key_in_bedroom" },
    "bedroom":  { contains: ["key_item"], locked: false },
    "basement":  { contains: ["final_revelation"], locked: false }
}

# The player MUST go through bedroom before basement
# This ensures they discover context before the climax
# The hallway between creates a "breath" moment

function try_open_door(door):
    if door.locked:
        if check_condition(door.unlock_condition):
            door.locked = false
            play_audio("door_unlock.wav")
            door.open()
        else:
            show_text("It's locked.")
            # Implicit: go find what opens this
    else:
        door.open()
```

**Why it matters:** In a game without combat encounters to pace the action, the level layout itself becomes the pacing tool. A long, narrow corridor after an emotional discovery gives the player time to process. A locked door creates anticipation. The designer controls the story's rhythm through architecture.

### Stretch Goals

- **Dynamic lighting shifts:** Change lighting color/intensity based on narrative progress (the house gets darker as the story gets heavier).
- **Player journal/inventory:** Collected notes appear in a journal the player can re-read, letting them review the story so far.
- **Multiple discovery orders:** Track which objects the player found first and subtly adjust voiceover or text to acknowledge their path through the story.
- **Ending variation:** The final scene changes based on how thoroughly the player explored (did they find all the hidden details, or just the critical path?).

### MVP Spec

| Element | Minimum Viable Version |
|---|---|
| **Environment** | 4-6 interconnected rooms (can be a 2D top-down map with tile-based walls) |
| **Interactable Objects** | 6-8 objects the player can examine (notes, photos, items) |
| **Trigger Zones** | 3-4 invisible zones that fire audio or text events |
| **Audio** | Ambient background loop + 2-3 triggered audio/text events |
| **Narrative** | A simple 3-beat story (setup, complication, revelation) told through objects and triggers |
| **Movement** | WASD or arrow key movement, interaction with a key press |
| **Inspection** | Click on an object to see its description / content in a detail view |
| **Gating** | At least 1 locked door that requires finding an item to open |
| **Win Condition** | Reaching the final room after discovering key narrative objects |

### Deliverable

A playable exploration game where the player moves through a small environment and pieces together a short story by examining objects and entering trigger zones. There should be no enemies, no health, and no score. The story should be discoverable in 3-5 minutes of exploration, with at least one moment of gated progression that ensures narrative order.

## Analogies by Background

### Backend Developers

| Core Concept | Analogy |
|---|---|
| Environmental Storytelling | Like structured logging — you place breadcrumbs (log entries) throughout a system, and the reader reconstructs what happened by examining them in context. |
| Trigger Zones | Like webhook endpoints — a region of space is "subscribed" to player entry, and when the event fires, it executes a handler. |
| Audio as Narrative Tool | Like monitoring alerts with severity levels — ambient sound is INFO, music shifts are WARN, voiceover is a CRITICAL alert. Each conveys urgency differently. |
| Non-Combat Movement | Like a read-only API — the player can GET information from the world but never POST, PUT, or DELETE. The system is designed entirely around retrieval. |
| Object Inspection | Like a detailed GET endpoint — the player requests more data about a specific resource, and the system returns a richer payload (description, history, connections). |
| Narrative Pacing via Level Design | Like rate limiting and request ordering — the architecture ensures consumers receive information in a sequence that makes sense, even if they try to access things out of order. |

### Frontend Developers

| Core Concept | Analogy |
|---|---|
| Environmental Storytelling | Like progressive disclosure in UI design — you do not dump all information at once. Context is revealed through interaction and exploration of the interface. |
| Trigger Zones | Like Intersection Observer — you define a boundary, and when the player element scrolls (walks) into it, a callback fires. |
| Audio as Narrative Tool | Like animation and transition states in a UI — they convey meaning, mood, and status beyond what the visual content alone communicates. |
| Non-Combat Movement | Like a documentation site or portfolio — the user browses at their own pace with no time pressure, no mandatory path, and no penalty for lingering. |
| Object Inspection | Like a modal or detail panel — clicking an item expands it to show more information, and dismissing it returns you to the main view. |
| Narrative Pacing via Level Design | Like a multi-step wizard or onboarding flow — the layout guides the user through information in the intended order, even while giving the illusion of freedom. |

### Data/ML Developers

| Core Concept | Analogy |
|---|---|
| Environmental Storytelling | Like feature engineering — the raw data (objects in a room) is meaningless until placed in context. Arrangement creates signal from noise. |
| Trigger Zones | Like threshold-based alerts in a monitoring pipeline — when a metric (player position) crosses a boundary, an action is triggered. |
| Audio as Narrative Tool | Like data sonification — translating non-visual information into sound to give the user another channel of understanding. |
| Non-Combat Movement | Like exploratory data analysis — no hypothesis to prove, no model to train. You are just wandering through the data, looking for patterns and stories. |
| Object Inspection | Like drilling down in a dashboard — clicking on an aggregate reveals the underlying records, giving you richer detail about a single data point. |
| Narrative Pacing via Level Design | Like a directed acyclic graph (DAG) in a pipeline — tasks (narrative beats) have dependencies, and the architecture ensures they execute in the right order. |

### Discussion Questions

1. Walking simulators are often criticized as "not real games." What is the minimum interaction required for something to feel like a game versus a passive experience? Where do you draw the line, and why?

2. In Gone Home, the player can go almost anywhere in any order, yet most players experience the story in roughly the same emotional arc. How does level design create a "guided freedom" that feels open but is actually structured?

3. If you removed all audio from a walking simulator — no music, no ambient sound, no voiceover — how much narrative can the environment alone carry? What would you need to change about the visual design to compensate?

4. Walking simulators rely heavily on the player choosing to engage. What design techniques can you use to make a player *want* to pick up and examine an object, without resorting to UI markers, waypoints, or "press X to interact" prompts?
