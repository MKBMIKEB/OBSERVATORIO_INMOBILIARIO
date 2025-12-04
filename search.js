// search.js
// Barra de búsqueda: ID de oferta (ofertasLayer) o municipio por Nominatim (sin IGAC)

(function () {
  // Espera hasta que existan map y ofertasLayer
  (function waitForMap(){
    if (!window.map || !window.ofertasLayer) {
      return setTimeout(waitForMap, 150);
    }
    initSearch();
  })();

  function initSearch() {
    // Capa para resaltar municipio encontrado
    const muniHighlight = L.geoJSON(null, {
      style: { color: '#2563eb', weight: 3, fillOpacity: 0.1 }
    }).addTo(map);

    // Control Leaflet (input + botón)
    const SearchControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control searchbar');
        container.innerHTML = `
          <input id="searchText" type="text" placeholder="Buscar: ID oferta o municipio…" />
          <button id="searchBtn" type="button">Buscar</button>
        `;
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        const input = container.querySelector('#searchText');
        const btn   = container.querySelector('#searchBtn');
        const go    = () => doSearch(input.value.trim());

        btn.addEventListener('click', go);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });

        return container;
      }
    });
    map.addControl(new SearchControl());

    // Debounce simple
    function debounce(fn, ms=400){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
    const doSearch = debounce(async (q) => {
      if (!q) return;

      const qUpper = q.toString().toUpperCase();
      let encontrado = false;
      let bounds = null;

      // 1) Buscar en OFERTAS por ID (exacto o parcial)
      ofertasLayer.eachLayer(l => {
        const id = l.feature?.properties?.ID ?? l.options?.ID ?? l?.oferta?.ID;
        if (id == null) return;
        const idStr = String(id).toUpperCase();
        if (idStr === qUpper || idStr.includes(qUpper)) {
          if (l.getBounds) {
            bounds = bounds ? bounds.extend(l.getBounds()) : l.getBounds();
          } else if (l.getLatLng) {
            bounds = bounds ? bounds.extend(l.getLatLng()) : L.latLngBounds([l.getLatLng()]);
          }
          if (l.openPopup) l.openPopup();
          encontrado = true;
        }
      });

      if (encontrado && bounds) {
        map.fitBounds(bounds.pad(0.2));
        return;
      }

      // 2) Buscar municipio con Nominatim
      await buscarMunicipioNominatim(q, muniHighlight);
    }, 250);
  }

  // Consulta Nominatim y pinta polígono/bbox
  async function buscarMunicipioNominatim(q, highlightLayer) {
    const url = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        format: 'geojson',
        q: `${q}, Colombia`,
        countrycodes: 'co',
        polygon_geojson: 1,
        addressdetails: 1,
        limit: 1
      });

    try {
      highlightLayer.clearLayers();

      const resp = await fetch(url, { headers: { 'Accept': 'application/geo+json' } });
      if (!resp.ok) throw new Error('Nominatim error ' + resp.status);
      const gj = await resp.json();

      if (!gj.features?.length) {
        alert('No se encontró: ' + q);
        return;
      }

      const feat = gj.features[0];
      highlightLayer.addData(feat);

      const temp = L.geoJSON(feat);
      const b = temp.getBounds();
      if (b.isValid()) map.fitBounds(b.pad(0.15));

      const nombre = feat.properties?.display_name || q;
      L.popup({ autoClose: true, closeButton: false })
        .setLatLng(b.getCenter())
        .setContent(`<strong>${nombre}</strong>`)
        .openOn(map);
    } catch (e) {
      console.error('Buscar municipio (Nominatim) falló:', e);
      alert('No se pudo realizar la búsqueda ahora.');
    }
  }
})();
