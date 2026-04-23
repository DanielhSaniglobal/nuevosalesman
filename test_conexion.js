require('dotenv').config();
const { buscarTier } = require('./lib/buscador.js');

async function test() {
  console.log("==========================================");
  console.log("Probando la conexión y búsqueda en Supabase...");
  console.log("==========================================\n");

  try {
    // Prueba 1: Búsqueda por Código Postal
    console.log("------------------------------------------");
    console.log("Prueba 1: Buscando por código postal (44160)");
    console.log("------------------------------------------");
    const resultadoCP = await buscarTier('44160');
    
    if (resultadoCP) {
      console.log("✅ Resultado encontrado por Código Postal:");
      console.dir(resultadoCP, { depth: null, colors: true });
    } else {
      console.log("❌ No se encontró ningún resultado para el CP 44160.");
    }
    
    // Prueba 2: Búsqueda por palabra en la Colonia
    console.log("\n------------------------------------------");
    console.log("Prueba 2: Buscando por parte del nombre de colonia ('Americana')");
    console.log("------------------------------------------");
    const resultadoColonia = await buscarTier('Americana');
    
    if (resultadoColonia) {
      console.log("✅ Resultado encontrado por nombre de Colonia:");
      console.dir(resultadoColonia, { depth: null, colors: true });
    } else {
      console.log("❌ No se encontró ningún resultado para la colonia 'Americana'.");
    }

  } catch (error) {
    console.error("Hubo un error de ejecución:", error);
  }
}

test();
