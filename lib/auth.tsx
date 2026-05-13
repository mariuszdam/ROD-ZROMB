'use client'

import { createContext, useContext } from 'react'

export const AuthContext = createContext(false)

export function useIsAdmin() {
  return useContext(AuthContext)
}
