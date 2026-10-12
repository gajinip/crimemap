import { describe, expect, it } from "vitest";
import type { CrimeIncident, IncidentOffender } from "../../src/types";
import { offenderFor } from "../../src/utils/offender";

function incident(overrides: Partial<CrimeIncident>): CrimeIncident {
  return {
    id: "CRM-2026-0001",
    lat: 11.9,
    lng: 79.8,
    category: "Robbery",
    occurredAt: "2026-04-01T10:00:00+05:30",
    area: "Saram",
    description: "",
    status: "Reported",
    isDemo: true,
    ...overrides,
  };
}

describe("offenderFor", () => {
  it("returns an operator-entered offender verbatim", () => {
    const offender: IncidentOffender = {
      name: "R. Kumar",
      alias: "Cobra",
      age: 34,
      gender: "Male",
      status: "Wanted",
      description: "Sought for questioning.",
      isDemo: false,
    };
    expect(offenderFor(incident({ offender }))).toBe(offender);
  });

  it("returns null for non-demo records with no offender", () => {
    expect(offenderFor(incident({ isDemo: false }))).toBeNull();
  });

  it("is deterministic for a given demo id", () => {
    const first = offenderFor(incident({ id: "CRM-2026-0777" }));
    const second = offenderFor(incident({ id: "CRM-2026-0777" }));
    expect(second).toEqual(first);
  });

  it("produces a well-formed profile when one is available", () => {
    const sample = offenderFor(incident({ id: "CRM-2026-0999" }));
    if (sample) {
      expect(sample.isDemo).toBe(true);
      expect(sample.name.length).toBeGreaterThan(0);
      expect(["Male", "Female", "Other", "Unknown"]).toContain(sample.gender);
      expect(["Wanted", "Arrested", "Under Investigation", "Unknown"]).toContain(sample.status);
    }
  });
});
