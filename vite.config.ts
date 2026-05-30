import { defineConfig } from 'vite';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  root: '.',
  base: isGitHubPages ? '/plane-shooter-game/' : '/',
});
