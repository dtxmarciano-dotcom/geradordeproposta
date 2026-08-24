import { Request, Response } from "express";
import { z } from "zod";
import {
  attachSupermarketLogo,
  editSupermarket,
  getSupermarkets,
  importProductsFromFile,
  registerSupermarket,
  removeSupermarket,
  SupermarketNotFoundError,
} from "../services/supermarketService";
import { MissingColumnsError } from "../utils/spreadsheetParser";
import { env } from "../config/env";

function buildPublicUrl(req: Request, relativePath: string): string {
  // Em produção, força https mesmo que req.protocol venha errado por algum
  // detalhe do proxy — evita gerar URL http:// que o navegador bloqueia como
  // conteúdo misto numa página https (ex: frontend na Vercel).
  const protocol = env.nodeEnv === "production" ? "https" : req.protocol;
  const base = env.publicUrl ?? `${protocol}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}${relativePath}`;
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  unit_name: z.string().trim().min(1, "Unidade é obrigatória"),
  // MVP: apenas URL de string. Upload real de arquivo de logo fica como TODO
  // (armazenamento em disco/bucket) para uma etapa futura.
  logo_url: z.string().trim().url().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  unit_name: z.string().trim().min(1).optional(),
  logo_url: z.string().trim().url().optional().nullable(),
});

export async function listSupermarketsHandler(_req: Request, res: Response): Promise<void> {
  const supermarkets = await getSupermarkets();
  res.status(200).json({ supermarkets });
}

export async function createSupermarketHandler(req: Request, res: Response): Promise<void> {
  const parseResult = createSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }

  const adminId = req.auth!.id;
  const { name, unit_name, logo_url } = parseResult.data;

  const supermarket = await registerSupermarket({
    name,
    unitName: unit_name,
    logoUrl: logo_url ?? null,
    createdBy: adminId,
  });

  res.status(201).json({ supermarket });
}

export async function updateSupermarketHandler(req: Request, res: Response): Promise<void> {
  const parseResult = updateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input", details: parseResult.error.flatten() });
    return;
  }

  try {
    const supermarket = await editSupermarket(req.params.id, {
      name: parseResult.data.name,
      unitName: parseResult.data.unit_name,
      logoUrl: parseResult.data.logo_url,
    });
    res.status(200).json({ supermarket });
  } catch (error) {
    if (error instanceof SupermarketNotFoundError) {
      res.status(404).json({ error: "Supermarket not found" });
      return;
    }
    throw error;
  }
}

export async function deleteSupermarketHandler(req: Request, res: Response): Promise<void> {
  try {
    await removeSupermarket(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof SupermarketNotFoundError) {
      res.status(404).json({ error: "Supermarket not found" });
      return;
    }
    throw error;
  }
}

export async function uploadLogoHandler(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded. Send a multipart field named 'file'." });
    return;
  }

  try {
    const logoUrl = buildPublicUrl(req, `/uploads/logos/${file.filename}`);
    const supermarket = await attachSupermarketLogo(req.params.id, logoUrl);
    res.status(200).json({ supermarket });
  } catch (error) {
    if (error instanceof SupermarketNotFoundError) {
      res.status(404).json({ error: "Supermarket not found" });
      return;
    }
    throw error;
  }
}

export async function uploadProductsHandler(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded. Send a multipart field named 'file'." });
    return;
  }

  try {
    const result = await importProductsFromFile(req.params.id, {
      buffer: file.buffer,
      originalname: file.originalname,
    });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof SupermarketNotFoundError) {
      res.status(404).json({ error: "Supermarket not found" });
      return;
    }
    if (error instanceof MissingColumnsError) {
      res.status(400).json({
        error: "A planilha está com colunas obrigatórias ausentes",
        missing: error.missing,
      });
      return;
    }
    throw error;
  }
}
