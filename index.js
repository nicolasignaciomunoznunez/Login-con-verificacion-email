import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

// CORRECCIÓN: Importar testConnection en lugar de connectDB
import { testConnection } from "./db/connectDB.js";

import authRoutes from "./routes/authRoutes.js";
import plantaRoutes from "./routes/plantaRoutes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies

app.use("/api/auth", authRoutes);
app.use("/api/planta", plantaRoutes);

// SERVIR LANDING PAGE EN DESARROLLO
if (process.env.NODE_ENV === "development") {
	// Servir los archivos estáticos de la landing page
	app.use(express.static(path.join(__dirname, "frontend/landing")));
	
	// Para cualquier ruta que no sea /api, servir la landing page
	app.get(/^\/(?!api).*/, (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "landing", "index.html"));
	});
}

// SERVIR APP EN PRODUCCIÓN
if (process.env.NODE_ENV === "production") {
	// Primero intenta servir archivos estáticos de la landing
	app.use(express.static(path.join(__dirname, "frontend/landing")));
	
	// Si no encuentra en landing, busca en dist (tu app React principal)
	app.use(express.static(path.join(__dirname, "frontend/dist")));

	// Para rutas API, manejar normalmente
	app.get("/api/*", (req, res, next) => next());
	
	// Para todas las demás rutas, servir la landing page como principal
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "landing", "index.html"));
	});
}

// CORRECCIÓN: Usar testConnection y hacerlo async/await
app.listen(PORT, async () => {
	try {
		await testConnection();
		console.log("✅ Server is running on port: ", PORT);
		console.log("🌍 Environment: ", process.env.NODE_ENV || "development");
	} catch (error) {
		console.error("❌ Error starting server:", error);
	}
});