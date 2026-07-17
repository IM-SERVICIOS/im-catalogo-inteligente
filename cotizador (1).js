/**
 * ============================================================
 *  COTIZADOR.JS — Cotizador Inteligente IM (Fase 2.5 — Supabase)
 * ============================================================
 *  Responsabilidades:
 *   1. Cargar el catálogo real de servicios desde data/services.json
 *      y poblar los selects/checkboxes del cotizador.
 *   2. Controlar la navegación entre los 4 pasos + barra de progreso.
 *   3. Validar cada paso antes de avanzar.
 *   4. Guardar la cotización en Supabase (tabla "cotizaciones"). El
 *      folio, "servir" y las fechas los genera/protege el SERVIDOR
 *      (ver supabase/schema.sql) — el navegador nunca los decide.
 *   5. Enviar copia por correo usando el proveedor configurado en
 *      IM_CONFIG.envioFormulario.proveedor.
 *   6. Mostrar el folio devuelto por Supabase y el botón de WhatsApp.
 *
 *  Se ejecuta después de "im:components-ready" (ver components-loader.js),
 *  ya que el <form id="cotizadorForm"> se inyecta dinámicamente.
 * ============================================================
 */

document.addEventListener("im:components-ready", async () => {
  const form = document.getElementById("cotizadorForm");
  if (!form) return; // el cotizador no está activo en esta fase/config

  const cfg = window.IM_CONFIG;
  let pasoActual = 1;
  const totalPasos = 4;
  let catalogoServicios = []; // [{id, nombre}, ...] cargado desde data/services.json

  // ---------- 0. Cliente de Supabase ----------
  let supabaseClient = null;
  const sbCfg = cfg.supabase;
  if (sbCfg && sbCfg.activo && typeof window.supabase !== "undefined" && sbCfg.url && sbCfg.anonKey && !sbCfg.url.includes("TU-PROYECTO")) {
    supabaseClient = window.supabase.createClient(sbCfg.url, sbCfg.anonKey);
  } else {
    console.warn("[IM] Supabase no está configurado (revisa IM_CONFIG.supabase en config.js). El cotizador seguirá funcionando solo por correo mientras tanto.");
  }

  // ---------- 1. Cargar catálogo de servicios y poblar el formulario ----------
  async function cargarCatalogoServicios() {
    try {
      const resp = await fetch("data/services.json");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      catalogoServicios = await resp.json();
    } catch (err) {
      console.error("[IM] No se pudo cargar data/services.json, usando respaldo de config.js:", err);
      // Respaldo: si el JSON falla, usamos los nombres de config.js sin id real.
      catalogoServicios = (cfg.cotizador.serviciosDisponibles || []).map((nombre, i) => ({
        id: `IM-${String(i + 1).padStart(3, "0")}`,
        nombre
      }));
    }
  }

  await cargarCatalogoServicios();

  llenarSelect("q-tipo", cfg.cotizador.tiposContribuyente);
  llenarSelect("q-tamano", cfg.cotizador.tamanosOperacion);
  llenarSelect("q-presupuesto", cfg.cotizador.rangosPresupuesto);
  llenarCheckboxesServicios("q-servicios-grid", catalogoServicios);

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

  function llenarCheckboxesServicios(contenedorId, servicios) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    servicios.forEach((serv, i) => {
      const wrap = document.createElement("label");
      wrap.className = "checkbox-pill";
      wrap.innerHTML = `<input type="checkbox" name="servicios" value="${escaparHtml(serv.id)}" id="serv-${i}"> <span>${escaparHtml(serv.nombre)}</span>`;
      contenedor.appendChild(wrap);
    });
  }

  function nombrePorId(id) {
    const encontrado = catalogoServicios.find(s => s.id === id);
    return encontrado ? encontrado.nombre : id;
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
    const idsSeleccionados = data.getAll("servicios");
    const nombresSeleccionados = idsSeleccionados.map(nombrePorId);
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
        <div><dt>Servicios de interés</dt><dd>${nombresSeleccionados.length ? nombresSeleccionados.map(escaparHtml).join(", ") : "—"}</dd></div>
        <div><dt>Presupuesto estimado</dt><dd>${escaparHtml(data.get("presupuesto") || "—")}</dd></div>
        <div class="full"><dt>Comentarios</dt><dd>${escaparHtml(data.get("comentarios") || "—")}</dd></div>
      </dl>
    `;
  }

  // ---------- 3. Folio de respaldo (SOLO si Supabase no responde) ----------
  // El folio "de verdad" lo genera el servidor (función
  // generar_folio_cotizacion() en Supabase, ver supabase/schema.sql).
  // Esta función solo existe como red de seguridad: si Supabase está
  // caído o mal configurado, igual queremos poder avisar por correo/
  // WhatsApp con un folio legible, aunque no sea el consecutivo oficial.
  function generarFolioRespaldo() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const prefijo = cfg.cotizador.folioPrefijo || "IM";
    const azar = Math.floor(Math.random() * 9000 + 1000);
    return `${prefijo}-${yyyy}${mm}${dd}-TMP${azar}`;
  }

  // ---------- 4. Guardar en Supabase ----------
  // El folio, "servir" y las fechas los pone el trigger del servidor;
  // aquí NUNCA se manda folio. Se pide de vuelta la fila insertada
  // (.select().single()) para mostrar el folio real al usuario.
  async function guardarEnSupabase(payload, idsServicios) {
    if (!supabaseClient) {
      return { ok: false, motivo: "no-configurado" };
    }
    const { data: fila, error } = await supabaseClient
      .from("cotizaciones")
      .insert([{
        nombre: payload.nombre,
        correo: payload.correo,
        telefono: payload.telefono,
        empresa: payload.empresa,
        rfc: payload.rfc,
        ciudad: payload.ciudad,
        estado: payload.estado,
        tipo_contribuyente: payload.tipoContribuyente,
        tamano_operacion: payload.tamanoOperacion,
        servicios_ids: idsServicios.join(","),
        presupuesto: payload.presupuesto,
        comentarios: payload.comentarios
      }])
      .select()
      .single();

    if (error) {
      console.error("[IM] Error al guardar en Supabase:", error.message);
      return { ok: false, motivo: error.message };
    }
    return { ok: true, folio: fila.folio };
  }

  // ---------- 5. Envío de correo (proveedor desacoplado) ----------
  async function enviarSolicitud(payload) {
    const proveedor = cfg.envioFormulario.proveedor;

    if (proveedor === "formsubmit") return enviarConFormSubmit(payload);
    if (proveedor === "emailjs") return enviarConEmailJs(payload);
    if (proveedor === "resend") return enviarConResend(payload);
    throw new Error(`Proveedor de envío no soportado: ${proveedor}`);
  }

  async function enviarConFormSubmit(payload) {
    const endpoint = cfg.envioFormulario.formsubmit.endpoint;
    const body = {
      ...payload,
      _subject: `Nueva solicitud de cotización — Folio ${payload.folio}`,
      _cc: payload.correo,
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
    const { publicKey, serviceId, templateId } = cfg.envioFormulario.emailjs;
    if (!publicKey || !serviceId || !templateId || typeof emailjs === "undefined") {
      throw new Error("EmailJS no está configurado todavía.");
    }
    return emailjs.send(serviceId, templateId, payload, publicKey);
  }

  async function enviarConResend(payload) {
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

  // ---------- 6. Envío del formulario ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const idsServicios = data.getAll("servicios");
    const nombresServicios = idsServicios.map(nombrePorId);

    const payloadBase = {
      nombre: data.get("nombre") || "",
      empresa: data.get("empresa") || "",
      rfc: data.get("rfc") || "",
      correo: data.get("correo") || "",
      telefono: data.get("telefono") || "",
      ciudad: data.get("ciudad") || "",
      estado: data.get("estado") || "",
      tipoContribuyente: data.get("tipoContribuyente") || "",
      tamanoOperacion: data.get("tamanoOperacion") || "",
      presupuesto: data.get("presupuesto") || "",
      comentarios: data.get("comentarios") || ""
    };

    mostrarEstado("enviando");

    // Primero se intenta guardar en Supabase: de ahí sale el folio real.
    const resultadoDb = await guardarEnSupabase(payloadBase, idsServicios);
    const dbOk = resultadoDb.ok;
    const folioFinal = dbOk ? resultadoDb.folio : generarFolioRespaldo();

    // El correo lleva el nombre legible de los servicios, no los ids.
    const payloadCorreo = {
      ...payloadBase,
      folio: folioFinal,
      servicios: nombresServicios.join(", ")
    };

    let correoOk = false;
    try {
      await enviarSolicitud(payloadCorreo);
      correoOk = true;
    } catch (err) {
      console.error("[IM] Error al enviar el correo del cotizador:", err);
    }

    if (dbOk || correoOk) {
      mostrarFolio(folioFinal, payloadCorreo);
      mostrarEstado("exito");
      if (!dbOk) console.warn("[IM] La cotización se envió por correo pero NO se guardó en Supabase. Folio de respaldo (no oficial):", folioFinal);
      if (!correoOk) console.warn("[IM] La cotización se guardó en Supabase (folio real) pero el correo falló.");
    } else {
      console.error("[IM] Falló tanto el guardado en Supabase como el envío por correo.");
      prepararWhatsappError(payloadCorreo);
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
