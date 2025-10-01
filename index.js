import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { testConnection } from "./db/connectDB.js";

import authRoutes from "./routes/authRoutes.js";
import plantaRoutes from "./routes/plantaRoutes.js";
import plantRoutes from "./routes/plantRoutes.js"; // Nuevo
import userPlantRoutes from "./routes/userPlantRoutes.js"; // Nuevo

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/planta", plantaRoutes);
app.use("/api/plants", plantRoutes); // Nuevo
app.use("/api/user-plants", userPlantRoutes); // Nuevo

// SERVIR LANDING PAGE EN DESARROLLO
if (process.env.NODE_ENV === "development") {
    app.use(express.static(path.join(__dirname, "frontend/landing")));
    
    app.get(/^\/(?!api).*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "landing", "index.html"));
    });
}

// SERVIR APP EN PRODUCCIÓN
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "frontend/landing")));
    app.use(express.static(path.join(__dirname, "frontend/dist")));

    app.get("/api/*", (req, res, next) => next());
    
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "landing", "index.html"));
    });
}

app.listen(PORT, async () => {
    try {
        await testConnection();
        console.log("✅ Server is running on port: ", PORT);
        console.log("🌍 Environment: ", process.env.NODE_ENV || "development");
        console.log("🚀 API Routes loaded:");
        console.log("   - /api/auth");
        console.log("   - /api/planta"); 
        console.log("   - /api/plants");
        console.log("   - /api/user-plants");
    } catch (error) {
        console.error("❌ Error starting server:", error);
    }
});