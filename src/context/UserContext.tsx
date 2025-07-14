'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User } from '@/lib/definitions';

// Create a context with a default value of null.
const UserContext = createContext<User | null>(null);

/**
 * Provides the authenticated user object to its children components.
 */
export function UserProvider({ children, user }: { children: ReactNode; user: User }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/**
 * Custom hook to access the user object from the context.
 * Throws an error if used outside of a UserProvider.
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
