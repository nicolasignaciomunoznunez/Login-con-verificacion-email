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


export const signup = async (req, res) => {
	const { email, password, name } = req.body;

	try {
		
		if (!email || !password || !name) {
			throw new Error("Complete todos los campos");
		}
		const userAlreadyExists = await User.findByEmail(email);
		console.log("Verificando si usuario existe:", userAlreadyExists);

		if (userAlreadyExists) {
			return res.status(400).json({ success: false, message: "El usuario ya existe" });
		}

		
		const hashedPassword = await bcryptjs.hash(password, 10);
		
		// Generar token de verificación de email (6 digitos)
		const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
		const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

		
		const newUser = await User.create({
			email,
			password: hashedPassword,
			name,
			verificationToken,
			verificationTokenExpiresAt,
		});

		
		const token = generateTokenAndSetCookie(res, newUser.id);

		// Enviar email de verificación al usuario
		await sendVerificationEmail(newUser.email, verificationToken);

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
			token: token, // 
		});
	} catch (error) {
		
		if (error.message.includes('ER_DUP_ENTRY') || error.message.includes('El email ya está registrado')) {
			return res.status(400).json({ success: false, message: "El usuario ya existe" });
		}
		res.status(400).json({ success: false, message: error.message });
	}
};

/**
 * Controlador para verificación de email
 */
export const verifyEmail = async (req, res) => {
	const { code } = req.body;
	try {

		const user = await User.findByVerificationToken(code);
		
		if (!user) {
			return res.status(400).json({ success: false, message: "Código inválido o ya expirado." });
		}


		if (user.verificationTokenExpiresAt < new Date()) {
			return res.status(400).json({ success: false, message: "Código inválido o ya expirado." });
		}

		const updatedUser = await User.verifyUser(user.id);

	
		await sendWelcomeEmail(updatedUser.email, updatedUser.name);


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


export const login = async (req, res) => {
	const { email, password } = req.body;
	try {
	
		const user = await User.findByEmail(email);
		if (!user) {
			return res.status(400).json({ success: false, message: "Credenciales inválidas" });
		}
		
	
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Credenciales inválidas" });
		}


		const token = generateTokenAndSetCookie(res, user.id);

		
		await User.updateLastLogin(user.id);

	
		const updatedUser = await User.findById(user.id);


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
			token: token, 
		});
	} catch (error) {
		console.log("Error al conectarse ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};


export const logout = async (req, res) => {

	res.clearCookie("token");
	res.status(200).json({ success: true, message: "Desconectado correctamente" });
};


export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {

		const user = await User.findByEmail(email);

		if (!user) {
			
			return res.status(200).json({ 
				success: true, 
				message: "Si el email existe, se enviarán instrucciones para resetear la contraseña" 
			});
		}


		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // Expira en 1 hora


		await User.setResetToken(user.id, resetToken, resetTokenExpiresAt);


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

		const user = await User.findByResetToken(token);

		if (!user) {
			return res.status(400).json({ success: false, message: "Token inválido o expirado" });
		}

	
		const hashedPassword = await bcryptjs.hash(password, 10);

		await User.updatePassword(user.id, hashedPassword);

		
		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Contraseña cambiada exitosamente" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};


export const checkAuth = async (req, res) => {
	try {

		const user = await User.findById(req.userId);
		
		if (!user) {
			return res.status(400).json({ success: false, message: "Usuario no encontrado" });
		}

	
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