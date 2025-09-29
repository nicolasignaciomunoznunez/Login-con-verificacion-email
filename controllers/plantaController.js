import { PlantaData } from '../models/plantaModel.js';

// Crear nuevo dato de planta 
export const createPlantData = async (req, res) => {
  try {
    const { batLocal, nivelLocal, senLocal, plantId } = req.body; // ✅ Cambio: plantId (no plantaId)
    const userId = req.userId;
    
    if (!batLocal || !nivelLocal || !senLocal || !plantId) {
      return res.status(400).json({ 
        success: false, 
        message: "Todos los campos son requeridos (incluyendo plantId)" 
      });
    }

    // ✅ CORREGIDO: Usar el nuevo nombre del método
    const tieneAcceso = await PlantaData.userHasPlantAccess(userId, parseInt(plantId));
    if (!tieneAcceso) {
      return res.status(403).json({ 
        success: false, 
        message: "No tienes acceso a esta planta" 
      });
    }

    const plantData = await PlantaData.create({
      plantId: parseInt(plantId), // ✅ Cambio: plantId (no plantaId)
      batLocal: parseFloat(batLocal),
      nivelLocal: parseFloat(nivelLocal),
      senLocal: parseFloat(senLocal)
    });
    
    res.status(201).json({
      success: true,
      message: "Dato de planta creado correctamente",
      data: plantData
    });
  } catch (error) {
    if (error.message.includes('La planta especificada no existe')) {
      return res.status(400).json({ 
        success: false, 
        message: "Planta no válida" 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Obtener todos los datos de planta del usuario autenticado
export const getMyPlantData = async (req, res) => {
  try {
    const userId = req.userId;
    const { plantId, page = 1, limit = 50 } = req.query; // ✅ Cambio: plantId (no plantaId)
    
    let plantData;
    let total;
    
    if (plantId) {
      // ✅ CORREGIDO: Usar nuevos nombres de métodos
      const tieneAcceso = await PlantaData.userHasPlantAccess(userId, parseInt(plantId));
      if (!tieneAcceso) {
        return res.status(403).json({ 
          success: false, 
          message: "No tienes acceso a esta planta" 
        });
      }
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      plantData = await PlantaData.findByPlantId(parseInt(plantId), parseInt(limit), offset); // ✅ Cambio: findByPlantId
      total = await PlantaData.countByPlantId(parseInt(plantId)); // ✅ Cambio: countByPlantId
    } else {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      plantData = await PlantaData.findByUserId(userId, parseInt(limit), offset);
      total = await PlantaData.countByUserId(userId);
    }
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: plantData,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener el último dato de planta del usuario
export const getLatestPlantData = async (req, res) => {
  try {
    const userId = req.userId;
    const { plantId } = req.query; // ✅ Cambio: plantId (no plantaId)
    
    let plantData;
    
    if (plantId) {
      const tieneAcceso = await PlantaData.userHasPlantAccess(userId, parseInt(plantId));
      if (!tieneAcceso) {
        return res.status(403).json({ 
          success: false, 
          message: "No tienes acceso a esta planta" 
        });
      }
      plantData = await PlantaData.findLatestByPlantId(parseInt(plantId)); // ✅ Cambio: findLatestByPlantId
    } else {
      plantData = await PlantaData.findLatestByUserId(userId);
    }
    
    if (!plantData) {
      return res.status(404).json({ 
        success: false, 
        message: "No se encontraron datos de planta" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: plantData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener datos por rango de fechas
export const getPlantDataByDateRange = async (req, res) => {
  try {
    const userId = req.userId;
    const { plantId, startDate, endDate } = req.query; // ✅ Cambio: plantId (no plantaId)
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "startDate y endDate son requeridos" 
      });
    }

    let plantData;
    
    if (plantId) {
      const tieneAcceso = await PlantaData.userHasPlantAccess(userId, parseInt(plantId));
      if (!tieneAcceso) {
        return res.status(403).json({ 
          success: false, 
          message: "No tienes acceso a esta planta" 
        });
      }
      plantData = await PlantaData.findByDateRange(parseInt(plantId), new Date(startDate), new Date(endDate));
    } else {
      plantData = await PlantaData.findByUserId(userId);
      plantData = plantData.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    }
    
    res.status(200).json({
      success: true,
      data: plantData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Actualizar dato de planta
export const updatePlantData = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const existingData = await PlantaData.findById(id);
    if (!existingData) {
      return res.status(404).json({ 
        success: false, 
        message: "Dato no encontrado" 
      });
    }
    
    // ✅ CORREGIDO: Usar plantId (no plantaId)
    const tieneAcceso = await PlantaData.userHasPlantAccess(userId, existingData.plantId);
    if (!tieneAcceso) {
      return res.status(403).json({ 
        success: false, 
        message: "No autorizado para modificar este registro" 
      });
    }

    const plantData = await PlantaData.update(id, req.body);
    
    res.status(200).json({
      success: true,
      message: "Dato actualizado correctamente",
      data: plantData
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Eliminar dato de planta
export const deletePlantData = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const existingData = await PlantaData.findById(id);
    if (!existingData) {
      return res.status(404).json({ 
        success: false, 
        message: "Dato no encontrado" 
      });
    }
    
    // ✅ CORREGIDO: Usar plantId (no plantaId)
    const tieneAcceso = await PlantaData.userHasPlantAccess(userId, existingData.plantId);
    if (!tieneAcceso) {
      return res.status(403).json({ 
        success: false, 
        message: "No autorizado para eliminar este registro" 
      });
    }

    const deleted = await PlantaData.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: "Dato no encontrado" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Dato eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener estadísticas de los datos de planta
export const getPlantStats = async (req, res) => {
  try {
    const userId = req.userId;
    const { plantId, days = 7 } = req.query; // ✅ Cambio: plantId (no plantaId)
    
    let stats;
    
    if (plantId) {
      const tieneAcceso = await PlantaData.userHasPlantAccess(userId, parseInt(plantId));
      if (!tieneAcceso) {
        return res.status(403).json({ 
          success: false, 
          message: "No tienes acceso a esta planta" 
        });
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const plantData = await PlantaData.findByDateRange(parseInt(plantId), startDate, endDate);
      
      stats = await calcularEstadisticas(plantData);
    } else {
      // ✅ CORREGIDO: Usar nuevo nombre del método
      stats = await PlantaData.getStatsByUserId(userId);
    }
    
    res.status(200).json({
      success: true,
      data: stats,
      days: parseInt(days)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Función helper para calcular estadísticas manualmente
const calcularEstadisticas = (plantData) => {
  if (plantData.length === 0) {
    return {
      avgBatLocal: 0,
      maxBatLocal: 0,
      minBatLocal: 0,
      avgNivelLocal: 0,
      maxNivelLocal: 0,
      minNivelLocal: 0,
      avgSenLocal: 0,
      maxSenLocal: 0,
      minSenLocal: 0,
      totalReadings: 0
    };
  }
  
  const batLocalValues = plantData.map(item => item.batLocal);
  const nivelLocalValues = plantData.map(item => item.nivelLocal);
  const senLocalValues = plantData.map(item => item.senLocal);
  
  const calculateStats = (values) => ({
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values)
  });
  
  return {
    avgBatLocal: calculateStats(batLocalValues).avg,
    maxBatLocal: calculateStats(batLocalValues).max,
    minBatLocal: calculateStats(batLocalValues).min,
    avgNivelLocal: calculateStats(nivelLocalValues).avg,
    maxNivelLocal: calculateStats(nivelLocalValues).max,
    minNivelLocal: calculateStats(nivelLocalValues).min,
    avgSenLocal: calculateStats(senLocalValues).avg,
    maxSenLocal: calculateStats(senLocalValues).max,
    minSenLocal: calculateStats(senLocalValues).min,
    totalReadings: plantData.length
  };
};