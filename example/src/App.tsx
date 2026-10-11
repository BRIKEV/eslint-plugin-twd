import { useEffect, useState, type FormEvent } from 'react'

interface Todo {
  id: number
  title: string
}

// A tiny todo list: GET /api/todos on load, POST /api/todos to add one.
// There is no backend; the TWD tests mock both requests.
export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [error, setError] = useState(false)
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetch('/api/todos')
      .then((res) => res.json())
      .then(setTodos)
      .catch(() => setError(true))
  }, [])

  const addTodo = async (event: FormEvent) => {
    event.preventDefault()
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const todo: Todo = await res.json()
    setTodos((current) => [...current, todo])
    setTitle('')
  }

  return (
    <main>
      <h1>Todos</h1>
      {error && <p role="alert">Could not load todos</p>}
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <form onSubmit={addTodo}>
        <label>
          New todo
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <button type="submit">Add</button>
      </form>
    </main>
  )
}
