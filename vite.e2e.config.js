import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const esptoolMock = path.resolve(rootDir, 'src/services/esptoolClient.mock.ts');

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  resolve: {
    alias: [
      { find: './services/esptoolClient', replacement: esptoolMock },
    ],
  },
});
