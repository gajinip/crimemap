import { describe, expect, it } from "vitest";
import type { GeoLinearRing } from "../../src/utils/geo";
import {
  centroid,
  geometryBounds,
  haversineMeters,
  isValidBoundaryGeometry,
  lerpPoint,
  maxDistanceMeters,
  pointInBoundary,
  pointInRing,
  ringSignedArea,
  ringToLatLng,
} from "../../src/utils/geo";

describe("geo", () => {
  it("haversine returns 0 for the same point", () => {
    expect(haversineMeters({ lat: 26.85, lng: 80.94 }, { lat: 26.85, lng: 80.94 })).toBe(0);
  });

  it("haversine approximates one kilometre east at Lucknow latitude", () => {
    const distance = haversineMeters({ lat: 26.85, lng: 80.94 }, { lat: 26.85, lng: 80.950069 });
    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1100);
  });

  it("centroid returns null for an empty list", () => {
    expect(centroid([])).toBeNull();
  });

  it("centroid averages the inputs", () => {
    const result = centroid([
      { lat: 0, lng: 10 },
      { lat: 2, lng: 20 },
    ]);
    expect(result).toEqual({ lat: 1, lng: 15 });
  });

  it("maxDistanceMeters is symmetric with haversine", () => {
    const origin = { lat: 26.85, lng: 80.94 };
    const points = [
      { lat: 26.8501, lng: 80.94 },
      { lat: 26.851, lng: 80.95 },
    ];
    expect(maxDistanceMeters(origin, points)).toBeCloseTo(haversineMeters(origin, points[1]), 6);
  });

  it("lerpPoint clamps t outside [0,1]", () => {
    expect(lerpPoint({ lat: 0, lng: 0 }, { lat: 10, lng: 10 }, -1)).toEqual({ lat: 0, lng: 0 });
    expect(lerpPoint({ lat: 0, lng: 0 }, { lat: 10, lng: 10 }, 5)).toEqual({ lat: 10, lng: 10 });
    expect(lerpPoint({ lat: 0, lng: 0 }, { lat: 10, lng: 10 }, 0.5)).toEqual({ lat: 5, lng: 5 });
  });

  const square: GeoLinearRing = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ];

  it("ringSignedArea magnitude is the polygon area and reversing flips the sign", () => {
    const area = ringSignedArea(square);
    expect(Math.abs(area)).toBeCloseTo(100);
    expect(ringSignedArea([...square].reverse())).toBeCloseTo(-area);
  });

  it("pointInRing honours the ray-cast rule", () => {
    expect(pointInRing({ lat: 5, lng: 5 }, square)).toBe(true);
    expect(pointInRing({ lat: 15, lng: 15 }, square)).toBe(false);
  });

  it("pointInBoundary treats holes as outside", () => {
    const withHole = {
      type: "Polygon" as const,
      coordinates: [square, [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]]],
    };
    expect(pointInBoundary({ lat: 5, lng: 5 }, withHole)).toBe(false);
    expect(pointInBoundary({ lat: 2, lng: 2 }, withHole)).toBe(true);
  });

  it("geometryBounds returns south/west/north/east", () => {
    expect(geometryBounds({ type: "Polygon", coordinates: [square] })).toEqual({
      south: 0,
      west: 0,
      north: 10,
      east: 10,
    });
  });

  it("isValidBoundaryGeometry requires closed rings of >=4 vertices", () => {
    const second = [
      [20, 20],
      [22, 20],
      [22, 22],
      [20, 22],
      [20, 20],
    ] as GeoLinearRing;
    expect(isValidBoundaryGeometry({ type: "Polygon", coordinates: [square] })).toBe(true);
    expect(
      isValidBoundaryGeometry({ type: "MultiPolygon", coordinates: [[square], [second]] }),
    ).toBe(true);
    expect(
      isValidBoundaryGeometry({
        type: "Polygon",
        coordinates: [[[0, 0], [1, 1], [0, 2], [0, 0]]],
      }),
    ).toBe(true);
    expect(
      isValidBoundaryGeometry({
        type: "Polygon",
        coordinates: [[[0, 0], [1, 1], [0, 2]]],
      }),
    ).toBe(false);
  });

  it("ringToLatLng swaps to [lat, lng] for Leaflet", () => {
    expect(ringToLatLng([[80.94, 26.85]])).toEqual([[26.85, 80.94]]);
  });
});