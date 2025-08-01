// api.js - VERSIÓN COMPLETA CORREGIDA
// Utilidades para peticiones a la API

export const API_BASE_URL = 'http://54.197.161.202:7000';

/**
 * Realiza una petición a la API
 * @param {string} endpoint - Endpoint relativo (ej: '/login')
 * @param {object} options - Opciones fetch (method, headers, body, etc)
 * @returns {Promise<any>} Respuesta de la API
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // CORRECCIÓN: Configurar headers por defecto
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // CORRECCIÓN: Mejorar configuración de la petición
    const requestConfig = {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      ...options
    };
    
    // Log para debugging
    console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
    if (options.body) {
      console.log('Request body:', options.body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestConfig);
    
    // CORRECCIÓN: Mejor manejo de códigos de estado
    console.log(`Response status: ${response.status}`);
    
    // Manejar código 409 (conflicto)
    if (response.status === 409) {
      throw new Error('409');
    }
    
    // CORRECCIÓN: Manejar otros códigos de error específicos
    if (response.status === 404) {
      throw new Error('Recurso no encontrado');
    }
    
    if (response.status === 400) {
      throw new Error('Datos inválidos');
    }
    
    if (response.status === 500) {
      throw new Error('Error interno del servidor');
    }
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    // CORRECCIÓN: Mejorar manejo de tipos de respuesta
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await response.json();
      console.log('Response data:', jsonData);
      return jsonData;
    } else {
      const textData = await response.text();
      console.log('Response text:', textData);
      
      // CORRECCIÓN: Intentar parsear como JSON si el texto lo permite
      try {
        return JSON.parse(textData);
      } catch (parseError) {
        return textData;
      }
    }
    
  } catch (error) {
    console.error('API error:', error);
    
    // CORRECCIÓN: Propagar errores específicos
    if (error.message === '409') {
      throw new Error('409');
    }
    
    // CORRECCIÓN: Manejo de errores de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Error de conexión. Verifica tu conexión a internet.');
    }
    
    // CORRECCIÓN: Manejo de timeout
    if (error.name === 'AbortError') {
      throw new Error('La petición tardó demasiado tiempo. Intenta de nuevo.');
    }
    
    throw error;
  }
};

// CORRECCIÓN: Función auxiliar para peticiones con timeout
export const apiRequestWithTimeout = async (endpoint, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await apiRequest(endpoint, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// CORRECCIÓN: Función específica para PUT requests
export const putRequest = async (endpoint, data) => {
  return await apiRequest(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
};

// CORRECCIÓN: Función específica para POST requests
export const postRequest = async (endpoint, data) => {
  return await apiRequest(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
};

// CORRECCIÓN: Función específica para DELETE requests
export const deleteRequest = async (endpoint) => {
  return await apiRequest(endpoint, {
    method: 'DELETE'
  });
};