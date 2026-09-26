/**
 * Cross-platform utility to free ports 8000 and 5173 before startup,
 * preventing 'address already in use' errors from orphaned processes.
 */

import { execSync } from 'node:child_process';

const PORTS = [8000, 5173];

for (const port of PORTS) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr /R /C:":${port} .*LISTENING"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          console.log(`🧹 Freeing occupied port ${port} (PID ${pid})...`);
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch {
            // Process may have already terminated
          }
        }
      }
    } else {
      // Unix / macOS
      try {
        const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
        if (pids) {
          console.log(`🧹 Freeing occupied port ${port} (PID ${pids.replace(/\n/g, ', ')})...`);
          for (const pid of pids.split('\n')) {
            if (pid.trim()) {
              execSync(`kill -9 ${pid.trim()}`, { stdio: 'ignore' });
            }
          }
        }
      } catch {
        // Port free
      }
    }
  } catch {
    // Port not in use
  }
}
