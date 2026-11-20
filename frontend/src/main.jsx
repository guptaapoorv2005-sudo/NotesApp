import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

async function request(path, options = {}, retry = true) {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (response.status === 401 && retry && !path.startsWith('/users/login') && !path.startsWith('/users/register')) {
    const refresh = await fetch('/api/v1/users/refresh-token', { method: 'POST', credentials: 'include' })
    if (refresh.ok) return request(path, options, false)
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return data.data
}

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    request('/users/current-user').then(setUser).catch(err => {
      if (err.status !== 401) setError('Could not connect to the server. Check that the backend is running.')
    }).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!user) return
    request('/notes').then(setNotes).catch(err => setError(err.message))
  }, [user])

  function selectNote(note) {
    setSelected(note?._id || null)
    setTitle(note?.title || '')
    setContent(note?.content || '')
    setEditing(Boolean(note))
    setError('')
  }

  async function authenticate(event) {
    event.preventDefault()
    setError(''); setBusy(true)
    try {
      const body = JSON.stringify({ email, password })
      if (mode === 'register') await request('/users/register', { method: 'POST', body }, false)
      const data = await request('/users/login', { method: 'POST', body }, false)
      setUser(data.user); setPassword('')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault()
    setError(''); setBusy(true)
    try {
      const note = await request(selected ? `/notes/${selected}` : '/notes', {
        method: selected ? 'PATCH' : 'POST', body: JSON.stringify({ title, content })
      })
      setNotes(current => [note, ...current.filter(item => item._id !== note._id)])
      selectNote(note)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function remove() {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    setBusy(true); setError('')
    try {
      await request(`/notes/${selected}`, { method: 'DELETE' })
      setNotes(current => current.filter(note => note._id !== selected))
      selectNote(null)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function logout() {
    setBusy(true); setError('')
    try {
      await request('/users/logout', { method: 'POST' })
      setUser(null); setNotes([]); selectNote(null); setSearch('')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const filtered = notes.filter(note => `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase()))
  const active = notes.find(note => note._id === selected)

  if (checking) return <div className="loading">Opening your workspace…</div>
  if (!user) return <main className="auth-page">
    <div className="auth-brand"><Brand /><span>A LITTLE SPACE FOR BIG IDEAS</span></div>
    <section className="auth-card">
      <div className="eyebrow"><span className="spark">✳</span> YOUR PERSONAL NOTEBOOK</div>
      <h1>{mode === 'login' ? 'Welcome back.' : 'Make space to think.'}</h1>
      <p className="intro">{mode === 'login' ? 'A little clarity starts here. Sign in to pick up where you left off.' : 'Create an account and give your thoughts a place to land.'}</p>
      <form onSubmit={authenticate} className="auth-form">
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="switch">{mode === 'login' ? 'New around here?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
    </section>
    <div className="auth-footer">A quieter place for your thoughts. <span>✳</span></div>
  </main>

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <div className="side-label">YOUR WORKSPACE</div>
      <div className="side-active"><span>▤</span> All notes <span className="count">{notes.length}</span></div>
      <div className="side-bottom"><div className="avatar">{user.email?.[0]?.toUpperCase()}</div><div className="account"><strong>Your account</strong><span title={user.email}>{user.email}</span></div><button className="logout" onClick={logout} disabled={busy}>Sign out</button></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><span>YOUR WORKSPACE <span className="slash">/</span> <b>All notes</b></span><button className="new-button" onClick={() => { selectNote(null); setEditing(true) }}>＋ <span>New note</span></button></header>
      <div className="workspace-content">
        <div className="page-heading"><div><div className="eyebrow">YOUR IDEAS, ALL IN ONE PLACE</div><h1>All notes<span className="heading-dot">.</span></h1><p>A little space for everything on your mind.</p></div><span className="note-total">{notes.length} {notes.length === 1 ? 'NOTE' : 'NOTES'}</span></div>
        {error && <p className="error workspace-error" role="alert">{error}</p>}
        <div className="notes-layout">
          <section className="notes-list" aria-label="Your notes"><div className="list-head"><strong>Notes</strong><span>{filtered.length}</span></div><label className="search"><span>⌕</span><input aria-label="Search notes" placeholder="Search your notes" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="list-scroll">{filtered.map(note => <button key={note._id} className={`note-item ${selected === note._id ? 'selected' : ''}`} onClick={() => selectNote(note)}><span className="note-title">{note.title}</span><span className="note-preview">{note.content}</span><span className="note-date">{formatDate(note.updatedAt)}</span></button>)}{!filtered.length && <p className="list-empty">{search ? 'No notes match your search.' : 'Your notes will appear here.'}</p>}</div></section>
          <section className="editor" aria-label="Note editor">{editing ? <form onSubmit={save} className="editor-form"><div className="editor-top"><span>{active ? `LAST EDITED ${formatDate(active.updatedAt).toUpperCase()}` : 'A FRESH PAGE'}</span><div className="editor-actions">{selected && <button type="button" className="delete" onClick={remove} disabled={busy}>Delete</button>}<button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save note'}</button></div></div><input className="title-input" aria-label="Note title" placeholder="Give your note a title" value={title} onChange={e => setTitle(e.target.value)} required /><textarea aria-label="Note content" placeholder="Start writing here…" value={content} onChange={e => setContent(e.target.value)} required /></form> : <div className="empty-editor"><div className="empty-icon">✳</div><h2>A little room to think.</h2><p>Select a note to revisit your thoughts, or start with a fresh page.</p><button className="primary" onClick={() => setEditing(true)}>＋ &nbsp;Create a note</button></div>}</section>
        </div>
        <div className="workspace-footer"><span>MADE FOR YOUR EVERYDAY THOUGHTS</span><span>TAKE YOUR TIME <span className="spark">✳</span></span></div>
      </div>
    </main>
  </div>
}

function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '' }
function Brand() { return <div className="brand"><span className="brand-mark">✳</span><span>stillnote<span className="brand-dot">.</span></span></div> }

createRoot(document.getElementById('root')).render(<App />)
