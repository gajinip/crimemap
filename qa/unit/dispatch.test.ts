import { describe, expect, it } from "vitest";
import type { DisplayPatrolUnit } from "../../src/patrol/patrolStore";
import { findNearbyOfficers, isCriticalIncident } from "../../src/utils/dispatch";

function unit(id: string, lat: number, lng: number): DisplayPatrolUnit {
  return {
    id,
    callsign: id,
    lat,
    lng,
    displayLat: lat,
    displayLng: lng,
    status: "Patrolling",
    displayStatus: "Patrolling",
    progress: 0,
    etaMinutes: 5,
    stationId: "ST-01",
    stationName: "Station",
    zoneId: "RZ-01",
    zoneArea: "Area",
    route: [],
  } as DisplayPatrolUnit;
}

describe("dispatch", () => {
  it("flags only critical categories for immediate action", () => {
    expect(isCriticalIncident({ category: "Robbery" })).toBe(true);
    expect(isCriticalIncident({ category: "Theft" })).toBe(false);
    expect(isCriticalIncident({ category: "Other" })).toBe(false);
  });

  it("returns officers within the radius, nearest first", () => {
    const origin = { lat: 11.93, lng: 79.83 };
    const near = unit("PU-01", 11.935, 79.83); // ~0.5 km
    const far = unit("PU-02", 11.98, 79.83); // ~5.5 km
    const result = findNearbyOfficers(origin, [far, near], 3000);
    expect(result.map((entry) => entry.unit.id)).toEqual(["PU-01"]);
    expect(result[0].distanceMeters).toBeLessThan(1000);
  });

  it("returns an empty list when no officer is in range", () => {
    const origin = { lat: 11.93, lng: 79.83 };
    const far = unit("PU-09", 12.5, 80.3);
    expect(findNearbyOfficers(origin, [far], 1000)).toHaveLength(0);
  });
});
