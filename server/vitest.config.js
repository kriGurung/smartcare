import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/setup.js'],
    // Each test file runs in its own forked process with a fresh in-memory
    // SQLite database, so files never share state. Sequential is still
    // enforced for deterministic output and to keep MySQL-style expectations.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
