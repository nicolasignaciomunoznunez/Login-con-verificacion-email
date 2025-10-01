import { executeQuery } from '../db/connectDB.js';

export class Plant {
    // CREATE - Crear nueva planta
    static async create(plantData) {
        const query = `
            INSERT INTO plants 
            (name, location, description, isActive) 
            VALUES (?, ?, ?, ?)
        `;
        
        try {
            const result = await executeQuery(query, [
                plantData.name,
                plantData.location,
                plantData.description,
                plantData.isActive !== undefined ? plantData.isActive : true
            ]);
            
            return this.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // READ - Buscar planta por ID
    static async findById(id) {
        const query = `
            SELECT p.*, 
                   COUNT(DISTINCT up.userId) as totalUsers,
                   COUNT(DISTINCT pd.id) as totalRecords
            FROM plants p
            LEFT JOIN user_plants up ON p.id = up.plantId AND up.isActive = TRUE
            LEFT JOIN plant_data pd ON p.id = pd.plantId
            WHERE p.id = ?
            GROUP BY p.id
        `;
        const plants = await executeQuery(query, [id]);
        return plants[0] || null;
    }

    // READ - Buscar todas las plantas
    static async findAll(limit = 100, offset = 0) {
        const query = `
            SELECT p.*, 
                   COUNT(DISTINCT up.userId) as totalUsers,
                   COUNT(DISTINCT pd.id) as totalRecords
            FROM plants p
            LEFT JOIN user_plants up ON p.id = up.plantId AND up.isActive = TRUE
            LEFT JOIN plant_data pd ON p.id = pd.plantId
            GROUP BY p.id
            ORDER BY p.createdAt DESC
            LIMIT ? OFFSET ?
        `;
        return await executeQuery(query, [limit, offset]);
    }

    // READ - Buscar plantas activas
    static async findActive() {
        const query = `
            SELECT p.*, 
                   COUNT(DISTINCT up.userId) as totalUsers,
                   COUNT(DISTINCT pd.id) as totalRecords
            FROM plants p
            LEFT JOIN user_plants up ON p.id = up.plantId AND up.isActive = TRUE
            LEFT JOIN plant_data pd ON p.id = pd.plantId
            WHERE p.isActive = TRUE
            GROUP BY p.id
            ORDER BY p.name ASC
        `;
        return await executeQuery(query);
    }

    // READ - Buscar plantas por usuario
    static async findByUserId(userId) {
        const query = `
            SELECT p.*, up.role, up.isActive as userPlantActive
            FROM plants p
            INNER JOIN user_plants up ON p.id = up.plantId
            WHERE up.userId = ? AND up.isActive = TRUE AND p.isActive = TRUE
            ORDER BY p.name ASC
        `;
        return await executeQuery(query, [userId]);
    }

    // READ - Buscar plantas por nombre (búsqueda)
    static async findByName(name, limit = 50) {
        const query = `
            SELECT p.*, 
                   COUNT(DISTINCT up.userId) as totalUsers,
                   COUNT(DISTINCT pd.id) as totalRecords
            FROM plants p
            LEFT JOIN user_plants up ON p.id = up.plantId AND up.isActive = TRUE
            LEFT JOIN plant_data pd ON p.id = pd.plantId
            WHERE p.name LIKE ? AND p.isActive = TRUE
            GROUP BY p.id
            ORDER BY p.name ASC
            LIMIT ?
        `;
        return await executeQuery(query, [`%${name}%`, limit]);
    }

    // READ - Obtener plantas con último dato
    static async findWithLatestData(userId = null) {
        let query, params;
        
        if (userId) {
            query = `
                SELECT p.*, up.role,
                       pd.batLocal as lastBatLocal,
                       pd.nivelLocal as lastNivelLocal,
                       pd.senLocal as lastSenLocal,
                       pd.timestamp as lastTimestamp
                FROM plants p
                INNER JOIN user_plants up ON p.id = up.plantId
                LEFT JOIN plant_data pd ON p.id = pd.plantId
                WHERE up.userId = ? AND up.isActive = TRUE AND p.isActive = TRUE
                AND pd.timestamp = (
                    SELECT MAX(timestamp) 
                    FROM plant_data 
                    WHERE plantId = p.id
                )
                ORDER BY p.name ASC
            `;
            params = [userId];
        } else {
            query = `
                SELECT p.*,
                       pd.batLocal as lastBatLocal,
                       pd.nivelLocal as lastNivelLocal,
                       pd.senLocal as lastSenLocal,
                       pd.timestamp as lastTimestamp
                FROM plants p
                LEFT JOIN plant_data pd ON p.id = pd.plantId
                WHERE p.isActive = TRUE
                AND pd.timestamp = (
                    SELECT MAX(timestamp) 
                    FROM plant_data 
                    WHERE plantId = p.id
                )
                ORDER BY p.name ASC
            `;
            params = [];
        }
        
        return await executeQuery(query, params);
    }

    // UPDATE - Actualizar planta
    static async update(id, updateData) {
        const allowedFields = ['name', 'location', 'description', 'isActive'];
        
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
        const query = `UPDATE plants SET ${fields.join(', ')} WHERE id = ?`;
        
        await executeQuery(query, values);
        return this.findById(id);
    }

    // DELETE - Eliminar planta (soft delete)
    static async delete(id) {
        const query = 'UPDATE plants SET isActive = FALSE WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // DELETE - Eliminar planta permanentemente
    static async permanentDelete(id) {
        const query = 'DELETE FROM plants WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // COUNT - Contar plantas totales
    static async count() {
        const query = 'SELECT COUNT(*) as total FROM plants WHERE isActive = TRUE';
        const result = await executeQuery(query);
        return result[0].total;
    }

    // COUNT - Contar plantas por usuario
    static async countByUserId(userId) {
        const query = `
            SELECT COUNT(*) as total 
            FROM user_plants up
            INNER JOIN plants p ON up.plantId = p.id
            WHERE up.userId = ? AND up.isActive = TRUE AND p.isActive = TRUE
        `;
        const result = await executeQuery(query, [userId]);
        return result[0].total;
    }

    // EXISTS - Verificar si planta existe
    static async exists(id) {
        const query = 'SELECT COUNT(*) as count FROM plants WHERE id = ? AND isActive = TRUE';
        const result = await executeQuery(query, [id]);
        return result[0].count > 0;
    }

    // USER MANAGEMENT - Asignar usuario a planta
    static async assignUser(plantId, userId, role = 'viewer') {
        const query = `
            INSERT INTO user_plants (userId, plantId, role, isActive) 
            VALUES (?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE 
            role = VALUES(role), 
            isActive = TRUE,
            createdAt = CURRENT_TIMESTAMP
        `;
        
        const result = await executeQuery(query, [userId, plantId, role]);
        return result.affectedRows > 0;
    }

    // USER MANAGEMENT - Remover usuario de planta
    static async removeUser(plantId, userId) {
        const query = 'UPDATE user_plants SET isActive = FALSE WHERE plantId = ? AND userId = ?';
        const result = await executeQuery(query, [plantId, userId]);
        return result.affectedRows > 0;
    }

    // USER MANAGEMENT - Obtener usuarios de planta
    static async getUsers(plantId) {
        const query = `
            SELECT u.id, u.email, u.name, up.role, up.createdAt as assignedAt
            FROM user_plants up
            INNER JOIN users u ON up.userId = u.id
            WHERE up.plantId = ? AND up.isActive = TRUE
            ORDER BY up.role, u.name
        `;
        return await executeQuery(query, [plantId]);
    }

    // STATS - Obtener estadísticas de planta
    static async getStats(plantId) {
        const query = `
            SELECT 
                p.*,
                COUNT(DISTINCT up.userId) as totalUsers,
                COUNT(DISTINCT pd.id) as totalRecords,
                MIN(pd.timestamp) as firstRecord,
                MAX(pd.timestamp) as lastRecord,
                AVG(pd.batLocal) as avgBatLocal,
                AVG(pd.nivelLocal) as avgNivelLocal,
                AVG(pd.senLocal) as avgSenLocal
            FROM plants p
            LEFT JOIN user_plants up ON p.id = up.plantId AND up.isActive = TRUE
            LEFT JOIN plant_data pd ON p.id = pd.plantId
            WHERE p.id = ?
            GROUP BY p.id
        `;
        const stats = await executeQuery(query, [plantId]);
        return stats[0] || null;
    }

    // VERIFY ACCESS - Verificar si usuario tiene acceso a planta
    static async userHasAccess(userId, plantId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM user_plants 
            WHERE userId = ? AND plantId = ? AND isActive = TRUE
        `;
        const result = await executeQuery(query, [userId, plantId]);
        return result[0].count > 0;
    }

    // VERIFY ROLE - Verificar rol de usuario en planta
    static async getUserRole(userId, plantId) {
        const query = `
            SELECT role 
            FROM user_plants 
            WHERE userId = ? AND plantId = ? AND isActive = TRUE
        `;
        const result = await executeQuery(query, [userId, plantId]);
        return result[0] ? result[0].role : null;
    }
}

export default Plant;