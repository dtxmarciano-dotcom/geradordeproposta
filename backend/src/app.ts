import path from "path";
import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import listRoutes from "./routes/listRoutes";

export function createApp(): Express {
  const app = express();

  // Necessário para req.protocol refletir "https" corretamente atrás do
  // proxy reverso de plataformas como o Render.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // Sem isso, o CORP padrão do helmet bloqueia o frontend (outra origem)
      // de carregar as imagens de logo servidas por /uploads.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: env.corsOrigin,
    })
  );
  app.use(express.json());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/admin", adminRoutes);
  app.use("/lists", listRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
