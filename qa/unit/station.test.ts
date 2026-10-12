import { describe, expect, it } from "vitest";
import type { PoliceStation } from "../../src/types";
import { stationDetails } from "../../src/utils/station";

function station(overrides: Partial<PoliceStation> = {}): PoliceStation {
  return {
    id: "PS-01",
    name: "Mission Street Police Station",
    lat: 11.927,
    lng: 79.8325,
    area: "Mission Street",
    jurisdiction: ["Mission Street", "Muthialpet", "Saram"],
    isDemo: true,
    ...overrides,
  };
}

describe("stationDetails", () => {
  it("is deterministic for a given station id", () => {
    const first = stationDetails(station({ id: "PS-07" }));
    const second = stationDetails(station({ id: "PS-07" }));
    expect(second).toEqual(first);
  });

  it("derives different profiles for different stations", () => {
    expect(stationDetails(station({ id: "PS-01" }))).not.toEqual(
      stationDetails(station({ id: "PS-05" })),
    );
  });

  it("produces a well-formed demo profile", () => {
    const details = stationDetails(station());
    expect(details.officerInCharge.length).toBeGreaterThan(0);
    expect(details.phone).toMatch(/^\+91 413 \d{4} \d{4}$/);
    expect(details.address).toContain("Puducherry");
    expect(details.capacity).toBeGreaterThanOrEqual(20);
    expect(details.capacity).toBeLessThanOrEqual(80);
    expect(["Operational", "Limited Hours", "Under Maintenance"]).toContain(details.status);
    expect(details.openedYear).toBeGreaterThanOrEqual(1948);
    expect(details.openedYear).toBeLessThanOrEqual(2021);
  });
});
