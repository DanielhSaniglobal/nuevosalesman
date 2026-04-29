const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const CloudConvert = require('cloudconvert');

function formatoPesos(monto) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(monto);
}

/**
 * Punto de entrada: Genera un buffer de memoria de un archivo DOCX relleno con la data del cliente.
 */
function generarCotizacionWordBuffer(datosLead) {
  const rutaPlantilla = path.join(__dirname, '..', 'assets', 'Documento sin título.docx');
  const contenidoPlantilla = fs.readFileSync(rutaPlantilla, 'binary');
  const zip = new PizZip(contenidoPlantilla);

  let xml = zip.file("word/document.xml").asText();
  xml = xml.replace(/\{/g, '«').replace(/\}/g, '»');
  xml = xml.replace(/«(<[^>]+>)*«/g, '«$1');
  xml = xml.replace(/»(<[^>]+>)*»/g, '»$1');
  xml = xml.replace(/«+/g, '«').replace(/»+/g, '»');
  zip.file("word/document.xml", xml);

  let doc;
  try {
    doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '«', end: '»' },
      nullGetter(part) { return part.module ? null : ""; }
    });
  } catch (error) {
    throw new Error('Error inicializando docxtemplater: ' + error.message);
  }

  const numeroBanios = parseInt(datosLead.Numero_banios) || 1;
  const precioUnitario = parseFloat(datosLead.unitario) || 0;
  const subtotal = numeroBanios * precioUnitario;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const fechaActual = new Date();
  const dia = String(fechaActual.getDate()).padStart(2, '0');
  const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
  const anio = fechaActual.getFullYear();
  const fechaStr = `${dia}/${mes}/${anio}`;

  const dict = {
    numero_cotizacion: datosLead.numero_cotizacion || 'S/N',
    nombre: datosLead.nombre,
    empresa: datosLead.empresa,
    telefono: datosLead.telefono,
    ubicacion: datosLead.ubicacion,
    Tipo_banio: datosLead.Tipo_banio,
    periodo: datosLead.periodo,
    Numero_banios: numeroBanios,

    fecha: fechaStr,
    unitario: formatoPesos(precioUnitario),
    subtotal: formatoPesos(subtotal),
    IVA: formatoPesos(iva),
    total: formatoPesos(total)
  };

  doc.render(dict);

  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return { buffer, variables: dict };
}

/**
 * Devuelve un archivo local para pruebas que no requieran gastar créditos de PDF.
 */
function generarCotizacionWord(datosLead, rutaSalida) {
  const result = generarCotizacionWordBuffer(datosLead);
  fs.writeFileSync(rutaSalida, result.buffer);
  return result.variables;
}

/**
 * Toma los datos del cliente, genera el Word invisible, lo sube a CloudConvert
 * y devuelve o guarda el PDF nativamente.
 */
async function generarCotizacionPDF(datosLead, rutaSalidaPDF = null) {
  if (!process.env.CLOUDCONVERT_KEY) {
      throw new Error("No hay llave de CloudConvert configurada en las variables de entorno.");
  }
  
  const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_KEY);
  
  // 1. Generamos el Word cerrado
  const { buffer, variables } = generarCotizacionWordBuffer(datosLead);
  const bufferBase64 = buffer.toString('base64');
  
  // 2. Tarea Múltiple en CloudConvert con payload crudo en memoria
  let job = await cloudConvert.jobs.create({
      "tasks": {
          "import-word": {
              "operation": "import/base64",
              "file": bufferBase64,
              "filename": "Cotizacion.docx"
          },
          "convert-to-pdf": {
              "operation": "convert",
              "input": "import-word",
              "output_format": "pdf"
          },
          "export-pdf": {
              "operation": "export/url",
              "input": "convert-to-pdf"
          }
      }
  });

  // 3. Esperar a que rendericen el PDF
  job = await cloudConvert.jobs.wait(job.id);
  
  // 4. Extraer el archivo convertido de retorno
  const fileExport = job.tasks.find(task => task.name === 'export-pdf').result.files[0];
  
  // 5. Descargarlo como memoria binaria (buffer) local
  const response = await fetch(fileExport.url);
  const arrayBuffer = await response.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  // 6. Si queremos guardarlo en disco para las pruebas locales
  if (rutaSalidaPDF) {
      fs.writeFileSync(rutaSalidaPDF, pdfBuffer);
  }
  
  return { pdfBuffer, urlCloudConvertTmp: fileExport.url, variables };
}

module.exports = {
  generarCotizacionWord,
  generarCotizacionWordBuffer,
  generarCotizacionPDF
};
