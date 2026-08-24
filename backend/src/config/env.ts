import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),
  seedAdminName: process.env.SEED_ADMIN_NAME ?? "Admin",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@vantta.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "admin12345",
  // Base pública da API, usada para montar a URL absoluta de arquivos enviados
  // (ex: logo). Se ausente, é derivada da própria requisição (protocol + host).
  publicUrl: process.env.PUBLIC_URL,
};
