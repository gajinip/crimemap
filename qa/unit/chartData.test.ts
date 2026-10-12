import { describe, expect, it } from "vitest";
import { buildCategoryHalfComparison, niceTicks } from "../../src/utils/chartData";
import { makeIncident } from "./helpers";

const RANGE = { from: "2026-04-01", to: "2026-10-08" };

describe("buildCategoryHalfComparison", () => {
  it("returns one entry per category, sorted by total descending", () => {
    const incidents = [
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Robbery" }),
    ];
    const rows = buildCategoryHalfComparison(incidents, RANGE);
    expect(rows).toHaveLength(7);
    expect(rows[0].category).toBe("Theft");
    const theft = rows.find((row) => row.category === "Theft");
    expect(theft?.first + theft?.second).toBe(2);
  });

  it("counts incidents in each half of the period", () => {
    const incidents = [
      makeIncident({ category: "Theft", occurredAt: "2026-05-01T12:00:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-06-20T12:00:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-08-15T12:00:00+05:30" }),
    ];
    const rows = buildCategoryHalfComparison(incidents, RANGE);
    const theft = rows.find((row) => row.category === "Theft");
    expect(theft?.first).toBe(2);
    expect(theft?.second).toBe(1);
  });

  it("ignores incidents outside the range", () => {
    const incidents = [
      makeIncident({ category: "Theft", occurredAt: "2026-03-31T23:59:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-10-09T00:00:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-06-01T12:00:00+05:30" }),
    ];
    const rows = buildCategoryHalfComparison(incidents, RANGE);
    const theft = rows.find((row) => row.category === "Theft");
    expect(theft?.first + theft?.second).toBe(1);
  });

  it("reports percentage change and hasBaseline", () => {
    const incidents = [
      makeIncident({ category: "Robbery", occurredAt: "2026-05-01T12:00:00+05:30" }),
      makeIncident({ category: "Robbery", occurredAt: "2026-08-01T12:00:00+05:30" }),
    ];
    const rows = buildCategoryHalfComparison(incidents, RANGE);
    const robbery = rows.find((row) => row.category === "Robbery");
    expect(robbery?.first).toBe(1);
    expect(robbery?.second).toBe(1);
    expect(robbery?.changePercent).toBe(0);
    expect(robbery?.hasBaseline).toBe(true);
  });

  it("returns null change and no baseline when the first half has no incidents", () => {
    const incidents = [
      makeIncident({ category: "Fraud", occurredAt: "2026-09-01T12:00:00+05:30" }),
    ];
    const rows = buildCategoryHalfComparison(incidents, RANGE);
    const fraud = rows.find((row) => row.category === "Fraud");
    expect(fraud?.first).toBe(0);
    expect(fraud?.second).toBe(1);
    expect(fraud?.changePercent).toBeNull();
    expect(fraud?.hasBaseline).toBe(false);
  });
});

describe("niceTicks", () => {
  it("covers the maximum value with a clean, integer top tick", () => {
    expect(niceTicks(70, 4)).toEqual([0, 20, 40, 60, 80]);
  });

  it("never produces sub-1 steps for small counts", () => {
    expect(niceTicks(1, 4)).toEqual([0, 1]);
    expect(niceTicks(0, 4)).toEqual([0]);
  });

  it("returns rounded values without floating point drift", () => {
    const ticks = niceTicks(243, 4);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(243);
    expect(ticks.every((tick) => Number.isInteger(tick))).toBe(true);
  });
});