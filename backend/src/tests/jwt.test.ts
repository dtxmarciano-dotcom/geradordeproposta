import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../utils/jwt";

describe("jwt utils", () => {
  it("signs and verifies a token round-trip", () => {
    const token = signToken({ id: "user-1", role: "admin" });
    const payload = verifyToken(token);

    expect(payload.id).toBe("user-1");
    expect(payload.role).toBe("admin");
  });

  it("throws when verifying a malformed token", () => {
    expect(() => verifyToken("not-a-valid-token")).toThrow();
  });

  it("throws when verifying a token signed with a different secret", () => {
    const jwt = require("jsonwebtoken");
    const badToken = jwt.sign({ id: "x", role: "user" }, "wrong-secret");
    expect(() => verifyToken(badToken)).toThrow();
  });
});
