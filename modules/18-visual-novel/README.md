# Module 18: Visual Novel
**Branching narrative where choices shape the story | Your decisions write the ending**
> "The most powerful game mechanic is the one that makes you put down the controller and think."
---

## Prerequisites
- **Module 1 (Pong):** Basic game loop, input handling, and rendering. Visual novels are architecturally simple but require clean state management — you need the fundamentals, not physics or complex movement.

## Week 1: History & Design Theory

### The Origin

*Phoenix Wright: Ace Attorney* (2001), directed by Shu Takumi at Capcom and originally released for the Game Boy Advance in Japan, demonstrated that a visual novel could be built around *active deduction* rather than passive reading. While earlier visual novels like *Snatcher* (1988) and *Tokimeki Memorial* (1994) had established branching narrative and character relationship systems, *Phoenix Wright* added a courtroom mechanic where the player had to examine evidence, identify contradictions in testimony, and present the right piece of evidence at the right moment. This transformed the visual novel from a genre where the player simply selected dialog options into one where the player *reasoned* through problems, making choices feel consequential not because of branching paths but because they tested comprehension. It proved that text-driven games could deliver tension, humor, and dramatic payoff as effectively as any action game.

### How the Genre Evolved

- **Doki Doki Literature Club (2017):** Dan Salvato's free game used the visual novel format's conventions against the player, subverting expectations in ways that required the medium's tropes to function. It manipulated save files, broke the fourth wall by addressing the player directly, and corrupted its own interface. Its contribution was demonstrating that the visual novel's data-driven structure — where story lives in script files and the engine merely renders them — could itself become a narrative device when the "script" appears to malfunction. It reached a massive Western audience and proved the genre's viability outside Japan.

- **13 Sentinels: Aegis Rim (2019):** Vanillaware's George Kamitani created a visual novel with 13 playable protagonists whose stories interleaved across multiple timelines. The player chose which character's route to pursue and in what order, with each route revealing information that recontextualized the others. Its contribution was demonstrating that non-linear route structure could be an expressive tool — the *order* in which the player experienced story beats changed their meaning, making the route system itself a form of storytelling.

### What Makes Visual Novels "Great"

The core design insight of the visual novel is that **anticipation of consequences is more engaging than the consequences themselves**. When a player faces a choice — "Do you tell her the truth?" — the power of that moment lives not in the branching code but in the seconds the player spends *deliberating*. The best visual novels design choices where the player genuinely does not know what will happen, where they care enough about the characters to agonize, and where the consequences may not reveal themselves for hours. This delayed consequence loop is uniquely powerful: it transforms reading into an active, anxious experience where every line of dialogue could be building toward a payoff for a choice made three chapters ago. The genre proves that interactivity does not require reflex or spatial reasoning — the act of choosing is itself a profound mechanic.

### The Essential Mechanic

**Making choices that branch the story, where consequences may not be immediately apparent** — the player reads, deliberates, decides, and lives with outcomes that reveal themselves over time.

## Week 2: Build the MVP

### What You're Building

A short branching story (10-20 story beats) with at least 3 meaningful choices leading to at least 2 distinct endings. The story is defined in a data file (not hardcoded), rendered with character sprites that change expression, a typewriter text effect, and background scene transitions. The player can save and load their progress.

This module is 2D. No engine is required.

### Core Concepts (Must Implement)

**1. Branching Narrative as a Directed Graph**

The story is a directed graph where each node is a story beat (a block of text, a choice, or a scene event) and each edge represents a transition to the next beat. Choice nodes have multiple outgoing edges, one per option. The graph may converge (branches rejoin), diverge (branches split permanently), or both.

