import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  addItemsHandler,
  compareListHandler,
  createListHandler,
  deleteItemHandler,
  deleteListHandler,
  getListHandler,
  listListsHandler,
  pdfListHandler,
  updateItemHandler,
  updateListHandler,
} from "../controllers/listController";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listListsHandler));
router.post("/", asyncHandler(createListHandler));
router.get("/:id", asyncHandler(getListHandler));
router.put("/:id", asyncHandler(updateListHandler));
router.delete("/:id", asyncHandler(deleteListHandler));

router.post("/:id/items", asyncHandler(addItemsHandler));
router.put("/:id/items/:itemId", asyncHandler(updateItemHandler));
router.delete("/:id/items/:itemId", asyncHandler(deleteItemHandler));

router.get("/:id/compare", asyncHandler(compareListHandler));
router.get("/:id/pdf", asyncHandler(pdfListHandler));

export default router;
