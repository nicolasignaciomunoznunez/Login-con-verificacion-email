// models/plantaModel.js - VERSIÓN CORREGIDA CON NOMBRES EN INGLÉS
import { executeQuery } from '../db/connectDB.js';

export class PlantaData {
    // CREATE - Corregido nombres de columnas
    static async create(datoPlanta) {
        const query = `
            INSERT INTO plant_data 
            (plantId, batLocal, nivelLocal, senLocal, timestamp) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        try {
            const result = await executeQuery(query, [
                datoPlanta.plantId,  // ✅ Corregido: plantId (no plantaId)
                datoPlanta.batLocal,
                datoPlanta.nivelLocal,
                datoPlanta.senLocal,
                datoPlanta.timestamp || new Date()
            ]);
            
            return this.findById(result.insertId);
        } catch (error) {
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Error('La planta especificada no existe');
            }
            throw error;
        }
    }

    // READ - Buscar por ID (corregido)
    static async findById(id) {
        const query = `
            SELECT pd.*, p.name as plantName, p.location 
            FROM plant_data pd 
            LEFT JOIN plants p ON pd.plantId = p.id 
            WHERE pd.id = ?
        `;
        const plantData = await executeQuery(query, [id]);
        return plantData[0] || null;
    }

    // READ - Buscar todos los registros de una PLANTA (corregido)
    static async findByPlantId(plantId, limit = 100, offset = 0) {
        const query = `
            SELECT pd.*, p.name as plantName, p.location 
            FROM plant_data pd 
            LEFT JOIN plants p ON pd.plantId = p.id 
            WHERE pd.plantId = ? 
            ORDER BY pd.timestamp DESC 
            LIMIT ? OFFSET ?
        `;
        return await executeQuery(query, [plantId, limit, offset]);
    }

    // READ - Buscar todos los registros de un USUARIO (corregido)
    static async findByUserId(userId, limit = 100, offset = 0) {
        const query = `
            SELECT pd.*, p.name as plantName, p.location, up.role 
            FROM plant_data pd 
            LEFT JOIN plants p ON pd.plantId = p.id 
            LEFT JOIN user_plants up ON p.id = up.plantId 
            WHERE up.userId = ? AND up.isActive = TRUE 
            ORDER BY pd.timestamp DESC 
            LIMIT ? OFFSET ?
        `;
        return await executeQuery(query, [userId, limit, offset]);
    }

    // READ - Obtener registros por rango de fechas (corregido)
    static async findByDateRange(plantId, startDate, endDate) {
        const query = `
            SELECT pd.*, p.name as plantName, p.location 
            FROM plant_data pd 
            LEFT JOIN plants p ON pd.plantId = p.id 
            WHERE pd.plantId = ? AND pd.timestamp BETWEEN ? AND ? 
            ORDER BY pd.timestamp ASC
        `;
        return await executeQuery(query, [plantId, startDate, endDate]);
    }

    // READ - Obtener el último registro de una PLANTA (corregido)
    static async findLatestByPlantId(plantId) {
        const query = `
            SELECT pd.*, p.name as plantName, p.location 
            FROM plant_data pd 
            LEFT JOIN plants p ON pd.plantId = p.id 
            WHERE pd.plantId = ? 
            ORDER BY pd.timestamp DESC 
            LIMIT 1
        `;
        const plantData = await executeQuery(query, [plantId]);
        return plantData[0] || null;
    }

    // READ - Obtener el último registro de un USUARIO (corregido)
    static async findLatestByUserId(userId) {
        const query = `
            SELECT pd.*, p.name as plantName, p.location, up.role 
            FROM plant_data pd 
            LEFT JOIN plants p ON pd.plantId = p.id 
            LEFT JOIN user_plants up ON p.id = up.plantId 
            WHERE up.userId = ? AND up.isActive = TRUE 
            ORDER BY pd.timestamp DESC 
            LIMIT 1
        `;
        const plantData = await executeQuery(query, [userId]);
        return plantData[0] || null;
    }

    // READ - Obtener estadísticas de una PLANTA (corregido)
    static async getStatsByPlantId(plantId) {
        const query = `
            SELECT 
                COUNT(*) as totalRecords,
                MIN(timestamp) as firstRecord,
                MAX(timestamp) as lastRecord,
                AVG(batLocal) as avgBatLocal,
                AVG(nivelLocal) as avgNivelLocal,
                AVG(senLocal) as avgSenLocal,
                MAX(batLocal) as maxBatLocal,
                MIN(batLocal) as minBatLocal,
                MAX(nivelLocal) as maxNivelLocal,
                MIN(nivelLocal) as minNivelLocal
            FROM plant_data 
            WHERE plantId = ?
        `;
        const stats = await executeQuery(query, [plantId]);
        return stats[0] || null;
    }

    // READ - Obtener estadísticas de un USUARIO (corregido)
    static async getStatsByUserId(userId) {
        const query = `
            SELECT 
                COUNT(*) as totalRecords,
                MIN(pd.timestamp) as firstRecord,
                MAX(pd.timestamp) as lastRecord,
                AVG(pd.batLocal) as avgBatLocal,
                AVG(pd.nivelLocal) as avgNivelLocal,
                AVG(pd.senLocal) as avgSenLocal
            FROM plant_data pd 
            LEFT JOIN user_plants up ON pd.plantId = up.plantId 
            WHERE up.userId = ? AND up.isActive = TRUE
        `;
        const stats = await executeQuery(query, [userId]);
        return stats[0] || null;
    }

    // UPDATE - Actualizar registro de planta (mantenido)
    static async update(id, updateData) {
        const allowedFields = ['batLocal', 'nivelLocal', 'senLocal', 'timestamp'];
        
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
        const query = `UPDATE plant_data SET ${fields.join(', ')} WHERE id = ?`;
        
        await executeQuery(query, values);
        return this.findById(id);
    }

    // DELETE - Eliminar registro (mantenido)
    static async delete(id) {
        const query = 'DELETE FROM plant_data WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // DELETE - Eliminar todos los registros de una PLANTA (corregido)
    static async deleteByPlantId(plantId) {
        const query = 'DELETE FROM plant_data WHERE plantId = ?';
        const result = await executeQuery(query, [plantId]);
        return result.affectedRows;
    }

    // COUNT - Contar registros totales (mantenido)
    static async count() {
        const query = 'SELECT COUNT(*) as total FROM plant_data';
        const result = await executeQuery(query);
        return result[0].total;
    }

    // COUNT - Contar registros de una PLANTA (corregido)
    static async countByPlantId(plantId) {
        const query = 'SELECT COUNT(*) as total FROM plant_data WHERE plantId = ?';
        const result = await executeQuery(query, [plantId]);
        return result[0].total;
    }

    // COUNT - Contar registros de un USUARIO (corregido)
    static async countByUserId(userId) {
        const query = `
            SELECT COUNT(*) as total 
            FROM plant_data pd 
            LEFT JOIN user_plants up ON pd.plantId = up.plantId 
            WHERE up.userId = ? AND up.isActive = TRUE
        `;
        const result = await executeQuery(query, [userId]);
        return result[0].total;
    }

    // EXISTS - Verificar si existe registro (mantenido)
    static async exists(id) {
        const query = 'SELECT COUNT(*) as count FROM plant_data WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result[0].count > 0;
    }

    // ✅ NUEVO: Verificar si usuario tiene acceso a planta (corregido)
    static async userHasPlantAccess(userId, plantId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM user_plants 
            WHERE userId = ? AND plantId = ? AND isActive = TRUE
        `;
        const result = await executeQuery(query, [userId, plantId]);
        return result[0].count > 0;
    }
}

export default PlantaData;