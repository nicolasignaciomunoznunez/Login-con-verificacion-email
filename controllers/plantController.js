import { Plant } from '../models/plantModel.js';

export class PlantController {
    // Obtener todas las plantas del usuario
    static async getUserPlants(req, res) {
        try {
            const userId = req.user.id; // Asumiendo que tienes autenticación
            const plants = await Plant.findByUserId(userId);
            res.json({ success: true, data: plants });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener plantas',
                error: error.message 
            });
        }
    }

    // Obtener planta por ID
    static async getPlantById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            // Verificar acceso
            const hasAccess = await Plant.userHasAccess(userId, id);
            if (!hasAccess) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tienes acceso a esta planta' 
                });
            }
            
            const plant = await Plant.findById(id);
            if (!plant) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Planta no encontrada' 
                });
            }
            
            res.json({ success: true, data: plant });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener planta',
                error: error.message 
            });
        }
    }

    // Crear nueva planta
    static async createPlant(req, res) {
        try {
            const plantData = req.body;
            const userId = req.user.id;
            
            const newPlant = await Plant.create(plantData);
            
            // Asignar usuario como owner
            await Plant.assignUser(newPlant.id, userId, 'owner');
            
            res.status(201).json({ 
                success: true, 
                message: 'Planta creada exitosamente',
                data: newPlant 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error al crear planta',
                error: error.message 
            });
        }
    }

    // Actualizar planta
    static async updatePlant(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = req.user.id;
            
            // Verificar acceso y rol
            const userRole = await Plant.getUserRole(userId, id);
            if (!userRole || !['owner', 'admin'].includes(userRole)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tienes permisos para editar esta planta' 
                });
            }
            
            const updatedPlant = await Plant.update(id, updateData);
            res.json({ 
                success: true, 
                message: 'Planta actualizada exitosamente',
                data: updatedPlant 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error al actualizar planta',
                error: error.message 
            });
        }
    }

    // Obtener plantas con últimos datos
    static async getPlantsWithLatestData(req, res) {
        try {
            const userId = req.user.id;
            const plants = await Plant.findWithLatestData(userId);
            res.json({ success: true, data: plants });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener plantas',
                error: error.message 
            });
        }
    }

    // Obtener estadísticas de planta
    static async getPlantStats(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const hasAccess = await Plant.userHasAccess(userId, id);
            if (!hasAccess) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tienes acceso a esta planta' 
                });
            }
            
            const stats = await Plant.getStats(id);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error al obtener estadísticas',
                error: error.message 
            });
        }
    }
}

export default PlantController;