# IM Catálogo Inteligente

Primer módulo del ecosistema digital de **IM Servicios Contables y Administrativos**.

---

## Nota importante sobre las fuentes de este proyecto

Este proyecto fusiona **dos indicaciones** que llegaron por separado:

1. **Prompt original** ("equipo creativo": Director de Arte, UX/UI, Marketing, Copywriter,
   Front-End) — enfocado en experiencia premium, storytelling visual y conversión.
2. **Documento Maestro de Desarrollo** (`PROMPT_IM_CATALOGO_INTELIGENTE.md`) — enfocado en
   especificación funcional estricta, arquitectura escalable y protocolo de entrega por fases.

Donde ambas indicaciones coinciden, se sumaron (nada se perdió). Donde hubo tensión entre
ambas, se resolvió así:

- **Testimonios / Casos de éxito:** el documento maestro es explícito y prioritario:
  **NO se muestran**, no se inventa contenido, y el componente queda oculto y desactivado
  por flag (`IM_CONFIG.features.testimonios` / `casosExito` en `false`). El prompt original
  ya había llegado a la misma conclusión por su cuenta; aquí se formaliza como regla dura.
- **Estructura de carpetas:** se adoptó la de `/components` + `/config` del documento
  maestro (más explícita), pero conservando la idea de módulos separados por página
  del prompt original (`hero`, `servicios`, `portal-clientes`, etc.).
- **Fuente de contenido:** en ambos casos la única fuente es el sitio oficial
  (`im-servicios.github.io/CONTABLES`). Todo el contenido de este catálogo —servicios,
  misión, visión, valores, FAQ, plantillas, equipo— proviene de ahí. No se inventaron
  estadísticas, clientes, premios ni alianzas.
- **Desarrollo por fases:** se respeta el protocolo del documento maestro (analizar antes
  de modificar, no romper fases previas, entregar siempre código completo y funcional).

---

## Estado actual: **FASE 2 — Completa y funcional** ✅

### Qué se mantuvo intacto de la Fase 1

- Estructura base (`index.html`, `css/styles.css`, `js/main.js`, `config/config.js`).
- Hero, Quiénes Somos, Servicios (los 7 servicios reales) y CTA de contacto.
- Paleta navy/crema/taupe heredada del sitio oficial, tipografía Fraunces + Inter.
- Botón flotante de WhatsApp, SEO base, PWA base, accesibilidad, responsive.

**No se reemplazó ningún archivo de la Fase 1 innecesariamente** — solo se ampliaron.

### Qué se agregó en esta fase

- **Cotizador Inteligente IM** (`components/cotizador.html` + `js/cotizador.js`):
  asistente de 4 pasos con barra de progreso, validación por paso, resumen final,
  folio con formato `IM-AAAAMMDD-0001`, envío desacoplado (ver abajo) y botón de
  WhatsApp con el folio ya incluido en el mensaje.
- **Portal de Clientes IM** (`components/portal-clientes.html`): explicación + mockup
  visual (CSS/SVG, no es una captura real) de lo que el cliente podrá consultar.
- **Dashboards Inteligentes** (`components/dashboards.html`): explicación + mockup de
  gráficas, basado en el servicio real "Dashboards / Graficados Interactivos".
- **Plantillas Inteligentes IM** (`components/plantillas-inteligentes.html`): grid de
  9 herramientas (las 3 reales ya disponibles en el sitio oficial + las mencionadas
  en el documento maestro como parte del mismo servicio de plantillas/indicadores).
- **Academia IM** (`components/academia.html`): enlaza directamente a las secciones
  reales de `academia.html` en el sitio oficial (Inicio, Manuales, Blog, FAQ Academia).
- **FAQ** (`components/faq.html`): las 5 preguntas reales del sitio oficial, en formato
  acordeón accesible (`<details>/<summary>`).
- **Testimonios y Casos de Éxito** (`components/testimonios.html`,
  `components/casos-exito.html`): **estructura oculta, sin contenido, sin enlace en el
  menú**. Solo se activarán manualmente cuando exista contenido real aprobado por IM
  (cambiar el flag correspondiente en `config/config.js`).
- **Redes sociales y compartir**: botón "Compartir catálogo" (Web Share API en móvil),
  "Copiar enlace", y espacio ya listo para LinkedIn/TikTok en el footer (ocultos
  automáticamente mientras no exista la URL real — ver `config/config.js`).
- **Componentes modulares**: `js/components-loader.js` inyecta cada bloque desde
  `/components/*.html` según su feature flag, sin necesidad de un backend.

