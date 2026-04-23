const { buscarTier } = require('../lib/buscador.js');
const { calcularPrecio } = require('../lib/cotizador.js');

module.exports = async function handler(req, res) {
  // Asegurarnos de que sólo se reciban peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed. Usa un método POST para enviar tu solicitud.'
    });
  }

  try {
    // 1. Extraer el texto enviado (simulamos que viene en un campo "mensaje")
    const { mensaje } = req.body || {};

    if (!mensaje) {
      return res.status(400).json({ 
        error: 'Petición inválida. Por favor incluye el texto a buscar en el campo "mensaje".' 
      });
    }

    // 2. Usar el buscador para ubicar el CP o la Colonia dentro de Supabase
    const zona = await buscarTier(mensaje);

    if (!zona) {
      return res.status(404).json({ 
        respuesta: '¡Hola! Lamentablemente no pudimos encontrar cobertura para esa colonia o código postal.' 
      });
    }

    // 3. Tomar el Tier y fijar los parámetros por defecto
    const tier = zona.municipio_id;
    const tipoServicio = 'OBRA';
    const tiempo = '1 mes';

    // Usar el cotizador para calcular el precio
    const precioBase = calcularPrecio(tier, tipoServicio, tiempo);

    if (precioBase === null) {
      return res.status(500).json({ 
        error: 'Hubo un error al calcular el precio asignado para tu zona y tipo de servicio.' 
      });
    }

    // Formatear numéricamente el monto para que sea visiblemente atractivo (ej: 2,000.00)
    const precioFormat = new Intl.NumberFormat('es-MX', { 
        style: 'decimal', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(precioBase);

    // 4. Armar el texto amigable como respuesta
    const textoRespuesta = `¡Hola! Para la colonia ${zona.colonia}, el precio de renta de sanitario es de $${precioFormat} + IVA.`;

    // Retorna un objeto en JSON con la respuesta final lista para el CRM o Bot.
    return res.status(200).json({ respuesta: textoRespuesta });

  } catch (error) {
    console.error("Error procesando Webhook:", error);
    return res.status(500).json({ error: 'Hubo un error interno procesando tu solicitud.' });
  }
}
