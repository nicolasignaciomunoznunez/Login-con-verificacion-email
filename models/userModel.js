import { executeQuery } from '../db/connectDB.js';

export class User {
    // CREATE - Crear nuevo usuario
    static async create(userData) {
        const query = `
            INSERT INTO users 
            (email, password, name, isVerified, resetPasswordToken, resetPasswordExpiresAt, verificationToken, verificationTokenExpiresAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
            const result = await executeQuery(query, [
                userData.email,
                userData.password,
                userData.name,
                userData.isVerified || false,
                userData.resetPasswordToken || null,
                userData.resetPasswordExpiresAt || null,
                userData.verificationToken || null,
                userData.verificationTokenExpiresAt || null
            ]);
            
            return this.findById(result.insertId);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El email ya está registrado');
            }
            throw error;
        }
    }

    // READ - Buscar por ID
    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = ?';
        const users = await executeQuery(query, [id]);
        return users[0] || null;
    }

    // READ - Buscar por email
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const users = await executeQuery(query, [email]);
        return users[0] || null;
    }

    // READ - Buscar por token de verificación
    static async findByVerificationToken(token) {
        const query = 'SELECT * FROM users WHERE verificationToken = ?';
        const users = await executeQuery(query, [token]);
        return users[0] || null;
    }

    // READ - Buscar por token de reset password
    static async findByResetToken(token) {
        const query = 'SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpiresAt > NOW()';
        const users = await executeQuery(query, [token]);
        return users[0] || null;
    }

    // READ - Obtener todos los usuarios (con paginación opcional)
    static async findAll(limit = 100, offset = 0) {
        const query = 'SELECT id, email, name, lastLogin, isVerified, createdAt FROM users LIMIT ? OFFSET ?';
        return await executeQuery(query, [limit, offset]);
    }

    // UPDATE - Actualizar usuario
    static async update(id, updateData) {
        const allowedFields = [
            'email', 'password', 'name', 'lastLogin', 'isVerified',
            'resetPasswordToken', 'resetPasswordExpiresAt',
            'verificationToken', 'verificationTokenExpiresAt'
        ];
        
        const fields = [];
        const values = [];
        
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });
        
        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        
        await executeQuery(query, values);
        return this.findById(id);
    }

    // UPDATE - Actualizar último login
    static async updateLastLogin(id) {
        const query = 'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?';
        await executeQuery(query, [id]);
        return this.findById(id);
    }

    // UPDATE - Marcar como verificado
    static async verifyUser(id) {
        const query = `
            UPDATE users 
            SET isVerified = TRUE, verificationToken = NULL, verificationTokenExpiresAt = NULL 
            WHERE id = ?
        `;
        await executeQuery(query, [id]);
        return this.findById(id);
    }

    // UPDATE - Establecer token de reset password
    static async setResetToken(id, token, expiresAt) {
        const query = `
            UPDATE users 
            SET resetPasswordToken = ?, resetPasswordExpiresAt = ? 
            WHERE id = ?
        `;
        await executeQuery(query, [token, expiresAt, id]);
        return this.findById(id);
    }

    // UPDATE - Cambiar contraseña y limpiar token
    static async updatePassword(id, newPassword) {
        const query = `
            UPDATE users 
            SET password = ?, resetPasswordToken = NULL, resetPasswordExpiresAt = NULL 
            WHERE id = ?
        `;
        await executeQuery(query, [newPassword, id]);
        return this.findById(id);
    }

    // DELETE - Eliminar usuario
    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = ?';
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // COUNT - Contar usuarios totales
    static async count() {
        const query = 'SELECT COUNT(*) as total FROM users';
        const result = await executeQuery(query);
        return result[0].total;
    }

    // EXISTS - Verificar si existe un usuario por email
    static async existsByEmail(email) {
        const query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
        const result = await executeQuery(query, [email]);
        return result[0].count > 0;
    }
}

export default User;