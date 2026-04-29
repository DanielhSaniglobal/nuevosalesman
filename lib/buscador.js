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

  // Paginación para obtener todos los registros (Supera el límite de 1000 de Supabase)
  let allZonas = [];
  let limit = 1000;
  let start = 0;
  let count = 0;
  
  do {
    const { data, error } = await supabase
      .from('colonias_zonas')
      .select('*')
      .range(start, start + limit - 1);
      
    if (error) {
      console.error("Error obteniendo las zonas desde Supabase:", error);
      throw error;
    }
    
    if (data) {
      allZonas = allZonas.concat(data);
      count = data.length;
    } else {
      count = 0;
    }
    
    start += limit;
  } while (count === limit);

  cacheZonas = allZonas;
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

    // Normalizamos el mensaje del cliente a minúsculas
    const mensajeMinc = mensaje.toLowerCase();

    // 2. Extraer posibles Códigos Postales (5 dígitos)
    const cpsEnMensaje = mensaje.match(/\b\d{5}\b/g) || [];

    if (cpsEnMensaje.length > 0) {
      // Buscar zonas que coincidan con los CP encontrados
      const zonasPorCP = zonas.filter(z => z.codigo_postal && cpsEnMensaje.includes(z.codigo_postal));

      if (zonasPorCP.length > 0) {
        // Si hay varias zonas con ese CP, cerciorarse con la colonia (prioritario)
        for (const zona of zonasPorCP) {
          if (zona.colonia) {
            const nombreColoniaEscapado = zona.colonia.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regexColonia = new RegExp('\\b' + nombreColoniaEscapado + '\\b', 'i');
            if (regexColonia.test(mensajeMinc)) {
              return zona; // Coincide CP y Colonia exacta
            }
          }
        }
        // Si no se cercioró ninguna colonia, devolvemos la primera del CP (no limitativo)
        return zonasPorCP[0];
      }
    }

    // 3. Si no hay CP en el mensaje o no se encontró el CP en la base de datos, 
    // buscar por nombre de colonia usando coincidencias exactas de palabra
    for (const zona of zonas) {
      if (zona.colonia) {
        const nombreColoniaEscapado = zona.colonia.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Aseguramos que la colonia tenga longitud para evitar falsos positivos
        if (nombreColoniaEscapado.length > 3) {
            const regexColonia = new RegExp('\\b' + nombreColoniaEscapado + '\\b', 'i');
            if (regexColonia.test(mensajeMinc)) {
              return zona;
            }
        }
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