```
# Story graph definition
story = {
    "start": {
        type: "text",
        speaker: "narrator",
        text: "The letter arrived on a Tuesday. You recognized the handwriting.",
        next: "choice_open_letter"
    },
    "choice_open_letter": {
        type: "choice",
        text: "The envelope sits on your desk.",
        options: [
            { text: "Open it immediately.", next: "open_letter",
              set_flag: "opened_eagerly" },
            { text: "Leave it for later.", next: "ignore_letter",
              set_flag: "ignored_letter" },
        ]
    },
    "open_letter": {
        type: "text",
        speaker: "protagonist",
        text: "My hands trembled as I tore it open...",
        next: "letter_contents"
    },
    "ignore_letter": {
        type: "text",
        speaker: "narrator",
        text: "You set it aside. By evening, curiosity won.",
        next: "letter_contents"  # Branches reconverge
    },
    "letter_contents": {
        type: "text",
        speaker: "narrator",
        text: "It read: 'Come to the old bridge at midnight. Come alone.'",
        # Different continuation based on flag
        next: {
            condition: "opened_eagerly",
            if_true: "excited_reaction",
            if_false: "cautious_reaction"
        }
    },
    ...
    "ending_good": {
        type: "ending",
        text: "You made it through. Together.",
        ending_name: "The Bridge Between"
    },
    "ending_bad": {
        type: "ending",
        text: "The bridge was empty. You were too late.",
        ending_name: "Midnight, Alone"
    }
}

class StoryEngine:
    def __init__(self, story_data):
        self.story = story_data
        self.current_node_id = "start"
        self.flags = {}
        self.history = []      # For backtracking/save

    def get_current(self):
        return self.story[self.current_node_id]

    def advance(self, choice_index=null):
        node = self.get_current()
        self.history.append(self.current_node_id)

        if node.type == "choice":
            chosen = node.options[choice_index]
            if "set_flag" in chosen:
                self.flags[chosen["set_flag"]] = true
            self.current_node_id = chosen["next"]

        elif node.type == "text":
            next_val = node["next"]
            if isinstance(next_val, dict):
                # Conditional branching
                if self.flags.get(next_val["condition"], false):
                    self.current_node_id = next_val["if_true"]
                else:
                    self.current_node_id = next_val["if_false"]
            else:
                self.current_node_id = next_val

        elif node.type == "ending":
            return "game_over"

        return self.current_node_id
```

**Why it matters:** The directed graph is the fundamental architecture of the visual novel. Every system in the game — text display, character sprites, scene transitions, save/load — is driven by traversing this graph. Defining the story as data rather than code means writers can author content independently of programmers, and the engine can be reused for any story.

**2. Text Rendering / Typewriter Effect**

Text appears character by character rather than all at once, creating a reading rhythm that mimics natural pacing. The player can click or press a button to instantly complete the current text block, then click again to advance to the next beat.

```
class TypewriterText:
    def __init__(self):
        self.full_text = ""
        self.visible_chars = 0
        self.chars_per_second = 30
        self.timer = 0.0
        self.complete = false
        self.pauses = {}  # char_index -> pause_duration

    def set_text(self, text):
        self.full_text = text
        self.visible_chars = 0
        self.timer = 0.0
        self.complete = false
        # Auto-detect pause points
        self.pauses = {}
        for i, char in enumerate(text):
            if char == '.':
                self.pauses[i] = 0.3
            elif char == ',':
                self.pauses[i] = 0.15
            elif char == '!':
                self.pauses[i] = 0.25

    def update(self, dt):
        if self.complete:
            return
        self.timer += dt
        while self.timer >= 1.0 / self.chars_per_second:
            self.timer -= 1.0 / self.chars_per_second
            self.visible_chars += 1
            # Check for pause at this character
            if self.visible_chars in self.pauses:
                self.timer -= self.pauses[self.visible_chars]
            if self.visible_chars >= len(self.full_text):
                self.complete = true
                break

    def skip_to_end(self):
        self.visible_chars = len(self.full_text)
        self.complete = true

    def get_visible_text(self):
        return self.full_text[:self.visible_chars]

    def handle_input(self, click):
        if click:
            if not self.complete:
                self.skip_to_end()
                return "completed"
            else:
                return "advance"  # Move to next story beat
        return null
```

**Why it matters:** The typewriter effect controls pacing, which is everything in a text-driven game. A dramatic revelation delivered all at once loses impact. Character by character, with pauses at punctuation, the text breathes — the player reads at the writer's intended pace. The skip-to-complete mechanic respects players who read faster than the typewriter.

**3. Character Sprite and Expression System**

Characters are displayed as layered sprites on screen. Each character has a set of expression variants (happy, sad, angry, surprised). The story data specifies which characters are visible and which expression each should display at any given beat.

