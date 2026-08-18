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
import {
  createUserHandler,
  deleteUserHandler,
  listUsersHandler,
  updateUserHandler,
} from "../controllers/userController";

const router = Router();

router.use(authenticate, requireRole("admin"));

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

router.get("/users", asyncHandler(listUsersHandler));
router.post("/users", asyncHandler(createUserHandler));
router.put("/users/:id", asyncHandler(updateUserHandler));
router.delete("/users/:id", asyncHandler(deleteUserHandler));

export default router;
