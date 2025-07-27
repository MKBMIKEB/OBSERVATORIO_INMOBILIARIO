// Manejo del panel de filtros y filtrado de ofertas
document.addEventListener('DOMContentLoaded', () => {
  const btnAplicar = document.getElementById('aplicarFiltros');
  if (!btnAplicar) return;

  btnAplicar.addEventListener('click', () => {
    if (!window.ofertaLayers || !window.ofertasLayer) return;

    const entSel = document.getElementById('filtro-entidad').value.toLowerCase();
    const tiempoSel = document.getElementById('filtro-tiempo').value;
    const precioMin = parseFloat(document.getElementById('precio-min').value);
    const precioMax = parseFloat(document.getElementById('precio-max').value);
    const areaMin = parseFloat(document.getElementById('area-min').value);
    const areaMax = parseFloat(document.getElementById('area-max').value);

    const ahora = Date.now();

    // Quitar todas las capas actuales
    window.ofertasLayer.clearLayers();

    window.ofertaLayers.forEach(({ layer, properties }) => {
      let ok = true;

      if (entSel && properties['Tipo de Inmueble'] &&
          properties['Tipo de Inmueble'].toLowerCase() !== entSel) {
        ok = false;
      }

      if (ok && tiempoSel) {
        const fecha = new Date(properties['Fecha del Registro']);
        const diffMes = (ahora - fecha.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (tiempoSel.startsWith('1') && (diffMes < 1 || diffMes > 6)) ok = false;
        else if (tiempoSel.startsWith('6') && (diffMes <= 6 || diffMes > 12)) ok = false;
        else if (tiempoSel.startsWith('Mayor') && diffMes <= 12) ok = false;
      }

      const valor = parseFloat(properties['Valor por unidad (COP)']);
      if (ok && !isNaN(precioMin) && valor < precioMin) ok = false;
      if (ok && !isNaN(precioMax) && valor > precioMax) ok = false;

      const area = parseFloat(properties['Área Hec']);
      if (ok && !isNaN(areaMin) && area < areaMin) ok = false;
      if (ok && !isNaN(areaMax) && area > areaMax) ok = false;

      if (ok) {
        window.ofertasLayer.addLayer(layer);
      }
    });

    if (window.updateSidebarStats) window.updateSidebarStats();
  });
});

