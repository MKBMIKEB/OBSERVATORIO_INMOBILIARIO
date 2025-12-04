/* carga_ofertas.js
   Opción A: construir window.ofertaLayers al cargar/actualizar datos
   y dejar que filtros.js pinte el resultado en window.ofertasLayer.
   - NO agrega capas base al mapa: solo las guarda en ofertaLayers.
   - Al terminar, dispara 'ofertas:ready' o llama reapplyFiltersOnDataChange()
*/

(() => {
  'use strict';

  // === 1) Config ===
  // Ajusta esta URL a tu endpoint real (ej: '/api/ofertas' o '/ofertas')
  const URL_LISTAR_OFERTAS = '/ofertas';

  // === 2) Utilidades ===
  const hasLeaflet = () => typeof L !== 'undefined';
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  async function waitFor(fn, timeoutMs = 7000, stepMs = 100) {
    const t0 = Date.now();
    while (!fn()) {
      if (Date.now() - t0 > timeoutMs) return false;
      await wait(stepMs);
    }
    return true;
  }

  // Asegura los globales que necesitan los filtros (por si el orden de scripts varía)
  function ensureInfra() {
    if (!hasLeaflet() || !window.map) return false;
    if (!window.ofertasLayer) {
      window.ofertasLayer = L.featureGroup().addTo(window.map);
    }
    if (!Array.isArray(window.ofertaLayers)) {
      window.ofertaLayers = [];
    }
    return true;
  }

  // Normaliza pequeñas variaciones de estructura para las propiedades
  function normalizeProps(raw = {}) {
    // Aquí no transformamos nombres (los filtros aceptan alias).
    // Solo nos aseguramos de devolver un objeto plano.
    return { ...raw };
  }

  // Crea un L.Layer a partir de un registro.
  // Acepta:
  //  - GeoJSON (Feature o geometry)
  //  - {lat, lng}
  //  - {coordsLatLng: [[lat,lng], ...]}  (Polyline/Polygon)
  function buildLayerFromRecord(rec) {
    const props = normalizeProps(rec.properties || rec.attrs || rec);

    // 1) GeoJSON Feature completo
    if (rec.type === 'Feature' && rec.geometry) {
      const gj = L.geoJSON(rec, {
        onEachFeature: (f, l) => bindPopupIfAvailable(l, f.properties || props),
      });
      return { layer: gj, properties: fProps(props) };
    }

    // 2) GeoJSON geometry + props aparte
    if (rec.geometry && rec.geometry.type) {
      const feature = { type: 'Feature', geometry: rec.geometry, properties: props };
      const gj = L.geoJSON(feature, {
        onEachFeature: (f, l) => bindPopupIfAvailable(l, f.properties || props),
      });
      return { layer: gj, properties: fProps(props) };
    }

    // 3) geometry en string (ej. guardado como texto)
    if (typeof rec.geomGeoJSON === 'string') {
      try {
        const geom = JSON.parse(rec.geomGeoJSON);
        const feature = { type: 'Feature', geometry: geom, properties: props };
        const gj = L.geoJSON(feature, {
          onEachFeature: (f, l) => bindPopupIfAvailable(l, f.properties || props),
        });
        return { layer: gj, properties: fProps(props) };
      } catch (_) { /* continúa */ }
    }

    // 4) Punto simple
    if (Number.isFinite(rec.lat) && Number.isFinite(rec.lng)) {
      const m = L.marker([rec.lat, rec.lng]);
      bindPopupIfAvailable(m, props);
      return { layer: m, properties: fProps(props) };
    }

    // 5) Polilínea/Polígono con coords Leaflet [[lat,lng], ...] o [[[lat,lng]...], ...]
    if (Array.isArray(rec.coordsLatLng) && rec.coordsLatLng.length) {
      const isPolygon = Array.isArray(rec.coordsLatLng[0]) && Array.isArray(rec.coordsLatLng[0][0]);
      const lyr = isPolygon ? L.polygon(rec.coordsLatLng) : L.polyline(rec.coordsLatLng);
      bindPopupIfAvailable(lyr, props);
      return { layer: lyr, properties: fProps(props) };
    }

    // Si no reconocemos la estructura, devuelve null para omitir
    return null;
  }

  // Adjunta popup si existe una función global de popup
  function bindPopupIfAvailable(layer, properties) {
    if (typeof window.generarPopupHTML === 'function') {
      try { layer.bindPopup(window.generarPopupHTML(properties)); } catch (_) {}
    } else if (typeof window.generarPopupOferta === 'function') {
      try { layer.bindPopup(window.generarPopupOferta(properties)); } catch (_) {}
    }
  }

  // Sanitiza las propiedades para los filtros (sin cambiar nombres)
  function fProps(p) { return { ...p }; }

  // Evita duplicados por ID (si lo tienes). Clave configurable.
  function getUniqueKey(p) {
    // Si usas otro campo como identificador, cámbialo aquí.
    return (p && (p.ID || p.Id || p.id)) ? String(p.ID || p.Id || p.id) : null;
  }

  // === 3) Carga desde URL ===
  async function loadOfertasFromUrl(url = URL_LISTAR_OFERTAS) {
    const ok = await waitFor(() => hasLeaflet() && !!window.map);
    if (!ok) {
      console.warn('[carga_ofertas] No hay Leaflet o map listo');
      return;
    }
    ensureInfra();

    let data;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (e) {
      console.error('[carga_ofertas] Error obteniendo ofertas:', e);
      return;
    }

    hydrateOfertaLayersFromArray(data);
  }

  // === 4) Carga desde un arreglo en memoria ===
  function hydrateOfertaLayersFromArray(arr) {
    if (!Array.isArray(arr)) {
      console.warn('[carga_ofertas] El dato recibido no es un array');
      return;
    }
    ensureInfra();

    // Evita duplicados
    const seen = new Set(window.ofertaLayers.map(v => getUniqueKey(v.properties)).filter(Boolean));

    arr.forEach(rec => {
      // Asegura propiedades (si el record viene plano del backend)
      const baseProps = normalizeProps(rec.properties || rec.attrs || rec);

      const uniqueKey = getUniqueKey(baseProps);
      if (uniqueKey && seen.has(uniqueKey)) return;

      const built = buildLayerFromRecord(rec);
      if (!built) return;

      window.ofertaLayers.push(built);
      if (uniqueKey) seen.add(uniqueKey);
    });

    // Notifica a filtros para que pinte lo visible
    if (typeof window.reapplyFiltersOnDataChange === 'function') {
      window.reapplyFiltersOnDataChange();
    } else {
      window.dispatchEvent(new Event('ofertas:ready'));
    }
  }

  // === 5) API pública ===
  window.cargaOfertas = {
    loadFromUrl: loadOfertasFromUrl,
    loadFromArray: hydrateOfertaLayersFromArray,
  };

  // === 6) Auto-arranque (opcional) ===
  // Si quieres que cargue automáticamente desde la URL apenas haya mapa:
  document.addEventListener('DOMContentLoaded', async () => {
    // Espera a que exista el mapa (si tu mapa dispara un evento 'map:ready', puedes escuchar ese en vez de esperar)
    await waitFor(() => hasLeaflet() && !!window.map, 8000, 120);
    // Descomenta para carga automática:
    // loadOfertasFromUrl();
  });

})();
