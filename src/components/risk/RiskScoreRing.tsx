import { useI18n } from '../../i18n/useI18n'
import type { RiskLevel } from '../../types'
import { RISK_LEVEL_COLOR } from '../../utils/riskPalette'

interface RiskScoreRingProps {
  score: number
  level: RiskLevel
  /** SVG diameter in px. */
  size?: number
  strokeWidth?: number
}

/**
 * Accessible circular 0-100 risk indicator. The ring is drawn with SVG and
 * colored by risk level; the numeric score is rendered in the centre.
 */
export function RiskScoreRing({
  score,
  level,
  size = 78,
  strokeWidth = 8,
}: RiskScoreRingProps) {
  const { t } = useI18n()
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference
  const color = RISK_LEVEL_COLOR[level]

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={t('Risk score {score} out of 100 ({level} risk)', { score: clamped, level: t('risk.' + level) })}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#DCE4EE"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            filter: `drop-shadow(0 0 5px ${color}80)`,
            transition: 'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="t-title font-bold leading-none"
          style={{ color }}
          aria-hidden="true"
        >
          {clamped}
        </span>
      </div>
    </div>
  )
}