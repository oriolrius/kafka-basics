#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcDir = join(__dirname, '..', 'src');

const commands = {
  'web': ['concurrently', '"node src/api/server.js"', '"vite --host"'],
  'kstart': ['node', join(srcDir, 'utils', 'show-structure.js')],
  'kpub': ['node', join(srcDir, 'producers', 'producer.js')],
  'ksub': ['node', join(srcDir, 'consumers', 'consumer.js')],
  'ktopic-info': ['node', join(srcDir, 'admin', 'topic-info.js')],
  'help': null
};

const command = process.argv[2] || 'help';

if (command === 'help' || !commands[command]) {
  console.log(`
🎯 Kafka Basics CLI

Usage: npx @oriolrius/kafka-basics <command>

Commands:
  web         Start web UI (API + frontend)
  kstart      Show project structure and help
  kpub        Send messages to Kafka
  ksub        Consume messages from Kafka
  ktopic-info Get topic information
  help        Show this help

Examples:
  npx @oriolrius/kafka-basics web
  npx @oriolrius/kafka-basics kstart
  npx @oriolrius/kafka-basics kpub --topic my-topic --message "Hello"

For more options, run each command with --help
`);
  process.exit(0);
}

const [cmd, ...args] = commands[command];
const child = spawn(cmd, args, { 
  stdio: 'inherit',
  shell: true,
  cwd: join(__dirname, '..')
});

child.on('error', (err) => {
  console.error('Failed to start command:', err);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code);
});