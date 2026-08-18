import { describe, it, expect, vi } from "vitest";
import { Request, Response } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/requireRole";
import { signToken } from "../utils/jwt";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("authenticate middleware", () => {
  it("rejects requests without an Authorization header", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid token", () => {
    const req = { headers: { authorization: "Bearer invalid-token" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid token and attaches auth payload", () => {
    const token = signToken({ id: "u1", role: "user" });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.auth).toEqual(expect.objectContaining({ id: "u1", role: "user" }));
  });
});

describe("requireRole middleware", () => {
  it("blocks when auth is missing", () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks when role does not match", () => {
    const req = { auth: { id: "u1", role: "user" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows when role matches", () => {
    const req = { auth: { id: "u1", role: "admin" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
