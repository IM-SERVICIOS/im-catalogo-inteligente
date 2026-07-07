/**
 * ============================================================
 *  SHARE.JS — Compartir catálogo / copiar enlace (Fase 2)
 * ============================================================
 *  Usa la Web Share API cuando el navegador la soporta (típico en
 *  móvil) y cae de vuelta a "copiar enlace" en escritorio.
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof IM_CONFIG === "undefined" || !IM_CONFIG.features.compartir) return;

  const shareBtn = document.getElementById("shareCatalogo");
  const copyBtn = document.getElementById("copyEnlace");
  const copyFeedback = document.getElementById("copyEnlaceFeedback");
  const url = IM_CONFIG.sitio.urlPublica;
  const titulo = IM_CONFIG.empresa.nombre;
  const texto = IM_CONFIG.empresa.descripcion;

  if (shareBtn) {
    if (navigator.share) {
      shareBtn.addEventListener("click", async () => {
        try {
          await navigator.share({ title: titulo, text: texto, url });
        } catch (err) {
          // El usuario canceló el share sheet; no es un error real.
        }
      });
    } else {
      shareBtn.hidden = true;
    }
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url);
        if (copyFeedback) {
          copyFeedback.hidden = false;
          copyFeedback.textContent = "¡Enlace copiado!";
          setTimeout(() => { copyFeedback.hidden = true; }, 2500);
        }
      } catch (err) {
        console.error("[IM] No se pudo copiar el enlace:", err);
      }
    });
  }
});
