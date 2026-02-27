# Module 0: Setup

**Goal:** Choose your engine/framework and get a window rendering with a colored rectangle moving on screen.

This is pre-work before the course starts. Complete it at your own pace.

## Choose Your Stack

This course is engine-agnostic. Pick whatever interests you — the mechanics and concepts are the same everywhere. Here are the most common options:

### Unity (C#)
- **Best for:** Industry-standard skills, 2D and 3D, huge ecosystem
- **Setup:** Download Unity Hub, create a new 2D project
- **"Hello World":** Create a sprite, move it with `transform.position += Vector3.right * speed * Time.deltaTime` in `Update()`
- **Where it shines:** Built-in physics, animation, UI, asset pipeline. Handles the game loop for you.

### Godot (GDScript or C#)
- **Best for:** Open source, lightweight, fast iteration
- **Setup:** Download from godotengine.org, create a new 2D project
- **"Hello World":** Add a Sprite2D node, move it in `_process(delta)` with `position.x += speed * delta`
- **Where it shines:** Scene tree architecture, signals system, built-in tilemap editor

### Web / JavaScript (Phaser, PixiJS, or raw Canvas)
- **Best for:** Low barrier to entry, easy to share/demo in a browser, no install for viewers
- **Setup (raw Canvas):** Create an HTML file, get a `<canvas>` 2D context, write your own `requestAnimationFrame` loop
- **Setup (Phaser):** `npm create @phaserjs/game@latest` or CDN include
- **"Hello World":** Draw a rectangle, update its x position each frame
- **Where it shines:** You see *everything* — no engine magic. Forces you to understand the game loop because you write it yourself.

### Other Options
- **Love2D (Lua)** — extremely simple, great for jams
- **Pygame (Python)** — accessible if Python is your comfort zone
- **Unreal (C++/Blueprints)** — overkill for this course but valid if you want Unreal experience

## What to Build

Your setup "hello world" should demonstrate:

1. **A window/canvas renders** — you can draw to the screen
2. **Something moves** — a rectangle or sprite translates across the screen each frame
3. **Input does something** — pressing a key changes the movement (direction, speed, color, anything)

That's it. If you can do those three things, you have a working game loop and you're ready for Module 1.

## Engine vs. No Engine: What's the Difference?

Throughout this course, you'll notice a pattern:

| Concept | With Engine | Without Engine |
|---------|------------|----------------|
| Game loop | Engine calls your `Update()` | You write `requestAnimationFrame` yourself |
| Collision | Engine provides `OnCollisionEnter` | You write AABB intersection checks |
| Physics | Engine has `Rigidbody` component | You implement `velocity += gravity * dt` |
| Rendering | Engine batches draw calls | You call `ctx.fillRect()` every frame |
| Input | Engine maps inputs to actions | You read `KeyboardEvent` or poll state |

Neither approach is "better." Engines remove boilerplate so you can focus on game-specific logic. Building without an engine teaches you what the engine is doing under the hood. This course values understanding both.

## Checklist

- [ ] Engine/framework installed and working
- [ ] Can render a colored shape to the screen
- [ ] Can move it with input
- [ ] Ready for Module 1
