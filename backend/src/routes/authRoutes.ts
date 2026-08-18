import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginHandler, logoutHandler } from "../controllers/authController";

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

router.post("/login", loginRateLimiter, loginHandler);
router.post("/logout", logoutHandler);

export default router;
