import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
  let token;
  
  // 1. Primero buscar en los headers (Authorization: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('🔐 Token encontrado en Authorization header');
  }
  // 2. Si no está en headers, buscar en cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
    console.log('🔐 Token encontrado en cookies');
  }
  
  // 3. Si no hay token en ningún lugar, error
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "No estas autorizado para ver este contenido" 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }

    // ✅ VERIFICACIÓN ADICIONAL PARA MySQL: 
    // Confirmar que el usuario aún existe en la base de datos
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuario no encontrado. Token inválido." 
      });
    }

    // ✅ También puedes verificar si el usuario está activo/verificado si lo deseas
    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: "Cuenta no verificada. Por favor verifica tu email." 
      });
    }

    req.userId = decoded.userId;
    req.user = user; // ✅ Opcional: agregar el usuario completo a la request
    console.log('✅ Token válido para usuario:', decoded.userId);
    next();
  } catch (error) {
    console.log("Error in verifyToken ", error);
    
    // Mejor manejo de errores específicos
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expirado" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Error del servidor" 
    });
  }
};