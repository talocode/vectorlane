#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');

console.log('Building VectorLane...');

try {
  console.log('  Compiling TypeScript...');
  execSync('npx tsc', { cwd: root, stdio: 'inherit' });
  
  console.log('  Copying demo docs...');
  mkdirSync(join(dist, 'demo'), { recursive: true });
  try {
    cpSync(join(root, 'demo'), join(dist, 'demo'), { recursive: true });
  } catch {}
  
  console.log('Build complete!');
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
