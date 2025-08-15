window.addEventListener('DOMContentLoaded', () => {
  console.log('⚙️ calculosmercado.js cargado', {
    map: typeof map !== 'undefined' ? map : null,
    ofertasLayer: typeof ofertasLayer !== 'undefined' ? ofertasLayer : null
  });

  (function() {
    if (typeof map === 'undefined' || !ofertasLayer) {
      console.error('❌ map u ofertasLayer NO están definidos aún');
      return;
    }
    console.log('▶️ arrancando lógica de cálculos de mercado');

    // 1) Array global de ofertas
    const allOffers = [];

    // 2) Repoblar allOffers desde la capa
    function populateOffers() {
      allOffers.length = 0;
      ofertasLayer.eachLayer(layer => {
        const feat = layer.feature;
        if (!feat) return;
        allOffers.push({
          id: feat.properties.ID,
          properties: feat.properties,
          geometry: feat.geometry
        });
      });
      console.log('populateOffers → allOffers IDs:', allOffers.map(o => o.id));
    }

    // 3) Estado de checkboxes
    const selectedIds = new Set();

    // Cambia el estilo del icono o polígono según si está seleccionado
    function setOfferHighlight(id, highlight) {
      const entry = window.ofertaLayers.find(o => o.properties.ID === id);
      if (!entry) return;
      const layer = entry.layer;
      if (typeof layer.setIcon === 'function') {
        layer.setIcon(highlight ? window.selectedIcon : window.defaultIcon);
      } else if (typeof layer.setStyle === 'function') {
        layer.setStyle({
          color: highlight ? 'green' : '#3388ff',
          fillColor: highlight ? 'green' : '#3388ff'
        });
      }
    }

    // 4) Render checklist
    function renderChecklist(visible) {
      console.log('renderChecklist → visible IDs:', visible.map(o => o.id));
      const container = document.getElementById('lista-ofertas');
      container.innerHTML = '';
      visible.forEach(o => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('flex','items-center','mb-1');
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.value = o.id; chk.id = `offer-${o.id}`;
          chk.classList.add('h-4','w-4','text-green-600','border-gray-300','rounded');
          if (selectedIds.has(o.id)) chk.checked = true;
          chk.addEventListener('change', e => {
            if (e.target.checked) selectedIds.add(o.id);
            else selectedIds.delete(o.id);
            console.log('Checkbox change → selectedIds now:', Array.from(selectedIds));
            setOfferHighlight(o.id, e.target.checked);
            updateSidebarStats();
          });
          const label = document.createElement('label');
          label.htmlFor = chk.id;
          label.classList.add('ml-2','text-sm','text-gray-700');
          label.textContent = `Oferta #${o.id}`;
          wrapper.append(chk, label);
          container.appendChild(wrapper);
          setOfferHighlight(o.id, selectedIds.has(o.id));
        });
      }

    // 5) Función principal: filtrar, calcular y actualizar DOM
// 4) Función principal: filtrar, calcular y actualizar DOM
function updateSidebarStats() {
  console.group('▶️ updateSidebarStats');

  // 1) Repoblar allOffers
  populateOffers();

  // 2) Ofertas en la vista actual
  const bounds  = map.getBounds();
  const visible = allOffers.filter(o => {
    const [lon, lat] = o.geometry.coordinates;
    return bounds.contains([lat, lon]);
  });

  // 2.1) Mostrar checklist
  renderChecklist(visible);

  // 3) Subconjunto (seleccionadas o todas visibles)
  const subset = selectedIds.size > 0
    ? visible.filter(o => selectedIds.has(o.id))
    : visible;

  // 3.1) Actualizar total
  document.getElementById('stat-total').textContent =
    subset.length;

  // 4) Extraer valores unitarios
  const unitValues = subset
    .map(o => parseFloat(o.properties['Valor por unidad (COP)']) || 0)
    .filter(v => v > 0);

  // 5) Calcular estadísticos
  let avg = 0, std = 0, cv = 0, low = 0, high = 0, adopted = 0;
  const n = unitValues.length;
  if (n > 0) {
    avg = unitValues.reduce((a,b) => a + b, 0) / n;
    if (n > 1) {
      const varSum = unitValues
        .map(v => (v - avg) ** 2)
        .reduce((a,b) => a + b, 0) / (n - 1);
      std  = Math.sqrt(varSum);
      cv   = avg ? std / avg : 0;
      low  = avg - std;
      high = avg + std;
    }
    adopted = Math.round(avg / 10000) * 10000;
  }

  // 6) Pintar los nuevos estadísticos
  const elems = {
    stdUnit:     document.getElementById('stat-std-unit'),
    cvUnit:      document.getElementById('stat-cv-unit'),
    lowUnit:     document.getElementById('stat-low-unit'),
    highUnit:    document.getElementById('stat-high-unit'),
    avgUnit:     document.getElementById('stat-prom'),
    adoptedSel:  document.getElementById('select-adopted-unit'),
    adoptedP:    document.getElementById('stat-adopted-unit')
  };

  elems.stdUnit  .textContent = n ? Math.round(std).toLocaleString('es-CO')        : '—';
  elems.cvUnit   .textContent = n ? `${(cv*100).toFixed(2)}%`                        : '—';
  elems.lowUnit  .textContent = n ? `$${Math.round(low).toLocaleString('es-CO')}`    : '—';
  elems.highUnit .textContent = n ? `$${Math.round(high).toLocaleString('es-CO')}`   : '—';
  elems.avgUnit  .textContent = n ? `$${Math.round(avg).toLocaleString('es-CO')}`    : '—';

  // 7) Rellenar <select> de Valor Adoptado
  if (elems.adoptedSel) {
    elems.adoptedSel.innerHTML = n > 0 ? `
      <option value="${low}">Inferior: $${Math.round(low).toLocaleString('es-CO')}</option>
      <option value="${avg}">Promedio: $${Math.round(avg).toLocaleString('es-CO')}</option>
      <option value="${high}">Superior: $${Math.round(high).toLocaleString('es-CO')}</option>
    ` : `<option disabled selected>—</option>`;

    // Por defecto, seleccionamos “Promedio”
    elems.adoptedSel.value = String(avg);

    // Pintar también el <p> de stat-adopted-unit
    elems.adoptedP.textContent = avg
      ? `$${Math.round(avg).toLocaleString('es-CO')}`
      : '—';

    // Y si el usuario cambia la opción, actualizamos ese <p>
    elems.adoptedSel.onchange = () => {
      const v = parseFloat(elems.adoptedSel.value);
      elems.adoptedP.textContent = v
        ? `$${Math.round(v).toLocaleString('es-CO')}`
        : '—';
    };
  }

  console.groupEnd();
  // Exponer para que otros scripts actualicen los cálculos
  window.updateSidebarStats = updateSidebarStats;
}

    // 6) enganchar eventos
    map.on('moveend zoomend', updateSidebarStats);
    // 7) primera ejecución
    updateSidebarStats();
  })(); 
});
