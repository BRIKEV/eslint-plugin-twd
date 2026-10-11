import { twd, expect, userEvent, screenDom } from 'twd-js'
import { describe, it, beforeEach } from 'twd-js/runner'

// A correct TWD test: the linter reports nothing here.
describe('Todos', () => {
  beforeEach(() => {
    twd.clearRequestMockRules()
  })

  it('shows the todos from the API', async () => {
    await twd.mockRequest('getTodos', {
      method: 'GET',
      url: '/api/todos',
      response: [{ id: 1, title: 'Learn TWD' }],
    })
    await twd.visit('/')
    await twd.waitForRequest('getTodos')

    const todo = await screenDom.findByText('Learn TWD')
    twd.should(todo, 'be.visible')
  })

  it('adds a todo', async () => {
    await twd.mockRequest('getTodos', { method: 'GET', url: '/api/todos', response: [] })
    await twd.mockRequest('createTodo', {
      method: 'POST',
      url: '/api/todos',
      response: { id: 2, title: 'Write a lint rule' },
    })
    await twd.visit('/')

    const user = userEvent.setup()
    await user.type(screenDom.getByLabelText('New todo'), 'Write a lint rule')
    await user.click(screenDom.getByRole('button', { name: 'Add' }))

    const rule = await twd.waitForRequest('createTodo')
    expect(rule.request.title).to.equal('Write a lint rule')
    twd.should(await screenDom.findByText('Write a lint rule'), 'be.visible')
  })
})
