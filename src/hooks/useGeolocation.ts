import { useCallback, useState } from 'react'
import type { GeoPoint } from '../types'

export type GeolocationStatus = 'idle' | 'locating' | 'success' | 'error'

export interface GeolocationResult {
  /** Last known user position, or null before the first successful fix. */
  position: GeoPoint | null
  /** Accuracy of the last fix in metres, when the browser reports it. */
  accuracyMeters: number | null
  status: GeolocationStatus
  /** Human-readable failure reason, or null. */
  error: string | null
  /** False when the browser does not expose the Geolocation API. */
  supported: boolean
  /** Request a fresh high-accuracy position fix. */
  locate: () => void
  /** Forget the last fix (e.g. after the marker is dismissed). */
  reset: () => void
}

/**
 * Thin wrapper around the browser Geolocation API.
 *
 * Used to find where the operator currently is so an incident can be pinned to
 * the crime spot and marked on the map. The demo dataset is centred on
 * Puducherry, so callers should treat a fix outside the district as
 * "out of area" rather than an error.
 */
export function useGeolocation(): GeolocationResult {
  const supported =
    typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined'

  const [position, setPosition] = useState<GeoPoint | null>(null)
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const locate = useCallback(() => {
    if (!supported) {
      setStatus('error')
      setError('Geolocation is not available in this browser.')
      return
    }

    setStatus('locating')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ lat: result.coords.latitude, lng: result.coords.longitude })
        setAccuracyMeters(Number.isFinite(result.coords.accuracy) ? result.coords.accuracy : null)
        setStatus('success')
      },
      (failure) => {
        setStatus('error')
        setError(
          failure.message ||
            'Unable to determine your location. Check the browser location permission.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }, [supported])

  const reset = useCallback(() => {
    setPosition(null)
    setAccuracyMeters(null)
    setStatus('idle')
    setError(null)
  }, [])

  return { position, accuracyMeters, status, error, supported, locate, reset }
}
