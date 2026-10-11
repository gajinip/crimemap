import { describe, expect, it } from "vitest";
import {
  buildAreaStats,
  buildCategoryStats,
  buildMonthlySeries,
  buildStatusStats,
  computeDashboardStats,
  computeRangeCompare,
  computeTrend,
} from "../../src/utils/stats";
import { FULL_RANGE, makeIncident, makeZone } from "./helpers";

const RANGE_DAY = { from: "2026-10-08", to: "2026-10-08" };

describe("stats", () => {
  it("computeRangeCompare compares a single day with the previous day", () => {
    const incidents = [
      makeIncident({ occurredAt: "2026-10-08T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-10-07T12:00:00+05:30" }),
    ];
    const compare = computeRangeCompare(incidents, RANGE_DAY);
    expect(compare.percent).toBe(0);
    expect(compare.direction).toBe("Stable");
    expect(compare.hasBaseline).toBe(true);
  });

  it("computeRangeCompare reports Rising above the 5% threshold", () => {
    const incidents = [
      makeIncident({ id: "c1", occurredAt: "2026-10-08T10:00:00+05:30" }),
      makeIncident({ id: "c2", occurredAt: "2026-10-08T11:00:00+05:30" }),
      makeIncident({ id: "c3", occurredAt: "2026-10-08T12:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-10-07T12:00:00+05:30" }),
    ];
    const compare = computeRangeCompare(incidents, RANGE_DAY);
    expect(compare.direction).toBe("Rising");
    expect(compare.percent).toBe(200);
  });

  it("computeRangeCompare lacks a baseline when the previous day is empty", () => {
    const incidents = [makeIncident({ occurredAt: "2026-10-08T10:00:00+05:30" })];
    expect(computeRangeCompare(incidents, RANGE_DAY).hasBaseline).toBe(false);
  });

  it("computeTrend uses two rolling 30-day windows", () => {
    const incidents = [
      makeIncident({ occurredAt: "2026-10-05T21:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-08-20T21:00:00+05:30" }),
    ];
    const trend = computeTrend(incidents, FULL_RANGE);
    expect(trend.percent).toBe(0);
    expect(trend.direction).toBe("Stable");
  });

  it("computeDashboardStats aggregates categories, hotspots and average score", () => {
    const incidents = [
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Robbery" }),
    ];
    const zones = [
      makeZone({ status: "Active", riskScore: 80, riskLevel: "High", trend: "Stable" }),
      makeZone({ status: "Monitoring", riskScore: 20, riskLevel: "Low", isEmerging: true }),
    ];
    const stats = computeDashboardStats(incidents, zones, null, FULL_RANGE);
    expect(stats.totalIncidents).toBe(3);
    expect(stats.mostCommonCategory).toBe("Theft");
    expect(stats.activeHotspots).toBe(1);
    expect(stats.emergingHotspots).toBe(1);
    expect(stats.highRiskZones).toBe(1);
    expect(stats.averageRiskScore).toBe(50);
    expect(stats.trendDirection).toBe("Stable");
  });

  it("buildCategoryStats covers all categories and normalises shares to 100", () => {
    const stats = buildCategoryStats([
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Robbery" }),
    ]);
    expect(stats[0].category).toBe("Theft");
    expect(stats[0].share).toBe(66.7);
    expect(stats).toHaveLength(7);
    expect(stats.map((s) => s.count).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it("buildMonthlySeries includes a leading zero month due to the +05:30 UTC rollback", () => {
    const series = buildMonthlySeries(
      [makeIncident({ occurredAt: "2026-04-15T10:00:00+05:30" }), makeIncident({ occurredAt: "2026-04-02T10:00:00+05:30" })],
      FULL_RANGE,
    );
    expect(series).toHaveLength(8);
    expect(series[0].month).toBe("2026-03");
    expect(series[0].count).toBe(0);
    expect(series[1].month).toBe("2026-04");
    expect(series[1].count).toBe(2);
    expect(series[7].month).toBe("2026-10");
  });

  it("buildAreaStats sorts descending and honours the limit", () => {
    const stats = buildAreaStats(
      [
        makeIncident({ area: "Area A" }),
        makeIncident({ area: "Area A" }),
        makeIncident({ area: "Area B" }),
        makeIncident({ area: "Area C" }),
      ],
      2,
    );
    expect(stats).toHaveLength(2);
    expect(stats[0]).toEqual({ area: "Area A", count: 2 });
    expect(stats[1].count).toBe(1);
  });

  it("buildStatusStats sorts counts descending", () => {
    const stats = buildStatusStats([
      makeIncident({ status: "Closed" }),
      makeIncident({ status: "Reported" }),
      makeIncident({ status: "Reported" }),
    ]);
    expect(stats[0]).toEqual({ status: "Reported", count: 2 });
    expect(stats[1]).toEqual({ status: "Closed", count: 1 });
  });
});