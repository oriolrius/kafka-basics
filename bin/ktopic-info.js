#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scriptPath = join(__dirname, '..', 'src', 'admin', 'topic-info.js');
const child = spawn('node', [scriptPath, ...process.argv.slice(2)], { 
  stdio: 'inherit',
  cwd: join(__dirname, '..')
});

child.on('error', (err) => {
  console.error('Failed to start ktopic-info:', err);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code);
});