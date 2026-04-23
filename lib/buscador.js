const { createClient } = require('@supabase/supabase-js');

// Configuración de variables de entorno para Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Faltan configurar las variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el ambiente.');
}

// Variables para almacenar caché de forma global
let cacheZonas = null;

async function cargarZonas() {
  if (cacheZonas) return cacheZonas;

  if (!supabase) {
    throw new Error('Supabase no está inicializado. Verifica tus credenciales (URL y KEY).');
  }

  // Al no poner .limit(), Supabase descarga todos los registros de jalón (máx 1000 por defecto en configs estándar, pero aquí pedirá todos si son menos o podemos paginar si fallara)
  const { data, error } = await supabase
    .from('colonias_zonas')
    .select('*');

  if (error) {
    console.error("Error obteniendo las zonas desde Supabase:", error);
    throw error;
  }

  cacheZonas = data;
  return cacheZonas;
}

/**
 * Busca por coincidencia exacta de CP o dentro del texto para colonia.
 * @param {string} mensaje 
 * @returns {Object|null} El primer resultado coincidente o null si no existe.
 */
async function buscarTier(mensaje) {
  if (!mensaje || typeof mensaje !== 'string') return null;

  try {
    // 1. Descargamos las colonias si no se han descargado
    const zonas = await cargarZonas();

    // Normalizamos el mensaje del cliente a minúsculas (para buscar 'Americana' o 'americana' sin fallar)
    const mensajeMinc = mensaje.toLowerCase();

    // 2. Recorremos todas las colonias
    for (const zona of zonas) {
      const codigoPostal = zona.codigo_postal ? zona.codigo_postal.toLowerCase() : '';
      const nombreColonia = zona.colonia ? zona.colonia.toLowerCase() : '';

      // Usamos .includes() para ver si la frase contiene el CP o la Colonia
      if (codigoPostal && mensajeMinc.includes(codigoPostal)) {
        return zona;
      }
      
      if (nombreColonia && mensajeMinc.includes(nombreColonia)) {
        return zona;
      }
    }

    // Si termina el ciclo y no encontró nada
    return null;

  } catch (error) {
    console.error("Hubo un error escaneando las zonas:", error);
    return null;
  }
}

module.exports = {
  buscarTier
};
