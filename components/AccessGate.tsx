'use client'

import { useEffect, useState } from 'react'
import { AuthContext } from '@/lib/auth'
import styles from './AccessGate.module.css'

const STORAGE_KEY = 'dzialka_access_code'

const USER_MAP: Record<string, string> = {
  pawelczescik:     'Pawel Czescik',
  kasiakoszacka:    'Kasia Koszacka',
  arekkoszacki:     'Arek Koszacki',
  danieldam:        'Daniel Dam',
  juliadam:         'Julia Dam',
  jakubczescik:     'Jakub Czescik',
  kacperczescik:    'Kacper Czescik',
  teresaczescik:    'Teresa Czescik',
  anetaczescik:     'Aneta Czescik',
  magdaczescik:     'Magda Czescik',
  tomaszczescik:    'Tomasz Czescik',
  anetanasiadka:    'Aneta Nasiadka',
  wojciechczescik:  'Wojciech Czescik',
  adamczescik:      'Adam Czescik',
  agnieszkaczescik: 'Agnieszka Czescik',
  paulinapietrzak:  'Paulina Pietrzak',
  aniagasparska:    'Ania Gasparska',
  mariuszdam:       'Mariusz Dam',
}

const ADMIN_CODES = ['mariuszdam', 'tomaszczescik']

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [isAdmin,  setIsAdmin]  = useState(false)
  const [userName, setUserName] = useState('')
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored && USER_MAP[stored]) {
      setIsAdmin(ADMIN_CODES.includes(stored))
      setUserName(USER_MAP[stored])
      setUnlocked(true)
    }
  }, [])

  function tryUnlock() {
    const val = input.trim().toLowerCase()
    if (!val) { setError(true); return }
    const name = USER_MAP[val]
    const admin = ADMIN_CODES.includes(val)
    if (name) {
      sessionStorage.setItem(STORAGE_KEY, val)
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
