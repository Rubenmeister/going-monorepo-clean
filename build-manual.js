#!/usr/bin/env node

// Script para generar manual corporativo de Going
// Usa require dinámico para manejar módulos

const path = require('path');
const fs = require('fs');

// Intentar importar docx, instalarlo si no existe
let docx;
try {
  docx = require('docx');
} catch (e) {
  console.log('Instalando dependencia docx...');
  require('child_process').execSync('npm install docx', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  docx = require('docx');
}

const { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType,
        WidthType, ShadingType, Table, TableRow, TableCell } = docx;

// Colores Going
const COLORS = {
  rojo: 'C0392B',
  azulOscuro: '1A2F4B',
  azulMedio: '2E5F8A'
};

// Utilidades de formato
const estilo = {
  titulo: (texto) => new TextRun({
    text: texto,
    bold: true,
    size: 32,
    color: COLORS.rojo,
    font: 'Calibri'
  }),

  subtitulo: (texto) => new TextRun({
    text: texto,
    bold: true,
    size: 26,
    color: COLORS.azulOscuro,
    font: 'Calibri'
  }),

  seccion: (texto) => new TextRun({
    text: texto,
    bold: true,
    size: 22,
    color: COLORS.azulMedio,
    font: 'Calibri'
  }),

  normal: (texto) => new TextRun({
    text: texto,
    size: 22,
    color: '000000',
    font: 'Calibri'
  }),

  negrita: (texto) => new TextRun({
    text: texto,
    bold: true,
    size: 22,
    color: '000000',
    font: 'Calibri'
  })
};

// Función para crear párrafo con espaciado
const parrafo = (contenido, options = {}) => {
  const {
    align = AlignmentType.LEFT,
    spacing = 200,
    indent = 0
  } = options;

  return new Paragraph({
    children: Array.isArray(contenido) ? contenido : [contenido],
    alignment: align,
    spacing: { line: spacing, lineRule: 'auto' },
    indent: indent > 0 ? { left: indent, firstLine: indent } : {}
  });
};

// Función para crear tabla de comparación
const tablaComparativa = () => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Encabezado
      new TableRow({
        children: [
          new TableCell({
            children: [parrafo(estilo.negrita('Característica'))],
            shading: { type: ShadingType.CLEAR, color: COLORS.azulOscuro },
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo(estilo.negrita('Grande'))],
            shading: { type: ShadingType.CLEAR, color: COLORS.azulOscuro },
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo(estilo.negrita('Negocio (PyME)'))],
            shading: { type: ShadingType.CLEAR, color: COLORS.azulOscuro },
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo(estilo.negrita('Agencia'))],
            shading: { type: ShadingType.CLEAR, color: COLORS.azulOscuro },
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        ]
      }),
      // Crédito
      new TableRow({
        children: [
          new TableCell({
            children: [parrafo(estilo.negrita('Crédito'))],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('✅ 40 días')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('❌ Pago por viaje')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('❌ Cobro a 15 días')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        ]
      }),
      // Aprobaciones
      new TableRow({
        children: [
          new TableCell({
            children: [parrafo(estilo.negrita('Aprobaciones'))],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('✅ Multinivel')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('❌ Sin aprobaciones')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('❌ Sin aprobaciones')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        ]
      }),
      // Wallet
      new TableRow({
        children: [
          new TableCell({
            children: [parrafo(estilo.negrita('Wallet'))],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('✅ Consolidada')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('❌ Por viaje')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('✅ Consolidada')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        ]
      }),
      // Comisión
      new TableRow({
        children: [
          new TableCell({
            children: [parrafo(estilo.negrita('Comisión'))],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('—')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('—')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }),
          new TableCell({
            children: [parrafo('✅ 10% por viaje')],
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        ]
      })
    ]
  });
};

// Estructura del documento - Simplified version con contenido clave
const children = [
  // ===== PORTADA =====
  new Paragraph({
    children: [estilo.normal('GOING — NOS MOVEMOS CONTIGO — EST. MMXXVI')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  }),
  new Paragraph({
    children: [new TextRun({ text: '', size: 200 })]
  }),
  new Paragraph({
    children: [new TextRun({ text: '', size: 200 })]
  }),
  new Paragraph({
    children: [estilo.titulo('PORTAL EMPRESAS')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  }),
  new Paragraph({
    children: [estilo.subtitulo('GUÍA DE USO')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  }),
  new Paragraph({
    children: [new TextRun({ text: '', size: 200 })]
  }),
  new Paragraph({
    children: [estilo.normal('Última actualización: Abril 2026')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  }),
  new Paragraph({
    children: [new TextRun({ text: '', size: 200 })]
  }),
  new Paragraph({
    children: [new TextRun({ text: '', size: 200 })]
  }),
  new Paragraph({
    children: [new TextRun({ text: '', size: 200 })]
  }),
  new Paragraph({
    children: [estilo.normal('Este manual está diseñado para facilitarle el uso completo de la plataforma Going Empresas y optimizar la movilidad corporativa de su organización.')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  }),

  new PageBreak(),

  // ===== ÍNDICE =====
  new Paragraph({
    children: [estilo.titulo('Índice de Contenidos')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  }),
  new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),
  parrafo(estilo.normal('1. Bienvenido a Going Empresas')),
  parrafo(estilo.normal('2. Su Tipo de Cuenta')),
  parrafo(estilo.normal('3. Primeros Pasos: Acceso y Navegación')),
  parrafo(estilo.normal('4. Panel de Control')),
  parrafo(estilo.normal('5. Cómo Solicitar un Viaje')),
  parrafo(estilo.normal('6. Seguimiento de Viajes')),
  parrafo(estilo.normal('7. Viajes Favoritos y Recurrentes')),
  parrafo(estilo.normal('8. Flujo de Aprobaciones (Cuenta Grande)')),
  parrafo(estilo.normal('9. Gestión de su Equipo')),
  parrafo(estilo.normal('10. Control de Presupuesto')),
  parrafo(estilo.normal('11. Facturación y Cobros')),
  parrafo(estilo.normal('12. Reportes y Análisis')),
  parrafo(estilo.normal('13. Tracking en Vivo')),
  parrafo(estilo.normal('14. Mapa en Vivo')),
  parrafo(estilo.normal('15. Seguridad en Ruta')),
  parrafo(estilo.normal('16. Política de Viajes Corporativos')),
  parrafo(estilo.normal('17. Sostenibilidad y Huella de Carbono')),
  parrafo(estilo.normal('18. Cotización para Grupos')),
  parrafo(estilo.normal('19. Configuración de su Cuenta')),
  parrafo(estilo.normal('20. Condiciones Comerciales (Agencia)')),
  parrafo(estilo.normal('21. Canales de Atención')),

  new PageBreak(),

  // ===== SECCIÓN 1 =====
  new Paragraph({
    children: [estilo.titulo('1. Bienvenido a Going Empresas')],
    spacing: { line: 240 }
  }),
  parrafo('Agradecemos que haya elegido Going para optimizar la movilidad corporativa de su empresa. Esta plataforma le permite gestionar de manera centralizada todos los traslados, transporte y experiencias de movilidad de su equipo.'),
  parrafo('Con Going Empresas, usted podrá:'),
  parrafo(estilo.negrita('• Solicitar y controlar viajes en tiempo real')),
  parrafo(estilo.negrita('• Monitorear el desempeño y seguridad de la movilidad corporativa')),
  parrafo(estilo.negrita('• Gestionar presupuestos y controles de gasto')),
  parrafo(estilo.negrita('• Acceder a reportes detallados de movilidad y sostenibilidad')),
  parrafo(estilo.negrita('• Mantener a su equipo seguro con tracking en vivo y scoring de seguridad')),
  parrafo('Este manual le guiará paso a paso a través de cada funcionalidad disponible en su portal.'),

  new PageBreak(),

  // ===== SECCIÓN 2 =====
  new Paragraph({
    children: [estilo.titulo('2. Su Tipo de Cuenta')],
    spacing: { line: 240 }
  }),
  parrafo('Going ofrece tres modalidades de cuenta corporativa, cada una diseñada para diferentes necesidades y volúmenes de operación.'),
  new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),

  tablaComparativa(),

  new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),

  new Paragraph({
    children: [estilo.seccion('Cuenta Grande')],
    spacing: { line: 240 }
  }),
  parrafo('Dirigida a empresas con alto volumen de traslados. Acceso a crédito de 40 días, flujo de aprobaciones multinivel configurable, wallet consolidada y máximo control administrativo.'),

  new Paragraph({
    children: [estilo.seccion('Cuenta Negocio (PyME)')],
    spacing: { line: 240 }
  }),
  parrafo('Ideal para pequeñas y medianas empresas. Modelo de pago por viaje: cada transacción se cobra de inmediato.'),

  new Paragraph({
    children: [estilo.seccion('Cuenta Agencia')],
    spacing: { line: 240 }
  }),
  parrafo('Para agencias de viajes, operadores turísticos y terceros. Modelo de comisión del 10% sobre cada viaje, cobro consolidado a 15 días.'),

  new PageBreak(),

  // ===== SECCIÓN 3 =====
  new Paragraph({
    children: [estilo.titulo('3. Primeros Pasos: Acceso y Navegación')],
    spacing: { line: 240 }
  }),

  new Paragraph({
    children: [estilo.seccion('Cómo acceder a su portal')],
    spacing: { line: 240 }
  }),
  parrafo('1. Ingrese a www.going.app/empresas desde su navegador'),
  parrafo('2. Ingrese su correo corporativo y contraseña'),
  parrafo('3. Si es la primera vez, le solicitaremos completar el perfil de su empresa'),
  parrafo('4. Haga clic en "Ingresar" para acceder al portal'),

  new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),

  new Paragraph({
    children: [estilo.seccion('Navegación del Portal')],
    spacing: { line: 240 }
  }),
  parrafo('El menú principal se encuentra en la parte superior izquierda. Desde allí podrá acceder a todos los módulos.'),
  parrafo(estilo.negrita('• Operaciones: Solicitar viajes, tracking, favoritos')),
  parrafo(estilo.negrita('• Administración: Equipo, presupuesto, aprobaciones')),
  parrafo(estilo.negrita('• Análisis: Reportes, sostenibilidad, seguridad')),
  parrafo(estilo.negrita('• Configuración: Datos de empresa, política de viajes')),

  new PageBreak(),

  // ===== SECCIÓN 4 =====
  new Paragraph({
    children: [estilo.titulo('4. Panel de Control')],
    spacing: { line: 240 }
  }),
  parrafo('El panel de control es su vista ejecutiva de la movilidad corporativa de este mes.'),

  new Paragraph({
    children: [estilo.seccion('Indicadores principales')],
    spacing: { line: 240 }
  }),

  new Paragraph({
    children: [estilo.negrita('Para Cuenta Grande:')],
    spacing: { line: 200 }
  }),
  parrafo('• Total de viajes realizados este mes'),
  parrafo('• Monto total gastado y monto disponible en crédito'),
  parrafo('• Viajes pendientes de aprobación'),
  parrafo('• Departamento con mayor gasto'),
  parrafo('• Calificación promedio de viajes'),

  new Paragraph({
    children: [estilo.negrita('Para Cuenta Negocio (PyME):')],
    spacing: { line: 200 }
  }),
  parrafo('• Total de viajes realizados este mes'),
  parrafo('• Monto total gastado'),
  parrafo('• Empleado con más viajes'),
  parrafo('• Calificación promedio de viajes'),

  new Paragraph({
    children: [estilo.negrita('Para Cuenta Agencia:')],
    spacing: { line: 200 }
  }),
  parrafo('• Total de reservas realizadas este mes'),
  parrafo('• Comisiones generadas'),
  parrafo('• Comisiones pendientes de cobro'),
  parrafo('• Cliente frecuente'),

  new PageBreak(),

  // ===== SECCIÓN 5 =====
  new Paragraph({
    children: [estilo.titulo('5. Cómo Solicitar un Viaje')],
    spacing: { line: 240 }
  }),
  parrafo('La solicitud de viajes es el corazón de la plataforma. Desde aquí, su equipo podrá reservar transporte inmediato, tours, experiencias y servicios de logística.'),

  new Paragraph({
    children: [estilo.seccion('Datos requeridos')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('• Lugar de origen y destino')),
  parrafo('  Seleccione desde el mapa o escriba la dirección específica'),
  parrafo(estilo.negrita('• Tipo de servicio')),
  parrafo('  Transporte, tours, experiencias o envíos'),
  parrafo(estilo.negrita('• Fecha y hora de partida')),
  parrafo('  Ahora mismo o una fecha y hora futura'),
  parrafo(estilo.negrita('• Número de pasajeros')),
  parrafo('  Según el tipo de vehículo requerido'),

  new Paragraph({
    children: [estilo.seccion('Campo adicional para Agencias')],
    spacing: { line: 240 }
  }),
  parrafo('Si su cuenta es de Agencia, verá un campo adicional "Nombre del cliente". Complete este campo con el nombre de la persona a nombre de quien realiza la reserva.'),

  new Paragraph({
    children: [estilo.seccion('Proceso de solicitud')],
    spacing: { line: 240 }
  }),
  parrafo('1. Haga clic en "Solicitar viaje"'),
  parrafo('2. Complete todos los campos requeridos'),
  parrafo('3. Verifique el costo estimado'),
  parrafo('4. Haga clic en "Confirmar solicitud"'),
  parrafo('5. Dependiendo de su tipo de cuenta, el viaje será aprobado automáticamente (Negocio) o pasará al flujo de aprobaciones (Grande).'),

  new PageBreak(),

  // ===== SECCIÓN 6 =====
  new Paragraph({
    children: [estilo.titulo('6. Seguimiento de Viajes')],
    spacing: { line: 240 }
  }),
  parrafo('El módulo de Gestión de Viajes le permite ver el historial completo de todos los viajes de su empresa.'),

  new Paragraph({
    children: [estilo.seccion('Información disponible')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('• Estado del viaje: Pendiente, En ruta, Completado, Cancelado')),
  parrafo(estilo.negrita('• Fecha, hora y duración')),
  parrafo(estilo.negrita('• Ruta y distancia recorrida')),
  parrafo(estilo.negrita('• Conductor asignado y datos de contacto')),
  parrafo(estilo.negrita('• Costo final y forma de pago')),
  parrafo(estilo.negrita('• Calificación de pasajero y conductor')),

  new Paragraph({
    children: [estilo.seccion('Filtros y búsqueda')],
    spacing: { line: 240 }
  }),
  parrafo('Puede filtrar viajes por: Fecha, Estado, Empleado, Centro de costo, Rango de precio'),

  new PageBreak(),

  // ===== SECCIÓN 7 =====
  new Paragraph({
    children: [estilo.titulo('7. Viajes Favoritos y Recurrentes')],
    spacing: { line: 240 }
  }),

  new Paragraph({
    children: [estilo.seccion('Viajes Favoritos')],
    spacing: { line: 240 }
  }),
  parrafo('Guarde sus rutas frecuentes como favoritos para solicitar viajes más rápidamente.'),
  parrafo('1. Complete una solicitud de viaje normalmente'),
  parrafo('2. Antes de confirmar, marque "Guardar como favorito"'),
  parrafo('3. Asigne un nombre descriptivo a la ruta'),
  parrafo('4. Confirme el viaje'),

  new Paragraph({
    children: [estilo.seccion('Viajes Recurrentes')],
    spacing: { line: 240 }
  }),
  parrafo('Configure viajes que se repiten automáticamente. Por ejemplo, traslado de ejecutivos todos los lunes a las 8 a.m.'),
  parrafo('Los viajes recurrentes se solicitan automáticamente en las fechas programadas y seguirán el mismo flujo de aprobaciones que los viajes manuales.'),

  new PageBreak(),

  // ===== SECCIÓN 8 =====
  new Paragraph({
    children: [estilo.titulo('8. Flujo de Aprobaciones (Cuenta Grande)')],
    spacing: { line: 240 }
  }),
  parrafo('Las cuentas Grande cuentan con un robusto flujo de aprobaciones multinivel. Esto permite que su empresa establezca controles de gasto.'),

  new Paragraph({
    children: [estilo.seccion('Cómo funciona el flujo')],
    spacing: { line: 240 }
  }),
  parrafo('1. El empleado solicita el viaje'),
  parrafo('2. El supervisor recibe la solicitud para aprobación'),
  parrafo('3. Si supera el límite establecido, se escala a Finanzas'),
  parrafo('4. Una vez aprobado, el viaje se ejecuta inmediatamente'),
  parrafo('5. Si se rechaza, el empleado recibe notificación con el motivo'),

  new PageBreak(),

  // ===== SECCIÓN 9 =====
  new Paragraph({
    children: [estilo.titulo('9. Gestión de su Equipo')],
    spacing: { line: 240 }
  }),
  parrafo('Agregue y gestione los usuarios de su empresa que tendrán acceso al portal.'),

  new Paragraph({
    children: [estilo.seccion('Agregar nuevos usuarios')],
    spacing: { line: 240 }
  }),
  parrafo('1. Acceda a "Equipo" en el menú principal'),
  parrafo('2. Haga clic en "Agregar empleado"'),
  parrafo('3. Ingrese correo corporativo, nombre y departamento'),
  parrafo('4. Asigne un rol (Administrador, Supervisor, Empleado)'),
  parrafo('5. Asigne centro de costo (opcional)'),
  parrafo('6. Envíe la invitación'),

  new Paragraph({
    children: [estilo.seccion('Roles disponibles')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('• Administrador: Acceso total al portal, gestión de usuarios')),
  parrafo(estilo.negrita('• Supervisor: Aprueba viajes de su equipo')),
  parrafo(estilo.negrita('• Empleado: Solicita viajes y ve su propio historial')),

  new PageBreak(),

  // ===== SECCIÓN 10 =====
  new Paragraph({
    children: [estilo.titulo('10. Control de Presupuesto')],
    spacing: { line: 240 }
  }),
  parrafo('Disponible en cuentas Grande y Negocio. Establezca límites de gasto para mantener control financiero.'),

  new Paragraph({
    children: [estilo.seccion('Presupuestos por departamento')],
    spacing: { line: 240 }
  }),
  parrafo('1. Acceda a "Presupuesto" en el menú'),
  parrafo('2. Seleccione "Crear presupuesto por departamento"'),
  parrafo('3. Indique el departamento y monto máximo mensual'),
  parrafo('4. Configure alertas (70%, 90%, 100%)'),
  parrafo('5. Guarde la configuración'),

  new Paragraph({
    children: [estilo.seccion('Presupuestos por empleado')],
    spacing: { line: 240 }
  }),
  parrafo('Para mayor granularidad, puede establecer límites mensuales individuales por empleado.'),

  new PageBreak(),

  // ===== SECCIÓN 11 =====
  new Paragraph({
    children: [estilo.titulo('11. Facturación y Cobros')],
    spacing: { line: 240 }
  }),

  new Paragraph({
    children: [estilo.seccion('Para Cuentas Grande y Negocio')],
    spacing: { line: 240 }
  }),
  parrafo('En esta sección encontrará todas las facturas emitidas, su saldo pendiente y el historial de pagos.'),
  parrafo(estilo.negrita('• Descargar facturas (PDF y XML)')),
  parrafo(estilo.negrita('• Ver saldo pendiente')),
  parrafo(estilo.negrita('• Consultar histórico de cobros')),

  new Paragraph({
    children: [estilo.seccion('Para Cuentas Agencia')],
    spacing: { line: 240 }
  }),
  parrafo('Las agencias verán un módulo de comisiones:'),
  parrafo(estilo.negrita('• Comisiones generadas: Todas las comisiones ganadas (10% por viaje)')),
  parrafo(estilo.negrita('• Comisiones por cobrar: Cobro a 15 días')),
  parrafo(estilo.negrita('• Resumen mensual: Total de comisiones')),

  new PageBreak(),

  // ===== SECCIÓN 12 =====
  new Paragraph({
    children: [estilo.titulo('12. Reportes y Análisis')],
    spacing: { line: 240 }
  }),
  parrafo('Los reportes le permiten analizar tendencias de movilidad y eficiencia operacional.'),

  new Paragraph({
    children: [estilo.seccion('Reportes disponibles')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('• Reporte de Uso: Total de viajes, pasajero-km, duración')),
  parrafo(estilo.negrita('• Reporte de Gasto: Desglose por departamento')),
  parrafo(estilo.negrita('• Reporte de Empleado: Viajes por persona, gasto')),
  parrafo(estilo.negrita('• Reporte de Eficiencia: Costo por km, tiempo de espera')),

  new Paragraph({
    children: [estilo.seccion('Descarga y exportación')],
    spacing: { line: 240 }
  }),
  parrafo('Todos los reportes pueden descargarse en formato Excel o PDF.'),

  new PageBreak(),

  // ===== SECCIÓN 13-21 (COMPRIMIDAS) =====
  new Paragraph({
    children: [estilo.titulo('13. Tracking en Vivo')],
    spacing: { line: 240 }
  }),
  parrafo('Monitoree en tiempo real dónde están los viajes activos de su empresa.'),
  parrafo(estilo.negrita('• Vista en mapa: Todos los vehículos activos')),
  parrafo(estilo.negrita('• Detalles: Conductor, pasajero, ETA')),
  parrafo(estilo.negrita('• Contacto directo con el conductor')),
  parrafo(estilo.negrita('• Historial reciente de viajes')),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('14. Mapa en Vivo')],
    spacing: { line: 240 }
  }),
  parrafo('Herramienta avanzada que monitorea la ubicación exacta de sus empleados durante viajes activos.'),

  new Paragraph({
    children: [estilo.seccion('Consideraciones de Privacidad')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('• Requiere consentimiento explícito del empleado')),
  parrafo(estilo.negrita('• Solo muestra ubicación durante viajes activos')),
  parrafo(estilo.negrita('• Los datos se eliminan al completar el viaje')),
  parrafo(estilo.negrita('• No hay seguimiento fuera de horas laborales')),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('15. Seguridad en Ruta')],
    spacing: { line: 240 }
  }),
  parrafo('Going prioriza la seguridad de su equipo. Acceda a scores de seguridad e incidentes reportados.'),

  new Paragraph({
    children: [estilo.seccion('Score de Seguridad')],
    spacing: { line: 240 }
  }),
  parrafo('Cada viaje recibe un score de 0 a 100:'),
  parrafo(estilo.negrita('• 80-100: Excelente')),
  parrafo(estilo.negrita('• 60-79: Bueno')),
  parrafo(estilo.negrita('• 40-59: Requiere monitoreo')),
  parrafo(estilo.negrita('• 0-39: Crítico')),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('16. Política de Viajes Corporativos')],
    spacing: { line: 240 }
  }),
  parrafo('Defina las reglas de movilidad corporativa de su empresa.'),

  new Paragraph({
    children: [estilo.seccion('Gasto')],
    spacing: { line: 240 }
  }),
  parrafo('Defina montos que requieren aprobación. Ejemplo:'),
  parrafo('• Hasta $50: Aprobación automática'),
  parrafo('• $50-$200: Aprobación del supervisor'),
  parrafo('• Más de $200: Aprobación de Finanzas'),

  new Paragraph({
    children: [estilo.seccion('Horarios')],
    spacing: { line: 240 }
  }),
  parrafo('Establezca los días y horas de solicitud:'),
  parrafo('• Lunes a viernes: 6 a.m. a 10 p.m.'),
  parrafo('• Sábado-domingo: 8 a.m. a 6 p.m.'),
  parrafo('• Festivos: Prohibido'),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('17. Sostenibilidad y Huella de Carbono')],
    spacing: { line: 240 }
  }),
  parrafo('Mida y reporte el impacto ambiental de su movilidad corporativa.'),

  new Paragraph({
    children: [estilo.seccion('Métricas disponibles')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('• CO2 total emitido (en kg)')),
  parrafo(estilo.negrita('• Equivalencia (árboles plantados)')),
  parrafo(estilo.negrita('• Viajes en vehículos eléctricos')),
  parrafo(estilo.negrita('• Comparativa con industria')),

  new Paragraph({
    children: [estilo.seccion('Reportes de RSE')],
    spacing: { line: 240 }
  }),
  parrafo('Exporte reportes para su RSE y cumplimiento ODS 13 (Acción climática).'),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('18. Cotización para Grupos')],
    spacing: { line: 240 }
  }),
  parrafo('Para traslados grupales especiales solicite cotizaciones a medida.'),

  new Paragraph({
    children: [estilo.seccion('Cómo solicitar')],
    spacing: { line: 240 }
  }),
  parrafo('1. Acceda a "Cotización Grupos"'),
  parrafo('2. Indique tipo de evento y número de personas'),
  parrafo('3. Fechas, horarios y rutas'),
  parrafo('4. Requisitos especiales'),
  parrafo('5. Envíe la solicitud'),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('19. Configuración de su Cuenta')],
    spacing: { line: 240 }
  }),
  parrafo('Desde aquí gestiona los datos y seguridad de su cuenta corporativa.'),

  new Paragraph({
    children: [estilo.seccion('Datos de la Empresa')],
    spacing: { line: 240 }
  }),
  parrafo('• Razón social • RUC/NIT • Logo corporativo • Teléfono • Ubicación principal'),

  new Paragraph({
    children: [estilo.seccion('Información de Facturación')],
    spacing: { line: 240 }
  }),
  parrafo('• Razón social • Dirección fiscal • Correo para facturas • Datos bancarios'),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('20. Condiciones Comerciales (Agencia)')],
    spacing: { line: 240 }
  }),
  parrafo('Para cuentas Agencia, esta sección muestra sus condiciones acordadas con Going.'),

  new Paragraph({
    children: [estilo.seccion('Información disponible')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('• Porcentaje de comisión (10%)')),
  parrafo(estilo.negrita('• Fechas de cobro (cada 15 días)')),
  parrafo(estilo.negrita('• Descuentos por volumen')),
  parrafo(estilo.negrita('• Términos especiales')),

  new PageBreak(),

  new Paragraph({
    children: [estilo.titulo('21. Canales de Atención')],
    spacing: { line: 240 }
  }),
  parrafo('Estamos aquí para ayudarle. Contáctenos por su canal preferido.'),

  new Paragraph({
    children: [estilo.seccion('Soporte Técnico')],
    spacing: { line: 240 }
  }),
  parrafo(estilo.negrita('Correo: soporte@going.app')),
  parrafo(estilo.negrita('Chat en vivo: 8 a.m. a 8 p.m.')),
  parrafo(estilo.negrita('Teléfono: +593-2-XXXX-XXXX')),

  new Paragraph({
    children: [estilo.seccion('Gestión Comercial')],
    spacing: { line: 240 }
  }),
  parrafo('Para facturación y renovación:'),
  parrafo(estilo.negrita('Correo: comercial@going.app')),

  new Paragraph({
    children: [estilo.seccion('Feedback y Sugerencias')],
    spacing: { line: 240 }
  }),
  parrafo('Valoramos sus comentarios:'),
  parrafo(estilo.negrita('producto@going.app')),

  new Paragraph({ children: [new TextRun({ text: '', size: 200 })] }),
  new Paragraph({ children: [new TextRun({ text: '', size: 200 })] }),

  new Paragraph({
    children: [estilo.normal('Gracias por elegir Going. ¡Nos movemos contigo!')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  }),

  new Paragraph({
    children: [estilo.negrita('Going — Ecuador 2026')],
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 }
  })
];

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margins: {
          top: 1080,
          right: 1080,
          bottom: 1080,
          left: 1080
        }
      }
    },
    children
  }]
});

// Generar el documento
Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, 'Manual_Portal_Empresas_Going.docx');

  fs.writeFileSync(outputPath, buffer);

  const fileSizeKB = buffer.length / 1024;
  const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

  console.log('');
  console.log('========================================');
  console.log('✓ MANUAL GENERADO EXITOSAMENTE');
  console.log('========================================');
  console.log(`Ubicación: ${outputPath}`);
  console.log(`Tamaño: ${fileSizeKB.toFixed(2)} KB (${fileSizeMB} MB)`);
  console.log('');
  console.log('Documento: Portal Empresas Going - Guía de Uso');
  console.log('Secciones: 21 módulos y funcionalidades');
  console.log('Tabla comparativa: 3 tipos de cuenta');
  console.log('Tono: Profesional y dirigido a clientes corporativos');
  console.log('========================================');
  console.log('');
}).catch(err => {
  console.error('Error al generar documento:', err.message);
  process.exit(1);
});
