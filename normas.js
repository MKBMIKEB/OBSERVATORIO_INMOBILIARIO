
document.addEventListener('DOMContentLoaded', () => {
  let normas = [];
  const capasNormas = new Map(); // index → capa Leaflet
  const form = document.getElementById('form-norma');

  form.addEventListener('submit', async e => {
    e.preventDefault(); // 🔒 evita que se recargue la página

    const fd = new FormData(form);

try {
  const res = await fetch('/api/normas', {
    method: 'POST',
    body: fd
  });

  const data = await res.json(); // ✅ solo una vez
  if (!res.ok) throw new Error(data.error || 'Error al guardar norma');

  const { norma } = data;

  normas.push(norma);       // 🔄 actualiza el arreglo local
  actualizarFiltros();      // 🎯 rellena selects únicos
  renderizarNormas();       // 🧱 pinta tabla
  form.reset();             // 🧹 limpia inputs
  alert('✅ Norma registrada correctamente');
} catch (err) {
  alert('❌ No se pudo guardar la norma');
  console.error(err);
}
});

  // Cargar normas al inicio
  fetch('/api/normas')
    .then(res => res.json())
    .then(data => {
      normas = data;
      actualizarFiltros();
      renderizarNormas();
    });

  document.getElementById('filtro-departamento').addEventListener('change', () => {
    actualizarMunicipios();
    renderizarNormas();
  });

  document.getElementById('filtro-municipio').addEventListener('change', renderizarNormas);

  function actualizarFiltros() {
    const filtroDep = document.getElementById('filtro-departamento');
    const deps = [...new Set(normas.map(n => n.departamento))].sort();

    filtroDep.innerHTML = '<option value="">Departamento</option>';
    deps.forEach(dep => {
      const opt = document.createElement('option');
      opt.value = dep;
      opt.textContent = dep;
      filtroDep.appendChild(opt);
    });

    actualizarMunicipios();
  }

  function actualizarMunicipios() {
    const filtroMun = document.getElementById('filtro-municipio');
    const depSel = document.getElementById('filtro-departamento').value;

    const municipios = normas
      .filter(n => !depSel || n.departamento === depSel)
      .map(n => n.municipio);

    const unicos = [...new Set(municipios)].sort();

    filtroMun.innerHTML = '<option value="">Municipio</option>';
    unicos.forEach(mun => {
      const opt = document.createElement('option');
      opt.value = mun;
      opt.textContent = mun;
      filtroMun.appendChild(opt);
    });
  }

  function renderizarNormas() {
    const depSel = document.getElementById('filtro-departamento').value;
    const munSel = document.getElementById('filtro-municipio').value;
    const tbody = document.getElementById('tbody-normas');
    tbody.innerHTML = '';

    normas
      .filter(n =>
        (!depSel || n.departamento === depSel) &&
        (!munSel || n.municipio === munSel)
      )
       .forEach((n, i) => { // ✅ DECLARA `i`
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="border p-2">${n.departamento}</td>
      <td class="border p-2">${n.municipio}</td>
      <td class="border p-2">${n.titulo}</td>
      <td class="border p-2">${n.ano}</td>
      <td class="border p-2">${n.decretos}</td>
      <td class="border p-2 text-center">
        <a href="${n.archivo}" target="_blank" class="text-blue-600 underline">📥</a>
      </td>
      <td class="border p-2 text-center">
        <a href="${n.plano}" target="_blank" class="text-blue-600 underline">📥</a>
      </td>
      <td class="border p-2 text-center">
        <button 
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 text-sm rounded toggle-plano" 
          data-index="${i}">
          🗺️ Ver Plano
        </button>
      </td>
    `;
        tbody.appendChild(row);
      });
  }
document.getElementById('tbody-normas').addEventListener('click', async e => {
  if (!e.target.classList.contains('toggle-plano')) return;
  const boton = e.target;
  const index = parseInt(boton.dataset.index, 10);
  const { plano: url } = normas[index];
  await visualizarPlanoDeNorma(url, index, boton);
});
async function visualizarPlanoDeNorma(url, index, boton) {
  // 1) Si ya existe la capa, la quitamos y restablecemos el botón
  if (capasNormas.has(index)) {
    const capa = capasNormas.get(index);
    map.removeLayer(capa);
    capasNormas.delete(index);
    boton.textContent = '🗺️ Ver Plano';
    boton.classList.replace('bg-red-600','bg-indigo-600');
    return;
  }

  // 2) Solo manejamos TIFF/TIFF
  const ext = url.split('.').pop().toLowerCase();
  if (ext !== 'tif' && ext !== 'tiff') return;

  try {
    // ─── Construir URL del PNG convertido por tu endpoint Express ────
    const filename  = url.split('/').pop();            // ej. "1749402858155-usos_g.tif"
    const nameOnly  = filename.replace(/\.\w+$/, '');   // "1749402858155-usos_g"
    const pngURL    = `/planos/${nameOnly}.png`;        // apunta a GET /planos/:name.png

    // ─── Obtener el GeoTIFF solo para extraer bounds ───────────────
    const resp        = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    const georaster   = await parseGeoraster(arrayBuffer);
    // Bounds en lat/lng: [[south, west], [north, east]]
    const bounds = [
      [georaster.ymin, georaster.xmin],
      [georaster.ymax, georaster.xmax]
    ];

    // ─── Crear overlay de imagen con el PNG ────────────────────────
    const layer = L.imageOverlay(pngURL, bounds, { opacity: 0.7 }).addTo(map);
    capasNormas.set(index, layer);
    map.fitBounds(bounds);

    // ─── Actualizar el botón ───────────────────────────────────────
    boton.textContent = '❌ Ocultar Plano';
    boton.classList.replace('bg-indigo-600','bg-red-600');

  } catch (err) {
    console.error('❌ Error cargando TIFF/PNG de norma:', err);
    alert('❌ No se pudo cargar el plano');
  }
}

});