```
class CharacterSprite:
    def __init__(self, name, base_position):
        self.name = name
        self.position = base_position  # "left", "center", "right"
        self.expressions = {}          # expression_name -> image
        self.current_expression = "neutral"
        self.visible = false
        self.alpha = 0.0               # For fade in/out

    def load_expressions(self, expression_map):
        # expression_map: {"happy": "char_happy.png", "sad": "char_sad.png", ...}
        for name, path in expression_map.items():
            self.expressions[name] = load_image(path)

    def set_expression(self, expression_name):
        if expression_name in self.expressions:
            self.current_expression = expression_name

    def show(self, fade_duration=0.3):
        self.visible = true
        self.fade_target = 1.0
        self.fade_speed = 1.0 / fade_duration

    def hide(self, fade_duration=0.3):
        self.fade_target = 0.0
        self.fade_speed = 1.0 / fade_duration

    def update(self, dt):
        # Smooth alpha transition
        if self.alpha < self.fade_target:
            self.alpha = min(self.alpha + self.fade_speed * dt,
                             self.fade_target)
        elif self.alpha > self.fade_target:
            self.alpha = max(self.alpha - self.fade_speed * dt,
                             self.fade_target)
            if self.alpha <= 0:
                self.visible = false

    def render(self, screen):
        if not self.visible and self.alpha <= 0:
            return
        img = self.expressions[self.current_expression]
        x = POSITION_MAP[self.position]  # "left" -> 200, "center" -> 512, etc.
        draw_image(screen, img, x, CHAR_Y, alpha=self.alpha)

# Story nodes include character directives
story_node = {
    type: "text",
    speaker: "elena",
    text: "I wasn't sure you'd come.",
    characters: [
        { name: "elena", position: "center", expression: "relieved" },
    ]
}
```

**Why it matters:** Character sprites are the visual anchor of the experience. Expression changes synchronized with dialog text create the illusion of a reacting, emotional character. A single sprite swap from "neutral" to "surprised" at the right moment communicates more than a paragraph of description.

**4. Choice System with Consequence Tracking**

Choices set flags that affect future story branches. Some consequences are immediate (the next line changes), while others are delayed (a flag set in chapter 1 determines an outcome in chapter 5). The system must track all flags persistently throughout a playthrough.

```
class ChoiceTracker:
    def __init__(self):
        self.flags = {}
        self.choice_history = []    # Track all choices for analytics/endings
        self.affinity = {}          # Character relationship scores

    def make_choice(self, choice_data):
        self.choice_history.append({
            "node": choice_data["node_id"],
            "chosen": choice_data["option_index"],
            "text": choice_data["option_text"]
        })

        # Set simple flags
        if "set_flag" in choice_data:
            self.flags[choice_data["set_flag"]] = true

        # Modify relationship scores
        if "affinity" in choice_data:
            for character, delta in choice_data["affinity"].items():
                self.affinity[character] = self.affinity.get(character, 0) + delta

    def check_flag(self, flag_name):
        return self.flags.get(flag_name, false)

    def get_affinity(self, character):
        return self.affinity.get(character, 0)

    def evaluate_condition(self, condition):
        """Evaluate conditions like 'affinity:elena >= 3 AND trusted_friend'"""
        if " AND " in condition:
            parts = condition.split(" AND ")
            return all(self.evaluate_condition(p.strip()) for p in parts)
        if " OR " in condition:
            parts = condition.split(" OR ")
            return any(self.evaluate_condition(p.strip()) for p in parts)
        if condition.startswith("affinity:"):
            # Parse "affinity:elena >= 3"
            parts = condition.split()
            char_name = parts[0].split(":")[1]
            operator = parts[1]
            value = int(parts[2])
            actual = self.get_affinity(char_name)
            if operator == ">=": return actual >= value
            if operator == "<=": return actual <= value
            if operator == "==": return actual == value
        else:
            return self.check_flag(condition)

# Choice with delayed consequence
choice_node = {
    type: "choice",
    text: "She looks at you expectantly.",
    options: [
        { text: "Tell her about the letter.",
          next: "tell_truth",
          set_flag: "told_elena_truth",
          affinity: { "elena": 2 } },
        { text: "Say nothing.",
          next: "stay_silent",
          set_flag: "hid_letter_from_elena",
          affinity: { "elena": -1 } },
    ]
}

# Hours later, this flag determines a scene
later_node = {
    type: "text",
    speaker: "elena",
    next: {
        condition: "told_elena_truth",
        if_true: "elena_grateful",    # She remembers you were honest
        if_false: "elena_discovers"   # She finds out you lied
    }
}
```

