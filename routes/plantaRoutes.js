import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createPlantData,
  getMyPlantData,
  getLatestPlantData,
  getPlantDataByDateRange,
  updatePlantData,
  deletePlantData,
  getPlantStats
} from "../controllers/plantaController.js";

const router = express.Router();

// Crear un nuevo dato
router.post("/", verifyToken, createPlantData);

// Obtener datos (con paginación y filtros)
router.get("/", verifyToken, getMyPlantData);

// Último dato
router.get("/latest", verifyToken, getLatestPlantData);

// Estadísticas
router.get("/stats", verifyToken, getPlantStats);

// Datos por rango de fechas (query params)
router.get("/range", verifyToken, getPlantDataByDateRange);

// Actualizar dato
router.put("/:id", verifyToken, updatePlantData);

// Eliminar dato
router.delete("/:id", verifyToken, deletePlantData);

export default router;
