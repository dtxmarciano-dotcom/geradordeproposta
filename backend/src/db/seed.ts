import bcrypt from "bcrypt";
import { pool } from "./pool";
import { env } from "../config/env";
import { findUserByEmail, createUser } from "../repositories/userRepository";

async function run(): Promise<void> {
  const existing = await findUserByEmail(env.seedAdminEmail);
  if (existing) {
    console.log(`Admin user already exists: ${env.seedAdminEmail}`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 10);
  const user = await createUser({
    name: env.seedAdminName,
    email: env.seedAdminEmail,
    passwordHash,
    role: "admin",
  });

  console.log(`Admin user created: ${user.email}`);
  await pool.end();
}

run().catch((error) => {
  console.error("seed failed:", error);
  process.exit(1);
});
