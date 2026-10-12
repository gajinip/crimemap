import { describe, expect, it } from "vitest";
import type { AnalysisWindow, CrimeIncident, IncidentOffender } from "../../src/types";
import {
  computeLinkAnalysis,
  LINKAGE_MODEL_VERSION,
  LINK_MIN_SCORE,
  linksForIncident,
} from "../../src/analytics/linkage";

function incident(overrides: Partial<CrimeIncident>): CrimeIncident {
  return {
    id: "CRM-2026-0001",
    lat: 11.9,
    lng: 79.8,
    category: "Theft",
    occurredAt: "2026-04-01T10:00:00+05:30",
    area: "Saram",
    description: "Bicycle stolen from a locked compound.",
    status: "Reported",
    isDemo: true,
    ...overrides,
  };
}

function offender(name: string): IncidentOffender {
  return {
    name,
    alias: null,
    age: 30,
    gender: "Male",
    status: "Wanted",
    description: "Test suspect.",
    isDemo: false,
  };
}

const window: AnalysisWindow = {
  days: 30,
  recentFrom: new Date("2026-05-05T00:00:00+05:30").getTime(),
  recentTo: new Date("2026-05-15T00:00:00+05:30").getTime(),
  previousFrom: new Date("2026-04-05T00:00:00+05:30").getTime(),
  previousTo: new Date("2026-05-05T00:00:00+05:30").getTime(),
  recentLabel: "recent",
  previousLabel: "previous",
};

describe("computeLinkAnalysis", () => {
  it("links two incidents that name the same suspect", () => {
    const a = incident({ id: "CRM-A", offender: offender("R. Kumar") });
    const b = incident({
      id: "CRM-B",
      area: "White Town",
      lat: 12.6,
      lng: 80.4,
      occurredAt: "2026-05-20T10:00:00+05:30",
      offender: offender("R. Kumar"),
    });
    const result = computeLinkAnalysis([a, b]);
    expect(result.linkedPairs).toBe(1);
    expect(result.links[0].sharedOffender).toBe("r. kumar");
    expect(result.repeatSuspects.map((s) => s.name)).toContain("R. Kumar");
  });

  it("links incidents of the same type that are close in time and space", () => {
    const a = incident({ id: "CRM-A", lat: 11.9, lng: 79.8 });
    const b = incident({
      id: "CRM-B",
      lat: 11.9009,
      lng: 79.8,
      occurredAt: "2026-04-01T11:00:00+05:30",
    });
    const result = computeLinkAnalysis([a, b]);
    expect(result.links).toHaveLength(1);
    expect(result.links[0].score).toBeGreaterThanOrEqual(LINK_MIN_SCORE);
    expect(result.links[0].sameArea).toBe(true);
  });

  it("does not link unrelated incidents far apart in time and space", () => {
    const a = incident({ id: "CRM-A", category: "Theft", lat: 11.9, lng: 79.8 });
    const b = incident({
      id: "CRM-B",
      category: "Fraud",
      lat: 13.1,
      lng: 80.3,
      area: "Elsewhere",
      occurredAt: "2026-06-20T10:00:00+05:30",
    });
    const result = computeLinkAnalysis([a, b]);
    expect(result.linkedPairs).toBe(0);
    expect(result.links).toHaveLength(0);
  });

  it("flags past-vs-present links when a window is supplied", () => {
    const past = incident({
      id: "CRM-PAST",
      occurredAt: "2026-05-03T10:00:00+05:30",
    });
    const present = incident({
      id: "CRM-NOW",
      occurredAt: "2026-05-07T10:00:00+05:30",
    });
    const result = computeLinkAnalysis([past, present], { window });
    expect(result.links[0].crossWindow).toBe(true);
  });

  it("groups three or more linked incidents into a network", () => {
    const suspect = offender("S. Murugan");
    const a = incident({ id: "CRM-A", offender: suspect, lat: 11.9, lng: 79.8 });
    const b = incident({
      id: "CRM-B",
      offender: suspect,
      lat: 11.9009,
      lng: 79.8,
      occurredAt: "2026-04-01T12:00:00+05:30",
    });
    const c = incident({
      id: "CRM-C",
      offender: suspect,
      lat: 11.9018,
      lng: 79.8,
      occurredAt: "2026-04-01T13:00:00+05:30",
    });
    const result = computeLinkAnalysis([a, b, c]);
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].size).toBe(3);
    expect(result.clusters[0].sharedOffender).toBe("s. murugan");
  });

  it("is deterministic and reports its model version", () => {
    const incidents = [
      incident({ id: "CRM-A" }),
      incident({ id: "CRM-B", occurredAt: "2026-04-01T11:30:00+05:30" }),
    ];
    const first = computeLinkAnalysis(incidents, { generatedAt: "2026-01-01T00:00:00.000Z" });
    const second = computeLinkAnalysis(incidents, { generatedAt: "2026-01-01T00:00:00.000Z" });
    expect(first).toEqual(second);
    expect(first.modelVersion).toBe(LINKAGE_MODEL_VERSION);
  });

  it("returns an empty result for fewer than two incidents", () => {
    const result = computeLinkAnalysis([incident({ id: "CRM-A" })]);
    expect(result.links).toHaveLength(0);
    expect(result.clusters).toHaveLength(0);
    expect(result.scanned).toBe(1);
  });
});

describe("linksForIncident", () => {
  it("returns only the links touching the requested incident", () => {
    const a = incident({ id: "CRM-A" });
    const b = incident({ id: "CRM-B", occurredAt: "2026-04-01T11:00:00+05:30" });
    const c = incident({
      id: "CRM-C",
      lat: 13.1,
      lng: 80.3,
      area: "Elsewhere",
      occurredAt: "2026-07-01T11:00:00+05:30",
    });
    const result = computeLinkAnalysis([a, b, c]);
    const links = linksForIncident("CRM-A", result);
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => link.a === "CRM-A" || link.b === "CRM-A")).toBe(true);
  });
});
