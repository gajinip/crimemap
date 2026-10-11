import type {
  CrimeIncident,
  RiskZone,
  PoliceStation,
  CategoryStat,
  DashboardStats,
  CrimeFilterState,
  ChangeReport,
} from '../types'
import { CrimeTable } from '../components/CrimeTable'
import { DemoChip } from '../components/ui/Badge'
import { InfoPopover } from '../components/ui/InfoPopover'
import { Panel } from '../components/ui/Panel'
import { RiskBreakdown } from '../components/RiskBreakdown'
import { formatNumber } from '../utils/format'
import { severityOf } from '../utils/severity'
import { downloadTextFile, toCsv } from '../utils/export'

interface ReportsViewProps {
  incidents: CrimeIncident[]
  zones: RiskZone[]
  changes: ChangeReport
  stations: PoliceStation[]
  stats: DashboardStats
  categoryStats: CategoryStat[]
  filters: CrimeFilterState
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function exportIncidents(incidents: CrimeIncident[]) {
  const rows = incidents.map((incident) => [
    incident.id,
    incident.occurredAt.slice(0, 10),
    incident.occurredAt.slice(11, 16),
    incident.category,
    severityOf(incident.category),
    incident.area,
    incident.status,
    incident.lat,
    incident.lng,
  ])
  downloadTextFile(
    `crimemap-incidents-${stamp()}.csv`,
    toCsv(
      ['Incident ID', 'Date', 'Time', 'Category', 'Severity', 'Locality', 'Status', 'Lat', 'Lng'],
      rows,
    ),
  )
}

function exportZones(zones: RiskZone[]) {
  const rows = zones.map((zone) => [
    zone.id,
    zone.area,
    zone.riskScore,
    zone.riskLevel,
    zone.trend,
    zone.trendPercent,
    zone.crimeCount,
    zone.previousCount,
    zone.dominantCrime,
    zone.peakWindow,
    zone.peakShare,
    zone.status,
    zone.isEmerging ? 'yes' : 'no',
  ])
  downloadTextFile(
    `crimemap-risk-zones-${stamp()}.csv`,
    toCsv(
      [
        'Zone ID',
        'Locality',
        'Risk Score',
        'Risk Level',
        'Trend',
        'Trend %',
        'Recent',
        'Previous',
        'Dominant Crime',
        'Peak Window',
        'Peak Share %',
        'Status',
        'Emerging',
      ],
      rows,
    ),
  )
}

function exportChanges(report: ChangeReport) {
  const rows = report.signals.map((signal) => [
    signal.id,
    signal.kind,
    signal.severity,
    signal.area,
    signal.headline,
    signal.detail,
    signal.deltaPercent,
    signal.recentCount,
    signal.previousCount,
    signal.category ?? '',
  ])
  downloadTextFile(
    `crimemap-change-signals-${stamp()}.csv`,
    toCsv(
      [
        'Signal ID',
        'Kind',
        'Urgency',
        'Locality',
        'Headline',
        'Detail',
        'Delta %',
        'Recent',
        'Previous',
        'Category',
      ],
      rows,
    ),
  )
}

function exportStations(stations: PoliceStation[]) {
  const rows = stations.map((station) => [
    station.id,
    station.name,
    station.area,
    station.jurisdiction.join('; '),
    station.lat,
    station.lng,
  ])
  downloadTextFile(
    `crimemap-stations-${stamp()}.csv`,
    toCsv(['Station ID', 'Name', 'Locality', 'Jurisdiction', 'Lat', 'Lng'], rows),
  )
}

/** Reports view: export-ready summary of incidents and risk zones. */
export function ReportsView({
  incidents,
  zones,
  changes,
  stations,
  stats,
  categoryStats,
}: ReportsViewProps) {
  const exportButtons: { label: string; hint: string; onClick: () => void }[] = [
    {
      label: 'Incidents CSV',
      hint: `${formatNumber(incidents.length)} records`,
      onClick: () => exportIncidents(incidents),
    },
    {
      label: 'Risk zones CSV',
      hint: `${formatNumber(zones.length)} zones`,
      onClick: () => exportZones(zones),
    },
    {
      label: 'Change signals CSV',
      hint: `${changes.signals.length} signals`,
      onClick: () => exportChanges(changes),
    },
    {
      label: 'Stations CSV',
      hint: `${formatNumber(stations.length)} stations`,
      onClick: () => exportStations(stations),
    },
    {
      label: 'Print / PDF',
      hint: 'Browser print dialog',
      onClick: () => window.print(),
    },
  ]

  return (
    <div className="scroll-thin flex flex-col gap-3 bg-navy-950 p-3 pb-8 xl:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold leading-tight text-white xl:text-[22px]">
              Reports &amp; Export
            </h1>
            <InfoPopover
              label="About reports and export"
              text="Snapshot of the current filtered dataset and explainable risk zones. Suitable for printing or copy/paste into operational briefs."
            />
          </div>
        </div>
        <DemoChip />
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Panel title="Total incidents" subtitle="Filtered">
          <p className="text-3xl font-bold text-white">{formatNumber(stats.totalIncidents)}</p>
        </Panel>
        <Panel title="Risk zones" subtitle="Active">
          <p className="text-3xl font-bold text-white">{formatNumber(zones.length)}</p>
        </Panel>
        <Panel title="Avg risk score" subtitle="0–100">
          <p className="text-3xl font-bold text-white">{Math.round(stats.averageRiskScore)}</p>
        </Panel>
      </div>

      <Panel title="Exports" subtitle="CSV files respect the active filters">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {exportButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={button.onClick}
              className="flex items-center justify-between rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 text-left hover:border-blue-500/50 hover:bg-navy-700"
            >
              <span className="text-[12px] font-semibold text-white">{button.label}</span>
              <span className="text-[10px] text-steel-500">{button.hint}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Top categories" subtitle="Share of filtered incidents">
        <ul className="divide-y divide-navy-700">
          {categoryStats.slice(0, 6).map((entry) => (
            <li key={entry.category} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
              <span className="text-[12px] font-semibold text-white">{entry.category}</span>
              <span className="font-mono text-[11px] text-steel-300">
                {entry.count} ({entry.share}%)
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {zones.length > 0 ? (
        <Panel title="Risk zone summaries" subtitle="Explainable scores">
          <div className="grid gap-2.5 md:grid-cols-2">
            {zones.slice(0, 3).map((zone) => (
              <RiskBreakdown key={zone.id} zone={zone} compact />
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel title="Incidents (filtered)" subtitle={`${formatNumber(incidents.length)} records`}>
        <CrimeTable incidents={incidents.slice(0, 25)} />
      </Panel>
    </div>
  )
}
