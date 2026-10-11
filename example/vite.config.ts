import react from '@vitejs/plugin-react'
import { twd } from 'twd-js/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    // Only src/twd-tests runs in the sidebar. lint-playground/ holds
    // deliberately broken tests that are there to be linted, not run.
    twd({ testFilePattern: '/src/twd-tests/**/*.twd.test.ts' }),
  ],
})
