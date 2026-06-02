import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createPlaywrightRunnerApi } from './config/dashboard/playwrightRunnerApi.js';

export default defineConfig({
  plugins: [react(), createPlaywrightRunnerApi()]
});