**Why it matters:** Delayed consequences are the soul of the visual novel. If every choice had immediate, obvious results, the player would simply optimize. When consequences are delayed, the player must make choices based on values rather than strategy — "What would I actually do?" rather than "Which option gives the best reward?" This is what makes visual novel choices feel personal.

**5. Multiple Endings / Route System**

The game has multiple distinct endings determined by the accumulated choices and flags across the playthrough. An ending selection function evaluates the player's history to determine which ending to show.

```
ENDINGS = {
    "ending_together": {
        name: "The Bridge Between",
        conditions: "told_elena_truth AND affinity:elena >= 3",
        priority: 1,   # Higher priority = checked first
        text: "You cross the bridge side by side..."
    },
    "ending_alone_good": {
        name: "A New Morning",
        conditions: "!told_elena_truth AND showed_courage",
        priority: 2,
        text: "You stand at the bridge alone, but at peace..."
    },
    "ending_alone_bad": {
        name: "Midnight, Alone",
        conditions: null,  # Default/fallback ending
        priority: 99,
        text: "The bridge is empty. The letter blows into the river..."
    }
}

def determine_ending(choice_tracker):
    """Evaluate endings by priority, return the first whose conditions are met."""
    sorted_endings = sorted(ENDINGS.values(), key=lambda e: e["priority"])
    for ending in sorted_endings:
        if ending["conditions"] is null:
            return ending  # Fallback
        if choice_tracker.evaluate_condition(ending["conditions"]):
            return ending
    return sorted_endings[-1]  # Should never reach here if fallback exists

def show_ending_screen(ending):
    display_text(ending["text"])
    display_ending_name(ending["name"])
    # Show which ending this is out of total
    display_text(f"Ending: {ending['name']} (1 of {len(ENDINGS)})")
    # Encourage replay
    display_text("Other paths remain unexplored...")
```

**Why it matters:** Multiple endings give choices weight retroactively. Even if the player does not replay, knowing that other endings *exist* validates the feeling that their choices mattered. For players who do replay, different endings reward exploring alternative decisions and reveal new facets of the story.

**6. Scripting / Data-Driven Story Format**

The entire story is defined in external data files (JSON, YAML, or a custom format), not hardcoded in the game logic. The engine reads these files and interprets them. This separation means the story can be written, edited, and expanded without touching code.

```
# story.json — the story as pure data
{
  "nodes": {
    "start": {
      "type": "text",
      "speaker": "narrator",
      "text": "The letter arrived on a Tuesday.",
      "background": "apartment_evening",
      "characters": [],
      "music": "quiet_piano",
      "next": "choice_open_letter"
    },
    "choice_open_letter": {
      "type": "choice",
      "text": "The envelope sits on your desk.",
      "options": [
        { "text": "Open it.", "next": "open_letter", "set_flag": "opened_eagerly" },
        { "text": "Leave it.", "next": "ignore_letter", "set_flag": "ignored_letter" }
      ]
    }
  },
  "characters": {
    "elena": {
      "display_name": "Elena",
      "color": "#7EC8E3",
      "expressions": {
        "neutral": "elena_neutral.png",
        "happy": "elena_happy.png",
        "sad": "elena_sad.png",
        "relieved": "elena_relieved.png",
        "angry": "elena_angry.png"
      }
    }
  },
  "backgrounds": {
    "apartment_evening": "bg_apartment_evening.png",
    "bridge_night": "bg_bridge_night.png"
  }
}

# Engine loads and interprets this data
class StoryLoader:
    def load(self, filepath):
        data = read_json(filepath)
        story_nodes = data["nodes"]
        characters = {}
        for char_id, char_data in data["characters"].items():
            sprite = CharacterSprite(char_data["display_name"], "center")
            sprite.load_expressions(char_data["expressions"])
            characters[char_id] = sprite
        backgrounds = data["backgrounds"]
        return story_nodes, characters, backgrounds
```

A custom domain-specific language (DSL) can also work well for story authoring, offering a more readable format than raw JSON:

```
# story.script — a simple DSL alternative
@scene apartment_evening
@music quiet_piano

NARRATOR: The letter arrived on a Tuesday.

> Open it.
    @set opened_eagerly
    @goto open_letter
> Leave it.
    @set ignored_letter
    @goto ignore_letter
```

