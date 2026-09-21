/* ═══════════════════════════════════════════════════════════════════════
   CONSENTIMIENTO DE COOKIES · copia de pruebas (21-09-2026)
   NO está conectado a la landing ni carga nada de Google.

   Qué hace:
   - Si no hay una decisión válida guardada, muestra el aviso.
   - Guarda la decisión en el navegador. Guardar la decisión NO necesita
     consentimiento: es estrictamente necesario para no preguntar en cada
     visita (guía de cookies de la AEPD).
   - La decisión caduca a los 12 MESES, tanto si fue «sí» como si fue «no».
   - Si cambian las cookies o sus finalidades, se sube VERSION y se vuelve a
     preguntar a todo el mundo aunque no hayan pasado 12 meses.
   - Emite el evento «nitia:consentimiento» con la decisión. En la versión
     real, medicion.js escuchará ese evento y SOLO entonces cargará Google.

   Correspondencia con el modo de consentimiento v2 de Google (modo BÁSICO:
   nada se carga antes de decidir):
     analitica  → analytics_storage
     publicidad → ad_storage, ad_user_data, ad_personalization
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLAVE   = 'nitia-consentimiento';
  var VERSION = 1;                         // subir al cambiar cookies o finalidades
  var VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;   // 12 meses

  function leer() {
    try {
      var d = JSON.parse(localStorage.getItem(CLAVE));
      if (!d || d.version !== VERSION) return null;
      if (Date.now() - d.fecha > VIGENCIA_MS) return null;
      return d;
    } catch (e) { return null; }
  }

  function guardar(analitica, publicidad) {
    var d = { version: VERSION, fecha: Date.now(),
              analitica: !!analitica, publicidad: !!publicidad };
    try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {}
    aplicar(d);
    return d;
  }

  function aplicar(d) {
    document.dispatchEvent(new CustomEvent('nitia:consentimiento', { detail: d }));
  }

  var aviso = document.getElementById('aviso-cookies');
  var panel = document.getElementById('panel-cookies');
  var swAnalitica  = document.getElementById('cookies-analitica');
  var swPublicidad = document.getElementById('cookies-publicidad');

  function cerrarAviso() { if (aviso) aviso.hidden = true; }

  function abrirPanel() {
    var d = leer();
    swAnalitica.checked  = d ? d.analitica  : false;   // nada viene marcado
    swPublicidad.checked = d ? d.publicidad : false;
    if (typeof panel.showModal === 'function') panel.showModal();
    else panel.setAttribute('open', '');
  }
  function cerrarPanel() { if (panel.open) panel.close(); }

  function decidir(analitica, publicidad) {
    guardar(analitica, publicidad);
    cerrarAviso();
    cerrarPanel();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cookies]');
    if (!b) return;
    var accion = b.getAttribute('data-cookies');
    if (accion === 'rechazar')  decidir(false, false);
    if (accion === 'aceptar')   decidir(true, true);
    if (accion === 'configurar') { e.preventDefault(); abrirPanel(); }
    if (accion === 'guardar')   decidir(swAnalitica.checked, swPublicidad.checked);
  });

  // Estado inicial
  var previa = leer();
  if (previa) { cerrarAviso(); aplicar(previa); }
  else if (aviso) { aviso.hidden = false; }
})();
