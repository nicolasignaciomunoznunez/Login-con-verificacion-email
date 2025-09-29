import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
	sendPasswordResetEmail,
	sendResetSuccessEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
} from "../mailtrap/emails.js";
import { User } from "../models/userModel.js";

/**
 * Controlador para registro de nuevos usuarios
 * Crea un nuevo usuario en la base de datos, envía email de verificación
 * y devuelve el token JWT para autenticación
 */
export const signup = async (req, res) => {
	const { email, password, name } = req.body;

	try {
		// Validar que todos los campos requeridos estén presentes
		if (!email || !password || !name) {
			throw new Error("Complete todos los campos");
		}

		// Verificar si el usuario ya existe en la base de datos
		const userAlreadyExists = await User.findByEmail(email);
		console.log("Verificando si usuario existe:", userAlreadyExists);

		if (userAlreadyExists) {
			return res.status(400).json({ success: false, message: "El usuario ya existe" });
		}

		// Hash de la contraseña para seguridad
		const hashedPassword = await bcryptjs.hash(password, 10);
		
		// Generar token de verificación de email (6 dígitos)
		const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
		const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira en 24 horas

		// Crear nuevo usuario en la base de datos
		const newUser = await User.create({
			email,
			password: hashedPassword,
			name,
			verificationToken,
			verificationTokenExpiresAt,
		});

		// Generar token JWT y establecer cookie HTTP-only
		// ✅ CAPTURAR EL TOKEN que devuelve la función para enviarlo en la respuesta JSON
		const token = generateTokenAndSetCookie(res, newUser.id);

		// Enviar email de verificación al usuario
		await sendVerificationEmail(newUser.email, verificationToken);

		// Responder con éxito, datos del usuario y token JWT
		res.status(201).json({
			success: true,
			message: "Usuario creado correctamente",
			user: {
				id: newUser.id,
				email: newUser.email,
				name: newUser.name,
				isVerified: newUser.isVerified,
				lastLogin: newUser.lastLogin,
				createdAt: newUser.createdAt,
				updatedAt: newUser.updatedAt
			},
			token: token, // ✅ TOKEN JWT para que el frontend lo guarde en localStorage
		});
	} catch (error) {
		// Manejar errores durante el registro
		if (error.message.includes('ER_DUP_ENTRY') || error.message.includes('El email ya está registrado')) {
			return res.status(400).json({ success: false, message: "El usuario ya existe" });
		}
		res.status(400).json({ success: false, message: error.message });
	}
};

/**
 * Controlador para verificación de email
 * Valida el código de verificación y activa la cuenta del usuario
 */
export const verifyEmail = async (req, res) => {
	const { code } = req.body;
	try {
		// Buscar usuario con el token de verificación válido
		const user = await User.findByVerificationToken(code);
		
		if (!user) {
			return res.status(400).json({ success: false, message: "Código inválido o ya expirado." });
		}

		// Verificar que el token no haya expirado
		if (user.verificationTokenExpiresAt < new Date()) {
			return res.status(400).json({ success: false, message: "Código inválido o ya expirado." });
		}

		// Marcar email como verificado y limpiar tokens de verificación
		const updatedUser = await User.verifyUser(user.id);

		// Enviar email de bienvenida
		await sendWelcomeEmail(updatedUser.email, updatedUser.name);

		// Responder con éxito y datos del usuario verificado
		res.status(200).json({
			success: true,
			message: "Email verificado correctamente",
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				name: updatedUser.name,
				isVerified: updatedUser.isVerified,
				lastLogin: updatedUser.lastLogin,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt
			},
		});
	} catch (error) {
		console.log("Error en la verificación del email ", error);
		res.status(500).json({ success: false, message: "Error del servidor" });
	}
};

/**
 * Controlador para inicio de sesión
 * Autentica usuario con email y password, genera nuevo token JWT
 */
export const login = async (req, res) => {
	const { email, password } = req.body;
	try {
		// Buscar usuario por email
		const user = await User.findByEmail(email);
		if (!user) {
			return res.status(400).json({ success: false, message: "Credenciales inválidas" });
		}
		
		// Verificar contraseña
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Credenciales inválidas" });
		}

		// Generar token JWT y establecer cookie HTTP-only
		// ✅ CAPTURAR EL TOKEN que devuelve la función para enviarlo en la respuesta JSON
		const token = generateTokenAndSetCookie(res, user.id);

		// Actualizar última fecha de login
		await User.updateLastLogin(user.id);

		// Obtener usuario actualizado
		const updatedUser = await User.findById(user.id);

		// Responder con éxito, datos del usuario y token JWT
		res.status(200).json({
			success: true,
			message: "Conectado correctamente",
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				name: updatedUser.name,
				isVerified: updatedUser.isVerified,
				lastLogin: updatedUser.lastLogin,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt
			},
			token: token, // ✅ TOKEN JWT para que el frontend lo guarde en localStorage
		});
	} catch (error) {
		console.log("Error al conectarse ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

/**
 * Controlador para cierre de sesión
 * Limpia la cookie de autenticación
 */
export const logout = async (req, res) => {
	// Eliminar cookie de token
	res.clearCookie("token");
	res.status(200).json({ success: true, message: "Desconectado correctamente" });
};

/**
 * Controlador para solicitud de reseteo de contraseña
 * Genera token de reseteo y envía email con instrucciones
 */
export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		// Buscar usuario por email
		const user = await User.findByEmail(email);

		if (!user) {
			// Por seguridad, no revelar si el email existe o no
			return res.status(200).json({ 
				success: true, 
				message: "Si el email existe, se enviarán instrucciones para resetear la contraseña" 
			});
		}

		// Generar token de reseteo seguro
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // Expira en 1 hora

		// Guardar token de reseteo en el usuario
		await User.setResetToken(user.id, resetToken, resetTokenExpiresAt);

		// Enviar email con link de reseteo
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

		res.status(200).json({ 
			success: true, 
			message: "Si el email existe, se enviarán instrucciones para resetear la contraseña" 
		});
	} catch (error) {
		console.log("Error en forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

/**
 * Controlador para reseteo de contraseña
 * Valida token de reseteo y actualiza la contraseña
 */
export const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		// Buscar usuario con token de reseteo válido
		const user = await User.findByResetToken(token);

		if (!user) {
			return res.status(400).json({ success: false, message: "Token inválido o expirado" });
		}

		// Hash de la nueva contraseña
		const hashedPassword = await bcryptjs.hash(password, 10);

		// Actualizar contraseña y limpiar tokens de reseteo
		await User.updatePassword(user.id, hashedPassword);

		// Enviar email de confirmación
		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Contraseña cambiada exitosamente" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

/**
 * Controlador para verificar autenticación
 * Valida token JWT y devuelve datos del usuario autenticado
 */
export const checkAuth = async (req, res) => {
	try {
		// req.userId es establecido por el middleware de autenticación
		const user = await User.findById(req.userId);
		
		if (!user) {
			return res.status(400).json({ success: false, message: "Usuario no encontrado" });
		}

		// Excluir password de la respuesta
		const userWithoutPassword = {
			id: user.id,
			email: user.email,
			name: user.name,
			isVerified: user.isVerified,
			lastLogin: user.lastLogin,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		};

		res.status(200).json({ success: true, user: userWithoutPassword });
	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};