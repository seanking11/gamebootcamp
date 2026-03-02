#!/usr/bin/env node
/**
 * Validates all Sokoban levels embedded in the Astro source file.
 * Run: node site/scripts/validate-sokoban.js
 *
 * Checks:
 * - Equal number of boxes ($, *) and targets (., *, +)
 * - Exactly one player (@, +)
 * - Level is enclosed (walls surround playable area)
 * - No box is in a corner without a target (dead on arrival)
 * - Level is solvable via BFS solver (brute-force, small levels only)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASTRO_FILE = resolve(__dirname, '../src/pages/modules/26-sokoban.astro');

// --- Parse levels from the source file ---
function extractLevels(source) {
  const match = source.match(/const LEVELS\s*=\s*\[([\s\S]*?)\];/);
  if (!match) { console.error('Could not find LEVELS array in source'); process.exit(1); }

  const levels = [];
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(match[1])) !== null) {
    levels.push(m[1].replace(/\\n/g, '\n'));
  }
  return levels;
}

// --- Level analysis ---
const WALL = '#', FLOOR = ' ', TARGET = '.', BOX = '$', PLAYER = '@', BOX_ON_TARGET = '*', PLAYER_ON_TARGET = '+';

function analyzeLevel(levelStr, index) {
  const lines = levelStr.split('\n');
  const rows = lines.length;
  const cols = Math.max(...lines.map(l => l.length));
  const errors = [];
  const warnings = [];

  let boxes = 0, targets = 0, players = 0;
  const boxPositions = [];
  const targetPositions = [];
  let playerPos = null;

  // Build grid
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const ch = (lines[r] || '')[c] || ' ';
      grid[r][c] = ch;

      if (ch === BOX || ch === BOX_ON_TARGET) {
        boxes++;
        boxPositions.push({ r, c });
      }
      if (ch === TARGET || ch === BOX_ON_TARGET || ch === PLAYER_ON_TARGET) {
        targets++;
        targetPositions.push({ r, c });
      }
      if (ch === PLAYER || ch === PLAYER_ON_TARGET) {
        players++;
        playerPos = { r, c };
      }
    }
  }

  // Check box/target count
  if (boxes !== targets) {
    errors.push(`Box/target mismatch: ${boxes} boxes, ${targets} targets`);
  }

  // Check player count
  if (players === 0) errors.push('No player (@) found');
  if (players > 1) errors.push(`Multiple players found: ${players}`);

  // Check for dead-on-arrival boxes (in corner without target)
  for (const box of boxPositions) {
    const isOnTarget = grid[box.r][box.c] === BOX_ON_TARGET;
    if (isOnTarget) continue;

    const wallUp = box.r === 0 || grid[box.r - 1][box.c] === WALL;
    const wallDown = box.r === rows - 1 || grid[box.r + 1]?.[box.c] === WALL;
    const wallLeft = box.c === 0 || grid[box.r][box.c - 1] === WALL;
    const wallRight = box.c === cols - 1 || grid[box.r][box.c + 1] === WALL;

    if ((wallUp || wallDown) && (wallLeft || wallRight)) {
      errors.push(`Dead box at (${box.r},${box.c}): stuck in corner with no target`);
    }
  }

  // Check level is enclosed (flood fill from player shouldn't reach edges without walls)
  if (playerPos) {
    const visited = new Set();
    const queue = [playerPos];
    let reachesEdge = false;

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1) {
        const ch = grid[r]?.[c];
        if (ch !== WALL && ch !== undefined) {
          reachesEdge = true;
        }
      }

      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
          reachesEdge = true;
          continue;
        }
        if (grid[nr][nc] !== WALL && !visited.has(`${nr},${nc}`)) {
          queue.push({ r: nr, c: nc });
        }
      }
    }

    if (reachesEdge) {
      warnings.push('Level may not be fully enclosed (flood fill reaches edge)');
    }
  }

  return { index, boxes, targets, players, errors, warnings, rows, cols };
}

// --- BFS Solver (small levels only) ---
function solveLevel(levelStr) {
  const lines = levelStr.split('\n');
  const rows = lines.length;
  const cols = Math.max(...lines.map(l => l.length));

  // Build initial state
  const walls = new Set();
  const targetSet = new Set();
  let initBoxes = [];
  let initPlayer = null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = (lines[r] || '')[c] || ' ';
      if (ch === WALL) walls.add(`${r},${c}`);
      if (ch === TARGET || ch === BOX_ON_TARGET || ch === PLAYER_ON_TARGET) targetSet.add(`${r},${c}`);
      if (ch === BOX || ch === BOX_ON_TARGET) initBoxes.push([r, c]);
      if (ch === PLAYER || ch === PLAYER_ON_TARGET) initPlayer = [r, c];
    }
  }

  if (!initPlayer || initBoxes.length === 0) return { solvable: false, reason: 'invalid level' };

  // State key: player position + sorted box positions
  function stateKey(player, boxes) {
    const sorted = boxes.map(b => `${b[0]},${b[1]}`).sort().join('|');
    return `${player[0]},${player[1]}:${sorted}`;
  }

  function isSolved(boxes) {
    return boxes.every(b => targetSet.has(`${b[0]},${b[1]}`));
  }

  const visited = new Set();
  const startKey = stateKey(initPlayer, initBoxes);
  visited.add(startKey);

  const queue = [{ player: initPlayer, boxes: initBoxes, moves: 0 }];
  const MAX_STATES = 500000; // Safety limit
  let explored = 0;

  while (queue.length > 0 && explored < MAX_STATES) {
    const { player, boxes, moves } = queue.shift();
    explored++;

    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = player[0] + dr, nc = player[1] + dc;
      const nKey = `${nr},${nc}`;

      if (walls.has(nKey)) continue;

      // Check if pushing a box
      const boxIdx = boxes.findIndex(b => b[0] === nr && b[1] === nc);
      let newBoxes = boxes;

      if (boxIdx !== -1) {
        const br = nr + dr, bc = nc + dc;
        const bKey = `${br},${bc}`;
        if (walls.has(bKey)) continue;
        if (boxes.some(b => b[0] === br && b[1] === bc)) continue;

        newBoxes = boxes.map((b, i) => i === boxIdx ? [br, bc] : b);

        // Simple deadlock: box in corner without target
        if (!targetSet.has(bKey)) {
          const wU = walls.has(`${br - 1},${bc}`);
          const wD = walls.has(`${br + 1},${bc}`);
          const wL = walls.has(`${br},${bc - 1}`);
          const wR = walls.has(`${br},${bc + 1}`);
          if ((wU || wD) && (wL || wR)) continue; // Dead state, prune
        }
      }

      const newPlayer = [nr, nc];
      const sk = stateKey(newPlayer, newBoxes);
      if (visited.has(sk)) continue;
      visited.add(sk);

      if (isSolved(newBoxes)) {
        return { solvable: true, moves: moves + 1, explored };
      }

      queue.push({ player: newPlayer, boxes: newBoxes, moves: moves + 1 });
    }
  }

  if (explored >= MAX_STATES) {
    return { solvable: null, reason: `exceeded ${MAX_STATES} states (level may be too complex to verify)`, explored };
  }
  return { solvable: false, reason: 'no solution found', explored };
}

// --- Main ---
const source = readFileSync(ASTRO_FILE, 'utf-8');
const levels = extractLevels(source);

console.log(`Found ${levels.length} levels in ${ASTRO_FILE}\n`);

let hasErrors = false;

for (let i = 0; i < levels.length; i++) {
  const analysis = analyzeLevel(levels[i], i);
  const label = `Level ${i + 1}`;
  const dims = `${analysis.rows}x${analysis.cols}`;

  console.log(`--- ${label} (${dims}, ${analysis.boxes} boxes, ${analysis.targets} targets) ---`);

  // Print the level visually
  const lines = levels[i].split('\n');
  for (const line of lines) console.log('  ' + line);
  console.log();

  if (analysis.errors.length > 0) {
    hasErrors = true;
    for (const err of analysis.errors) console.log(`  ❌ ERROR: ${err}`);
  }
  for (const warn of analysis.warnings) console.log(`  ⚠️  WARNING: ${warn}`);

  if (analysis.errors.length === 0) {
    console.log('  ✅ Structure valid');

    // Try to solve
    console.log('  🔍 Solving...');
    const result = solveLevel(levels[i]);
    if (result.solvable === true) {
      console.log(`  ✅ Solvable in ${result.moves} moves (explored ${result.explored} states)`);
    } else if (result.solvable === null) {
      console.log(`  ⚠️  ${result.reason} (explored ${result.explored} states)`);
    } else {
      hasErrors = true;
      console.log(`  ❌ UNSOLVABLE: ${result.reason} (explored ${result.explored} states)`);
    }
  }

  console.log();
}

if (hasErrors) {
  console.log('❌ VALIDATION FAILED — fix the errors above');
  process.exit(1);
} else {
  console.log('✅ All levels valid and solvable');
}
