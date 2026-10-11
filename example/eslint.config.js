import tsParser from '@typescript-eslint/parser'
// The plugin from the parent folder, built into ../dist.
// A real project writes: import twd from 'eslint-plugin-twd'
import twd from '../dist/index.js'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.twd.test.{ts,tsx,js,jsx}'],
    languageOptions: { parser: tsParser },
    plugins: { twd },
    // Becomes `twd.configs.recommended` once it exists (learning path step 10)
    rules: {
      'twd/no-focused-tests': 'error',
      'twd/single-top-level-describe': 'error',
      'twd/runner-imports': 'error',
      'twd/no-missing-await': 'error',
      'twd/no-request-body': 'error',
    },
  },
]
