import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.use(authenticate, requireRole("admin"));

function notImplemented(_req: Request, res: Response): void {
  res.status(501).json({ error: "Not implemented yet" });
}

router.get("/supermarkets", notImplemented);
router.post("/supermarkets", notImplemented);
router.put("/supermarkets/:id", notImplemented);
router.delete("/supermarkets/:id", notImplemented);
router.post("/supermarkets/:id/products", notImplemented);

router.get("/users", notImplemented);
router.put("/users/:id", notImplemented);

export default router;
