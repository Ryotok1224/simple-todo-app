import { useEffect, useState } from 'react'
import './App.css'

type Todo = {
  id: number
  text: string
  done: boolean
}

type Filter = 'all' | 'active' | 'done'

const STORAGE_KEY = 'simple-todo-app.todos'

function loadTodos(): Todo[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as Todo[]) : []
  } catch {
    return []
  }
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setTodos([...todos, { id: Date.now(), text: trimmed, done: false }])
    setText('')
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((t) => t.id !== id))
  }

  const clearDone = () => {
    setTodos(todos.filter((t) => !t.done))
  }

  const visibleTodos = todos.filter((t) => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const remaining = todos.filter((t) => !t.done).length

  return (
    <main className="app">
      <h1>TODOリスト</h1>

      <form className="add-form" onSubmit={addTodo}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="やることを入力..."
          aria-label="新しいTODO"
        />
        <button type="submit">追加</button>
      </form>

      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          すべて
        </button>
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
          未完了
        </button>
        <button className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')}>
          完了
        </button>
      </div>

      {visibleTodos.length === 0 ? (
        <p className="empty">TODOはありません</p>
      ) : (
        <ul className="todo-list">
          {visibleTodos.map((todo) => (
            <li key={todo.id} className={todo.done ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                <span>{todo.text}</span>
              </label>
              <button className="delete" onClick={() => deleteTodo(todo.id)} aria-label="削除">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="summary">
        <span>残り {remaining} 件</span>
        <button onClick={clearDone} disabled={todos.length === remaining}>
          完了済みを削除
        </button>
      </footer>
    </main>
  )
}

export default App
