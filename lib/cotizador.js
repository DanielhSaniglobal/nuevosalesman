/**
 * Calcula el precio final de acuerdo al tier de zona, el tipo de servicio y el tiempo.
 * 
 * @param {number|string} tier - Tier de la zona (ej. 1, 2, 3...)
 * @param {string} tipoServicio - 'OBRA' o 'EVENTO'
 * @param {string} tiempo - Duración del servicio para OBRA (ej. '1 semana', '15 dias', '21 dias', '1 mes')
 * @returns {number|null} El precio final o null si no se encuentra un precio base o ocurre un error.
 */
function calcularPrecio(tier, tipoServicio, equipo, tiempoODuracion) {
  const preciosObra = {
    1: 2000,
    2: 2100,
    3: 2000,
    4: 2300,
    5: 2500,
    6: 1300,
    7: 2800
  };

  const preciosEvento = {
    1: 1550,
    2: 1600,
    3: 1650,
    4: 1900,
    5: 2000,
    6: 1000,
    7: 2400
  };

  // Extraemos el número del tier
  const tierNum = parseInt(String(tier).replace(/\D/g, ''), 10) || tier;

  if (tipoServicio === 'EVENTO') {
    let precioBaseDia = preciosEvento[tierNum];
    if (precioBaseDia === undefined) return null;

    // Regla de Negocio: Si piden 'solo lavamanos', restamos $400 a la base del tier
    if (String(equipo).toLowerCase().includes('solo lavamanos')) {
      precioBaseDia -= 400;
    }

    // Duración de un evento llega en días, forzamos un parseo robusto para asegurarnos de que sea multplicador (Mínimo 1 día)
    let dias = parseInt(String(tiempoODuracion).replace(/\D/g, ''), 10) || 1;
    // Si la cadena de texto no tenía números pero es válido, lo dejamos en 1 por defecto.
    return precioBaseDia * dias;
  }

  if (tipoServicio === 'OBRA') {
    let precioBaseMes = preciosObra[tierNum];
    if (precioBaseMes === undefined) {
      return null;
    }

    // Regla de Negocio: Si piden 'solo lavamanos', restamos $400 a la base del tier
    if (String(equipo).toLowerCase().includes('solo lavamanos')) {
      precioBaseMes -= 400;
    }

    let descuento = 0;
    const tiempoDesc = String(tiempoODuracion).toLowerCase();

    // Verificadores flexivos de porcentaje 
    if (tiempoDesc.includes('1 semana')) {
      descuento = 0.10;
    } else if (tiempoDesc.includes('15 dia') || tiempoDesc.includes('15 día')) {
      descuento = 0.07;
    } else if (tiempoDesc.includes('21 dia') || tiempoDesc.includes('21 día')) {
      descuento = 0.04;
    } else if (tiempoDesc.includes('mes')) {
      descuento = 0.00;
    }

    const precioFinal = precioBaseMes * (1 - descuento);
    return precioFinal;
  }

  return null;
}

module.exports = {
  calcularPrecio
};
