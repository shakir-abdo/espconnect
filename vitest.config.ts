import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
    ],
    server: {
      deps: {
        inline: [/tasmota-webserial-esptool/],
      },
    },
  },
});
