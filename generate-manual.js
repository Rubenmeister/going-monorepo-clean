#!/usr/bin/env node

/**
 * Manual Portal Empresas Going
 * Genera documento DOCX profesional para clientes corporativos
 */

const fs = require('fs');
const path = require('path');

// Intentar cargar docx, si falla instalar
let docx;
try {
  docx = require('docx');
} catch (e) {
  console.log('Instalando dependencia docx...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install docx', { stdio: 'inherit', cwd: __dirname });
    docx = require('docx');
  } catch (installErr) {
    console.error('Error al instalar docx:', installErr.message);
    process.exit(1);
  }
}

const { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType,
        WidthType, ShadingType, Table, TableRow, TableCell } = docx;

// Colores Going
const COLORS = { rojo: 'C0392B', azulOscuro: '1A2F4B', azulMedio: '2E5F8A' };

// Estilos
const estilo = {
  titulo: (t) => new TextRun({ text: t, bold: true, size: 32, color: COLORS.rojo, font: 'Calibri' }),
  subtitulo: (t) => new TextRun({ text: t, bold: true, size: 26, color: COLORS.azulOscuro, font: 'Calibri' }),
  seccion: (t) => new TextRun({ text: t, bold: true, size: 22, color: COLORS.azulMedio, font: 'Calibri' }),
  normal: (t) => new TextRun({ text: t, size: 22, color: '000000', font: 'Calibri' }),
  negrita: (t) => new TextRun({ text: t, bold: true, size: 22, color: '000000', font: 'Calibri' })
};

const parrafo = (contenido, options = {}) => new Paragraph({
  children: Array.isArray(contenido) ? contenido : [contenido],
  alignment: options.align || AlignmentType.LEFT,
  spacing: { line: options.spacing || 200, lineRule: 'auto' }
});

const tablaComparativa = () => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        ['Característica', 'Grande', 'Negocio (PyME)', 'Agencia'].map(h =>
          new TableCell({
            children: [parrafo(estilo.negrita(h))],
            shading: { type: ShadingType.CLEAR, color: COLORS.azulOscuro },
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        )
      ]
    }),
    new TableRow({
      children: ['Crédito', '✅ 40 días', '❌ Pago por viaje', '❌ Cobro a 15 días'].map(c =>
        new TableCell({
          children: [parrafo(c)],
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        })
      )
    }),
    new TableRow({
      children: ['Aprobaciones', '✅ Multinivel', '❌ Sin aprobaciones', '❌ Sin aprobaciones'].map(c =>
        new TableCell({
          children: [parrafo(c)],
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        })
      )
    }),
    new TableRow({
      children: ['Wallet', '✅ Consolidada', '❌ Por viaje', '✅ Consolidada'].map(c =>
        new TableCell({
          children: [parrafo(c)],
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        })
      )
    }),
    new TableRow({
      children: ['Comisión', '—', '—', '✅ 10% por viaje'].map(c =>
        new TableCell({
          children: [parrafo(c)],
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        })
      )
    })
  ]
});

