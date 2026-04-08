import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { mkdirSync, copyFileSync, readdirSync, rmSync } from 'fs'

function deployToRoot() {
  return {
    name: 'deploy-to-root',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const rootDir = resolve(__dirname)
      const distAssets = resolve(distDir, 'assets')
      const rootAssets = resolve(rootDir, 'assets')

      // Copy built index.html to root (for GitHub Pages) and as 404.html (SPA fallback)
      copyFileSync(resolve(distDir, 'index.html'), resolve(rootDir, '404.html'))

      // NOTE: We don't overwrite root index.html here because Vite reads it as source.
      // The GitHub Actions workflow handles copying it for deployment.

      // Clear and copy built assets
      try {
        for (const f of readdirSync(rootAssets)) {
          if (f.endsWith('.js') || f.endsWith('.css')) {
            rmSync(resolve(rootAssets, f))
          }
        }
      } catch {}
      mkdirSync(rootAssets, { recursive: true })
      for (const f of readdirSync(distAssets)) {
        copyFileSync(resolve(distAssets, f), resolve(rootAssets, f))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), deployToRoot()],
  base: '/Intern-Dashboard/',
})
