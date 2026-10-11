import { describe, expect, it } from "vitest";
import {
  buildPeriodComparison,
  buildTrendSeries,
  reportAnchor,
} from "../../src/utils/stats";
import { makeIncident } from "./helpers";

describe("reportMetrics", () => {
  it("reportAnchor returns the latest incident date", () => {
    const incidents = [
      makeIncident({ occurredAt: "2026-09-30T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-10-03T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-08-01T10:00:00+05:30" }),
    ];
    expect(reportAnchor(incidents)).toBe("2026-10-03");
  });

  it("buildPeriodComparison counts the latest week against the previous week", () => {
    const incidents = [
      makeIncident({ occurredAt: "2026-10-08T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-10-05T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-09-30T10:00:00+05:30" }),
    ];
    const comparison = buildPeriodComparison(incidents, "2026-10-08");

    expect(comparison.anchor).toBe("2026-10-08");
    expect(comparison.totals.currentWeek).toBe(2);
    expect(comparison.totals.previousWeek).toBe(1);
    expect(comparison.totals.changeWeek).toBe(100);
    expect(comparison.baselines.week).toBe(true);

    const theft = comparison.rows.find((row) => row.category === "Theft");
    expect(theft?.currentWeek).toBe(2);
    expect(theft?.previousWeek).toBe(1);
    expect(theft?.changeWeek).toBe(100);
  });

  it("buildPeriodComparison compares the current 28-day window with the previous one", () => {
    const incidents = [
      makeIncident({ occurredAt: "2026-10-01T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-09-01T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-09-02T10:00:00+05:30" }),
    ];
    const comparison = buildPeriodComparison(incidents, "2026-10-08");

    expect(comparison.totals.current28).toBe(1);
    expect(comparison.totals.previous28).toBe(2);
    expect(comparison.totals.change28).toBe(-50);
    expect(comparison.baselines.d28).toBe(true);
  });

  it("buildPeriodComparison marks prior-year YTD unavailable with no records", () => {
    const incidents = [makeIncident({ occurredAt: "2026-05-01T10:00:00+05:30" })];
    const comparison = buildPeriodComparison(incidents, "2026-10-08");

    expect(comparison.totals.currentYtd).toBe(1);
    expect(comparison.totals.previousYtd).toBe(0);
    expect(comparison.totals.changeYtd).toBeNull();
    expect(comparison.baselines.ytd).toBe(false);

    const theft = comparison.rows.find((row) => row.category === "Theft");
    expect(theft?.changeYtd).toBeNull();
    expect(theft?.previousYtd).toBe(0);
  });

  it("buildTrendSeries uses daily buckets for a week-long range", () => {
    const incidents = [
      makeIncident({ occurredAt: "2026-10-08T09:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-10-08T10:00:00+05:30" }),
      makeIncident({ occurredAt: "2026-10-05T10:00:00+05:30" }),
    ];
    const { granularity, buckets } = buildTrendSeries(incidents, {
      from: "2026-10-02",
      to: "2026-10-08",
    });

    expect(granularity).toBe("day");
    expect(buckets).toHaveLength(7);
    expect(buckets[0].key).toBe("2026-10-02");
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
    expect(buckets[buckets.length - 1].count).toBe(2);
  });

  it("buildTrendSeries switches to weekly buckets for a quarter", () => {
    const { granularity, buckets } = buildTrendSeries([], {
      from: "2026-07-11",
      to: "2026-10-08",
    });
    expect(granularity).toBe("week");
    expect(buckets.length).toBeGreaterThan(5);
  });

  it("buildTrendSeries switches to monthly buckets for long ranges", () => {
    const { granularity } = buildTrendSeries([], {
      from: "2026-01-01",
      to: "2026-10-08",
    });
    expect(granularity).toBe("month");
  });
});
