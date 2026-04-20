import React, { useState } from 'react'
import FreePlay from './modes/FreePlay'
import Learn from './modes/Learn'
import { useSampler } from './hooks/useSampler'
import './App.css'

function App() {
  const [mode, setMode] = useState('freeplay')
  const sampler = useSampler()

  return (
    <div className="app">
      <nav className="app__nav">
        <span className="app__title">super sound samplr by zoe</span>
        <div className="app__nav-btns">
          <button
            className={`app__nav-btn${mode === 'freeplay' ? ' app__nav-btn--active' : ''}`}
            onClick={() => setMode('freeplay')}
          >Free Play</button>
          <button
            className={`app__nav-btn${mode === 'learn' ? ' app__nav-btn--active' : ''}`}
            onClick={() => setMode('learn')}
          >Learn</button>
        </div>
      </nav>
      <main className="app__main">
        {mode === 'freeplay' && <FreePlay sampler={sampler} />}
        {mode === 'learn' && <Learn sampler={sampler} />}
      </main>
    </div>
  )
}

export default App
