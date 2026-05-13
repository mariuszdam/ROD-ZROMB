'use client'

import { useState } from 'react'
import { AuthContext } from '@/lib/auth'
import styles from './AccessGate.module.css'

const USER_MAP: Record<string, string> = Object.fromEntries(
  (process.env.NEXT_PUBLIC_USER_CODES ?? '').split(',')
    .map(s => s.trim()).filter(Boolean)
    .map(entry => {
      const [code, ...rest] = entry.split(':')
      return [code.toLowerCase(), rest.join(':')]
    })
)

const ADMIN_CODES = (process.env.NEXT_PUBLIC_ADMIN_CODES ?? '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [isAdmin,  setIsAdmin]  = useState(false)
  const [userName, setUserName] = useState('')
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState(false)

  function tryUnlock() {
    const val = input.trim().toLowerCase()
    if (!val) { setError(true); return }
    const name = USER_MAP[val]
    const admin = ADMIN_CODES.includes(val)
    if (name) {
      setIsAdmin(admin)
      setUserName(name)
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  if (unlocked) {
    return (
      <AuthContext.Provider value={{ isAdmin, userName }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <div className={styles.gate}>
      <div className={styles.card}>
        <div className={styles.icon}>🌿</div>
        <div className={styles.title}>ROD ZREMB</div>
        <div className={styles.address}>ul. Potulicka 3 · 03-686 Warszawa</div>
        <div className={styles.sub}>Wprowadź swój kod dostępu</div>
        <input
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          onKeyDown={e => { if (e.key === 'Enter') tryUnlock() }}
          placeholder="••••••••"
          autoFocus
        />
        {error && <div className={styles.errorMsg}>Nieprawidłowy kod</div>}
        <button className={styles.btn} onClick={tryUnlock}>Wejdź</button>
      </div>
    </div>
  )
}
