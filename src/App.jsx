import React, { useState } from 'react'
import FreePlay from './modes/FreePlay'
import './App.css'

function App() {
  const [mode, setMode] = useState('freeplay')

  return (
    <div className="app">
      <nav className="app__nav">
        <button
          className={`app__nav-btn${mode === 'freeplay' ? ' app__nav-btn--active' : ''}`}
          onClick={() => setMode('freeplay')}
        >Free Play</button>
        <button
          className={`app__nav-btn${mode === 'learn' ? ' app__nav-btn--active' : ''}`}
          onClick={() => setMode('learn')}
        >Learn</button>
        <button
          className={`app__nav-btn${mode === 'explore' ? ' app__nav-btn--active' : ''}`}
          onClick={() => setMode('explore')}
        >Explore</button>
      </nav>
      <main className="app__main">
        {mode === 'freeplay' && <FreePlay />}
        {mode === 'learn' && <div className="app__placeholder">Learn mode — coming soon</div>}
        {mode === 'explore' && <div className="app__placeholder">Explore mode — coming soon</div>}
      </main>
    </div>
  )
}

export default App
