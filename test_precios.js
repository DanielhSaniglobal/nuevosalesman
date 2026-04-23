require('dotenv').config();
const { buscarTier } = require('./lib/buscador.js');
const { calcularPrecio } = require('./lib/cotizador.js');

async function testPrecios() {
  console.log("==================================================");
  console.log("Simulando Cotización Completa de Saniglobal...");
  console.log("==================================================\n");

  try {
    console.log("paso 1: Buscando zona por código postal (44160)");
    const zona = await buscarTier('44160');

    if (!zona) {
      console.log("❌ Error: No se encontró el CP en la base de datos.");
      return;
    }

    // Aquí extraemos el municipio_id que funge como el 'Tier'
    const tier = zona.municipio_id;
    console.log(`✅ Zona encontrada: ${zona.colonia} | Tier asignado: ${tier}`);

    // Parámetros de prueba
    const tipoServicio = 'OBRA';
    const tiempo = '1 semana';

    console.log(`\npaso 2: Generando cálculo...`);
    console.log(`  - Tipo de Servicio: ${tipoServicio}`);
    console.log(`  - Duración: ${tiempo}`);

    // Ejecutamos la función
    const precioFinal = calcularPrecio(tier, tipoServicio, tiempo);

    if (precioFinal !== null) {
      // Formatear a formato de moneda local 
      const precioMoneda = new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
      }).format(precioFinal);

      console.log(`\n==================================================`);
      console.log(`💲 RESULTADO ESPERADO: ${precioMoneda}`);
      console.log(`==================================================`);

      if (precioFinal === 1800) {
         console.log("✅ ¡Tu prueba es exitosa! Se aplicó el 10% correctamente sobre los $2,000 base del Tier 1.");
      } else {
         console.log("⚠️ Advertencia: El resultado esperado de $1,800.00 no coincidió.");
      }

    } else {
      console.log("❌ Error: No se pudo calcular el precio. Verifica el Tier y los parámetros.");
    }
  } catch (error) {
    console.error("Hubo un error de ejecución en la prueba:", error);
  }
}

testPrecios();
