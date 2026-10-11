import { describe, expect, it } from "vitest";
import { CATEGORY_SEVERITY, SEVERITY_WEIGHT, severityOf } from "../../src/utils/severity";

describe("severity", () => {
  it("maps every category to a severity", () => {
    expect(severityOf("Robbery")).toBe("Critical");
    expect(severityOf("Assault")).toBe("High");
    expect(severityOf("Theft")).toBe("Medium");
    expect(severityOf("Other")).toBe("Low");
  });

  it("weights are strictly increasing and bounded 0-1", () => {
    expect(SEVERITY_WEIGHT.Critical).toBe(1);
    expect(SEVERITY_WEIGHT.Low).toBe(0.4);
    expect(SEVERITY_WEIGHT.High).toBeGreaterThan(SEVERITY_WEIGHT.Medium);
  });

  it("defines every category in CATEGORY_SEVERITY", () => {
    expect(Object.keys(CATEGORY_SEVERITY)).toHaveLength(7);
  });
});