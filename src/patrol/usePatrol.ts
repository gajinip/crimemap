import { useContext } from 'react'
import { PatrolContext } from './patrolStore'
import type { PatrolContextValue } from './patrolStore'

/** Read access to the running patrol simulation. */
export function usePatrol(): PatrolContextValue {
  const context = useContext(PatrolContext)
  if (!context) throw new Error('usePatrol must be used inside <PatrolProvider>')
  return context
}