**Why it matters:** Separating story data from engine code is the architectural decision that makes visual novels practical to develop. A hardcoded story cannot be written by non-programmers, cannot be easily tested in isolation, and cannot be swapped or modded. Data-driven design transforms the engine into a reusable platform and the story into portable content.

**7. Background / Scene Transitions**

Background images change to establish location. Transitions between backgrounds use effects like crossfade, dissolve, or cut-to-black to create pacing and mood.

```
class BackgroundRenderer:
    def __init__(self):
        self.current_bg = null
        self.next_bg = null
        self.transition_type = "none"
        self.transition_progress = 0.0
        self.transition_speed = 2.0   # Complete in 0.5 seconds

    def change_background(self, new_bg_image, transition="crossfade"):
        if self.current_bg is null:
            self.current_bg = new_bg_image
            return
        self.next_bg = new_bg_image
        self.transition_type = transition
        self.transition_progress = 0.0

    def update(self, dt):
        if self.transition_type == "none":
            return

        self.transition_progress += dt * self.transition_speed
        if self.transition_progress >= 1.0:
            self.current_bg = self.next_bg
            self.next_bg = null
            self.transition_type = "none"
            self.transition_progress = 0.0

    def render(self, screen):
        if self.transition_type == "none":
            draw_image(screen, self.current_bg, 0, 0)
            return

        if self.transition_type == "crossfade":
            draw_image(screen, self.current_bg, 0, 0,
                       alpha=1.0 - self.transition_progress)
            draw_image(screen, self.next_bg, 0, 0,
                       alpha=self.transition_progress)

        elif self.transition_type == "fade_through_black":
            if self.transition_progress < 0.5:
                # Fade current to black
                darkness = self.transition_progress * 2.0
                draw_image(screen, self.current_bg, 0, 0)
                draw_rect(screen, BLACK, full_screen, alpha=darkness)
            else:
                # Fade black to next
                darkness = (1.0 - self.transition_progress) * 2.0
                draw_image(screen, self.next_bg, 0, 0)
                draw_rect(screen, BLACK, full_screen, alpha=darkness)

        elif self.transition_type == "cut":
            # Instant switch
            self.current_bg = self.next_bg
            self.next_bg = null
            self.transition_type = "none"
            draw_image(screen, self.current_bg, 0, 0)
```

**Why it matters:** Backgrounds establish place and mood. The transition type communicates narrative pacing — a hard cut implies sudden change, a slow crossfade implies gentle passage of time, and a fade-through-black signals a significant scene break. These are cinematic tools that visual novels inherit, and using them deliberately elevates the storytelling.

### Stretch Goals (If Time Allows)

- **Save/load with multiple slots:** Allow the player to save at any point and maintain multiple save files, enabling them to explore different branches without replaying from the start.
- **Text log / backlog:** A scrollable history of all text and choices the player has seen, allowing them to review past dialogue.
- **Auto-advance mode:** Automatically advance text after a configurable delay, letting the player read hands-free.
- **Ending gallery:** A screen that shows which endings the player has discovered (and silhouettes for undiscovered ones), encouraging replay to find them all.

### MVP Spec

| Feature | Required |
|---|---|
| Story defined in data file (JSON, YAML, or DSL) | Yes |
| Story engine that traverses the narrative graph | Yes |
| Typewriter text rendering with skip | Yes |
| At least 2 character sprites with 3+ expressions each | Yes |
| Expression changes synchronized with story beats | Yes |
| At least 3 meaningful choices with flag-setting | Yes |
| At least 1 delayed consequence (flag set early, checked later) | Yes |
| At least 2 distinct endings | Yes |
| Background images with crossfade transitions | Yes |
| Speaker name and text styling per character | Yes |
| Save/load with multiple slots | Stretch |
| Text log / backlog | Stretch |
| Auto-advance mode | Stretch |
| Ending gallery | Stretch |

### Deliverable

Submit your playable visual novel with source code, the story data file, and a **narrative graph diagram** showing all story nodes, choices, branches, and endings. Include a short write-up (300-500 words) answering: *How did you design your choices so that the player feels their decisions matter? Describe one choice where the consequence is delayed and explain how you used flags to connect the choice to its eventual outcome.*

## Analogies by Background
> These analogies map game dev concepts to patterns you already know.

