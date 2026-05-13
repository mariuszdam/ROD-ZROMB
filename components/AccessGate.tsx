'use client'

import { useEffect, useState } from 'react'
import { AuthContext } from '@/lib/auth'
import styles from './AccessGate.module.css'

const STORAGE_KEY = 'rod_zremb_access'
const ROLE_KEY    = 'rod_zremb_role'
const CODE        = process.env.NEXT_PUBLIC_ACCESS_CODE ?? ''
const ADMIN_CODES = (process.env.NEXT_PUBLIC_ADMIN_CODES ?? '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [isAdmin,  setIsAdmin]  = useState(false)
  const [checked,  setChecked]  = useState(false)
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      setUnlocked(true)
      setIsAdmin(localStorage.getItem(ROLE_KEY) === 'admin')
    }
    setChecked(true)
  }, [])

  function tryUnlock() {
    const val = input.trim().toLowerCase()
    if (!val || !CODE) { setError(true); return }
    const admin = ADMIN_CODES.includes(val)
    const user  = val === CODE.toLowerCase()

    if (admin || user) {
      localStorage.setItem(STORAGE_KEY, '1')
      localStorage.setItem(ROLE_KEY, admin ? 'admin' : 'user')
      setIsAdmin(admin)
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  if (!checked) return null

  if (unlocked) {
    return (
      <AuthContext.Provider value={isAdmin}>
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
        <div className={styles.sub}>Wprowadź kod dostępu</div>
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
