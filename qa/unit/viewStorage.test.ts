import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readView, writeView } from "../../src/utils/viewStorage";

/** Minimal in-memory Storage so the module's browser calls work under node. */
function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
  };
}

describe("viewStorage", () => {
  const original = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
    (globalThis as { window?: unknown }).window = { localStorage: makeStorage() };
  });

  afterEach(() => {
    (globalThis as { window?: unknown }).window = original;
  });

  it("defaults to the map when nothing is stored", () => {
    expect(readView()).toBe("map");
  });

  it("round-trips a valid view", () => {
    writeView("trends");
    expect(readView()).toBe("trends");
  });

  it("falls back to the map for an unknown stored value", () => {
    (globalThis as { window: { localStorage: Storage } }).window.localStorage.setItem(
      "crimemap.view",
      "not-a-view",
    );
    expect(readView()).toBe("map");
  });
});
