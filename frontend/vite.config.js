import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { wakatimeDevPlugin } from './dev/wakatime-plugin.js';

const git = (format) => {
  try {
    return execSync(`git -c safe.directory=/app show -s --format=${format} HEAD`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
};
const commit = process.env.VITE_COMMIT_SHA || git('%h');
const localCommitDate = git('%cI');
const localCommitTitle = git('%s');

let githubCommit = null;

if (
  /^[0-9a-f]{7,40}$/i.test(commit) &&
  (localCommitDate === 'unknown' || localCommitTitle === 'unknown')
) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/mateusb12/rkm-service-manager/commits/${commit}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'rkm-service-manager-build',
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API HTTP ${response.status}`);
    }

    const payload = await response.json();
    const date = payload.commit?.committer?.date;
    const title = payload.commit?.message?.split('\n')[0];

    if (!date || !title) {
      throw new Error('Metadados incompletos.');
    }

    githubCommit = { date, title };
    console.info(`[RKM build] Metadados carregados: ${commit.slice(0, 7)}`);
  } catch (error) {
    console.warn('[RKM build] Falha ao consultar metadados:', error);
  }
}

const commitDate =
  process.env.VITE_COMMIT_DATE ||
  (localCommitDate !== 'unknown' ? localCommitDate : githubCommit?.date || 'unknown');

const commitTitle =
  process.env.VITE_COMMIT_TITLE ||
  (localCommitTitle !== 'unknown' ? localCommitTitle : githubCommit?.title || 'unknown');

export default defineConfig({
  plugins: [react(), wakatimeDevPlugin()],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(commit),
    'import.meta.env.VITE_COMMIT_DATE': JSON.stringify(commitDate),
    'import.meta.env.VITE_COMMIT_TITLE': JSON.stringify(commitTitle),
  },
  server: {
    port: Number(process.env.FRONTEND_PORT || 4173),
    // O frontend roda em Docker com o código montado via volume.
    // Polling garante que alterações feitas no host acionem o HMR.
    watch: { usePolling: true, interval: 120 },
    proxy: {
      '/api': process.env.BACKEND_URL || 'http://127.0.0.1:' + (process.env.BACKEND_PORT || 8787),
    },
  },
  preview: { port: Number(process.env.FRONTEND_PORT || 4173) },
});
