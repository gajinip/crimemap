import type {
  PredictedRiskZone,
  PredictionAdjustment,
  PredictionResult,
  RiskForecastResponse,
  RiskZone,
} from '../types'
import { riskLevelFor } from './risk'

/**
 * Conservative, explainable forward view over the measured risk zones.
 *
 * This is deliberately *not* a probabilistic model: it applies a small,
 * rule-based adjustment on top of the deterministic score, driven only by
 * signals the zone already exposes (emerging status, trend direction) and the
 * forecast's confidence. Every movement is bounded, blended by confidence and
 * reported as an itemised list so the predicted score is never shown without
 * its reasons.
 *
 *   emerging    a watch signal - small boost              up to +6
 *   rising      trend persistence, scaled by %            up to +6
 *   declining   trend persistence, scaled by %            down to -5
 *   confidence  scales the raw signal into the adjustment (never widens it)
 *
 * The base measured score is always retained (`baseScore`/`baseLevel`), and
 * `riskScore`/`riskLevel` are overridden with the predicted values so existing
 * consumers transparently operate on the forward view.
 */

export const PREDICTION_MODEL_VERSION = 'crimemap-forward-view-v1'

const MAX_BOOST = 10
const MAX_PENALTY = 6
const EMERGING_RAW_BOOST = 6
const TREND_RAW_MAX = 6
const DECLINE_RAW_MAX = 5
const MIN_CONFIDENCE = 0.4
const MAX_CONFIDENCE = 0.9
/** Below this confidence a decline is not trusted to reduce coverage. */
const HIGH_CONFIDENCE = 0.6

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/** Heuristic data-coverage confidence, matching the forecast engine. */
function confidenceFor(zone: RiskZone, forecast?: RiskForecastResponse): number {
  const fromForecast = forecast?.predictions.find((prediction) => prediction.zoneId === zone.id)
  if (fromForecast) return clamp(fromForecast.confidence, 0, 1)
  return clamp(MIN_CONFIDENCE + (Math.min(zone.crimeCount, 20) / 20) * (MAX_CONFIDENCE - MIN_CONFIDENCE), MIN_CONFIDENCE, MAX_CONFIDENCE)
}

/**
 * Raw (pre-confidence) forward signal for a zone. Emerging and rising/declining
 * are mutually exclusive so the same trend is never counted twice.
 */
function rawSignal(zone: RiskZone): { key: PredictionAdjustment['key']; raw: number; label: string; detail: string } | null {
  if (zone.isEmerging) {
    return {
      key: 'emerging',
      raw: EMERGING_RAW_BOOST,
      label: 'Emerging watch',
      detail: 'No incidents in the previous window - placed on forward watch',
    }
  }

  if (zone.trend === 'Rising' && zone.trendPercent > 5) {
    const raw = clamp((zone.trendPercent / 100) * 10, 1, TREND_RAW_MAX)
    return {
      key: 'trend',
      raw,
      label: 'Rising trend',
      detail: `${zone.trendPercent > 0 ? '+' : ''}${zone.trendPercent}% vs the previous window - trend persistence`,
    }
  }

  if (zone.trend === 'Declining' && zone.trendPercent < -5) {
    const raw = -clamp((Math.abs(zone.trendPercent) / 100) * 8, 1, DECLINE_RAW_MAX)
    return {
      key: 'trend',
      raw,
      label: 'Declining trend',
      detail: `${zone.trendPercent}% vs the previous window - cautious forward reduction`,
    }
  }

  return null
}

/** Builds the forward adjustment for a single measured zone. */
export function predictZone(zone: RiskZone, forecast?: RiskForecastResponse): PredictedRiskZone {
  const confidence = confidenceFor(zone, forecast)
  const signal = rawSignal(zone)

  const adjustments: PredictionAdjustment[] = []
  const raw = signal?.raw ?? 0
  // A decline is only trusted once confidence clears the floor; a low-confidence
  // fall is left as-is rather than reducing coverage on weak evidence.
  const demoteSuppressed = raw < 0 && confidence < HIGH_CONFIDENCE

  if (signal && demoteSuppressed) {
    adjustments.push({
      key: 'confidence',
      label: 'Confidence weighting',
      points: 0,
      detail: `Decline withheld: ${Math.round(confidence * 100)}% confidence is below the ${Math.round(HIGH_CONFIDENCE * 100)}% floor`,
    })
  } else if (signal) {
    adjustments.push({
      key: signal.key,
      label: signal.label,
      points: round1(raw * confidence),
      detail: signal.detail,
    })
    // Confidence reported as its own component whenever it moved the signal, so
    // the listed components always reconcile with the total adjustment.
    if (Math.abs(raw - raw * confidence) >= 0.05) {
      adjustments.push({
        key: 'confidence',
        label: 'Confidence weighting',
        points: round1(raw * confidence - raw),
        detail: `${Math.round(confidence * 100)}% confidence scaled the ${raw > 0 ? '+' : ''}${round1(raw)} signal`,
      })
    }
  }

  const adjustment = demoteSuppressed ? 0 : clamp(round1(raw * confidence), -MAX_PENALTY, MAX_BOOST)
  const predictedScore = clamp(Math.round(zone.riskScore + adjustment), 0, 100)
  const predictedLevel = riskLevelFor(predictedScore)

  const rationale =
    adjustments.length === 0
      ? [`Stable: ${zone.riskScore}/100 measured score carried forward unchanged`]
      : adjustments.map(
          (item) =>
            `${item.label}: ${item.points > 0 ? '+' : ''}${item.points} (${item.detail})`,
        )
  rationale.push(
    `Forward view ${zone.riskScore} → ${predictedScore}/100 (${predictedLevel}); confidence ${Math.round(confidence * 100)}%`,
  )

  return {
    ...zone,
    baseScore: zone.riskScore,
    baseLevel: zone.riskLevel,
    riskScore: predictedScore,
    riskLevel: predictedLevel,
    predictedScore,
    predictedLevel,
    adjustment,
    confidence: Math.round(confidence * 100) / 100,
    adjustments,
    rationale,
  }
}

/** Predicts a whole zone set. Order and ids are preserved for lookup. */
export function computePredictedZones(
  zones: RiskZone[],
  forecast?: RiskForecastResponse,
): PredictedRiskZone[] {
  return zones.map((zone) => predictZone(zone, forecast))
}

/**
 * Convenience wrapper returning the predicted view plus the metadata a screen
 * needs to label it. Falls back to `source: 'measured'` when there is nothing
 * to predict, so callers can branch on a single value.
 */
export function buildPredictionResult(
  zones: RiskZone[],
  forecast?: RiskForecastResponse,
): PredictionResult {
  const predicted = computePredictedZones(zones, forecast)
  return {
    zones: predicted,
    source: predicted.length > 0 ? 'predicted' : 'measured',
    modelVersion: PREDICTION_MODEL_VERSION,
  }
}
