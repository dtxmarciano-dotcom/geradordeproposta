import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user";

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (req.auth.role !== role) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
