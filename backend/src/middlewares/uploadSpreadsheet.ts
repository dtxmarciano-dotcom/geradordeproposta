import multer from "multer";

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// MVP: buffer in memory, never written to disk. Fine at this file size cap.
export const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      callback(new Error("Unsupported file type. Use .csv, .xlsx or .xls"));
      return;
    }
    callback(null, true);
  },
}).single("file");
