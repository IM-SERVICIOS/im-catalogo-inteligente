/**
 * ============================================================
 *  CONFIG.JS — Configuración centralizada de IM Catálogo Inteligente
 * ============================================================
 *  Este archivo concentra todos los datos de contacto, redes
 *  sociales y variables globales del sitio.
 *
 *  REGLA DE ORO: ningún otro archivo debe repetir estos valores
 *  "a mano". Siempre se debe leer desde aquí (IM_CONFIG).
 *
 *  Al evolucionar hacia Next.js/Supabase, este objeto se puede
 *  migrar directamente a variables de entorno (.env) sin cambiar
 *  la forma en que el resto del código lo consume.
 * ============================================================
 */

const IM_CONFIG = {

  // Identidad de la empresa
  empresa: {
    nombre: "IM Servicios Contables y Administrativos",
    nombreCorto: "IM",
    descripcion: "Servicios contables, administrativos y asesoría financiera con soluciones tecnológicas.",
    anioFundacion: 2025,
    ciudad: "Guadalupe, Nuevo León, México"
  },

  // Contacto directo
  contacto: {
    correo: "im.contable29@gmail.com",
    whatsappNumero: "528110068006", // formato internacional sin '+' ni espacios
    whatsappMensajeDefault: "Hola, me interesa información sobre IM Servicios Contables"
  },

  // Redes sociales oficiales
  redes: {
    facebook: "https://www.facebook.com/share/18oyHU5iuT/?mibextid=wwXIfr",
    instagram: "https://instagram.com/imservicioscontables/profilecard/?igsh=MXNiYTZpYjVjbXlmdQ==",
    linkedin: "",   // pendiente: agregar cuando exista el perfil oficial
    tiktok: ""      // pendiente: agregar cuando exista el perfil oficial
  },

  // Enlace canónico del sitio (para compartir / copiar enlace)
  sitio: {
    urlPublica: "https://im-servicios.github.io/CONTABLES/"
  },

  // ------------------------------------------------------------
  // COTIZADOR INTELIGENTE IM (Fase 2)
  // ------------------------------------------------------------
  cotizador: {
    // Prefijo de folio: IM-AAAAMMDD-0001
    folioPrefijo: "IM",
    // Servicios de interés que se ofrecen como opción en el cotizador
    // (deben coincidir 1:1 con los servicios reales listados en #servicios)
    serviciosDisponibles: [
      "Contabilidad para pequeños negocios y personas con actividad empresarial",
      "Nómina y RRHH",
      "Impuestos",
      "Facturación Electrónica",
      "Asesorías Especializadas",
      "Dashboards / Graficados Interactivos",
      "Plantillas e Indicadores"
    ],
    tiposContribuyente: ["Persona Física", "Persona Moral"],
    tamanosOperacion: ["Emprendedor / Independiente", "1 a 5 empleados", "6 a 20 empleados", "Más de 20 empleados"],
    rangosPresupuesto: ["Aún no lo sé / quiero orientación", "Menos de $2,000 MXN/mes", "$2,000 - $5,000 MXN/mes", "Más de $5,000 MXN/mes"]
  },

  // ------------------------------------------------------------
  // ENVÍO DE FORMULARIO (desacoplado para migrar a Resend/serverless)
  // ------------------------------------------------------------
  // 'proveedor' controla qué implementación usa js/cotizador.js.
  // Cambiar aquí no debería requerir tocar el resto del código:
  //   - "formsubmit": funciona en GitHub Pages sin backend (fase 2 actual).
  //   - "emailjs": alternativa con más control, requiere cuenta EmailJS.
  //   - "resend": función serverless propia (fase futura, ver README).
  envioFormulario: {
    proveedor: "formsubmit",
    formsubmit: {
      endpoint: "https://formsubmit.co/ajax/im.contable29@gmail.com"
    },
    emailjs: {
      publicKey: "",
      serviceId: "",
      templateId: ""
    },
    resend: {
      apiEndpoint: ""
    }
  },

  // Documentos legales
  documentos: {
    terminos: "docs/terminos.pdf",
    privacidad: "docs/privacidad.pdf"
  },

  // Rutas internas del sitio (para mantener consistencia de navegación)
  rutas: {
    inicio: "index.html",
    servicios: "index.html#servicios",
    sobreNosotros: "index.html#sobre",
    beneficios: "index.html#beneficios",
    contacto: "index.html#contacto",
    catalogo: "catalogo.html",
    productos: "productos.html",
    academia: "academia.html",
    comunidad: "comunidad.html",
    cotizador: "index.html#cotizador",
    portalClientes: "index.html#portal-clientes",
    dashboardsSeccion: "index.html#dashboards",
    plantillas: "index.html#plantillas-inteligentes",
    academiaSeccion: "index.html#academia",
    faq: "index.html#faq"
  },

  // Feature flags — controla qué módulos están visibles.
  // Esto permite activar el ecosistema por fases sin romper nada.
  // IMPORTANTE: testimonios y casosExito permanecen en false a propósito.
  // El documento maestro PROHÍBE mostrarlos sin contenido real aprobado por IM.
  // Los componentes existen (components/testimonios.html, components/casos-exito.html)
  // pero nunca se inyectan en el DOM mientras el flag esté en false.
  features: {
    testimonios: false,      // NUNCA activar sin contenido real y aprobado
    casosExito: false,       // NUNCA activar sin contenido real y aprobado
    cotizadorInteligente: true,   // Fase 2: activo
    portalClientes: true,         // Fase 2: activo (mockup + explicación)
    dashboards: true,              // Fase 2: activo (mockup + explicación)
    plantillasInteligentes: true,  // Fase 2: activo
    academia: true,                 // Fase 2: activo
    faq: true,                      // Fase 2: activo
    compartir: true,                // Fase 2: botones de compartir/copiar enlace
    pwa: true
  }
};

// Exponer de forma global para uso en cualquier página del sitio
if (typeof window !== "undefined") {
  window.IM_CONFIG = IM_CONFIG;
}
