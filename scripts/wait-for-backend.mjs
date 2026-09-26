/**
 * Cross-platform helper script to verify FastAPI backend availability
 * before Vite dev server starts, preventing ECONNREFUSED proxy errors.
 */

import http from 'node:http';

const HEALTH_URL = 'http://127.0.0.1:8000/api/health';
const MAX_WAIT_MS = 45000;
const RETRY_INTERVAL_MS = 300;

const startTime = Date.now();

console.log('⏳ Waiting for FastAPI backend (http://127.0.0.1:8000/api/health) to be ready...');

function pingBackend() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      // Any response code between 200 and 399 confirms server is answering HTTP requests
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
        resolve(true);
      } else {
        resolve(false);
      }
      res.resume(); // Consume stream to free memory
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend() {
  while (Date.now() - startTime < MAX_WAIT_MS) {
    const isReady = await pingBackend();
    if (isReady) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ FastAPI backend is healthy (${elapsed}s). Starting Vite frontend...\n`);
      process.exit(0);
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
  }

  console.error('\n❌ Timed out waiting for FastAPI backend to respond on http://127.0.0.1:8000/api/health.');
  console.error('Please verify Python environment and that uvicorn started without errors above.\n');
  process.exit(1);
}

waitForBackend();
