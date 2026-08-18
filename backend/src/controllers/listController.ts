import { Request, Response } from "express";
import { z } from "zod";
import {
  addItems,
  compareList,
  createListForUser,
  editItem,
  getListDetail,
  getListsForUser,
  ItemNotFoundError,
  ListNotFoundError,
  removeItem,
  removeList,
  renameList,
} from "../services/listService";
import { generateComparisonPdf } from "../utils/pdfGenerator";

const createListSchema = z.object({
  title: z.string().trim().min(1).optional(),
});

const updateListSchema = z.object({
  title: z.string().trim().min(1, "Nome é obrigatório"),
});

const itemSchema = z.object({
  product_name: z.string().trim().min(1, "Nome do produto é obrigatório"),
  quantity: z.coerce.number().positive().optional(),
});

const addItemsSchema = z.union([itemSchema, z.array(itemSchema).min(1)]);

const updateItemSchema = z.object({
  product_name: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().positive().optional(),
});

function handleNotFound(error: unknown, res: Response): boolean {
  if (error instanceof ListNotFoundError || error instanceof ItemNotFoundError) {
    res.status(404).json({ error: "Lista não encontrada" });
    return true;
  }
  return false;
}

export async function listListsHandler(req: Request, res: Response): Promise<void> {
  const lists = await getListsForUser(req.auth!.id);
  res.status(200).json({ lists });
}

export async function createListHandler(req: Request, res: Response): Promise<void> {
  const parseResult = createListSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }
  const list = await createListForUser(req.auth!.id, parseResult.data.title ?? null);
  res.status(201).json({ list });
}

export async function getListHandler(req: Request, res: Response): Promise<void> {
  try {
    const { list, items } = await getListDetail(req.params.id, req.auth!.id);
    res.status(200).json({ list, items });
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}

export async function updateListHandler(req: Request, res: Response): Promise<void> {
  const parseResult = updateListSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }
  try {
    const list = await renameList(req.params.id, req.auth!.id, parseResult.data.title);
    res.status(200).json({ list });
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}

export async function deleteListHandler(req: Request, res: Response): Promise<void> {
  try {
    await removeList(req.params.id, req.auth!.id);
    res.status(204).send();
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}

export async function addItemsHandler(req: Request, res: Response): Promise<void> {
  const parseResult = addItemsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }
  try {
    const items = await addItems(req.params.id, req.auth!.id, parseResult.data);
    res.status(201).json({ items });
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}

export async function updateItemHandler(req: Request, res: Response): Promise<void> {
  const parseResult = updateItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }
  try {
    const item = await editItem(req.params.id, req.auth!.id, req.params.itemId, parseResult.data);
    res.status(200).json({ item });
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}

export async function deleteItemHandler(req: Request, res: Response): Promise<void> {
  try {
    await removeItem(req.params.id, req.auth!.id, req.params.itemId);
    res.status(204).send();
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}

export async function compareListHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await compareList(req.params.id, req.auth!.id);
    res.status(200).json(result);
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "lista";
}

export async function pdfListHandler(req: Request, res: Response): Promise<void> {
  try {
    const { list } = await getListDetail(req.params.id, req.auth!.id);
    const result = await compareList(req.params.id, req.auth!.id);
    const title = list.title || "Lista de compras";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vantta-${slugify(title)}.pdf"`
    );

    const doc = generateComparisonPdf(title, result);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    if (handleNotFound(error, res)) return;
    throw error;
  }
}
