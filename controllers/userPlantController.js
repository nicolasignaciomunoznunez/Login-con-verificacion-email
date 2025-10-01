import { UserPlant } from '../models/userPlantModel.js';


export class UserPlantController {
    // Asignar usuario a planta
    static async assignUserToPlant(req, res) {
        try {
            const { plantId } = req.params;
            const { userId, role } = req.body;
            const currentUserId = req.user.id;

            // Verificar que el usuario actual es owner/admin de la planta
            const currentUserRole = await UserPlant.getUserRole(currentUserId, plantId);
            if (!['owner', 'admin'].includes(currentUserRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para asignar usuarios a esta planta'
                });
            }

            const assignment = await UserPlant.create(userId, plantId, role);
            res.status(201).json({
                success: true,
                message: 'Usuario asignado exitosamente',
                data: assignment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al asignar usuario',
                error: error.message
            });
        }
    }

    // Obtener usuarios de una planta
    static async getPlantUsers(req, res) {
        try {
            const { plantId } = req.params;
            const userId = req.user.id;

            // Verificar acceso
            const hasAccess = await UserPlant.userHasAccess(userId, plantId);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes acceso a esta planta'
                });
            }

            const users = await UserPlant.findByPlantId(plantId);
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    }

    // Obtener plantas de un usuario
    static async getUserPlants(req, res) {
        try {
            const userId = req.user.id;
            const plants = await UserPlant.findByUserId(userId);
            
            res.json({
                success: true,
                data: plants
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener plantas',
                error: error.message
            });
        }
    }

    // Actualizar rol de usuario en planta
    static async updateUserRole(req, res) {
        try {
            const { plantId, assignmentId } = req.params;
            const { role } = req.body;
            const currentUserId = req.user.id;

            // Verificar permisos
            const currentUserRole = await UserPlant.getUserRole(currentUserId, plantId);
            if (currentUserRole !== 'owner') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el owner puede cambiar roles'
                });
            }

            const updatedAssignment = await UserPlant.update(assignmentId, { role });
            res.json({
                success: true,
                message: 'Rol actualizado exitosamente',
                data: updatedAssignment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar rol',
                error: error.message
            });
        }
    }

    // Remover usuario de planta
    static async removeUserFromPlant(req, res) {
        try {
            const { plantId, assignmentId } = req.params;
            const currentUserId = req.user.id;

            // Verificar permisos
            const currentUserRole = await UserPlant.getUserRole(currentUserId, plantId);
            if (!['owner', 'admin'].includes(currentUserRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para remover usuarios'
                });
            }

            await UserPlant.delete(assignmentId);
            res.json({
                success: true,
                message: 'Usuario removido exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al remover usuario',
                error: error.message
            });
        }
    }
}

export default UserPlantController;