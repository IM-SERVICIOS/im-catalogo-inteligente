/**
 * ============================================================
 *  MAIN.JS — Lógica general de IM Catálogo Inteligente (Fase 1)
 * ============================================================
 *  Responsabilidades de este archivo en la Fase 1:
 *   1. Inyectar los datos de contacto/redes desde config.js
 *      (nunca hardcodear números, correos o links en el HTML).
 *   2. Controlar el menú móvil (nav-toggle).
 *   3. Año dinámico en el footer.
 *
 *  A partir de la Fase 2 este archivo se dividirá en módulos
 *  (components/) conforme crezca: cotizador.js, whatsapp.js, etc.
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {

  if (typeof IM_CONFIG === "undefined") {
    console.error("[IM] No se encontró IM_CONFIG. Verifica que config/config.js se cargue antes que main.js.");
    return;
  }

  // ---------- 1. Enlaces de contacto / WhatsApp / redes ----------
  const waLink = buildWhatsappLink(IM_CONFIG.contacto.whatsappNumero, IM_CONFIG.contacto.whatsappMensajeDefault);

  const waFloat = document.getElementById("waFloat");
  if (waFloat) waFloat.href = waLink;

  const ctaWhatsapp = document.getElementById("ctaWhatsapp");
  if (ctaWhatsapp) ctaWhatsapp.href = waLink;

  const footerCorreo = document.getElementById("footerCorreo");
  if (footerCorreo) footerCorreo.href = `mailto:${IM_CONFIG.contacto.correo}`;

  const footerFacebook = document.getElementById("footerFacebook");
  if (footerFacebook && IM_CONFIG.redes.facebook) footerFacebook.href = IM_CONFIG.redes.facebook;

  const footerInstagram = document.getElementById("footerInstagram");
  if (footerInstagram && IM_CONFIG.redes.instagram) footerInstagram.href = IM_CONFIG.redes.instagram;

  // LinkedIn y TikTok: se ocultan automáticamente mientras no exista
  // el perfil oficial en config.js (evita enlaces rotos o "#").
  const footerLinkedin = document.getElementById("footerLinkedin");
  if (footerLinkedin) {
    if (IM_CONFIG.redes.linkedin) footerLinkedin.href = IM_CONFIG.redes.linkedin;
    else footerLinkedin.hidden = true;
  }
  const footerTiktok = document.getElementById("footerTiktok");
  if (footerTiktok) {
    if (IM_CONFIG.redes.tiktok) footerTiktok.href = IM_CONFIG.redes.tiktok;
    else footerTiktok.hidden = true;
  }

  const footerTerminos = document.getElementById("footerTerminos");
  if (footerTerminos) footerTerminos.href = IM_CONFIG.documentos.terminos;

  const footerPrivacidad = document.getElementById("footerPrivacidad");
  if (footerPrivacidad) footerPrivacidad.href = IM_CONFIG.documentos.privacidad;

  // ---------- 2. Menú móvil ----------
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Cerrar el menú al elegir una opción (mejor UX en móvil)
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- 3. Año dinámico en el footer ----------
  const anioActual = document.getElementById("anioActual");
  if (anioActual) anioActual.textContent = new Date().getFullYear();

});

/**
 * Construye un link de WhatsApp válido a partir del número y mensaje
 * definidos en config.js. Centralizar esto evita reescribir la URL
 * de wa.me en cada archivo del sitio.
 */
function buildWhatsappLink(numero, mensaje) {
  const base = `https://wa.me/${numero}`;
  if (!mensaje) return base;
  return `${base}?text=${encodeURIComponent(mensaje)}`;
}
