/**
 * ============================================================
 *  COTIZADOR.JS — Cotizador Inteligente IM (Fase 2)
 * ============================================================
 *  Responsabilidades:
 *   1. Poblar los selects/checkboxes del cotizador desde IM_CONFIG.
 *   2. Controlar la navegación entre los 4 pasos + barra de progreso.
 *   3. Validar cada paso antes de avanzar.
 *   4. Generar el folio con formato IM-AAAAMMDD-0001.
 *   5. Enviar la solicitud usando el proveedor configurado en
 *      IM_CONFIG.envioFormulario.proveedor (desacoplado a propósito
 *      para poder migrar de FormSubmit a Resend sin rehacer el wizard).
 *   6. Mostrar el folio y el botón de WhatsApp con el folio incluido.
 *
 *  Se ejecuta después de "im:components-ready" (ver components-loader.js),
 *  ya que el <form id="cotizadorForm"> se inyecta dinámicamente.
 * ============================================================
 */

document.addEventListener("im:components-ready", () => {
  const form = document.getElementById("cotizadorForm");
  if (!form) return; // el cotizador no está activo en esta fase/config

  const cfg = window.IM_CONFIG;
  let pasoActual = 1;
  const totalPasos = 4;

  // ---------- 1. Poblar campos dinámicos desde config.js ----------
  llenarSelect("q-tipo", cfg.cotizador.tiposContribuyente);
  llenarSelect("q-tamano", cfg.cotizador.tamanosOperacion);
  llenarSelect("q-presupuesto", cfg.cotizador.rangosPresupuesto);
  llenarCheckboxes("q-servicios-grid", cfg.cotizador.serviciosDisponibles);

  function llenarSelect(id, opciones) {
    const select = document.getElementById(id);
    if (!select) return;
    opciones.forEach(op => {
      const el = document.createElement("option");
      el.value = op;
      el.textContent = op;
      select.appendChild(el);
    });
  }

  function llenarCheckboxes(contenedorId, opciones) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    opciones.forEach((op, i) => {
      const wrap = document.createElement("label");
      wrap.className = "checkbox-pill";
      wrap.innerHTML = `<input type="checkbox" name="servicios" value="${escaparHtml(op)}" id="serv-${i}"> <span>${escaparHtml(op)}</span>`;
      contenedor.appendChild(wrap);
    });
  }

  function escaparHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ---------- 2. Navegación entre pasos ----------
  const steps = Array.from(form.querySelectorAll(".cotizador-step"));
  const progressBar = document.getElementById("cotizadorProgressBar");
  const progressWrap = document.getElementById("cotizadorProgressWrap");
  const stepLabels = Array.from(document.querySelectorAll(".step-dot"));

  function mostrarPaso(n) {
    steps.forEach(s => {
      s.hidden = Number(s.dataset.step) !== n;
    });
    stepLabels.forEach((el, i) => {
      el.classList.toggle("active", i < n);
    });
    if (progressBar) progressBar.style.width = `${(n / totalPasos) * 100}%`;
    if (progressWrap) progressWrap.setAttribute("aria-valuenow", String(n));
    if (n === totalPasos) construirResumen();
    pasoActual = n;
  }

  form.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    if (btn.dataset.action === "next") {
      if (!validarPaso(pasoActual)) return;
      mostrarPaso(Math.min(pasoActual + 1, totalPasos));
    }
    if (btn.dataset.action === "prev") {
      mostrarPaso(Math.max(pasoActual - 1, 1));
    }
  });

  function validarPaso(n) {
    const stepEl = steps.find(s => Number(s.dataset.step) === n);
    if (!stepEl) return true;
    const requeridos = Array.from(stepEl.querySelectorAll("[required]"));
    let ok = true;
    requeridos.forEach(campo => {
      if (!campo.value || !campo.value.trim()) {
        campo.reportValidity();
        ok = false;
      }
    });
    return ok;
  }

  function construirResumen() {
    const data = new FormData(form);
    const servicios = data.getAll("servicios");
    const resumen = document.getElementById("q-resumen");
    if (!resumen) return;
    resumen.innerHTML = `
      <dl class="resumen-list">
        <div><dt>Nombre</dt><dd>${escaparHtml(data.get("nombre") || "—")}</dd></div>
        <div><dt>Empresa</dt><dd>${escaparHtml(data.get("empresa") || "—")}</dd></div>
        <div><dt>Correo</dt><dd>${escaparHtml(data.get("correo") || "—")}</dd></div>
        <div><dt>Teléfono</dt><dd>${escaparHtml(data.get("telefono") || "—")}</dd></div>
        <div><dt>Ciudad / Estado</dt><dd>${escaparHtml(data.get("ciudad") || "—")}, ${escaparHtml(data.get("estado") || "—")}</dd></div>
        <div><dt>Tipo de contribuyente</dt><dd>${escaparHtml(data.get("tipoContribuyente") || "—")}</dd></div>
        <div><dt>Tamaño de operación</dt><dd>${escaparHtml(data.get("tamanoOperacion") || "—")}</dd></div>
        <div><dt>Servicios de interés</dt><dd>${servicios.length ? servicios.map(escaparHtml).join(", ") : "—"}</dd></div>
        <div><dt>Presupuesto estimado</dt><dd>${escaparHtml(data.get("presupuesto") || "—")}</dd></div>
        <div class="full"><dt>Comentarios</dt><dd>${escaparHtml(data.get("comentarios") || "—")}</dd></div>
      </dl>
    `;
  }

  // ---------- 3. Generación de folio ----------
  // Formato: IM-AAAAMMDD-0001
  // Nota técnica: al ser un sitio 100% estático (sin backend), el
  // consecutivo se lleva en localStorage del navegador. Esto garantiza
  // folios únicos y legibles por sesión/dispositivo; para un folio
  // verdaderamente global y secuencial entre todos los visitantes se
  // requiere el backend previsto en la fase con Resend/Node (ver README).
  function generarFolio() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const fechaKey = `${yyyy}${mm}${dd}`;

    const storageKey = "im_folio_counter_" + fechaKey;
    let consecutivo = Number(localStorage.getItem(storageKey) || 0) + 1;
    localStorage.setItem(storageKey, String(consecutivo));

    const prefijo = cfg.cotizador.folioPrefijo || "IM";
    return `${prefijo}-${fechaKey}-${String(consecutivo).padStart(4, "0")}`;
  }

  // ---------- 4. Envío (proveedor desacoplado) ----------
  async function enviarSolicitud(payload) {
    const proveedor = cfg.envioFormulario.proveedor;

    if (proveedor === "formsubmit") {
      return enviarConFormSubmit(payload);
    }
    if (proveedor === "emailjs") {
      return enviarConEmailJs(payload);
    }
    if (proveedor === "resend") {
      return enviarConResend(payload);
    }
    throw new Error(`Proveedor de envío no soportado: ${proveedor}`);
  }

  async function enviarConFormSubmit(payload) {
    const endpoint = cfg.envioFormulario.formsubmit.endpoint;
    const body = {
      ...payload,
      _subject: `Nueva solicitud de cotización — Folio ${payload.folio}`,
      _cc: payload.correo, // envía copia al correo del cliente
      _template: "table"
    };
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(`FormSubmit respondió ${resp.status}`);
    return true;
  }

  async function enviarConEmailJs(payload) {
    // Placeholder listo para activarse: requiere cargar el SDK de EmailJS
    // (https://cdn.jsdelivr.net/npm/@emailjs/browser/dist/email.min.js) y
    // completar IM_CONFIG.envioFormulario.emailjs con las claves reales.
    const { publicKey, serviceId, templateId } = cfg.envioFormulario.emailjs;
    if (!publicKey || !serviceId || !templateId || typeof emailjs === "undefined") {
      throw new Error("EmailJS no está configurado todavía.");
    }
    return emailjs.send(serviceId, templateId, payload, publicKey);
  }

  async function enviarConResend(payload) {
    // Placeholder para la fase con backend propio (Node/Next.js + Resend).
    const endpoint = cfg.envioFormulario.resend.apiEndpoint;
    if (!endpoint) throw new Error("Falta configurar el endpoint de Resend.");
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`Resend endpoint respondió ${resp.status}`);
    return true;
  }

  // ---------- 5. Envío del formulario ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const folio = generarFolio();
    const payload = {
      folio,
      nombre: data.get("nombre") || "",
      empresa: data.get("empresa") || "",
      rfc: data.get("rfc") || "",
      correo: data.get("correo") || "",
      telefono: data.get("telefono") || "",
      ciudad: data.get("ciudad") || "",
      estado: data.get("estado") || "",
      tipoContribuyente: data.get("tipoContribuyente") || "",
      tamanoOperacion: data.get("tamanoOperacion") || "",
      servicios: data.getAll("servicios").join(", "),
      presupuesto: data.get("presupuesto") || "",
      comentarios: data.get("comentarios") || ""
    };

    mostrarEstado("enviando");

    try {
      await enviarSolicitud(payload);
      mostrarFolio(folio, payload);
      mostrarEstado("exito");
    } catch (err) {
      console.error("[IM] Error al enviar el cotizador:", err);
      prepararWhatsappError(payload);
      mostrarEstado("error");
    }
  });

  function mostrarEstado(estado) {
    const wizard = form;
    const enviando = document.getElementById("cotizadorEnviando");
    const exito = document.getElementById("cotizadorExito");
    const error = document.getElementById("cotizadorError");

    wizard.hidden = estado !== "form";
    if (enviando) enviando.hidden = estado !== "enviando";
    if (exito) exito.hidden = estado !== "exito";
    if (error) error.hidden = estado !== "error";
  }

  function mostrarFolio(folio, payload) {
    const folioEl = document.getElementById("folioNumero");
    if (folioEl) folioEl.textContent = folio;

    const waBtn = document.getElementById("q-whatsappFolio");
    if (waBtn) {
      const mensaje = `Hola, soy ${payload.nombre}. Acabo de solicitar una cotización en el sitio de IM. Mi folio es ${folio}.`;
      waBtn.href = buildWhatsappLink(cfg.contacto.whatsappNumero, mensaje);
    }
  }

  function prepararWhatsappError(payload) {
    const waBtn = document.getElementById("q-whatsappError");
    if (waBtn) {
      const mensaje = `Hola, soy ${payload.nombre}. Intenté llenar el cotizador del sitio pero no se pudo enviar. Me interesa: ${payload.servicios || "sus servicios"}.`;
      waBtn.href = buildWhatsappLink(cfg.contacto.whatsappNumero, mensaje);
    }
  }

  // Inicializar en paso 1
  mostrarPaso(1);
});
