#!/usr/bin/env node
/**
 * Orchestrator for all content validators.
 * Run: node site/scripts/validate-all.js
 *
 * Runs each validator and reports combined results.
 * Exits with code 1 if any validator fails.
 */

import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const validators = [
  {
    name: 'Sokoban Level Validator',
    script: resolve(__dirname, 'validate-sokoban.js'),
  },
  // Add more validators here as they are created, e.g.:
  // { name: 'Tetris Piece Validator', script: resolve(__dirname, 'validate-tetris.js') },
];

let allPassed = true;

for (const v of validators) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${v.name}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execFileSync('node', [v.script], { stdio: 'inherit' });
    console.log(`\n${v.name}: PASSED`);
  } catch {
    console.error(`\n${v.name}: FAILED`);
    allPassed = false;
  }
}

console.log(`\n${'='.repeat(60)}`);
if (allPassed) {
  console.log('All content validators passed.');
} else {
  console.error('Some validators failed. See output above.');
  process.exit(1);
}
