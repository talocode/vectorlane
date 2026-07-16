#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const cli = join(root, 'dist', 'cli.js');

const tests = [
  { name: '--help', cmd: `node ${cli} --help` },
  { name: '--version', cmd: `node ${cli} --version` },
  { name: 'doctor', cmd: `node ${cli} doctor` },
  { name: 'demo', cmd: `node ${cli} demo` },
];

let passed = 0;
let failed = 0;

console.log('Running smoke tests...\n');

for (const test of tests) {
  try {
    execSync(test.cmd, { cwd: root, stdio: 'pipe', timeout: 30000 });
    console.log(`\x1b[32m✓\x1b[0m ${test.name}`);
    passed++;
  } catch (e) {
    console.log(`\x1b[31m✗\x1b[0m ${test.name}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