### Envío del formulario del Cotizador (importante)

El documento maestro pide una solución sin PHP, funcional en GitHub Pages, y
desacoplada para migrar a Resend después. Se implementó así:

- **Proveedor activo hoy:** [FormSubmit](https://formsubmit.co) (`formsubmit.co/ajax/...`),
  gratuito, sin backend propio. **Acción requerida de tu parte:** la primera vez que
  llegue un envío real, FormSubmit pedirá confirmar el correo `im.contable29@gmail.com`
  desde la bandeja de entrada — hay que dar clic en ese enlace de confirmación una sola vez.
- El cliente recibe copia automática a su propio correo (`_cc`), tal como pide el
  documento maestro ("enviar el folio al correo del cliente" + "al correo de IM").
- **Migración futura a Resend:** todo el envío pasa por una sola función
  (`enviarSolicitud()` en `js/cotizador.js`) que decide el proveedor según
  `IM_CONFIG.envioFormulario.proveedor`. Para migrar, solo hay que:
  1. Cambiar `proveedor: "formsubmit"` a `proveedor: "resend"` en `config/config.js`.
  2. Completar `envioFormulario.resend.apiEndpoint` con la función serverless real.
  3. No se toca el wizard, la validación, el folio ni la UI.

### Limitación honesta sobre el folio

El folio (`IM-AAAAMMDD-0001`) se genera con un consecutivo guardado en el navegador
del visitante (`localStorage`), porque el sitio no tiene backend propio todavía. Esto
garantiza folios únicos y con el formato correcto por dispositivo/sesión, pero **no**
es un consecutivo global compartido entre todos los visitantes al mismo tiempo. Un
consecutivo verdaderamente centralizado requiere el backend previsto para la fase con
Node/Next.js + Supabase/Resend, según la visión del documento maestro.

### Qué sigue sin mostrarse (a propósito, por diseño)

- Testimonios y casos de éxito (ver arriba).
- Imágenes reales del sitio oficial (hero, plantillas, equipo): esta fase sigue usando
  mockups ilustrativos en CSS/SVG. En cuanto se autorice el uso de las imágenes reales
  (`hero.jpg`, fotos del equipo, `plantilla-preview.png`, etc.), se integran en
  `assets/images/` sin romper el layout.
- Íconos PWA (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`): se generaron como
  **placeholder** (fondo navy + "IM") porque el logotipo oficial en alta resolución no
  venía en los archivos recibidos. Cuando exista el logo original, solo hay que
  reemplazar esos 3 archivos en `assets/icons/`.

---

## Estructura del proyecto

```
/index.html
/css/styles.css
/js/main.js
/js/components-loader.js
/js/cotizador.js
/js/share.js
/config/config.js
/components/
  portal-clientes.html
  dashboards.html
  plantillas-inteligentes.html
  academia.html
  cotizador.html
  faq.html
  testimonios.html     (oculto, sin contenido)
  casos-exito.html     (oculto, sin contenido)
/assets/icons/
  favicon.svg, icono-sobre.svg
  icon-192.png, icon-512.png, apple-touch-icon.png  (placeholders, ver nota arriba)
/assets/images/        (vacío — pendiente de imágenes reales autorizadas)
robots.txt
manifest.json
sitemap.xml
README.md
```

---

## Cómo probar en local

Los componentes se cargan con `fetch()`, que requiere http(s) y no funciona abriendo
`index.html` directamente con doble clic (`file://`). Para probar localmente:

```bash
npx serve .
```

o cualquier servidor estático equivalente (Live Server de VS Code, `python -m http.server`, etc.).
En GitHub Pages funciona sin configuración adicional.

---

## Cómo publicar en GitHub Pages

1. Sube todo el contenido de esta carpeta a la raíz del repositorio (o a la carpeta
   configurada como fuente de Pages).
2. Activa GitHub Pages apuntando a esa rama/carpeta.
3. Confirma el correo de FormSubmit la primera vez que llegue una solicitud real del
   Cotizador (ver sección de arriba).

---

## Siguiente fase (Fase 3, sugerida)

- Migrar el envío del Cotizador de FormSubmit a Resend (backend propio).
- Folio con consecutivo centralizado (requiere backend/base de datos).
- Integrar imágenes reales del sitio oficial una vez autorizadas.
- Activar Testimonios / Casos de Éxito **solo** cuando IM entregue contenido real.
- Iniciar Panel Administrativo / CRM / gestión documental (visión de largo plazo del
  documento maestro).

Para iniciarla, envía el mensaje: **`Continuar Fase 3`**
