import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.use(authenticate);

function notImplemented(_req: Request, res: Response): void {
  res.status(501).json({ error: "Not implemented yet" });
}

router.get("/", notImplemented);
router.post("/", notImplemented);
router.get("/:id", notImplemented);
router.put("/:id", notImplemented);
router.delete("/:id", notImplemented);
router.get("/:id/compare", notImplemented);

export default router;
