// The plugin from the parent folder, built into ../dist.
// A real project writes: import twd from 'twd-lint'
import twd from '../dist/index.js'

export default [
  { ignores: ['dist'] },
  twd.configs.recommended,
]
