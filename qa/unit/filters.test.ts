import { describe, expect, it } from "vitest";
import {
  applyContextFilters,
  applyCrimeFilters,
  countByCategory,
  filterRiskZones,
  timePresets,
  withinDateRange,
} from "../../src/utils/filters";
import { defaultFilters, makeIncident, makeZone } from "./helpers";

describe("filters", () => {
  it("withinDateRange compares against the +05:30 day bounds", () => {
    expect(withinDateRange("2026-10-05T21:30:00+05:30", { from: "2026-10-01", to: "2026-10-08" })).toBe(true);
    expect(withinDateRange("2026-09-30T23:00:00+05:30", { from: "2026-10-01", to: "2026-10-08" })).toBe(false);
    expect(withinDateRange("2026-10-09T00:00:00+05:30", { from: "2026-10-01", to: "2026-10-08" })).toBe(false);
  });

  it("applyContextFilters narrows by area, category and search", () => {
    const incidents = [
      makeIncident({ id: "I-1", area: "Area A", category: "Theft", description: "phone" }),
      makeIncident({ id: "I-2", area: "Area B", category: "Robbery", description: "bike" }),
      makeIncident({ id: "I-3", area: "Area A", category: "Assault", description: "scuffle" }),
    ];
    const areaFiltered = applyContextFilters(incidents, defaultFilters({ area: "Area A" }));
    expect(areaFiltered.map((i) => i.id)).toEqual(["I-1", "I-3"]);

    const categoryFiltered = applyContextFilters(
      incidents,
      defaultFilters({ categories: ["Theft"] }),
    );
    expect(categoryFiltered.map((i) => i.id)).toEqual(["I-1"]);

    const searched = applyContextFilters(incidents, defaultFilters({ searchQuery: "bike" }));
    expect(searched.map((i) => i.id)).toEqual(["I-2"]);
  });

  it("severity filter uses the category->severity map", () => {
    const theft = makeIncident({ category: "Theft" });
    const kept = applyContextFilters([theft], defaultFilters({ severities: ["Medium"] }));
    const dropped = applyContextFilters([theft], defaultFilters({ severities: ["Critical"] }));
    expect(kept).toHaveLength(1);
    expect(dropped).toHaveLength(0);
  });

  it("applyCrimeFilters also excludes incidents outside the date range", () => {
    const incidents = [
      makeIncident({ id: "I-1", occurredAt: "2026-10-05T21:00:00+05:30" }),
      makeIncident({ id: "I-2", occurredAt: "2026-03-01T21:00:00+05:30" }),
    ];
    const result = applyCrimeFilters(incidents, defaultFilters({ dateRange: { from: "2026-04-01", to: "2026-10-08" } }));
    expect(result.map((i) => i.id)).toEqual(["I-1"]);
  });

  it("filterRiskZones applies risk level, area and free text", () => {
    const zones = [
      makeZone({ id: "Z-1", area: "Area A", riskLevel: "High", dominantCrime: "Theft" }),
      makeZone({ id: "Z-2", area: "Area B", riskLevel: "Low", dominantCrime: "Fraud" }),
    ];
    expect(filterRiskZones(zones, defaultFilters({ riskLevels: ["High"] })).map((z) => z.id)).toEqual(["Z-1"]);
    expect(filterRiskZones(zones, defaultFilters({ area: "Area B" })).map((z) => z.id)).toEqual(["Z-2"]);
    expect(filterRiskZones(zones, defaultFilters({ searchQuery: "theft" })).map((z) => z.id)).toEqual(["Z-1"]);
  });

  it("countByCategory tallies within the date range", () => {
    const incidents = [
      makeIncident({ category: "Theft", occurredAt: "2026-10-05T21:00:00+05:30" }),
      makeIncident({ category: "Theft", occurredAt: "2026-05-05T21:00:00+05:30" }),
      makeIncident({ category: "Robbery", occurredAt: "2026-10-06T21:00:00+05:30" }),
    ];
    const counts = countByCategory(incidents, defaultFilters());
    expect(counts.Theft).toBe(2);
    expect(counts.Robbery).toBe(1);
  });

  it("timePresets runs from the dataset end date", () => {
    const presets = timePresets();
    expect(presets).toHaveLength(5);
    expect(presets[0].range.to).toBe("2026-10-08");
    expect(presets[4].range.from).toBe("2026-04-01");
    expect(presets[1].days).toBe(7);
    expect(presets[4].days).toBeNull();
  });
});