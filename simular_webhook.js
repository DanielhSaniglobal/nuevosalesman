require('dotenv').config();

// Importamos la función de nuestro archivo Webhook
const webhookHandler = require('./api/webhook.js');

async function simularPeticion() {
  console.log("==================================================");
  console.log("📨 Simulando petición POST conectándose al Webhook");
  console.log("==================================================\n");

  // Vercel y Express usan estos objetos (req, res), así que nosotros enviamos
  // algo con una estructura idéntica a lo que llegaría en una petición web real:
  const reqMock = {
    method: 'POST',
    body: {
      mensaje: 'Necesito un baño en la Americana'
    }
  };

  console.log("Cuerpo de la petición simulada:");
  console.log(reqMock.body);
  console.log("\nProcesando evento interno...");

  // Este objeto res falso nos permitirá capturar y pintar la 
  // respuesta que nuestro código en webhook.js intenta enviar (el json)
  const resMock = {
    status: function(statusCode) {
      this.statusCode = statusCode;
      return this; // Para permitir el encadenamiento `res.status().json()`
    },
    json: function(data) {
      console.log(`\n==================================================`);
      console.log(`🌐 RESPUESTA RECIBIDA [Estado HTTP: ${this.statusCode || 200}]`);
      console.log(`==================================================`);
      console.dir(data, { depth: null, colors: true });
    }
  };

  try {
    // Al ejecutar la función del webhook con estos mockups, el script 
    // pensará que recibió un POST del navegador/CRM.
    await webhookHandler(reqMock, resMock);
  } catch (error) {
    console.error("Hubo un error ejecutando la simulación:", error);
  }
}

simularPeticion();
