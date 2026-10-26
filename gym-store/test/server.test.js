const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = __dirname.replace(/\/test$/, '');

function waitForServer(port) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const interval = setInterval(() => {
      fetch(`http://127.0.0.1:${port}/api/products`)
        .then((res) => res.ok ? resolve() : null)
        .catch(() => {
          if (Date.now() - started > 8000) {
            clearInterval(interval);
            reject(new Error('timed out waiting for server'));
          }
        });
    }, 150);
  });
}

test('GET /api/products returns data and supports search filtering', async () => {
  const port = 3456;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await waitForServer(port);

  const res = await fetch(`http://127.0.0.1:${port}/api/products?search=bench&category=equipment`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data));
  assert.ok(data.some((item) => item.name.toLowerCase().includes('bench')));
  assert.ok(data.every((item) => item.category === 'equipment'));

  child.kill('SIGTERM');
});
