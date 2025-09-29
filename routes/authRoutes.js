import express from "express";
import {
	login,
	logout,
	signup,
	verifyEmail,
	forgotPassword,
	resetPassword,
	checkAuth,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Ruta para verificar autenticación (protegida)
router.get("/check-auth", verifyToken, checkAuth);

// Rutas de autenticación públicas
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Rutas de verificación y recuperación
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;