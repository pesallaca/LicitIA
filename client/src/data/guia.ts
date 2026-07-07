// Academia de LicitIA: la "guía para empezar de cero" en contratación pública.
// Contenido PROPIO en lenguaje llano + enlaces a las fuentes oficiales (PLACSP,
// Hacienda). Dirigido por datos: añadir un artículo = añadir un objeto aquí.
//
// Formato del cuerpo: cada string es un párrafo. Prefijos especiales:
//   '## '  → subtítulo dentro del artículo
//   '- '   → elemento de lista
//   '! '   → aviso destacado (caja)

export interface EnlaceOficial {
  etiqueta: string;
  url: string;
}

export interface Articulo {
  id: string;
  titulo: string;
  resumen: string;
  cuerpo: string[];
  enlaces?: EnlaceOficial[];
  cta?: { texto: string; tab: 'profile' | 'new' | 'insights' };
}

export interface Seccion {
  id: string;
  titulo: string;
  articulos: Articulo[];
}

export const secciones: Seccion[] = [
  {
    id: 'empezar',
    titulo: '1 · Empezar de cero',
    articulos: [
      {
        id: 'que-es-licitar',
        titulo: '¿Qué es una licitación pública?',
        resumen: 'El concurso por el que las administraciones compran. Y tu empresa puede presentarse.',
        cuerpo: [
          'Cuando un ayuntamiento necesita jardineros, un hospital necesita material o un ministerio necesita una web, no puede contratar "a dedo": la ley le obliga a convocar un concurso público para que cualquier empresa pueda optar al contrato. Ese concurso es una licitación.',
          'Todas las licitaciones del sector público español se publican en un único sitio oficial: la Plataforma de Contratación del Sector Público (PLACSP). Es pública, gratuita y cualquiera puede consultarla.',
          '## ¿Por qué debería interesarte?',
          '- El sector público español adjudica decenas de miles de contratos al año, desde unos pocos miles de euros hasta millones.',
          '- La ley (LCSP 9/2017) obliga a dividir muchos contratos en lotes precisamente para que las PYMEs puedan participar.',
          '- La administración PAGA: los plazos de pago están regulados y el impago es rarísimo comparado con el sector privado.',
          '! Mito a derribar: «eso es solo para empresas grandes». Falso. La mayoría de contratos menores y muchos procedimientos abiertos simplificados están pensados para empresas pequeñas.',
        ],
      },
      {
        id: 'puede-mi-pyme',
        titulo: '¿Puede licitar mi PYME? Requisitos reales',
        resumen: 'Menos de los que crees: capacidad, no estar en prohibición, y solvencia proporcional.',
        cuerpo: [
          'Para presentarte a una licitación necesitas, en esencia, tres cosas:',
          '- Capacidad de obrar: ser una empresa o autónomo legalmente constituido, con el objeto social relacionado con el contrato.',
          '- No estar en prohibición de contratar: básicamente, estar al corriente con Hacienda y la Seguridad Social y no tener sanciones que lo impidan.',
          '- Solvencia económica y técnica: demostrar que puedes hacer el trabajo. Y aquí viene la buena noticia.',
          '## La solvencia es PROPORCIONAL',
          'Los requisitos de solvencia deben ser proporcionales al contrato. Para un contrato de 40.000 € nadie te pedirá facturar millones: suele bastar con un seguro, la facturación de los últimos años acorde al importe, o experiencia en trabajos similares.',
          '! En contratos pequeños (los "menores" y muchos simplificados) los requisitos se reducen al mínimo. Es la puerta de entrada ideal.',
        ],
        cta: { texto: 'Analiza un pliego con IA y te diremos si encaja con una PYME', tab: 'new' },
      },
      {
        id: 'pcap-ppt',
        titulo: 'Los documentos: PCAP y PPT (los "pliegos")',
        resumen: 'Las reglas del juego y el qué hay que hacer. Aprende a leerlos sin miedo.',
        cuerpo: [
          'Cada licitación publica dos documentos clave que juntos se llaman "los pliegos":',
          '- PCAP (Pliego de Cláusulas Administrativas Particulares): las REGLAS del concurso. Quién puede presentarse, qué solvencia se pide, cómo se puntúa, plazos, garantías y penalizaciones.',
          '- PPT (Pliego de Prescripciones Técnicas): el QUÉ. Describe el trabajo a realizar: tareas, calidades, plazos de ejecución, medios exigidos.',
          '## Cómo leerlos sin ahogarse',
          'Un pliego puede tener 60 páginas, pero las decisiones importantes están en pocas: el cuadro resumen (presupuesto, plazo, CPV), los criterios de adjudicación (cómo se reparten los puntos) y la solvencia exigida. Empieza SIEMPRE por ahí.',
          '! Para esto existe LicitIA: pega el pliego y la IA te saca la ficha, los criterios, los riesgos y una recomendación en minutos.',
        ],
        cta: { texto: 'Probar el análisis de pliegos', tab: 'new' },
      },
    ],
  },
  {
    id: 'alta',
    titulo: '2 · Darse de alta',
    articulos: [
      {
        id: 'alta-placsp',
        titulo: 'Alta de empresa en PLACSP, paso a paso',
        resumen: 'Registrarse es gratis y se hace una sola vez. Con esto ya puedes recibir avisos y licitar.',
        cuerpo: [
          'El registro como "empresa licitadora" en la Plataforma es gratuito y online:',
          '- 1. Entra en la Plataforma de Contratación del Sector Público y pulsa «Empresas» → «Registrarse».',
          '- 2. Rellena los datos de la empresa (CIF/NIF, razón social, contacto). Necesitarás un correo electrónico que uses de verdad: ahí llegarán los avisos.',
          '- 3. Activa la cuenta desde el correo de confirmación.',
          '- 4. Opcional pero MUY recomendable: configura suscripciones para recibir avisos de licitaciones de tu sector (por CPV, por órgano de contratación o por palabras).',
          '## Certificado electrónico: tu otra llave',
          'Para PRESENTAR ofertas necesitarás además un certificado electrónico de representante de la empresa (FNMT u otro cualificado) o DNIe. Pídelo cuanto antes: el trámite puede tardar días y las ofertas no esperan.',
          '! El registro en PLACSP sirve para toda la administración estatal y para la mayoría de autonómicas y locales que publican ahí. Una vez, y listo.',
        ],
        enlaces: [
          { etiqueta: 'PLACSP · Sección Empresas (registro)', url: 'https://contrataciondelestado.es/wps/portal/plataforma/empresas' },
          { etiqueta: 'Preguntas frecuentes oficiales (bloque Empresas)', url: 'https://contrataciondelestado.es/wps/portal/plataforma/informacion/preguntas_frecuentes' },
        ],
      },
      {
        id: 'rolece',
        titulo: 'ROLECE: apúntate una vez, licita más fácil siempre',
        resumen: 'El registro oficial que acredita tu empresa de una vez para todas las licitaciones.',
        cuerpo: [
          'El ROLECE (Registro Oficial de Licitadores y Empresas Clasificadas del Sector Público) es un registro estatal donde inscribes UNA VEZ los datos y documentos de tu empresa: constitución, poderes, solvencia, clasificación...',
          '## ¿Qué ganas inscribiéndote?',
          '- En muchos procedimientos (especialmente el abierto simplificado) la inscripción en ROLECE es requisito u opción que simplifica muchísimo el papeleo.',
          '- Dejas de aportar la misma documentación en cada licitación: el certificado ROLECE la acredita.',
          '- La inscripción es gratuita y se solicita online (con certificado electrónico).',
          '! Consejo práctico: no esperes a necesitarlo. La inscripción puede tardar semanas y más de una PYME ha perdido una licitación por no tener el ROLECE a tiempo.',
        ],
        enlaces: [
          { etiqueta: 'ROLECE · Web oficial y manuales de usuario', url: 'https://registrodelicitadores.gob.es/' },
        ],
      },
    ],
  },
  {
    id: 'buscar',
    titulo: '3 · Encontrar licitaciones',
    articulos: [
      {
        id: 'buscar-placsp',
        titulo: 'Buscar en PLACSP y crear suscripciones',
        resumen: 'El buscador oficial y los avisos por correo: configúralos bien y no se te escapará nada.',
        cuerpo: [
          'En la Plataforma puedes buscar licitaciones sin estar registrado: por texto libre, por CPV (el código de actividad), por provincia, por importe o por estado (en plazo, adjudicada...).',
          '## Las suscripciones: tu radar oficial',
          'Registrado como empresa, puedes crear suscripciones: la Plataforma te enviará un correo cuando se publique algo que encaje con tus filtros (CPV, órganos de contratación, palabras clave).',
          '- Suscríbete por tus códigos CPV principales (mejor por prefijo amplio, p. ej. «77» para jardinería, que por códigos ultraespecíficos).',
          '- Añade también los ayuntamientos y organismos de tu zona.',
          '! El correo oficial avisa, pero no analiza: te llegará TODO lo que cumpla el filtro y tendrás que cribarlo a mano.',
        ],
      },
      {
        id: 'radar-licitia',
        titulo: 'El radar de LicitIA: que el trabajo sucio lo haga la máquina',
        resumen: 'Define tu perfil una vez y te enseñamos solo lo que encaja, puntuado por relevancia.',
        cuerpo: [
          'LicitIA lee las licitaciones nuevas de PLACSP cada pocas horas y las cruza con el perfil de TU empresa: tus códigos CPV, tus palabras clave y tu rango de presupuesto.',
          '- Cada licitación relevante recibe una puntuación (★): cuanto más alta, mejor encaja contigo.',
          '- Lo que no encaja, ni lo ves. Se acabó cribar cientos de anuncios.',
          '- Y cuando una te interese, pásala al análisis con IA para decidir con datos si te presentas.',
        ],
        cta: { texto: 'Configurar mi perfil de empresa ahora', tab: 'profile' },
      },
    ],
  },
  {
    id: 'ofertar',
    titulo: '4 · Presentar tu oferta',
    articulos: [
      {
        id: 'deuc',
        titulo: 'El DEUC sin dolor',
        resumen: 'La declaración europea que sustituye al papeleo inicial. Se rellena una vez y se reutiliza.',
        cuerpo: [
          'El DEUC (Documento Europeo Único de Contratación) es una declaración responsable estandarizada: en lugar de presentar todos tus certificados al licitar, DECLARAS que cumples los requisitos. Solo el ganador tendrá que acreditarlo después con documentos.',
          '## Cómo se rellena',
          '- El órgano de contratación suele adjuntar su DEUC en la licitación (un archivo XML o un formulario).',
          '- Se cumplimenta electrónicamente (hay un servicio en línea para importar el XML, rellenarlo y exportarlo), se firma y se incluye en la oferta.',
          '- Las respuestas son casi siempre las mismas para tu empresa: guárdalo y reutilízalo en la siguiente licitación.',
          '! No dejes el DEUC para el último día: la primera vez impone, la segunda son 15 minutos.',
        ],
        enlaces: [
          { etiqueta: 'Visor/generador oficial del DEUC', url: 'https://visor.registrodelicitadores.gob.es/espd-web/filter?lang=es' },
          { etiqueta: 'Nota informativa del DEUC (Ministerio de Hacienda, PDF)', url: 'https://www.hacienda.gob.es/GabineteMinistro/varios/documento_europeo_unico_contratacion.pdf' },
        ],
      },
      {
        id: 'presentacion-electronica',
        titulo: 'La presentación electrónica de ofertas',
        resumen: 'Las ofertas se presentan online con la herramienta oficial de PLACSP. Así funciona.',
        cuerpo: [
          'Hoy las ofertas se presentan casi siempre de forma electrónica a través de la Herramienta de Preparación y Presentación de Ofertas de la propia Plataforma (una aplicación Java que se descarga desde la licitación concreta).',
          '## El proceso, resumido',
          '- 1. En la licitación (dentro de PLACSP, con tu usuario), pulsa sobre la preparación de oferta: se descarga la herramienta con los "sobres" electrónicos ya configurados.',
          '- 2. Rellena cada sobre: documentación administrativa (DEUC...), oferta técnica y oferta económica, según pida el pliego.',
          '- 3. Firma electrónicamente con tu certificado y presenta ANTES de la fecha y hora límite. La plataforma te da un justificante: guárdalo.',
          '! La herramienta necesita Java y un certificado bien instalado. Haz una prueba DÍAS antes del plazo, no horas: los problemas técnicos de última hora son el error clásico.',
        ],
        enlaces: [
          { etiqueta: 'Guías oficiales de la Plataforma (índice, incluye la Guía de Licitación Electrónica)', url: 'https://contrataciondelestado.es/wps/portal/guiasInfo' },
        ],
      },
      {
        id: 'errores-tipicos',
        titulo: 'Los 7 errores típicos del principiante',
        resumen: 'Los tropiezos que eliminan ofertas enteras — y cómo evitarlos todos.',
        cuerpo: [
          '- 1. Presentar fuera de plazo. La plataforma cierra a la hora exacta. Presenta el día antes.',
          '- 2. Meter la oferta económica en el sobre equivocado. Puede ser causa de EXCLUSIÓN directa: respeta qué va en cada sobre.',
          '- 3. No firmar (o firmar con un certificado caducado). Revisa tu certificado una semana antes.',
          '- 4. Ignorar los criterios de adjudicación y escribir la oferta "a tu manera". Escribe para PUNTUAR: responde uno a uno a lo que el pliego puntúa.',
          '- 5. Ofertar un precio temerariamente bajo sin justificación: puede exigir justificación o suponer exclusión.',
          '- 6. No preguntar las dudas: durante el plazo puedes hacer preguntas al órgano de contratación desde la Plataforma. Es gratis y las respuestas son públicas.',
          '- 7. Rendirse tras el primer no. Las primeras ofertas enseñan; las siguientes ganan.',
        ],
        cta: { texto: 'Analiza el pliego antes de ofertar', tab: 'new' },
      },
    ],
  },
  {
    id: 'diccionario',
    titulo: '5 · Diccionario del licitador',
    articulos: [
      {
        id: 'cpv',
        titulo: 'CPV: el código de tu actividad',
        resumen: 'Ocho dígitos que clasifican TODO lo que compra la administración.',
        cuerpo: [
          'El CPV (Common Procurement Vocabulary) es un código europeo de 8 dígitos que clasifica el objeto de cada contrato. Ejemplos: 45000000 = obras de construcción; 72000000 = servicios informáticos; 77310000 = plantación y mantenimiento de zonas verdes.',
          'Cuanto más a la izquierda coincidan los dígitos, más general es la coincidencia: «77» abarca toda la jardinería y agricultura; «7731» ya es más específico.',
          '! En tu perfil de LicitIA basta con poner los PREFIJOS de tus CPV (p. ej. «45, 77»): el radar hará el resto.',
        ],
        cta: { texto: 'Poner mis CPV en el perfil', tab: 'profile' },
      },
      {
        id: 'solvencia',
        titulo: 'Solvencia (económica y técnica)',
        resumen: 'La prueba de que puedes hacer el trabajo. Proporcional al tamaño del contrato.',
        cuerpo: [
          'La solvencia económica demuestra que tu empresa es viable (facturación anual, seguro de responsabilidad civil...). La solvencia técnica demuestra que sabes hacer el trabajo (contratos similares realizados, titulaciones, medios materiales y humanos).',
          'El pliego (PCAP) concreta SIEMPRE qué solvencia se exige y cómo acreditarla. Y debe ser proporcional: para contratos pequeños, requisitos pequeños.',
        ],
      },
      {
        id: 'criterios',
        titulo: 'Criterios de adjudicación (cómo se gana)',
        resumen: 'El reparto de puntos: precio, mejoras, memoria técnica... Aquí se decide todo.',
        cuerpo: [
          'Los criterios dicen cómo se reparten los 100 puntos del concurso. Dos familias:',
          '- Criterios automáticos (fórmula): el precio, plazos de entrega, ampliaciones de garantía... Se puntúan con una fórmula matemática, sin opinión.',
          '- Criterios de juicio de valor: la memoria técnica, la metodología... Los valora una mesa técnica.',
          'Estrategia básica: mira el PESO de cada bloque. Si el precio vale 70 puntos, la batalla es de precio; si la memoria vale 60, la batalla es de calidad y redacción.',
        ],
      },
      {
        id: 'baja-temeraria',
        titulo: 'Baja temeraria (u oferta anormalmente baja)',
        resumen: 'Cuando tu precio es tan bajo que resulta sospechoso: te pedirán explicaciones.',
        cuerpo: [
          'Si tu oferta económica queda muy por debajo de la media (según la fórmula del pliego o de la ley), se considera "anormalmente baja". No es eliminación automática: te pedirán JUSTIFICARLA (costes, medios propios, condiciones ventajosas).',
          'Si la justificación no convence, quedas excluido. Y si convence pero era irreal, sufrirás ejecutando el contrato a pérdida.',
          '! Regla de oro PYME: calcula tus costes reales antes de tocar el precio. Ganar perdiendo dinero no es ganar.',
        ],
      },
      {
        id: 'ute',
        titulo: 'UTE: unirse para llegar más lejos',
        resumen: 'Dos o más empresas se presentan juntas a un contrato que solas no alcanzarían.',
        cuerpo: [
          'La Unión Temporal de Empresas permite que varias empresas se presenten JUNTAS a una licitación, sumando solvencias y capacidades. Se formaliza solo si ganáis (antes basta un compromiso de constitución).',
          'Es LA herramienta de la PYME para acceder a contratos grandes: tú aportas la especialidad, otro aporta la facturación o los medios.',
        ],
      },
      {
        id: 'garantias',
        titulo: 'Garantías (provisional y definitiva)',
        resumen: 'La fianza que responde de que cumplirás el contrato.',
        cuerpo: [
          'La garantía definitiva es una fianza (normalmente el 5% del importe de adjudicación, IVA excluido) que deposita el GANADOR antes de firmar. Responde de la correcta ejecución y se devuelve al terminar sin incidencias.',
          'Puede constituirse en efectivo, aval bancario o seguro de caución. La provisional (al presentar oferta) hoy es excepcional.',
        ],
      },
    ],
  },
  {
    id: 'recursos',
    titulo: '6 · Recursos oficiales',
    articulos: [
      {
        id: 'enlaces-oficiales',
        titulo: 'Guías y manuales oficiales (PLACSP y más)',
        resumen: 'Las fuentes oficiales, verificadas, para profundizar en cada tema.',
        cuerpo: [
          'Esta Academia es un mapa en lenguaje llano; los documentos oficiales son el territorio. Aquí tienes las fuentes verificadas para profundizar:',
          '- En PLACSP → «Información» → «Guías de ayuda» encontrarás la «Guía de Servicios de Licitación Electrónica» (cómo preparar y presentar ofertas, ~110 págs.) y la «Guía del Operador Económico» (cómo usar la Plataforma como empresa, ~90 págs.). Se actualizan a menudo: por eso enlazamos al índice y no a una versión concreta.',
          '! Fuente de los materiales enlazados: Plataforma de Contratación del Sector Público (PLACSP), Ministerio de Hacienda, y demás organismos oficiales citados.',
        ],
        enlaces: [
          { etiqueta: 'PLACSP · Portal oficial', url: 'https://contrataciondelsectorpublico.gob.es/' },
          { etiqueta: 'PLACSP · Índice de guías oficiales de ayuda', url: 'https://contrataciondelestado.es/wps/portal/guiasInfo' },
          { etiqueta: 'PLACSP · Preguntas frecuentes para empresas', url: 'https://contrataciondelestado.es/wps/portal/plataforma/informacion/preguntas_frecuentes' },
          { etiqueta: 'Guía práctica de Contratación Pública para la PYME (ipyme.org, PDF)', url: 'https://ipyme.org/Publicaciones/Gu%C3%ADas%20para%20emprendedores%20y%20empresas/GuiaPracticaContratacionPublicaPyme.pdf' },
          { etiqueta: 'ROLECE · Registro Oficial de Licitadores', url: 'https://registrodelicitadores.gob.es/' },
          { etiqueta: 'Visor/generador oficial del DEUC', url: 'https://visor.registrodelicitadores.gob.es/espd-web/filter?lang=es' },
          { etiqueta: 'Ley 9/2017 de Contratos del Sector Público (BOE)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2017-12902' },
        ],
      },
    ],
  },
];

export const totalArticulos = secciones.reduce((n, s) => n + s.articulos.length, 0);
