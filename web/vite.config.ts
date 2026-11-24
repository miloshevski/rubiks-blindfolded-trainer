import { localPwa } from './pwa.ts';
import { spawn } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development the Python server (python3 -m bld.server, port 8000) answers /api;
// in production it also serves the built files from web/dist.

/** `npm run dev` also starts the Python API server, and stops it with Vite. */
function apiServer(): Plugin {
  return {
    name: 'bld-api-server',
    apply: 'serve',
    configureServer(server) {
      const child = spawn('python3', ['-m', 'bld.server'], { cwd: '..', stdio: 'inherit' });
      child.on('error', err => server.config.logger.error(`could not start the API server: ${err.message}`));
      const stop = () => { child.kill(); };
      server.httpServer?.on('close', stop);
      process.on('exit', stop);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiServer(), localPwa()],
  worker: { format: 'es' },
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
});
