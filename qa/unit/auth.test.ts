import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authenticate,
  clearSession,
  DEMO_CREDENTIALS,
  initialsFrom,
  readSession,
  registerUser,
  writeSession,
} from "../../src/auth/auth";

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

const VALID = {
  name: "Ravi Kumar",
  role: "Field Officer",
  stationName: "Central Precinct",
  deptId: "DEPT-0421",
  mobile: "+91 90000 12345",
  area: "Mission Street",
  email: "ravi.kumar@police.gov.in",
  password: "secret123",
};

beforeEach(() => {
  vi.stubGlobal("localStorage", makeStorage());
  vi.stubGlobal("sessionStorage", makeStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initialsFrom", () => {
  it("uses first and last name initials", () => {
    expect(initialsFrom("Ravi Kumar")).toBe("RK");
    expect(initialsFrom("Solo")).toBe("S");
    expect(initialsFrom("  ")).toBe("?");
  });
});

describe("authenticate", () => {
  it("accepts the demo account regardless of email casing", () => {
    const user = authenticate(DEMO_CREDENTIALS.email.toUpperCase(), DEMO_CREDENTIALS.password);
    expect(user?.deptId).toBe("DEPT-0001");
  });

  it("rejects wrong credentials", () => {
    expect(authenticate(DEMO_CREDENTIALS.email, "nope")).toBeNull();
  });
});

describe("registerUser", () => {
  it("rejects invalid input with a readable message", () => {
    expect("error" in registerUser({ ...VALID, name: "" })).toBe(true);
    expect("error" in registerUser({ ...VALID, mobile: "12" })).toBe(true);
    expect("error" in registerUser({ ...VALID, email: "bad" })).toBe(true);
    expect("error" in registerUser({ ...VALID, password: "123" })).toBe(true);
  });

  it("registers a new officer and then authenticates them", () => {
    const result = registerUser(VALID);
    if (!("user" in result)) throw new Error("expected successful registration");
    expect(result.user.initials).toBe("RK");
    expect(result.user.stationName).toBe("Central Precinct");

    const again = authenticate("ravi.kumar@police.gov.in", "secret123");
    expect(again?.deptId).toBe("DEPT-0421");
  });

  it("blocks duplicate email and department ID", () => {
    registerUser(VALID);
    expect("error" in registerUser(VALID)).toBe(true);
    expect("error" in registerUser({ ...VALID, email: "other@police.gov.in" })).toBe(true);
  });
});

describe("session helpers", () => {
  it("persists and clears the signed-in user", () => {
    const result = registerUser(VALID);
    if (!("user" in result)) throw new Error("expected successful registration");
    writeSession(result.user);
    expect(readSession()?.email).toBe(VALID.email);
    clearSession();
    expect(readSession()).toBeNull();
  });
});
