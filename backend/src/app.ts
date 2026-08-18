import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import listRoutes from "./routes/listRoutes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
    })
  );
  app.use(express.json());

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