### For Backend Developers

| Game Dev Concept | Backend Analogy |
|---|---|
| Branching narrative graph | A workflow engine (Temporal, Step Functions) — nodes are workflow steps, edges are transitions, and the execution path depends on runtime conditions (flags) |
| Typewriter text rendering | Streaming HTTP responses — delivering data character by character rather than in a single payload, with the consumer (player) able to request the full payload early (skip) |
| Character sprite/expression system | A template engine with partials — the base template (character) swaps in different partials (expressions) based on context variables passed at render time |
| Choice system with consequence tracking | Event sourcing — every choice is an immutable event appended to a log, and the current state (flags, affinity) is derived by replaying all events in order |
| Multiple endings / route system | A rules engine — ordered rules evaluated top-down, where the first rule whose conditions match produces the result (ending) |
| Data-driven story format | Configuration-as-code / infrastructure-as-data — the runtime behavior is entirely determined by declarative configuration files, not imperative code |
| Background / scene transitions | Blue-green deployment — transitioning smoothly from one active state (old background) to another (new background) with a brief overlap period |

### For Frontend Developers

| Game Dev Concept | Frontend Analogy |
|---|---|
| Branching narrative graph | A state machine for UI flow (XState) — each state renders different content, transitions are triggered by user actions (choices), and guards (flags) control which transitions are available |
| Typewriter text rendering | A CSS animation on `width` with `overflow: hidden` on a monospace element — or a JavaScript interval that reveals characters one at a time, with a click handler to skip to completion |
| Character sprite/expression system | Conditional rendering of image components — a React component that receives an `expression` prop and renders the corresponding image, with CSS transitions on swap |
| Choice system with consequence tracking | Redux action history — each choice dispatches an action that updates the store (flags), and downstream components read the store to conditionally render content |
| Multiple endings / route system | A/B test resolution — evaluating conditions from a prioritized list of variants to determine which page/component to render for the current user session |
| Data-driven story format | CMS-driven content — the React app is the engine, the content comes from a headless CMS (story data file), and the two are developed independently |
| Background / scene transitions | CSS transitions between background images — `transition: background-image 0.5s ease` on a container element, or crossfade using overlapping absolutely-positioned divs |

### For Data / ML Engineers

| Game Dev Concept | Data / ML Analogy |
|---|---|
| Branching narrative graph | A decision tree with stateful traversal — each internal node splits on a player choice, leaf nodes are endings, and the path through the tree is the player's unique playthrough |
| Typewriter text rendering | Streaming inference — a language model generating tokens one at a time, with the option to batch-return all remaining tokens if the user presses "skip" |
| Character sprite/expression system | Feature visualization — displaying different visual representations of a data entity (character) depending on which features (mood) are active, like attention heatmaps changing per layer |
| Choice system with consequence tracking | Feature store updates — each choice writes a feature (flag) to the store, and downstream models (story nodes) read from the store to make predictions (determine content) |
| Multiple endings / route system | Model selection based on metadata — evaluating a ranked list of candidate models (endings) against the current data profile (player flags) and selecting the best match |
| Data-driven story format | Config-driven pipelines — the pipeline code is generic, and a YAML/JSON config determines what data is loaded, what transformations run, and what output is produced |
| Background / scene transitions | Dataset blending — smoothly transitioning between two data distributions (backgrounds) by interpolating their weights over a transition period |

---

### Discussion Questions

1. **The paradox of choice:** Research suggests that more options can lead to decision paralysis and less satisfaction. How many choices should a visual novel offer per chapter? Is it better to have fewer, higher-stakes choices or many small ones? How did you balance this in your MVP?

2. **Visible vs. invisible consequences:** Some visual novels show you exactly what changed after a choice ("Elena will remember this"). Others hide consequences entirely. What are the design implications of each approach? Which creates more meaningful decision-making?

3. **The replay problem:** Visual novels encourage replay to see different endings, but replaying means re-reading content you have already seen. How can designers balance making each playthrough feel fresh against the reality that much of the content will be repeated? What tools (skip, fast-forward, route selection) help?

4. **Story as data vs. story as code:** Your MVP defines the story in a data file. What are the tradeoffs of this approach versus writing story logic directly in code? At what point does the data format become so complex (conditions, nested branches, scripted events) that it effectively becomes a programming language?
