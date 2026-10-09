import type { RiskForecastResponse } from '../types'

/**
 * Contract for the future predictive-risk microservice.
 *
 *   GET /api/v1/risk/forecast?area=...&horizon_days=30
 *     -> RiskForecastResponse { risk_score, risk_level, confidence,
 *                               contributing_factors, is_demo }
 *
 * The bundled build does not call this endpoint: `buildRiskForecast()` in
 * `src/analytics/risk.ts` produces the exact same response shape from the
 * deterministic scoring engine, so the values always match the map and the
 * explainability panel. Nothing here predicts individual future events.
 */
export interface RiskApiService {
  fetchForecast(params?: { area?: string; horizonDays?: number }): Promise<RiskForecastResponse>
}

export function httpRiskApi(baseUrl: string): RiskApiService {
  return {
    async fetchForecast(params) {
      const search = new URLSearchParams()
      if (params?.area) search.set('area', params.area)
      if (params?.horizonDays) search.set('horizon_days', String(params.horizonDays))
      const response = await fetch(`${baseUrl}/risk/forecast?${search.toString()}`)
      if (!response.ok) {
        throw new Error(`CRIMEMAP risk API error ${response.status}`)
      }
      return (await response.json()) as RiskForecastResponse
    },
  }
}
