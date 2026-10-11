import { describe, expect, it } from "vitest";
import { buildCategoryTrends } from "../../src/utils/stats";
import { makeIncident } from "./helpers";

const RANGE_30D = { from: "2026-09-09", to: "2026-10-08" };

describe("buildCategoryTrends", () => {
  it("returns one entry per crime category with overall totals", () => {
    const incidents = [
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Robbery" }),
    ];
    const trends = buildCategoryTrends(incidents, RANGE_30D, 30);
    expect(trends).toHaveLength(7);
    const theft = trends.find((row) => row.category === "Theft");
    expect(theft?.total).toBe(2);
    expect(theft?.current).toBe(2);
  });

  it("compares a fixed rolling 30-day window with the previous 30 days", () => {
    const incidents = [
      // one in the recent window (09 Sep - 08 Oct)
      makeIncident({ category: "Theft", occurredAt: "2026-10-06T12:00:00+05:30" }),
      // two in the previous window (10 Aug - 08 Sep)
      makeIncident({ category: "Theft", occurredAt: "2026-08-20T12:00:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-08-25T12:00:00+05:30" }),
    ];
    const trends = buildCategoryTrends(incidents, { from: "2026-04-01", to: "2026-10-08" }, 30);
    const theft = trends.find((row) => row.category === "Theft");
    expect(theft?.current).toBe(1);
    expect(theft?.previous).toBe(2);
    expect(theft?.hasBaseline).toBe(true);
    expect(theft?.percent).toBe(-50);
    expect(theft?.direction).toBe("Declining");
  });

  it("reports n/a (no baseline) when the previous window is empty", () => {
    const incidents = [
      makeIncident({ category: "Robbery", occurredAt: "2026-10-06T12:00:00+05:30" }),
    ];
    const trends = buildCategoryTrends(incidents, { from: "2026-04-01", to: "2026-10-08" }, 30);
    const robbery = trends.find((row) => row.category === "Robbery");
    expect(robbery?.hasBaseline).toBe(false);
    expect(robbery?.percent).toBeNull();
  });

  it("matches computeRangeCompare semantics when no window is given", () => {
    const incidents = [
      makeIncident({ category: "Theft", occurredAt: "2026-10-08T10:00:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-10-07T10:00:00+05:30" }),
    ];
    const trends = buildCategoryTrends(incidents, { from: "2026-10-08", to: "2026-10-08" });
    const theft = trends.find((row) => row.category === "Theft");
    expect(theft?.current).toBe(1);
    expect(theft?.previous).toBe(1);
    expect(theft?.percent).toBe(0);
  });
});