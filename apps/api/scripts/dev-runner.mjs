#!/usr/bin/env node

import { spawn } from 'child_process';
import { watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const srcDir = join(projectRoot, 'src');
const entryPoint = join(srcDir, 'index.ts');

let serverProcess = null;

function startServer() {
  if (serverProcess) {
    console.log('🔄 Restarting server...');
    serverProcess.kill();
  } else {
    console.log('🚀 Starting server...');
  }

  serverProcess = spawn('npx', ['tsx', entryPoint], {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  serverProcess.on('exit', (code, signal) => {
    if (signal !== 'SIGTERM' && signal !== 'SIGKILL') {
      console.log(`Server exited with code ${code}`);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function setupWatcher() {
  console.log(`👀 Watching for changes in ${srcDir}`);
  
  const watcher = watch(srcDir, { recursive: true }, (_, filename) => {
    if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
      console.log(`📝 File changed: ${filename}`);
      startServer();
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    watcher.close();
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.close();
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(0);
  });
}

// Start initial server
startServer();

// Setup file watcher
setupWatcher();

console.log('✅ Development server is running. Press Ctrl+C to stop.');