import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { projectUnit, routeDurationSeconds } from '../analytics/patrol'
import type { PatrolPlan } from '../types'
import { PatrolContext } from './patrolStore'
import type { DisplayPatrolUnit } from './patrolStore'

const TICK_MS = 250

interface PatrolProviderProps {
  plan: PatrolPlan
  children: ReactNode
}

/**
 * Runs the patrol simulation. Progress advances on a fixed tick outside the
 * render cycle, so map markers animate while the rest of the app stays quiet.
 */
export function PatrolProvider({ plan, children }: PatrolProviderProps) {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const planKey = plan.units.map((unit) => `${unit.id}:${unit.zoneId}`).join('|')

  const [lastPlanKey, setLastPlanKey] = useState(planKey)
  if (lastPlanKey !== planKey) {
    setLastPlanKey(planKey)
    setProgress({})
    setElapsedSeconds(0)
    setRunning(false)
  }

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + TICK_MS / 1000)
      setProgress((current) => {
        const next: Record<string, number> = {}
        for (const unit of plan.units) {
          const duration = routeDurationSeconds(unit.route)
          const base = current[unit.id] ?? 0
          const advanced = base + ((TICK_MS / 1000) * speed) / duration
          next[unit.id] = advanced >= 1 ? advanced - 1 : advanced
        }
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [running, speed, plan])

  const toggleRunning = useCallback(() => setRunning((value) => !value), [])
  const changeSpeed = useCallback((value: number) => setSpeed(value), [])
  const reset = useCallback(() => {
    setRunning(false)
    setProgress({})
    setElapsedSeconds(0)
  }, [])

  const units = useMemo<DisplayPatrolUnit[]>(
    () =>
      plan.units.map((unit) => {
        const unitProgress = progress[unit.id] ?? 0
        const projected = projectUnit({ route: unit.route, progress: unitProgress })
        return {
          ...unit,
          progress: unitProgress,
          displayLat: projected.lat,
          displayLng: projected.lng,
          displayStatus: projected.status,
          etaMinutes: projected.etaMinutes,
        }
      }),
    [plan, progress],
  )

  const value = useMemo(
    () => ({
      units,
      coveredZones: plan.coveredZones,
      running,
      speed,
      elapsedSeconds,
      toggleRunning,
      changeSpeed,
      reset,
    }),
    [units, plan.coveredZones, running, speed, elapsedSeconds, toggleRunning, changeSpeed, reset],
  )

  return <PatrolContext.Provider value={value}>{children}</PatrolContext.Provider>
}
