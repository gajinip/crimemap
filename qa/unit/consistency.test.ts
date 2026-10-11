import { describe, expect, it } from "vitest";
import { computeRiskZones } from "../../src/analytics/risk";
import { CRIME_INCIDENTS } from "../../src/data/crimeIncidents";
import { POLICE_STATIONS } from "../../src/data/policeStations";
import { CRIME_CATEGORIES, INCIDENT_STATUSES, RISK_LEVELS, SEVERITIES } from "../../src/types";
import {
  ALL_AREAS,
  applyContextFilters,
  applyCrimeFilters,
  timePresets,
  type CrimeFilterState,
} from "../../src/utils/filters";
import { computeDashboardStats } from "../../src/utils/stats";

const DEMO_RANGE = { from: "2026-04-01", to: "2026-10-08" };

/** The Reports view's default filter state (period = All dates). */
function reportsDefaultFilters(): CrimeFilterState {
  const fullRange = timePresets().find((preset) => preset.days === null);
  if (!fullRange) throw new Error("expected an all-dates preset");
  return {
    categories: [...CRIME_CATEGORIES],
    riskLevels: [...RISK_LEVELS],
    severities: [...SEVERITIES],
    statuses: [...INCIDENT_STATUSES],
    area: ALL_AREAS,
    dateRange: fullRange.range,
    searchQuery: "",
  };
}

describe("cross-page dataset consistency", () => {
  it("Reports defaults to the full dataset, matching every other page", () => {
    const filters = reportsDefaultFilters();
    expect(applyContextFilters(CRIME_INCIDENTS, filters)).toHaveLength(CRIME_INCIDENTS.length);
    expect(applyCrimeFilters(CRIME_INCIDENTS, filters)).toHaveLength(CRIME_INCIDENTS.length);
    expect(POLICE_STATIONS.length).toBeGreaterThan(0);
  });

  it("Reports and Dashboard agree on totals, zones and average risk", () => {
    const filters = reportsDefaultFilters();
    const dashboardZones = computeRiskZones(CRIME_INCIDENTS, DEMO_RANGE);
    const dashboardStats = computeDashboardStats(CRIME_INCIDENTS, dashboardZones, null, DEMO_RANGE);

    const reportsZones = computeRiskZones(
      applyContextFilters(CRIME_INCIDENTS, filters),
      filters.dateRange,
    );
    const reportsStats = computeDashboardStats(
      applyCrimeFilters(CRIME_INCIDENTS, filters),
      reportsZones,
      filters.dateRange,
      filters.dateRange,
    );

    expect(dashboardStats.totalIncidents).toBe(CRIME_INCIDENTS.length);
    expect(reportsStats.totalIncidents).toBe(dashboardStats.totalIncidents);
    expect(reportsZones).toHaveLength(dashboardZones.length);
    expect(reportsStats.highRiskZones).toBe(dashboardStats.highRiskZones);
    expect(reportsStats.averageRiskScore).toBe(dashboardStats.averageRiskScore);
    expect(reportsStats.trendPercent).toBe(dashboardStats.trendPercent);
  });
});
