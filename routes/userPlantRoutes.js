import express from 'express';
import { UserPlantController } from '../controllers/userPlantController.js';
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();

router.use(verifyToken);

// Obtener plantas del usuario actual
router.get('/my-plants', UserPlantController.getUserPlants);

// Gestión de usuarios en plantas
router.post('/:plantId/users', UserPlantController.assignUserToPlant);
router.get('/:plantId/users', UserPlantController.getPlantUsers);
router.put('/:plantId/users/:assignmentId', UserPlantController.updateUserRole);
router.delete('/:plantId/users/:assignmentId', UserPlantController.removeUserFromPlant);

export default router;