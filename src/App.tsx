import { useEffect, useState } from 'react'
import './App.css'

type Category = 'work' | 'private' | 'shopping' | 'other'
type Priority = 'low' | 'medium' | 'high'

type Classification = {
  category: Category
  priority: Priority
  urgent: boolean
}

type Todo = {
  id: number
  text: string
  done: boolean
  category?: Category
  priority?: Priority
  urgent?: boolean
  jevStatus?: 'loading' | 'error'
}

type Filter = 'all' | 'active' | 'done'

const CATEGORY_LABELS: Record<Category, string> = {
  work: '仕事',
  private: 'プライベート',
  shopping: '買い物',
  other: 'その他',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

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
  const [jevEnabled, setJevEnabled] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : { jevEnabled: false }))
      .then((config: { jevEnabled: boolean }) => setJevEnabled(config.jevEnabled))
      .catch(() => setJevEnabled(false))
  }, [])

  const updateTodo = (id: number, changes: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)))
  }

  const classify = async (id: number, todoText: string) => {
    updateTodo(id, { jevStatus: 'loading' })
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: todoText }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = (await res.json()) as Classification
      updateTodo(id, { ...result, jevStatus: undefined })
    } catch {
      updateTodo(id, { jevStatus: 'error' })
    }
  }

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    const id = Date.now()
    setTodos([...todos, { id, text: trimmed, done: false }])
    setText('')
    if (jevEnabled) classify(id, trimmed)
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
      <p className="jev-status">Jev による自動判定: {jevEnabled ? 'ON' : 'OFF'}</p>

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
                <span className="todo-text">{todo.text}</span>
              </label>
              <div className="badges">
                {todo.jevStatus === 'loading' && <span className="badge">判定中…</span>}
                {todo.jevStatus === 'error' && (
                  <button className="badge retry" onClick={() => classify(todo.id, todo.text)}>
                    判定失敗（再試行）
                  </button>
                )}
                {todo.category && <span className="badge category">{CATEGORY_LABELS[todo.category]}</span>}
                {todo.priority && (
                  <span className={`badge priority-${todo.priority}`}>優先度: {PRIORITY_LABELS[todo.priority]}</span>
                )}
                {todo.urgent && <span className="badge urgent">急ぎ</span>}
              </div>
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
