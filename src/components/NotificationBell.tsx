import { AlertTriangle, Bell, Check, MapPin, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { CriticalAlert } from '../utils/alerts'
import { RISK_LEVEL_BADGE, RISK_LEVEL_COLOR } from '../utils/riskPalette'
import { CRIME_CATEGORY_COLORS } from '../utils/visuals'
import { Sheet } from './ui/Sheet'

interface NotificationBellProps {
  alerts: CriticalAlert[]
  /** Jump to the crime map (used by the alert actions). */
  onOpenMap: () => void
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Critical-incident notification bell + drawer.
 *
 * Alerts are generated locally from the risk engine and exist purely for
 * in-app situational awareness. Nothing is dispatched to real police units
 * unless an authorised backend and communication channel are configured.
 */
export function NotificationBell({ alerts, onOpenMap }: NotificationBellProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set())

  const unread = alerts.filter((alert) => !acknowledged.has(alert.id)).length

  const acknowledge = (id: string) =>
    setAcknowledged((current) => new Set(current).add(id))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('Critical incident notifications')}
        title={t('Critical incident notifications')}
        className="relative grid size-11 shrink-0 place-items-center rounded-lg border border-navy-700 bg-navy-800 text-steel-400 transition-colors hover:bg-hover hover:text-steel-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-police-blue"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-risk-critical px-1 t-xs font-bold leading-5 text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t('Close notifications')}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[1290] cursor-default bg-steel-100/20"
          />
          <Sheet
            ariaLabel={t('Critical incident notifications')}
            onClose={() => setOpen(false)}
            header={
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-risk-critical/10 text-risk-critical">
                  <ShieldAlert className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="t-base font-bold text-steel-100">
                    {t('Critical incident notifications')}
                  </h2>
                  <p className="t-xs text-steel-400">
                    {unread > 0 ? `${unread} ${t('unread')}` : t('All acknowledged')}
                  </p>
                </div>
              </div>
            }
          >
            <p className="mb-3 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 t-xs leading-relaxed text-steel-400">
              {t(
                'Demo alerts derived from the synthetic risk engine. No notification is dispatched to a police unit unless an authorised channel is configured.',
              )}
            </p>

            {alerts.length === 0 ? (
              <p className="py-8 text-center t-base text-steel-400">
                {t('No critical incidents in the current window.')}
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {alerts.map((alert) => {
                  const color = RISK_LEVEL_COLOR[alert.riskLevel]
                  const isAcked = acknowledged.has(alert.id)
                  return (
                    <li
                      key={alert.id}
                      className={`overflow-hidden rounded-xl border bg-navy-800 transition-opacity ${
                        isAcked ? 'border-navy-700 opacity-70' : 'border-navy-700'
                      }`}
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <div className="flex items-center justify-between gap-2 px-3 pt-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-[1px] t-xs font-bold uppercase tracking-[0.08em]"
                          style={{ color, backgroundColor: `${color}1f` }}
                        >
                          <AlertTriangle className="size-3" aria-hidden />
                          {RISK_LEVEL_BADGE[alert.riskLevel]}
                        </span>
                        <span className="font-mono t-xs font-semibold text-steel-400">
                          {alert.reference}
                        </span>
                      </div>

                      <div className="px-3 py-2.5">
                        <p className="flex items-center gap-1.5 t-base font-semibold text-steel-100">
                          <span
                            className="inline-block size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: CRIME_CATEGORY_COLORS[alert.category] }}
                            aria-hidden
                          />
                          {t('category.' + alert.category)} · {t(alert.area)}
                        </p>
                        <dl className="mt-2 grid grid-cols-1 gap-1 t-xs text-steel-400">
                          <div className="flex justify-between gap-3">
                            <dt>{t('Verified location')}</dt>
                            <dd className="text-right font-medium text-steel-200">{t(alert.area)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt>{t('Raised')}</dt>
                            <dd className="text-right font-medium text-steel-200">
                              {dateFormatter.format(new Date(alert.raisedAt))}
                            </dd>
                          </div>
                          {alert.window ? (
                            <div className="flex justify-between gap-3">
                              <dt>{t('Peak window')}</dt>
                              <dd className="text-right font-medium text-steel-200">{alert.window}</dd>
                            </div>
                          ) : null}
                          <div className="flex justify-between gap-3">
                            <dt>{t('Nearest unit')}</dt>
                            <dd className="text-right font-medium text-steel-200">
                              {alert.stationName
                                ? `${t(alert.stationName)}${
                                    alert.distanceMeters !== null
                                      ? ` · ${formatDistance(alert.distanceMeters)}`
                                      : ''
                                  }`
                                : t('Unassigned')}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt>{t('Status')}</dt>
                            <dd
                              className={`text-right font-semibold ${
                                isAcked ? 'text-risk-low' : 'text-risk-critical'
                              }`}
                            >
                              {isAcked ? t('Acknowledged') : t('Awaiting acknowledgement')}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="flex items-center gap-2 border-t border-navy-700 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenMap()
                            setOpen(false)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-police-blue px-2.5 py-1.5 t-xs font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          <MapPin className="size-3.5" aria-hidden />
                          {t('Open Map')}
                        </button>
                        <button
                          type="button"
                          onClick={() => acknowledge(alert.id)}
                          disabled={isAcked}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-700 px-2.5 py-1.5 t-xs font-semibold text-steel-300 transition-colors hover:bg-hover hover:text-steel-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="size-3.5" aria-hidden />
                          {isAcked ? t('Acknowledged') : t('Acknowledge')}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Sheet>
        </>
      ) : null}
    </>
  )
}
