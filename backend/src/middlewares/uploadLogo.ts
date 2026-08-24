import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const LOGOS_DIR = path.join(process.cwd(), "uploads", "logos");
fs.mkdirSync(LOGOS_DIR, { recursive: true });

// MVP: armazenamento em disco local, conforme permitido pelo documento técnico.
// Em plataformas com disco efêmero (ex: Render free tier), o arquivo pode ser
// perdido em um novo deploy/restart — migrar para um bucket S3-compatível
// é o próximo passo natural fora do escopo do MVP.
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, LOGOS_DIR),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${req.params.id}-${crypto.randomUUID()}${extension}`;
    callback(null, uniqueName);
  },
});

export const uploadLogo = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new Error("Tipo de arquivo não suportado. Use PNG, JPG, WEBP ou SVG."));
      return;
    }
    callback(null, true);
  },
}).single("file");
