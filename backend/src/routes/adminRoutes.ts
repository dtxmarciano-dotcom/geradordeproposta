import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/requireRole";
import { uploadSpreadsheet } from "../middlewares/uploadSpreadsheet";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createSupermarketHandler,
  deleteSupermarketHandler,
  listSupermarketsHandler,
  updateSupermarketHandler,
  uploadProductsHandler,
} from "../controllers/supermarketController";

const router = Router();

router.use(authenticate, requireRole("admin"));

function notImplemented(_req: Request, res: Response): void {
  res.status(501).json({ error: "Not implemented yet" });
}

function handleUploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  uploadSpreadsheet(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Upload error" });
      return;
    }
    next();
  });
}

router.get("/supermarkets", asyncHandler(listSupermarketsHandler));
router.post("/supermarkets", asyncHandler(createSupermarketHandler));
router.put("/supermarkets/:id", asyncHandler(updateSupermarketHandler));
router.delete("/supermarkets/:id", asyncHandler(deleteSupermarketHandler));
router.post(
  "/supermarkets/:id/products/upload",
  handleUploadMiddleware,
  asyncHandler(uploadProductsHandler)
);

router.get("/users", notImplemented);
router.put("/users/:id", notImplemented);

export default router;
