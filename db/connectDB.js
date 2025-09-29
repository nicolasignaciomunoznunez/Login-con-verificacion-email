import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ryvspa',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
   
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para ejecutar queries
export const executeQuery = async (query, params = []) => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('🔌 Ejecutando query:', query.substring(0, 100) + '...');
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('❌ Error en la query:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

// Función para obtener conexión directa (para transacciones)
export const getConnection = async () => {
    return await pool.getConnection();
};

// Verificar conexión a la base de datos
export const testConnection = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        
        // Verificar que las tablas existan
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.tables 
            WHERE TABLE_SCHEMA = ?
        `, [process.env.DB_NAME || 'mi_proyecto']);
        
        console.log('📊 Tablas en la base de datos:');
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
};

// Función para cerrar el pool (útil para tests)
export const closePool = async () => {
    await pool.end();
};

export default pool;