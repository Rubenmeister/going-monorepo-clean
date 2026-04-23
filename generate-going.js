const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType, BorderStyle, Footer, PageNumber } = require('docx');

const docList = [
  "TERMINOS Y CONDICIONES DE USO DE LA APLICACIÓN GOING.docx",
  "AVISO DE SERVICIOS GOING Y GLOSARIO.docx",
  "NORMATIVA DE LOS CONDUCTORES CON GOING.docx",
  "NORMATIVAS CONDUCTORES GOING.docx",
  "NORMATIVA DE LOS USUARIOS DE LA PLATAFORMA.docx",
  "MANUAL DE PLOTICAS  PARA USUARIOS GOING.docx",
  "NORMAS COMUNITARIAS GOING.docx",
  "TU PRIMER_VIAJE_CON_GOING.docx",
  "CONDUCTOR , POR QUÉ ELEGIRNOS.docx",
  "AVISO DE PRIVACIDAD  Y TRATAMIENTO DE DATOS DE GOING.docx",
  "Términos tratamiento de datos y uso de la aplicación GOING.docx",
  "AVISO DE PRIVACIDAD PARA ASPIRANTES Y EMPLEADOS DE GOING.docx",
  "Aceptación de uso de datos 2024.docx",
  "Política de cero tolerancia.docx",
  "COMPARTIR EN CASO DE EMERGENCIA.docx",
  "TECNOLOGÍA GOING Y SEGURIDAD DE LA PLATAFORMA.docx",
  "ASISTENCIA AL USUARIO GOING.docx",
  "GOING ENVIOS CONDICIONES Y NORMATIVAS.docx",
  "TERMINOS Y CONDICIONES PARA GOING ENVIOS.docx",
  "NORMATIVAS PARA GOING ENVIOS.docx",
  "ENVÍOS.  ARTÍCULOS PROHIBIDOS.docx",
  "MANEJO DE ENVIOS.docx",
  "Condiciones del programa de referidos de Going.docx",
  "Tarjeta de Regalo Going.docx",
  "Condiciones para la creación de contenido generado por el usuario.docx",
  "Política de derechos de autor de Going.docx",
  "Política de marcas registradas de Going.docx"
];

const uploadDir = "/sessions/focused-relaxed-galileo/mnt/uploads";
const outDir = "/sessions/focused-relaxed-galileo/mnt/outputs";

function extractContent(docPath) {
  try {
    const cmd = `pandoc "${docPath}" -t plain 2>/dev/null`;
    const content = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return content.trim();
  } catch (err) {
    return "";
  }
}

function cleanText(txt) {
  return txt
    .replace(/GOING Inc\./g, "Going")
    .replace(/GoingApp/g, "Going")
    .replace(/Going Inc\./g, "Going");
}

function createParas(content) {
  const lines = cleanText(content).split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
  const result = [];

  for (const line of lines) {
    if (line.match(/^[0-9]+\.\s/)) {
      result.push(new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun({ text: line.replace(/^[0-9]+\.\s/, ""), size: 22 })]
      }));
    } else if (line.match(/^[\-•]\s/)) {
      result.push(new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: line.replace(/^[\-•]\s/, ""), size: 22 })]
      }));
    } else if (line.length < 70 && line === line.toUpperCase()) {
      result.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, size: 26, color: "1A2F4B" })],
        spacing: { before: 200, after: 100 }
      }));
    } else {
      result.push(new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: 100 }
      }));
    }
  }

  return result;
}

const sections = [];

sections.push(new Paragraph({
  children: [new TextRun({ text: "GOING", bold: true, size: 80, color: "1A2F4B" })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 1440, after: 200 }
}));

sections.push(new Paragraph({
  children: [new TextRun({ text: "Documentos Legales y Normativos", size: 40, color: "1A2F4B" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 }
}));

sections.push(new Paragraph({
  children: [new TextRun({ text: "Versión Revisada 2026", size: 28, color: "666666", italics: true })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 }
}));

sections.push(new Paragraph({
  children: [new TextRun({ text: "Thorn Cía. Ltda.", size: 24, color: "333333" })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 }
}));

sections.push(new Paragraph({
  children: [new TextRun({ text: "Quito, Ecuador", size: 24, color: "333333" })],
  alignment: AlignmentType.CENTER
}));

sections.push(new Paragraph({ children: [new PageBreak()] }));

let docCount = 0;
for (let i = 0; i < docList.length; i++) {
  const docName = docList[i];
  const docPath = path.join(uploadDir, docName);
  const docNum = i + 1;

  if (fs.existsSync(docPath)) {
    console.log("Processing " + docNum + ": " + docName);
    const content = extractContent(docPath);
    if (content.length > 0) {
      docCount++;

      sections.push(new Paragraph({
        children: [new TextRun({
          text: docNum + ". " + docName.replace(/\.docx$/i, ""),
          bold: true,
          size: 32,
          color: "1A2F4B"
        })],
        spacing: { before: 200, after: 200 },
        border: { bottom: { color: "1A2F4B", space: 1, style: BorderStyle.SINGLE, size: 12 } }
      }));

      const contentParas = createParas(content);
      for (const p of contentParas) {
        sections.push(p);
      }

      if (docNum < docList.length) {
        sections.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }
  } else {
    console.log("Missing " + docNum + ": " + docName);
  }
}

console.log("Creating document with " + docCount + " documents...");

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: "bullet",
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0,
          format: "decimal",
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Thorn Cía. Ltda. · Confidencial", size: 20, color: "999999" }),
              new TextRun({ text: "  Página ", size: 20, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 20, color: "999999" })
            ],
            alignment: AlignmentType.CENTER
          })
        ]
      })
    },
    children: sections
  }]
});

const outPath = path.join(outDir, "Documentos_Legales_Going_2026.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  const stats = fs.statSync(outPath);
  console.log("Success!");
  console.log("File: " + outPath);
  console.log("Size: " + (stats.size / 1024 / 1024).toFixed(2) + " MB");
  console.log("Documents processed: " + docCount + "/27");
  process.exit(0);
});