const children = [
  // PORTADA
  parrafo(estilo.normal('GOING — NOS MOVEMOS CONTIGO — EST. MMXXVI'), { align: AlignmentType.CENTER }),
  new Paragraph({ children: [new TextRun({ text: '', size: 200 })] }),
  new Paragraph({ children: [new TextRun({ text: '', size: 200 })] }),
  parrafo(estilo.titulo('PORTAL EMPRESAS'), { align: AlignmentType.CENTER }),
  parrafo(estilo.subtitulo('GUÍA DE USO'), { align: AlignmentType.CENTER }),
  new Paragraph({ children: [new TextRun({ text: '', size: 200 })] }),
  parrafo(estilo.normal('Última actualización: Abril 2026'), { align: AlignmentType.CENTER }),
  new Paragraph({ children: [new TextRun({ text: '', size: 400 })] }),
  parrafo(estilo.normal('Este manual está diseñado para facilitarle el uso completo de la plataforma Going Empresas y optimizar la movilidad corporativa de su organización.'), { align: AlignmentType.CENTER }),

  new PageBreak(),

  // ÍNDICE
  parrafo(estilo.titulo('Índice de Contenidos'), { align: AlignmentType.CENTER }),
  new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),
  ...['1. Bienvenido a Going Empresas', '2. Su Tipo de Cuenta', '3. Primeros Pasos', '4. Panel de Control',
      '5. Cómo Solicitar un Viaje', '6. Seguimiento de Viajes', '7. Viajes Favoritos y Recurrentes',
      '8. Flujo de Aprobaciones', '9. Gestión de su Equipo', '10. Control de Presupuesto',
      '11. Facturación y Cobros', '12. Reportes y Análisis', '13. Tracking en Vivo', '14. Mapa en Vivo',
      '15. Seguridad en Ruta', '16. Política de Viajes', '17. Sostenibilidad y Carbono',
      '18. Cotización para Grupos', '19. Configuración de su Cuenta', '20. Condiciones Comerciales',
      '21. Canales de Atención'].map(i => parrafo(estilo.normal(i))),

  new PageBreak(),

  // SECCIÓN 1
  parrafo(estilo.titulo('1. Bienvenido a Going Empresas')),
  parrafo('Agradecemos que haya elegido Going para optimizar la movilidad corporativa de su empresa.'),
  parrafo('Con Going Empresas, usted podrá:'),
  parrafo(estilo.negrita('• Solicitar y controlar viajes en tiempo real')),
  parrafo(estilo.negrita('• Monitorear el desempeño y seguridad')),
  parrafo(estilo.negrita('• Gestionar presupuestos y controles de gasto')),
  parrafo(estilo.negrita('• Acceder a reportes detallados')),
  parrafo(estilo.negrita('• Mantener a su equipo seguro con tracking en vivo')),

  new PageBreak(),

  // SECCIÓN 2
  parrafo(estilo.titulo('2. Su Tipo de Cuenta')),
  parrafo('Going ofrece tres modalidades de cuenta corporativa.'),
  new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),
  tablaComparativa(),
  new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),

  parrafo(estilo.seccion('Cuenta Grande')),
  parrafo('Dirigida a empresas con alto volumen. Crédito 40 días, aprobaciones multinivel, wallet consolidada.'),

  parrafo(estilo.seccion('Cuenta Negocio (PyME)')),
  parrafo('Ideal para pequeñas y medianas empresas. Pago por viaje inmediato, sin aprobaciones.'),

  parrafo(estilo.seccion('Cuenta Agencia')),
  parrafo('Para agencias y operadores. Comisión 10%, cobro a 15 días, reservas a nombre de terceros.'),

  new PageBreak(),

  parrafo(estilo.titulo('3. Primeros Pasos: Acceso y Navegación')),
  parrafo(estilo.seccion('Cómo acceder')),
  parrafo('1. Ingrese a www.going.app/empresas'),
  parrafo('2. Ingrese su correo corporativo y contraseña'),
  parrafo('3. Complete el perfil de su empresa'),
  parrafo('4. Haga clic en "Ingresar"'),

  parrafo(estilo.seccion('Navegación')),
  parrafo('El menú se encuentra en la parte superior izquierda:'),
  parrafo(estilo.negrita('• Operaciones: Solicitar, tracking, favoritos')),
  parrafo(estilo.negrita('• Administración: Equipo, presupuesto, aprobaciones')),
  parrafo(estilo.negrita('• Análisis: Reportes, sostenibilidad, seguridad')),
  parrafo(estilo.negrita('• Configuración: Datos, política, integraciones')),

  new PageBreak(),

  parrafo(estilo.titulo('4. Panel de Control')),
  parrafo('Vista ejecutiva de la movilidad corporativa de este mes.'),
  parrafo(estilo.negrita('Para Cuenta Grande:')),
  parrafo('• Total de viajes • Gasto y crédito • Aprobaciones pendientes • Departamento con mayor gasto'),
  parrafo(estilo.negrita('Para Cuenta Negocio:')),
  parrafo('• Total de viajes • Gasto total • Empleado frecuente'),
  parrafo(estilo.negrita('Para Cuenta Agencia:')),
  parrafo('• Reservas realizadas • Comisiones generadas • Comisiones por cobrar'),

  new PageBreak(),

  parrafo(estilo.titulo('5. Cómo Solicitar un Viaje')),
  parrafo('La solicitud de viajes es el corazón de la plataforma.'),
  parrafo(estilo.seccion('Datos requeridos')),
  parrafo(estilo.negrita('• Origen y destino')),
  parrafo(estilo.negrita('• Tipo de servicio: Transporte, tours, experiencias')),
  parrafo(estilo.negrita('• Fecha y hora')),
  parrafo(estilo.negrita('• Número de pasajeros')),
  parrafo(estilo.negrita('• Notas adicionales')),

  parrafo(estilo.seccion('Para Agencias')),
  parrafo('Campo adicional "Nombre del cliente" para reservas a nombre de terceros.'),

  parrafo(estilo.seccion('Proceso')),
  parrafo('1. Haga clic en "Solicitar viaje"'),
  parrafo('2. Complete los campos'),
  parrafo('3. Verifique costo estimado'),
  parrafo('4. Confirme solicitud'),

  new PageBreak(),

  parrafo(estilo.titulo('6. Seguimiento de Viajes')),
  parrafo(estilo.seccion('Información disponible')),
  parrafo(estilo.negrita('• Estado: Pendiente, En ruta, Completado, Cancelado')),
  parrafo(estilo.negrita('• Fecha, hora, duración')),
  parrafo(estilo.negrita('• Ruta y distancia')),
  parrafo(estilo.negrita('• Conductor y contacto')),
  parrafo(estilo.negrita('• Costo y forma de pago')),
  parrafo(estilo.negrita('• Calificaciones')),

  parrafo(estilo.seccion('Filtros')),
  parrafo('Fecha, Estado, Empleado, Centro de costo, Rango de precio'),

  new PageBreak(),

  parrafo(estilo.titulo('7. Viajes Favoritos y Recurrentes')),
  parrafo(estilo.seccion('Favoritos')),
  parrafo('Guarde rutas frecuentes para solicitar más rápidamente.'),
  parrafo('1. Complete una solicitud normalmente'),
  parrafo('2. Marque "Guardar como favorito"'),
  parrafo('3. Asigne un nombre descriptivo'),
  parrafo('4. Confirme'),

  parrafo(estilo.seccion('Recurrentes')),
  parrafo('Configure viajes que se repiten automáticamente.'),
  parrafo('1. Haga clic en "Viajes Recurrentes"'),
  parrafo('2. Ingrese datos del viaje'),
  parrafo('3. Seleccione frecuencia: diario, semanal, quincenal, mensual'),
  parrafo('4. Indique días y horarios'),
  parrafo('5. Confirme'),

  new PageBreak(),

  parrafo(estilo.titulo('8. Flujo de Aprobaciones (Cuenta Grande)')),
  parrafo(estilo.seccion('Cómo funciona')),
  parrafo('1. Empleado solicita viaje'),
  parrafo('2. Supervisor aprueba'),
  parrafo('3. Si supera límite, escala a Finanzas'),
  parrafo('4. Al aprobar, viaje se ejecuta inmediatamente'),
  parrafo('5. Si se rechaza, empleado recibe notificación'),

  parrafo(estilo.seccion('Panel de aprobaciones')),
  parrafo('Supervisores verán un panel con solicitudes pendientes para aprobar o rechazar.'),

  new PageBreak(),

  parrafo(estilo.titulo('9. Gestión de su Equipo')),
  parrafo(estilo.seccion('Agregar nuevos usuarios')),
  parrafo('1. Acceda a "Equipo"'),
  parrafo('2. Haga clic en "Agregar empleado"'),
  parrafo('3. Ingrese correo, nombre, departamento'),
  parrafo('4. Asigne rol: Administrador, Supervisor, Empleado'),
  parrafo('5. Asigne centro de costo'),
  parrafo('6. Envíe invitación'),

  parrafo(estilo.seccion('Roles')),
  parrafo(estilo.negrita('• Administrador: Acceso total, gestión de usuarios')),
  parrafo(estilo.negrita('• Supervisor: Aprueba viajes del equipo')),
  parrafo(estilo.negrita('• Empleado: Solicita viajes, ve su historial')),

  new PageBreak(),

  parrafo(estilo.titulo('10. Control de Presupuesto')),
  parrafo('Disponible en Grandes y Negocio. Establezca límites de gasto.'),
  parrafo(estilo.seccion('Por departamento')),
  parrafo('1. Acceda a "Presupuesto"'),
  parrafo('2. Seleccione "Crear por departamento"'),
  parrafo('3. Indique monto máximo mensual'),
  parrafo('4. Configure alertas (70%, 90%, 100%)'),
  parrafo('5. Guarde'),

  parrafo(estilo.seccion('Por empleado')),
  parrafo('Establezca límites individuales para control granular.'),

  new PageBreak(),

  parrafo(estilo.titulo('11. Facturación y Cobros')),
  parrafo(estilo.seccion('Grandes y Negocio')),
  parrafo('Facturas emitidas, saldo pendiente, historial de pagos.'),
  parrafo(estilo.negrita('• Descargar en PDF y XML')),
  parrafo(estilo.negrita('• Ver saldo pendiente')),
  parrafo(estilo.negrita('• Histórico de cobros')),

  parrafo(estilo.seccion('Agencias')),
  parrafo('Módulo de comisiones:'),
  parrafo(estilo.negrita('• Generadas: 10% por viaje')),
  parrafo(estilo.negrita('• Por cobrar: A 15 días')),
  parrafo(estilo.negrita('• Resumen mensual')),

  new PageBreak(),

  parrafo(estilo.titulo('12. Reportes y Análisis')),
  parrafo(estilo.seccion('Disponibles')),
  parrafo(estilo.negrita('• Uso: Viajes, km, duración promedio')),
  parrafo(estilo.negrita('• Gasto: Por departamento, empleado')),
  parrafo(estilo.negrita('• Empleado: Viajes, gasto, cumplimiento')),
  parrafo(estilo.negrita('• Eficiencia: Costo por km, tiempo espera')),

  parrafo(estilo.seccion('Exportación')),
  parrafo('Excel o PDF para presentaciones ejecutivas.'),

  new PageBreak(),

  parrafo(estilo.titulo('13-21. Funcionalidades Adicionales')),

  parrafo(estilo.seccion('13. Tracking en Vivo')),
  parrafo('Monitoree en tiempo real los viajes activos.'),

  parrafo(estilo.seccion('14. Mapa en Vivo')),
  parrafo('Ubicación exacta de empleados con consentimiento explícito.'),

  parrafo(estilo.seccion('15. Seguridad en Ruta')),
  parrafo('Scores de 0-100: 80-100 Excelente, 60-79 Bueno, 40-59 Monitoreo, 0-39 Crítico.'),

  parrafo(estilo.seccion('16. Política de Viajes')),
  parrafo('Defina: Montos de gasto, horarios de solicitud, servicios permitidos.'),

  parrafo(estilo.seccion('17. Sostenibilidad')),
  parrafo('Mida huella de carbono, exporte para RSE y ODS 13.'),

  parrafo(estilo.seccion('18. Cotización Grupos')),
  parrafo('Solicite presupuestos para eventos corporativos.'),

  parrafo(estilo.seccion('19. Configuración')),
  parrafo('Datos empresa, facturación, usuarios, integraciones API.'),

  parrafo(estilo.seccion('20. Condiciones (Agencia)')),
  parrafo('Comisión, fechas de cobro, descuentos, términos especiales.'),

  parrafo(estilo.seccion('21. Canales de Atención')),
  parrafo(estilo.negrita('Soporte: soporte@going.app')),
  parrafo(estilo.negrita('Comercial: comercial@going.app')),
  parrafo(estilo.negrita('Producto: producto@going.app')),

  new Paragraph({ children: [new TextRun({ text: '', size: 400 })] }),
  parrafo(estilo.normal('Gracias por elegir Going. ¡Nos movemos contigo!'), { align: AlignmentType.CENTER }),
  parrafo(estilo.negrita('Going — Ecuador 2026'), { align: AlignmentType.CENTER })
];

const doc = new Document({
  sections: [{
    properties: { page: { margins: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, 'Manual_Portal_Empresas_Going.docx');
  fs.writeFileSync(outputPath, buffer);

  const sizeKB = (buffer.length / 1024).toFixed(2);
  const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

  console.log('\n========================================');
  console.log('✓ MANUAL GENERADO EXITOSAMENTE');
  console.log('========================================');
  console.log(`Ubicación: ${outputPath}`);
  console.log(`Tamaño: ${sizeKB} KB (${sizeMB} MB)`);
  console.log('Contenido: 21 secciones, tabla comparativa, tono profesional');
  console.log('========================================\n');
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
