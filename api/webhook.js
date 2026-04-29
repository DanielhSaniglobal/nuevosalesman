const { buscarTier } = require('../lib/buscador.js');
const { calcularPrecio } = require('../lib/cotizador.js');
const { generarCotizacionPDF } = require('../lib/generador_cotizacion.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed. Usa un método POST para enviar tu solicitud.'
    });
  }

  try {
    const { 
        mensaje, // CP o Ubicación
        servicio_solicitado = 'Baños Portátiles', 
        tipo_servicio = 'OBRA', 
        equipo = 'sencillo', 
        duracion = '1 mes',
        nombre = 'Cliente Kommo', 
        empresa = 'Particular', 
        telefono = 'N/A', 
        numero_cotizacion = `SG-${Date.now().toString().slice(-6)}`
    } = req.body || {};

    // 1. REGLAS DE DESVÍO A HUMANO (Triage)
    const servicioFiltro = String(servicio_solicitado).toLowerCase();
    
    if (servicioFiltro.includes('remolque')) {
        return res.status(200).json({ respuesta: 'La renta comienza desde $31,000 + IVA por día. Un ejecutivo le contactará para afinar detalles.' });
    }
    
    if (servicioFiltro.includes('fosa')) {
        return res.status(200).json({ respuesta: 'Necesitamos validar el inventario en su zona. Un asesor le confirmará en minutos.' });
    }

    if (servicioFiltro.includes('limpieza')) {
        return res.status(200).json({ respuesta: 'Como cada proyecto es único, un asesor especializado revisará los detalles con usted.' });
    }

    // Normalización de 'lava manos' a 'Lavamanos'
    let equipoNorm = String(equipo).replace(/lava\s*manos/ig, 'Lavamanos');
    // Para asegurar mayúscula si escriben 'lavamanos'
    equipoNorm = equipoNorm.replace(/lavamanos/ig, 'Lavamanos');

    if (!mensaje) {
      return res.status(200).json({ respuesta: 'Por favor, indícanos tu Código Postal para validar tu zona y darte el precio exacto.' });
    }

    const zona = await buscarTier(mensaje);

    if (!zona) {
      return res.status(200).json({ respuesta: 'No logramos identificar tu zona. Por favor, compártenos tu Código Postal o verifica el nombre de tu colonia para darte el precio exacto.' });
    }

    const tier = zona.municipio_id;

    // 3. Cálculos Avanzados de Precios 
    const precioFinal = calcularPrecio(tier, tipo_servicio, equipoNorm, duracion);

    if (precioFinal === null) {
      return res.status(500).json({ error: 'Hubo un error al calcular el precio.' });
    }

    // Convertir si calcularPrecio detectó eventos de varios días
    const precioFormat = new Intl.NumberFormat('es-MX', { 
        style: 'decimal', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(precioFinal);

    // 4. Generación de PDF
    // Extraemos la cantidad de baños (opcional). Por ahora forzamos a 1 para la base del PDF (o tomable desde body si lo tienen)
    const Numero_banios = parseInt(req.body.Numero_banios, 10) || 1;

    const datosLead = {
        numero_cotizacion,
        nombre,
        empresa,
        telefono,
        ubicacion: zona.colonia,
        Tipo_banio: `${tipo_servicio} - ${equipoNorm}`, // Ej: OBRA - Lavamanos
        periodo: duracion,
        Numero_banios,
        unitario: precioFinal // Unitario final ya tiene descuentos
    };
    
    const { urlCloudConvertTmp } = await generarCotizacionPDF(datosLead);

    // 5. Respuesta Final
    const textoRespuesta = `¡Hola! Para la colonia ${zona.colonia}, el precio de renta de sanitario es de $${precioFormat} + IVA.`;

    return res.status(200).json({ 
        respuesta: textoRespuesta,
        link_pdf: urlCloudConvertTmp
    });

  } catch (error) {
    console.error("Error procesando Webhook:", error);
    return res.status(500).json({ error: 'Hubo un error interno procesando tu solicitud.' });
  }
}

