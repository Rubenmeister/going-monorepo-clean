const { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel,
        AlignmentType, BorderStyle, WidthType, ShadingType,
        Header, Footer, PageNumber, LevelFormat, Table, TableRow, TableCell, VerticalAlign, UnitsType } = require('docx');
const fs = require('fs');
const path = require('path');

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

// Estructura del documento
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
    children: [
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

      // Salto de página
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

      // ===== SECCIÓN 1: BIENVENIDO =====
      new Paragraph({
        children: [estilo.titulo('1. Bienvenido a Going Empresas')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Agradecemos que haya elegido Going para optimizar la movilidad corporativa de su empresa. Esta plataforma le permite gestionar de manera centralizada todos los traslados, transporte y experiencias de movilidad de su equipo.'),
      ])),
      parrafo(estilo.normal('Con Going Empresas, usted podrá:')),
      parrafo(estilo.negrita('• Solicitar y controlar viajes en tiempo real')),
      parrafo(estilo.negrita('• Monitorear el desempeño y seguridad de la movilidad corporativa')),
      parrafo(estilo.negrita('• Gestionar presupuestos y controles de gasto')),
      parrafo(estilo.negrita('• Acceder a reportes detallados de movilidad y sostenibilidad')),
      parrafo(estilo.negrita('• Mantener a su equipo seguro con tracking en vivo y scoring de seguridad')),
      parrafo(new TextRun([
        estilo.normal('Este manual le guiará paso a paso a través de cada funcionalidad disponible en su portal, asegurando que aproveche al máximo su inversión en movilidad corporativa.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 2: TIPO DE CUENTA =====
      new Paragraph({
        children: [estilo.titulo('2. Su Tipo de Cuenta')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Going ofrece tres modalidades de cuenta corporativa, cada una diseñada para diferentes necesidades y volúmenes de operación. Identifique cuál es la suya para comprender mejor las funcionalidades disponibles.'),
      ])),
      new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),

      tablaComparativa(),

      new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),

      // Descripción de Cuenta Grande
      new Paragraph({
        children: [estilo.seccion('Cuenta Grande')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Dirigida a empresas con alto volumen de traslados. Acceso a crédito de 40 días, flujo de aprobaciones multinivel configurable, wallet consolidada y máximo control administrativo.'),
      ])),

      // Descripción de Cuenta Negocio
      new Paragraph({
        children: [estilo.seccion('Cuenta Negocio (PyME)')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Ideal para pequeñas y medianas empresas. Modelo de pago por viaje: cada transacción se cobra de inmediato. Sin flujos de aprobación ni periodos de crédito. Operación ágil y sin complicaciones administrativas.'),
      ])),

      // Descripción de Cuenta Agencia
      new Paragraph({
        children: [estilo.seccion('Cuenta Agencia')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Para agencias de viajes, operadores turísticos y terceros que reservan viajes a nombre de sus clientes. Modelo de comisión del 10% sobre cada viaje, cobro consolidado a 15 días, y acceso a campo especial para reservas a nombre de terceros.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 3: PRIMEROS PASOS =====
      new Paragraph({
        children: [estilo.titulo('3. Primeros Pasos: Acceso y Navegación')],
        spacing: { line: 240 }
      }),

      new Paragraph({
        children: [estilo.seccion('Cómo acceder a su portal')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('1. Ingrese a '),
        estilo.negrita('www.going.app/empresas'),
        estilo.normal(' desde su navegador'),
      ])),
      parrafo(estilo.normal('2. Ingrese su correo corporativo y contraseña')),
      parrafo(estilo.normal('3. Si es la primera vez, le solicitaremos completar el perfil de su empresa')),
      parrafo(estilo.normal('4. Haga clic en "Ingresar" para acceder al portal')),

      new Paragraph({ children: [new TextRun({ text: '', size: 100 })] }),

      new Paragraph({
        children: [estilo.seccion('Navegación del Portal')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('El menú principal se encuentra en la parte superior izquierda. Desde allí podrá acceder a todos los módulos. La navegación es intuitiva y está organizada en categorías principales:'),
      ])),
      parrafo(estilo.negrita('• Operaciones: Solicitar viajes, tracking, favoritos')),
      parrafo(estilo.negrita('• Administración: Equipo, presupuesto, aprobaciones')),
      parrafo(estilo.negrita('• Análisis: Reportes, sostenibilidad, seguridad')),
      parrafo(estilo.negrita('• Configuración: Datos de empresa, política de viajes')),

      new PageBreak(),

      // ===== SECCIÓN 4: PANEL DE CONTROL =====
      new Paragraph({
        children: [estilo.titulo('4. Panel de Control')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('El panel de control es su vista ejecutiva de la movilidad corporativa de este mes. Aquí encontrará indicadores clave adaptados a su tipo de cuenta.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Indicadores principales')],
        spacing: { line: 240 }
      }),

      new Paragraph({
        children: [estilo.negrita('Para Cuenta Grande:')],
        spacing: { line: 200 }
      }),
      parrafo(estilo.normal('• Total de viajes realizados este mes')),
      parrafo(estilo.normal('• Monto total gastado y monto disponible en crédito')),
      parrafo(estilo.normal('• Viajes pendientes de aprobación')),
      parrafo(estilo.normal('• Departamento con mayor gasto')),
      parrafo(estilo.normal('• Calificación promedio de viajes (conductor y servicio)')),

      new Paragraph({
        children: [estilo.negrita('Para Cuenta Negocio (PyME):')],
        spacing: { line: 200 }
      }),
      parrafo(estilo.normal('• Total de viajes realizados este mes')),
      parrafo(estilo.normal('• Monto total gastado')),
      parrafo(estilo.normal('• Empleado con más viajes')),
      parrafo(estilo.normal('• Calificación promedio de viajes')),

      new Paragraph({
        children: [estilo.negrita('Para Cuenta Agencia:')],
        spacing: { line: 200 }
      }),
      parrafo(estilo.normal('• Total de reservas realizadas este mes')),
      parrafo(estilo.normal('• Comisiones generadas')),
      parrafo(estilo.normal('• Comisiones pendientes de cobro (próximos 15 días)')),
      parrafo(estilo.normal('• Cliente frecuente')),

      new PageBreak(),

      // ===== SECCIÓN 5: SOLICITAR VIAJE =====
      new Paragraph({
        children: [estilo.titulo('5. Cómo Solicitar un Viaje')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('La solicitud de viajes es el corazón de la plataforma. Desde aquí, su equipo podrá reservar transporte inmediato, tours, experiencias y servicios de logística.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Datos requeridos')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('• Lugar de origen y destino')),
      parrafo(estilo.normal('  Seleccione desde el mapa o escriba la dirección específica')),
      parrafo(estilo.negrita('• Tipo de servicio')),
      parrafo(estilo.normal('  Transporte, tours, experiencias o envíos')),
      parrafo(estilo.negrita('• Fecha y hora de partida')),
      parrafo(estilo.normal('  Ahora mismo o una fecha y hora futura')),
      parrafo(estilo.negrita('• Número de pasajeros')),
      parrafo(estilo.normal('  Según el tipo de vehículo requerido')),
      parrafo(estilo.negrita('• Notas adicionales')),
      parrafo(estilo.normal('  Instrucciones especiales para el conductor')),

      new Paragraph({
        children: [estilo.seccion('Campo adicional para Agencias')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Si su cuenta es de Agencia, verá un campo adicional "'),
        estilo.negrita('Nombre del cliente'),
        estilo.normal('". Complete este campo con el nombre de la persona a nombre de quien realiza la reserva.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Proceso de solicitud')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('1. Haga clic en "Solicitar viaje"')),
      parrafo(estilo.normal('2. Complete todos los campos requeridos')),
      parrafo(estilo.normal('3. Verifique el costo estimado')),
      parrafo(estilo.normal('4. Haga clic en "Confirmar solicitud"')),
      parrafo(new TextRun([
        estilo.normal('5. Dependiendo de su tipo de cuenta, el viaje será aprobado automáticamente (Negocio) o pasará al flujo de aprobaciones (Grande).'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 6: SEGUIMIENTO =====
      new Paragraph({
        children: [estilo.titulo('6. Seguimiento de Viajes')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('El módulo de Gestión de Viajes le permite ver el historial completo de todos los viajes de su empresa.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Información disponible')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('• Estado del viaje:')),
      parrafo(estilo.normal('  Pendiente, En ruta, Completado, Cancelado')),
      parrafo(estilo.negrita('• Fecha, hora y duración')),
      parrafo(estilo.negrita('• Ruta y distancia recorrida')),
      parrafo(estilo.negrita('• Conductor asignado y datos de contacto')),
      parrafo(estilo.negrita('• Costo final y forma de pago')),
      parrafo(estilo.negrita('• Calificación de pasajero y conductor')),
      parrafo(estilo.negrita('• Notas y observaciones')),

      new Paragraph({
        children: [estilo.seccion('Filtros y búsqueda')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('Puede filtrar viajes por:')),
      parrafo(estilo.normal('• Fecha (rango de fechas)')),
      parrafo(estilo.normal('• Estado (completados, pendientes, cancelados)')),
      parrafo(estilo.normal('• Empleado o pasajero')),
      parrafo(estilo.normal('• Centro de costo o departamento')),
      parrafo(estilo.normal('• Rango de precio')),

      new PageBreak(),

      // ===== SECCIÓN 7: FAVORITOS Y RECURRENTES =====
      new Paragraph({
        children: [estilo.titulo('7. Viajes Favoritos y Recurrentes')],
        spacing: { line: 240 }
      }),

      new Paragraph({
        children: [estilo.seccion('Viajes Favoritos')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Guarde sus rutas frecuentes como favoritos para solicitar viajes más rápidamente. Esto es especialmente útil para traslados rutinarios como de oficina a aeropuerto, entre sedes, etc.'),
      ])),
      parrafo(estilo.normal('Para guardar como favorito:')),
      parrafo(estilo.normal('1. Complete una solicitud de viaje normalmente')),
      parrafo(estilo.normal('2. Antes de confirmar, marque "Guardar como favorito"')),
      parrafo(estilo.normal('3. Asigne un nombre descriptivo a la ruta')),
      parrafo(estilo.normal('4. Confirme el viaje')),

      new Paragraph({
        children: [estilo.seccion('Viajes Recurrentes')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Configure viajes que se repiten automáticamente en su calendario corporativo. Por ejemplo, traslado de ejecutivos todos los lunes a las 8 a.m.'),
      ])),
      parrafo(estilo.normal('Para crear un recurrente:')),
      parrafo(estilo.normal('1. Haga clic en "Viajes Recurrentes"')),
      parrafo(estilo.normal('2. Ingrese los datos del viaje')),
      parrafo(estilo.normal('3. Seleccione la frecuencia: diario, semanal, quincenal, mensual')),
      parrafo(estilo.normal('4. Indique los días y horarios específicos')),
      parrafo(estilo.normal('5. Confirme la configuración')),
      parrafo(new TextRun([
        estilo.normal('Los viajes recurrentes se solicitan automáticamente en las fechas programadas y seguirán el mismo flujo de aprobaciones que los viajes manuales.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 8: APROBACIONES =====
      new Paragraph({
        children: [estilo.titulo('8. Flujo de Aprobaciones (Cuenta Grande)')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Las cuentas Grande cuentan con un robusto flujo de aprobaciones multinivel. Esto permite que su empresa establezca controles de gasto por rol y autoridad.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Cómo funciona el flujo')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('1. El empleado solicita el viaje')),
      parrafo(estilo.normal('2. El supervisor recibe la solicitud para aprobación')),
      parrafo(estilo.normal('3. Si supera el límite establecido, se escala a Finanzas')),
      parrafo(estilo.normal('4. Una vez aprobado, el viaje se ejecuta inmediatamente')),
      parrafo(estilo.normal('5. Si se rechaza, el empleado recibe notificación con el motivo')),

      new Paragraph({
        children: [estilo.seccion('Configurar aprobadores')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Desde el módulo de Configuración, usted puede asignar aprobadores y establecer límites de gasto por nivel de autorización.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Panel de aprobaciones')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Los supervisores y aprobadores verán un panel con todas las solicitudes pendientes, permitiéndoles aprobar o rechazar en minutos.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 9: GESTIÓN DE EQUIPO =====
      new Paragraph({
        children: [estilo.titulo('9. Gestión de su Equipo')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Agregue y gestione los usuarios de su empresa que tendrán acceso al portal y podrán solicitar viajes.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Agregar nuevos usuarios')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('1. Acceda a "Equipo" en el menú principal')),
      parrafo(estilo.normal('2. Haga clic en "Agregar empleado"')),
      parrafo(estilo.normal('3. Ingrese correo corporativo, nombre y departamento')),
      parrafo(estilo.normal('4. Asigne un rol (Administrador, Supervisor, Empleado)')),
      parrafo(estilo.normal('5. Asigne centro de costo (opcional, para presupuestos)')),
      parrafo(estilo.normal('6. Envíe la invitación')),

      new Paragraph({
        children: [estilo.seccion('Roles disponibles')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('• Administrador:')),
      parrafo(estilo.normal('  Acceso total al portal, gestión de usuarios y configuración')),
      parrafo(estilo.negrita('• Supervisor:')),
      parrafo(estilo.normal('  Aprueba viajes de su equipo, ve reportes del departamento')),
      parrafo(estilo.negrita('• Empleado:')),
      parrafo(estilo.normal('  Solicita viajes y ve su propio historial')),

      new Paragraph({
        children: [estilo.seccion('Historial por persona')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Haga clic en un empleado para ver su historial de viajes, gasto acumulado y cumplimiento de la política de viajes corporativa.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 10: PRESUPUESTO =====
      new Paragraph({
        children: [estilo.titulo('10. Control de Presupuesto')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Disponible en cuentas Grande y Negocio. Establezca límites de gasto para mantener control financiero sobre la movilidad corporativa.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Presupuestos por departamento')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('1. Acceda a "Presupuesto" en el menú')),
      parrafo(estilo.normal('2. Seleccione "Crear presupuesto por departamento"')),
      parrafo(estilo.normal('3. Indique el departamento y monto máximo mensual')),
      parrafo(estilo.normal('4. Configure alertas (70%, 90%, 100%)')),
      parrafo(estilo.normal('5. Guarde la configuración')),

      new Paragraph({
        children: [estilo.seccion('Presupuestos por empleado')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Para mayor granularidad, puede establecer límites mensuales individuales por empleado. Útil para ejecutivos con asignaciones especiales.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Alertas y notificaciones')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Reciba notificaciones automáticas cuando su departamento o empleado se acerque a los límites de presupuesto. Esto permite actuar antes de exceder.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 11: FACTURACIÓN =====
      new Paragraph({
        children: [estilo.titulo('11. Facturación y Cobros')],
        spacing: { line: 240 }
      }),

      new Paragraph({
        children: [estilo.seccion('Para Cuentas Grande y Negocio')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('En esta sección encontrará todas las facturas emitidas, su saldo pendiente y el historial de pagos realizados.'),
      ])),
      parrafo(estilo.negrita('• Descargar facturas (PDF y XML)')),
      parrafo(estilo.negrita('• Ver saldo pendiente')),
      parrafo(estilo.negrita('• Consultar histórico de cobros')),

      new Paragraph({
        children: [estilo.seccion('Para Cuentas Agencia')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Las agencias verán un módulo de comisiones en lugar de facturas:'),
      ])),
      parrafo(estilo.negrita('• Comisiones generadas:')),
      parrafo(estilo.normal('  Todas las comisiones ganadas en el mes (10% por viaje)')),
      parrafo(estilo.negrita('• Comisiones por cobrar:')),
      parrafo(estilo.normal('  Comisiones que serán cobradas en los próximos 15 días')),
      parrafo(estilo.negrita('• Resumen mensual:')),
      parrafo(estilo.normal('  Total de comisiones y detalle por cliente')),

      new PageBreak(),

      // ===== SECCIÓN 12: REPORTES =====
      new Paragraph({
        children: [estilo.titulo('12. Reportes y Análisis')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Los reportes le permiten analizar tendencias de movilidad, eficiencia operacional y cumplimiento de políticas corporativas.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Reportes disponibles')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('• Reporte de Uso:')),
      parrafo(estilo.normal('  Total de viajes, pasajero-kilómetros, duración promedio')),
      parrafo(estilo.negrita('• Reporte de Gasto:')),
      parrafo(estilo.normal('  Desglose por departamento, empleado, tipo de servicio')),
      parrafo(estilo.negrita('• Reporte de Empleado:')),
      parrafo(estilo.normal('  Viajes por persona, cumplimiento de política, gasto acumulado')),
      parrafo(estilo.negrita('• Reporte de Eficiencia:')),
      parrafo(estilo.normal('  Costo por kilómetro, tiempo de espera, ocupación promedio')),

      new Paragraph({
        children: [estilo.seccion('Descarga y exportación')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('Todos los reportes pueden descargarse en formato Excel o PDF para análisis posterior y presentaciones ejecutivas.')),
      parrafo(estilo.normal('Seleccione el rango de fechas y haga clic en "Descargar reporte"')),

      new PageBreak(),

      // ===== SECCIÓN 13: TRACKING EN VIVO =====
      new Paragraph({
        children: [estilo.titulo('13. Tracking en Vivo')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Monitoree en tiempo real dónde están los viajes activos de su empresa. Esto le permite mantener control operacional y responder ante cualquier contingencia.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Funcionalidades')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('• Vista en mapa:')),
      parrafo(estilo.normal('  Vea todos los vehículos activos de su empresa en tiempo real')),
      parrafo(estilo.negrita('• Detalles del viaje:')),
      parrafo(estilo.normal('  Conductor, pasajero, origen, destino, ETA (tiempo estimado de llegada)')),
      parrafo(estilo.negrita('• Contacto directo:')),
      parrafo(estilo.normal('  Llame al conductor directamente si es necesario')),
      parrafo(estilo.negrita('• Historial reciente:')),
      parrafo(estilo.normal('  Lista de viajes completados en las últimas horas')),

      new PageBreak(),

      // ===== SECCIÓN 14: MAPA EN VIVO =====
      new Paragraph({
        children: [estilo.titulo('14. Mapa en Vivo')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Herramienta avanzada que monitorea la ubicación exacta de sus empleados durante viajes activos. Requiere consentimiento explícito del empleado.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Consideraciones de Privacidad')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('El mapa en vivo respeta completamente la privacidad de sus empleados:'),
      ])),
      parrafo(estilo.negrita('• Requiere consentimiento explícito del empleado')),
      parrafo(estilo.negrita('• Solo muestra ubicación durante viajes activos')),
      parrafo(estilo.negrita('• Los datos se eliminan al completar el viaje')),
      parrafo(estilo.negrita('• No hay seguimiento fuera de horas laborales')),

      new Paragraph({
        children: [estilo.seccion('Activar el monitoreo')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('1. El empleado debe autorizar el monitoreo en su perfil')),
      parrafo(estilo.normal('2. Su administrador verá un ícono de ubicación en viajes autorizados')),
      parrafo(estilo.normal('3. Haga clic para ver la ubicación en tiempo real')),

      new PageBreak(),

      // ===== SECCIÓN 15: SEGURIDAD =====
      new Paragraph({
        children: [estilo.titulo('15. Seguridad en Ruta')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Going prioriza la seguridad de su equipo. Acceda a scores de seguridad, incidentes reportados y clips de dashcam cuando sea necesario.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Score de Seguridad')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Cada viaje recibe un score de 0 a 100 basado en comportamiento del conductor, incidentes y evaluaciones de pasajero.'),
      ])),
      parrafo(estilo.negrita('• 80-100: Excelente')),
      parrafo(estilo.negrita('• 60-79: Bueno')),
      parrafo(estilo.negrita('• 40-59: Requiere monitoreo')),
      parrafo(estilo.negrita('• 0-39: Crítico, requiere investigación')),

      new Paragraph({
        children: [estilo.seccion('Incidentes reportados')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Si se reporta un incidente durante un viaje, recibirá una notificación inmediata. Puede revisar detalles y solicitar dashcam cuando sea pertinente.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Solicitar clips de dashcam')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Para viajes con incidentes o scores bajos, puede solicitar el clip de dashcam del vehículo. Esto facilita investigaciones internas y mejora continua.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 16: POLÍTICA DE VIAJES =====
      new Paragraph({
        children: [estilo.titulo('16. Política de Viajes Corporativos')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Defina las reglas de movilidad corporativa de su empresa. Todos los empleados verán estas políticas y tendrán que cumplirlas.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Gasto')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('Defina montos que requieren aprobación previa y montos que están bloqueados. Por ejemplo:')),
      parrafo(estilo.normal('• Hasta $50: Aprobación automática')),
      parrafo(estilo.normal('• $50-$200: Aprobación del supervisor')),
      parrafo(estilo.normal('• Más de $200: Aprobación de Finanzas')),

      new Paragraph({
        children: [estilo.seccion('Horarios')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('Establezca los días y horas en que se pueden solicitar viajes. Por ejemplo:')),
      parrafo(estilo.normal('• Lunes a viernes: 6 a.m. a 10 p.m.')),
      parrafo(estilo.normal('• Sábado y domingo: 8 a.m. a 6 p.m.')),
      parrafo(estilo.normal('• Festivos: Prohibido')),

      new Paragraph({
        children: [estilo.seccion('Servicios')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Active o desactive tipos de servicio según la política de su empresa:'),
      ])),
      parrafo(estilo.normal('• Transporte urbano')),
      parrafo(estilo.normal('• Tours y experiencias')),
      parrafo(estilo.normal('• Alojamiento')),
      parrafo(estilo.normal('• Envíos y logística')),

      new PageBreak(),

      // ===== SECCIÓN 17: SOSTENIBILIDAD =====
      new Paragraph({
        children: [estilo.titulo('17. Sostenibilidad y Huella de Carbono')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Mida y reporte el impacto ambiental de la movilidad corporativa de su empresa. Contribuya a los Objetivos de Desarrollo Sostenible de la ONU.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Métricas disponibles')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('• CO2 total emitido (en kg)')),
      parrafo(estilo.negrita('• Equivalencia (ej: árboles plantados para compensar)')),
      parrafo(estilo.negrita('• Viajes en vehículos eléctricos')),
      parrafo(estilo.negrita('• Distancia total vs. teletrabajo sugerido')),
      parrafo(estilo.negrita('• Comparativa con industria')),

      new Paragraph({
        children: [estilo.seccion('Reportes de RSE')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Exporte reportes detallados de sostenibilidad para su informe de Responsabilidad Social Empresarial (RSE) y cumplimiento con el ODS 13 (Acción climática).'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Opciones sostenibles')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Going le permite priorizar vehículos eléctricos e híbridos en las solicitudes, reforzando su compromiso con sostenibilidad.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 18: COTIZACIÓN GRUPOS =====
      new Paragraph({
        children: [estilo.titulo('18. Cotización para Grupos')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Para traslados grupales especiales como eventos corporativos, capacitaciones o visitas, solicite cotizaciones a medida.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Cómo solicitar una cotización')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('1. Acceda a "Cotización Grupos"')),
      parrafo(estilo.normal('2. Indique el tipo de evento (corporativo, capacitación, visita, etc.)')),
      parrafo(estilo.normal('3. Número de personas')),
      parrafo(estilo.normal('4. Fechas, horarios y rutas')),
      parrafo(estilo.normal('5. Requisitos especiales (Wi-Fi, refrigerio, etc.)')),
      parrafo(estilo.normal('6. Envíe la solicitud')),

      new Paragraph({
        children: [estilo.seccion('Respuesta')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('El equipo de Going le contactará en 24 horas con una cotización personalizada que incluye precios especiales por volumen, garantía de disponibilidad y términos flexibles.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 19: CONFIGURACIÓN =====
      new Paragraph({
        children: [estilo.titulo('19. Configuración de su Cuenta')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Desde aquí gestiona los datos, seguridad y integraciones de su cuenta corporativa.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Datos de la Empresa')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('• Razón social')),
      parrafo(estilo.normal('• RUC/NIT')),
      parrafo(estilo.normal('• Logo corporativo')),
      parrafo(estilo.normal('• Teléfono de contacto')),
      parrafo(estilo.normal('• Ubicación principal')),

      new Paragraph({
        children: [estilo.seccion('Información de Facturación')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('• Razón social para facturas')),
      parrafo(estilo.normal('• Dirección fiscal')),
      parrafo(estilo.normal('• Correo para recepción de facturas')),
      parrafo(estilo.normal('• Datos bancarios (cuentas de débito)')),

      new Paragraph({
        children: [estilo.seccion('Usuarios Administradores')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Agregue o retire administradores de la plataforma. Solo administradores pueden acceder a configuración sensible.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Integraciones API')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Si su empresa usa sistemas ERP, HRIS o contabilidad, puede integrar Going mediante API. Solicite documentación técnica a nuestro equipo.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 20: CONDICIONES AGENCIA =====
      new Paragraph({
        children: [estilo.titulo('20. Condiciones Comerciales (Agencia)')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Para cuentas Agencia, esta sección le muestra las condiciones comerciales acordadas con Going.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Información disponible')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('• Porcentaje de comisión (10%)')),
      parrafo(estilo.negrita('• Fechas de cobro (cada 15 días)')),
      parrafo(estilo.negrita('• Descuentos por volumen')),
      parrafo(estilo.negrita('• Términos especiales acordados')),
      parrafo(estilo.negrita('• Período de contrato y renovación')),

      new Paragraph({
        children: [estilo.seccion('Contacto comercial')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Si necesita ajustar condiciones o negociar términos especiales, encontrará el contacto de su gestor comercial en esta sección.'),
      ])),

      new PageBreak(),

      // ===== SECCIÓN 21: CANALES DE ATENCIÓN =====
      new Paragraph({
        children: [estilo.titulo('21. Canales de Atención')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Estamos aquí para ayudarle en todo lo que necesite. Contáctenos por su canal preferido.'),
      ])),

      new Paragraph({
        children: [estilo.seccion('Soporte Técnico')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.negrita('Correo:')),
      parrafo(estilo.normal('soporte@going.app')),
      parrafo(estilo.negrita('Chat en vivo:')),
      parrafo(estilo.normal('Disponible en el portal (esquina inferior derecha) de 8 a.m. a 8 p.m.')),
      parrafo(estilo.negrita('Teléfono:')),
      parrafo(estilo.normal('+593-2-XXXX-XXXX')),

      new Paragraph({
        children: [estilo.seccion('Gestión Comercial')],
        spacing: { line: 240 }
      }),
      parrafo(estilo.normal('Para consultas sobre facturación, renovación de contrato o negociación de términos especiales:')),
      parrafo(estilo.negrita('Correo:')),
      parrafo(estilo.normal('comercial@going.app')),

      new Paragraph({
        children: [estilo.seccion('Feedback y Sugerencias')],
        spacing: { line: 240 }
      }),
      parrafo(new TextRun([
        estilo.normal('Valoramos sus comentarios. Si tiene sugerencias para mejorar la plataforma, escriba a:'),
      ])),
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
    ]
  }]
});

// Generar el documento
Packer.toBuffer(doc).then(buffer => {
  const outputPath = 'C:\\Users\\USER1\\going-monorepo-clean\\Manual_Portal_Empresas_Going.docx';

  fs.writeFileSync(outputPath, buffer);

  const fileSizeKB = buffer.length / 1024;
  console.log(`✓ Manual generado exitosamente`);
  console.log(`  Ubicación: ${outputPath}`);
  console.log(`  Tamaño: ${fileSizeKB.toFixed(2)} KB`);
});
