import { createContext } from 'react'
import type { PatrolUnit } from '../types'

/** Projected unit state rendered by the UI at the current simulation tick. */
export interface DisplayPatrolUnit extends PatrolUnit {
  displayLat: number
  displayLng: number
  displayStatus: PatrolUnit['status']
  etaMinutes: number
}

export interface PatrolContextValue {
  units: DisplayPatrolUnit[]
  coveredZones: number
  running: boolean
  speed: number
  elapsedSeconds: number
  toggleRunning: () => void
  changeSpeed: (speed: number) => void
  reset: () => void
}

/**
 * Shared patrol simulation state. Kept in a components-free module so both the
 * provider file and the `usePatrol` hook file stay Fast Refresh friendly.
 */
export const PatrolContext = createContext<PatrolContextValue | null>(null)
