/**
 * ============================================================
 *  COMPONENTS-LOADER.JS — Fase 2
 * ============================================================
 *  Inyecta los componentes modulares (/components/*.html) dentro
 *  de los placeholders <section data-component="..."> de index.html.
 *
 *  Reglas:
 *   - Un componente SOLO se carga si su feature flag en IM_CONFIG
 *     está en `true`. Esto es lo que garantiza que testimonios.html
 *     y casos-exito.html nunca aparezcan sin contenido real aprobado.
 *   - Al terminar de inyectar todo, dispara el evento "im:components-ready"
 *     en document, para que cotizador.js y share.js puedan enlazar
 *     sus propios listeners sobre markup que recién existe en el DOM.
 *
 *  Requiere servirse por http(s) (GitHub Pages o un servidor local).
 *  Abrir index.html directamente con file:// bloqueará fetch() por
 *  política CORS del navegador; para probar en local usa por ejemplo:
 *    npx serve .
 *  o la extensión "Live Server" de VS Code.
 * ============================================================
 */

(function () {
  const FLAG_BY_COMPONENT = {
    "portal-clientes": "portalClientes",
    "dashboards": "dashboards",
    "plantillas-inteligentes": "plantillasInteligentes",
    "academia": "academia",
    "faq": "faq",
    "cotizador": "cotizadorInteligente",
    "testimonios": "testimonios",
    "casos-exito": "casosExito"
  };

  async function cargarComponente(placeholder) {
    const nombre = placeholder.dataset.component; // ej. "portal-clientes"
    const flag = FLAG_BY_COMPONENT[nombre];
    const activo = flag ? !!(window.IM_CONFIG && IM_CONFIG.features && IM_CONFIG.features[flag]) : true;

    if (!activo) {
      // No se toca el DOM: el componente ni siquiera se descarga.
      return;
    }

    try {
      const resp = await fetch(`components/${nombre}.html`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      placeholder.outerHTML = html;
    } catch (err) {
      console.error(`[IM] No se pudo cargar el componente "${nombre}":`, err);
      placeholder.hidden = true;
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const placeholders = Array.from(document.querySelectorAll("[data-component]"));
    await Promise.all(placeholders.map(cargarComponente));
    document.dispatchEvent(new CustomEvent("im:components-ready"));
  });
})();
