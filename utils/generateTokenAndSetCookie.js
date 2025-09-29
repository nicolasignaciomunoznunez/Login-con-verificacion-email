import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
    // Generar token JWT
    const token = jwt.sign(
        { userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || "15d" }
    );

    // Establecer cookie HTTP-only
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 días
    });

    return token; // ✅ Devolver el token para que el frontend lo use
};