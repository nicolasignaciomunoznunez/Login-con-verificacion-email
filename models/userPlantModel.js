import { executeQuery } from '../db/connectDB.js';

export class UserPlant {
    // CREATE - Asignar usuario a planta
    static async create(userId, plantId, role = 'viewer') {
        const query = `
            INSERT INTO user_plants (userId, plantId, role, isActive) 
            VALUES (?, ?, ?, TRUE)
        `;
        
        try {
            const result = await executeQuery(query, [userId, plantId, role]);
            return this.findById(result.insertId);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El usuario ya está asignado a esta planta');
            }
            throw error;
        }
    }

    // READ - Buscar por ID
    static async findById(id) {
        const query = `
            SELECT up.*, u.name as userName, u.email, p.name as plantName
            FROM user_plants up
            INNER JOIN users u ON up.userId = u.id
            INNER JOIN plants p ON up.plantId = p.id
            WHERE up.id = ?
        `;
        const userPlants = await executeQuery(query, [id]);
        return userPlants[0] || null;
    }

    // READ - Buscar por usuario y planta
    static async findByUserAndPlant(userId, plantId) {
        const query = `
            SELECT up.*, u.name as userName, p.name as plantName
            FROM user_plants up
            INNER JOIN users u ON up.userId = u.id
            INNER JOIN plants p ON up.plantId = p.id
            WHERE up.userId = ? AND up.plantId = ?
        `;
        const userPlants = await executeQuery(query, [userId, plantId]);
        return userPlants[0] || null;
    }

    // READ - Obtener plantas de un usuario
    static async findByUserId(userId, onlyActive = true) {
        const query = `
            SELECT up.*, p.name as plantName, p.location, p.description, p.isActive as plantActive
            FROM user_plants up
            INNER JOIN plants p ON up.plantId = p.id
            WHERE up.userId = ? ${onlyActive ? 'AND up.isActive = TRUE AND p.isActive = TRUE' : ''}
            ORDER BY p.name ASC
        `;
        return await executeQuery(query, [userId]);
    }

    // READ - Obtener usuarios de una planta
    static async findByPlantId(plantId, onlyActive = true) {
        const query = `
            SELECT up.*, u.name as userName, u.email, u.lastLogin
            FROM user_plants up
            INNER JOIN users u ON up.userId = u.id
            WHERE up.plantId = ? ${onlyActive ? 'AND up.isActive = TRUE' : ''}
            ORDER BY up.role, u.name ASC
        `;
        return await executeQuery(query, [plantId]);
    }

    // UPDATE - Actualizar rol o estado
    static async update(id, updateData) {
        const allowedFields = ['role', 'isActive'];
        
        const fields = [];
        const values = [];
        
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });
        
        if (fields.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }
        
        values.push(id);
        const query = `UPDATE user_plants SET ${fields.join(', ')} WHERE id = ?`;
        
        await executeQuery(query, values);
        return this.findById(id);
    }

    // DELETE - Desactivar asignación (soft delete)
    static async delete(id) {
        const query = 'UPDATE user_plants SET isActive = FALSE WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // DELETE - Eliminar asignación permanentemente
    static async permanentDelete(id) {
        const query = 'DELETE FROM user_plants WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // VERIFY - Verificar si usuario tiene acceso a planta
    static async userHasAccess(userId, plantId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM user_plants 
            WHERE userId = ? AND plantId = ? AND isActive = TRUE
        `;
        const result = await executeQuery(query, [userId, plantId]);
        return result[0].count > 0;
    }

    // VERIFY - Verificar rol de usuario en planta
    static async getUserRole(userId, plantId) {
        const query = `
            SELECT role 
            FROM user_plants 
            WHERE userId = ? AND plantId = ? AND isActive = TRUE
        `;
        const result = await executeQuery(query, [userId, plantId]);
        return result[0] ? result[0].role : null;
    }

    // COUNT - Contar usuarios por planta
    static async countByPlantId(plantId) {
        const query = 'SELECT COUNT(*) as total FROM user_plants WHERE plantId = ? AND isActive = TRUE';
        const result = await executeQuery(query, [plantId]);
        return result[0].total;
    }

    // COUNT - Contar plantas por usuario
    static async countByUserId(userId) {
        const query = 'SELECT COUNT(*) as total FROM user_plants WHERE userId = ? AND isActive = TRUE';
        const result = await executeQuery(query, [userId]);
        return result[0].total;
    }
}

