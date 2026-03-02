/**
 * Source of truth for all module pages and their expected canvas IDs.
 * Used by smoke tests and interaction tests.
 */
export const modules = [
  { slug: '01-pong', canvasIds: ['demo-gameloop', 'demo-aabb', 'demo-reflect', 'demo-fsm', 'demo-pong'] },
  { slug: '02-platformer', canvasIds: ['demo-gravity', 'demo-tilemap', 'demo-fsm', 'demo-coyote', 'demo-platformer'] },
  { slug: '03-top-down-shooter', canvasIds: ['demo-pool', 'demo-vector', 'demo-collision', 'demo-enemy', 'demo-shooter'] },
  { slug: '04-endless-runner', canvasIds: ['procgen-canvas', 'ringbuf-canvas', 'curve-canvas', 'parallax-canvas', 'runner-canvas'] },
  { slug: '05-puzzle', canvasIds: ['demo-rotation', 'demo-lineclear', 'demo-tetris'] },
  { slug: '06-tower-defense', canvasIds: ['demo-astar', 'demo-targeting', 'demo-td'] },
  { slug: '07-roguelike', canvasIds: ['demo-bsp', 'demo-turns', 'demo-fov'] },
  { slug: '08-fighting-game', canvasIds: ['demo-hitbox', 'demo-framedata', 'demo-inputbuf'] },
  { slug: '09-racing', canvasIds: ['demo-steering', 'demo-friction', 'demo-racer'] },
  { slug: '10-deckbuilder', canvasIds: ['demo-deck', 'demo-effects', 'demo-status'] },
  { slug: '11-first-person-game', canvasIds: ['demo-3d', 'demo-raycast', 'demo-fov'] },
  { slug: '12-3d-platformer', canvasIds: ['demo-orbit', 'demo-camrel', 'demo-shadow'] },
  { slug: '13-capstone', canvasIds: ['demo-scope', 'demo-plan'] },
  { slug: '14-metroidvania', canvasIds: ['demo-graph', 'demo-gating'] },
  { slug: '15-run-and-gun', canvasIds: ['demo-aim', 'demo-boss'] },
  { slug: '16-third-person-shooter', canvasIds: ['demo-camera', 'demo-cover'] },
  { slug: '17-point-and-click', canvasIds: ['demo-inventory', 'demo-dialog'] },
  { slug: '18-visual-novel', canvasIds: ['demo-narrative', 'demo-typewriter'] },
  { slug: '19-walking-simulator', canvasIds: ['demo-triggers', 'demo-inspect'] },
  { slug: '20-turn-based-rpg', canvasIds: ['demo-damage', 'demo-turnorder', 'demo-battle'] },
  { slug: '21-action-rpg', canvasIds: ['demo-loot', 'demo-iframes'] },
  { slug: '22-rts', canvasIds: ['demo-box-select', 'demo-fog'] },
  { slug: '23-turn-based-strategy', canvasIds: ['demo-movement', 'demo-hit-prob'] },
  { slug: '24-auto-battler', canvasIds: ['demo-shop', 'demo-combat'] },
  { slug: '25-4x-strategy', canvasIds: ['demo-hex', 'demo-techtree'] },
  { slug: '26-sokoban', canvasIds: ['demo-push', 'demo-undo', 'demo-sokoban'] },
  { slug: '27-physics-puzzle', canvasIds: ['demo-slingshot', 'demo-materials'] },
  { slug: '28-simulation-racing', canvasIds: ['demo-grip-circle', 'demo-racing-line'] },
  { slug: '29-management-tycoon', canvasIds: ['demo-sim-loop', 'demo-financial'] },
  { slug: '30-farming-life-sim', canvasIds: ['demo-crop-growth', 'demo-time-budget'] },
  { slug: '31-survival-crafting', canvasIds: ['demo-craft-tree', 'demo-day-night'] },
  { slug: '32-rhythm-game', canvasIds: ['demo-timing', 'demo-rhythm'] },
  { slug: '33-survival-horror', canvasIds: ['demo-stalker', 'demo-flashlight'] },
  { slug: '34-idle-incremental', canvasIds: ['demo-growth', 'demo-prestige'] },
  { slug: '35-party-game', canvasIds: ['demo-minigames', 'demo-multiinput'] },
  { slug: '36-trivia', canvasIds: ['demo-trivia', 'demo-selection'] },
  { slug: '37-social-deduction', canvasIds: ['demo-roles', 'demo-voting'] },
  { slug: '38-sandbox', canvasIds: ['demo-terrain', 'demo-blocks'] },
];

/** Total expected canvas count across all modules */
export const totalCanvasCount = modules.reduce((sum, m) => sum + m.canvasIds.length, 0);
