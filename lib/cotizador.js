/**
 * Calcula el precio final de acuerdo al tier de zona, el tipo de servicio y el tiempo.
 * 
 * @param {number|string} tier - Tier de la zona (ej. 1, 2, 3...)
 * @param {string} tipoServicio - 'OBRA' o 'EVENTO'
 * @param {string} tiempo - Duración del servicio para OBRA (ej. '1 semana', '15 dias', '21 dias', '1 mes')
 * @returns {number|null} El precio final o null si no se encuentra un precio base o ocurre un error.
 */
function calcularPrecio(tier, tipoServicio, tiempo) {
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

  // Extraemos el número del tier si por algún motivo recibimos una cadena como "Tier 1"
  const tierNum = parseInt(String(tier).replace(/\D/g, ''), 10) || tier;

  if (tipoServicio === 'EVENTO') {
    return preciosEvento[tierNum] || null;
  }

  if (tipoServicio === 'OBRA') {
    const precioBase = preciosObra[tierNum];
    if (precioBase === undefined) {
      return null;
    }

    let descuento = 0;
    switch (tiempo) {
      case '1 semana':
        descuento = 0.10;
        break;
      case '15 dias':
        descuento = 0.07;
        break;
      case '21 dias':
        descuento = 0.04;
        break;
      case '1 mes':
        descuento = 0.00;
        break;
      default:
        // Si el tiempo no coincide, no se aplica descuento por defecto
        descuento = 0.00;
        break;
    }

    const precioFinal = precioBase * (1 - descuento);
    return precioFinal;
  }

  return null;
}

module.exports = {
  calcularPrecio
};
