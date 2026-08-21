import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const git = (format) => {
  try { return execSync(`git -c safe.directory=/app show -s --format=${format} HEAD`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return 'unknown'; }
};
const commit = process.env.VITE_COMMIT_SHA || git('%h');
const commitDate = process.env.VITE_COMMIT_DATE || git('%cI');
const commitTitle = process.env.VITE_COMMIT_TITLE || git('%s');

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(commit),
    'import.meta.env.VITE_COMMIT_DATE': JSON.stringify(commitDate),
    'import.meta.env.VITE_COMMIT_TITLE': JSON.stringify(commitTitle),
  },
  server: { port: Number(process.env.FRONTEND_PORT || 4173), proxy: { '/api': process.env.BACKEND_URL || 'http://127.0.0.1:' + (process.env.BACKEND_PORT || 8787) } },
  preview: { port: Number(process.env.FRONTEND_PORT || 4173) },
});
