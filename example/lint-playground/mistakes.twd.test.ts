// Deliberately broken: one mistake per rule, so you can see each one
// underlined in the editor. Not run by TWD (see vite.config.ts).
// `npm run lint` lists them; `npx eslint lint-playground --fix` shows the autofixes.
import { twd, screenDom, describe } from 'twd-js' // twd/runner-imports: describe is not in twd-js
import { it, expect } from 'vitest' // twd/runner-imports: wrong framework

describe('Mistakes', () => {
  it.only('forgets awaits', async () => { // twd/no-focused-tests
    twd.visit('/') // twd/no-missing-await (autofix)
    screenDom.findByText('Learn TWD') // twd/no-missing-await (autofix)
  })

  it('reads .body', async () => {
    const rule = await twd.waitForRequest('createTodo')
    expect(rule.request.body.title).to.equal('A') // twd/no-request-body
  })
})

