import express from 'express';
import { PlantController } from '../controllers/plantController.js';

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas de plantas
router.get('/', PlantController.getUserPlants);
router.get('/with-latest-data', PlantController.getPlantsWithLatestData);
router.get('/:id', PlantController.getPlantById);
router.get('/:id/stats', PlantController.getPlantStats);
router.post('/', PlantController.createPlant);
router.put('/:id', PlantController.updatePlant);

export default router;