'use client'

import { createContext, useContext } from 'react'

interface AuthState {
  isAdmin: boolean
  userName: string
}

export const AuthContext = createContext<AuthState>({ isAdmin: false, userName: '' })

export function useIsAdmin() {
  return useContext(AuthContext).isAdmin
}

export function useUserName() {
  return useContext(AuthContext).userName
}
