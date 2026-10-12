import { describe, expect, it } from "vitest";
import { buildCategoryDetail } from "../../src/utils/categoryInsights";
import { makeIncident } from "./helpers";

const RANGE_30D = { from: "2026-09-09", to: "2026-10-08" };
const FULL_RANGE = { from: "2026-04-01", to: "2026-10-08" };

describe("buildCategoryDetail", () => {
  it("aggregates totals, period change, areas and case status", () => {
    const incidents = [
      // Two recent Thefts (in window), one in the previous window.
      makeIncident({ category: "Theft", area: "Area A", occurredAt: "2026-10-06T09:00:00+05:30" }),
      makeIncident({ category: "Theft", area: "Area A", occurredAt: "2026-10-06T21:00:00+05:30" }),
      makeIncident({
        category: "Theft",
        area: "Area B",
        status: "Closed",
        occurredAt: "2026-08-20T12:00:00+05:30",
      }),
    ];

    const detail = buildCategoryDetail(incidents, "Theft", RANGE_30D);

    expect(detail.total).toBe(3);
    expect(detail.current).toBe(2);
    expect(detail.previous).toBe(1);
    expect(detail.hasBaseline).toBe(true);
    expect(detail.changePercent).toBe(100);

    expect(detail.areas[0]).toEqual({ name: "Area A", count: 2, share: 66.7 });
    expect(detail.topArea?.name).toBe("Area A");
    expect(detail.lowestArea?.name).toBe("Area B");

    expect(detail.pending).toBe(2);
    expect(detail.cleared).toBe(1);
  });

  it("buckets weekday and hour using IST timestamps", () => {
    const incidents = [
      makeIncident({ category: "Theft", occurredAt: "2026-10-06T09:00:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-10-06T21:00:00+05:30" }),
    ];

    const detail = buildCategoryDetail(incidents, "Theft", RANGE_30D);

    const tuesday = detail.byDay.find((bucket) => bucket.label === "Tue");
    expect(tuesday?.count).toBe(2);
    expect(detail.peakDay?.label).toBe("Tue");
    expect(detail.peakHour?.count).toBe(1);
  });

  it("computes the category share of all filtered incidents", () => {
    const incidents = [
      makeIncident({ category: "Theft" }),
      makeIncident({ category: "Robbery" }),
      makeIncident({ category: "Robbery" }),
      makeIncident({ category: "Fraud" }),
    ];

    const detail = buildCategoryDetail(incidents, "Theft", FULL_RANGE);
    expect(detail.overallShare).toBe(25);
  });

  it("returns empty structures when the category has no incidents", () => {
    const incidents = [makeIncident({ category: "Robbery" })];
    const detail = buildCategoryDetail(incidents, "Theft", FULL_RANGE);

    expect(detail.total).toBe(0);
    expect(detail.overallShare).toBe(0);
    expect(detail.areas).toHaveLength(0);
    expect(detail.topArea).toBeNull();
    expect(detail.peakDay).toBeNull();
    expect(detail.peakHour).toBeNull();
  });
});
