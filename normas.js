document.addEventListener('DOMContentLoaded', () => {
  let normas = [];
  const capasNormas = new Map();
  const form = document.getElementById('form-norma');

  // ====== CARGA Y CRUD DE NORMAS ======
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);

    try {
      const res = await fetch('/api/normas', {
        method: 'POST',
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar norma');

      const { norma } = data;
      normas.push(norma);
      actualizarFiltros();
      renderizarNormas();
      form.reset();
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

  // ====== FILTROS DINÁMICOS ======
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

  // ====== RENDERIZADO DE TABLA CON DIAGNÓSTICO ======
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
      .forEach((n, i) => {
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
          <td class="border p-2 text-center space-y-1">
            <div>
              <button 
                class="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 text-xs rounded toggle-plano" 
                data-index="${i}">
                🗺️ Ver Plano
              </button>
            </div>
            <div>
              <button 
                class="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 text-xs rounded diagnosticar-plano" 
                data-index="${i}">
                🔍 Diagnosticar
              </button>
            </div>
            <div>
              <button 
                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded georref-manual" 
                data-index="${i}">
                🎯 Manual
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
  }

  // ====== EVENTOS DE BOTONES ======
  document.getElementById('tbody-normas').addEventListener('click', async e => {
    if (e.target.classList.contains('toggle-plano')) {
      const index = parseInt(e.target.dataset.index, 10);
      const { plano: url } = normas[index];
      await visualizarPlanoDeNormaMejorado(url, index, e.target);
      
    } else if (e.target.classList.contains('diagnosticar-plano')) {
      const index = parseInt(e.target.dataset.index, 10);
      const { plano: url } = normas[index];
      await mostrarDiagnostico(url, index);
      
    } else if (e.target.classList.contains('georref-manual')) {
      const index = parseInt(e.target.dataset.index, 10);
      const { plano: url } = normas[index];
      abrirHerramientaGeorreferenciacionManual(url, index);
    }
  });

  // ====== FUNCIÓN DE DIAGNÓSTICO MODAL ======
  async function mostrarDiagnostico(url, index) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">🔍 Diagnóstico de Georreferenciación</h3>
          <button id="cerrar-diagnostico" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div id="contenido-diagnostico" class="text-sm">
          <div class="flex items-center gap-2 mb-4">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Analizando archivo TIFF...</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('cerrar-diagnostico').onclick = () => modal.remove();
    
    try {
      const diagnostico = await diagnosticarGeorreferenciacion(url, index);
      mostrarResultadoDiagnostico(diagnostico);
    } catch (error) {
      document.getElementById('contenido-diagnostico').innerHTML = `
        <div class="text-red-600">
          <h4 class="font-bold mb-2">❌ Error en el diagnóstico:</h4>
          <p class="mb-4">${error.message}</p>
          <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <h5 class="font-bold text-yellow-800">💡 Posibles soluciones:</h5>
            <ul class="list-disc list-inside text-yellow-700 text-xs mt-2">
              <li>Verificar que el archivo TIFF existe y es accesible</li>
              <li>Asegurar que el TIFF tiene georreferenciación embebida</li>
              <li>Usar QGIS para reproyectar a EPSG:4326 o EPSG:3116</li>
              <li>Probar la georreferenciación manual</li>
            </ul>
          </div>
        </div>
      `;
    }
    
    function mostrarResultadoDiagnostico(diag) {
      const estado = diag.coordenadasValidas ? '✅' : '❌';
      const color = diag.coordenadasValidas ? 'text-green-600' : 'text-red-600';
      
      document.getElementById('contenido-diagnostico').innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${estado}</span>
            <span class="font-bold ${color}">
              ${diag.coordenadasValidas ? 'Archivo válido para georreferenciación' : 'Problemas detectados'}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-blue-50 p-3 rounded">
              <h4 class="font-bold text-blue-800 mb-2">📊 Información Técnica</h4>
              <ul class="text-xs space-y-1">
                <li><strong>Sistema:</strong> ${diag.sistemaDetectado || 'No detectado'}</li>
                <li><strong>Transformación:</strong> ${diag.necesitaTransformacion ? 'Requerida' : 'No necesaria'}</li>
                <li><strong>Bbox:</strong> [${diag.bbox?.map(n => n.toFixed(4)).join(', ') || 'N/A'}]</li>
              </ul>
            </div>
            
            <div class="${diag.problemas.length ? 'bg-red-50' : 'bg-green-50'} p-3 rounded">
              <h4 class="font-bold ${diag.problemas.length ? 'text-red-800' : 'text-green-800'} mb-2">
                ${diag.problemas.length ? '⚠️ Problemas' : '✅ Estado'}
              </h4>
              ${diag.problemas.length ? 
                `<ul class="text-xs space-y-1">
                  ${diag.problemas.map(p => `<li>• ${p}</li>`).join('')}
                </ul>` : 
                '<p class="text-xs">No se detectaron problemas</p>'
              }
            </div>
          </div>
          
          ${diag.soluciones.length ? `
            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h4 class="font-bold text-yellow-800 mb-2">💡 Soluciones Recomendadas</h4>
              <ul class="text-xs space-y-1">
                ${diag.soluciones.map(s => `<li>• ${s}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="flex gap-2 mt-6">
            ${diag.coordenadasValidas ? 
              `<button onclick="intentarVisualizacion(${index})" class="flex-1 bg-green-600 text-white p-2 rounded text-sm">
                🗺️ Intentar Visualización
              </button>` : ''
            }
            <button onclick="abrirHerramientaGeorreferenciacionManual('${url}', ${index}); document.querySelector('.fixed').remove();" 
                    class="flex-1 bg-orange-600 text-white p-2 rounded text-sm">
              🎯 Georreferenciación Manual
            </button>
            <button onclick="descargarReporte(${index})" class="flex-1 bg-blue-600 text-white p-2 rounded text-sm">
              📄 Descargar Reporte
            </button>
          </div>
        </div>
      `;
    }
  }

  // ====== FUNCIONES GLOBALES PARA MODAL ======
  window.intentarVisualizacion = async (index) => {
    document.querySelector('.fixed').remove();
    const boton = document.querySelector(`button[data-index="${index}"].toggle-plano`);
    const { plano: url } = normas[index];
    await visualizarPlanoDeNormaMejorado(url, index, boton);
  };

  window.descargarReporte = (index) => {
    // Implementar descarga de reporte de diagnóstico
    alert('Funcionalidad de reporte en desarrollo');
  };

  // ====== INCLUIR TODAS LAS FUNCIONES DE DIAGNÓSTICO ======
  // (Las funciones del diagnóstico van aquí - las del artifact anterior)
  
  // FUNCIÓN DE DIAGNÓSTICO COMPLETO
  async function diagnosticarGeorreferenciacion(url, index) {
    console.log(`🔍 Diagnosticando archivo: ${url}`);
    
    try {
      // Verificar accesibilidad del archivo
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Archivo no accesible: HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`📊 Tamaño del archivo: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      
      // Verificar si es un TIFF válido
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      
      // Extraer metadatos críticos
      const width = image.getWidth();
      const height = image.getHeight();
      const bbox = image.getBoundingBox();
      const origin = image.getOrigin();
      const resolution = image.getResolution();
      const geoKeys = image.getGeoKeys();
      
      console.log('📋 METADATOS DEL TIFF:');
      console.log(`   Dimensiones: ${width} x ${height}`);
      console.log(`   Bounding Box: [${bbox.join(', ')}]`);
      console.log(`   Origen: [${origin.join(', ')}]`);
      console.log(`   Resolución: [${resolution.join(', ')}]`);
      console.log(`   Sistema de coordenadas: ${geoKeys.GeographicTypeGeoKey || geoKeys.ProjectedCSTypeGeoKey || 'No especificado'}`);
      
      // Verificar sistema de coordenadas
      return verificarSistemaCoordenadas(geoKeys, bbox, origin);
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      throw new Error(`Error en diagnóstico: ${error.message}`);
    }
  }

  // VERIFICAR SISTEMA DE COORDENADAS
  function verificarSistemaCoordenadas(geoKeys, bbox, origin) {
    const diagnostico = {
      sistemaDetectado: null,
      problemas: [],
      soluciones: [],
      bbox: bbox,
      coordenadasValidas: false,
      necesitaTransformacion: false
    };
    
    // Detectar sistema de coordenadas común en Colombia
    if (geoKeys.ProjectedCSTypeGeoKey === 3116) {
      diagnostico.sistemaDetectado = 'MAGNA-SIRGAS / Colombia Bogota zone (EPSG:3116)';
      diagnostico.necesitaTransformacion = true;
      diagnostico.coordenadasValidas = verificarRangoMagnaSirgas(bbox);
    } else if (geoKeys.GeographicTypeGeoKey === 4326) {
      diagnostico.sistemaDetectado = 'WGS 84 (EPSG:4326)';
      diagnostico.necesitaTransformacion = false;
      diagnostico.coordenadasValidas = verificarRangoWGS84(bbox);
    } else if (geoKeys.ProjectedCSTypeGeoKey === 3857) {
      diagnostico.sistemaDetectado = 'WGS 84 / Pseudo-Mercator (EPSG:3857)';
      diagnostico.necesitaTransformacion = true;
      diagnostico.coordenadasValidas = true; // Asumir válido para Web Mercator
    } else {
      diagnostico.problemas.push('Sistema de coordenadas no reconocido');
      diagnostico.soluciones.push('Verificar el sistema de coordenadas del archivo fuente');
      diagnostico.soluciones.push('Reproyectar a EPSG:4326 usando QGIS');
    }
    
    // Verificar coordenadas para Colombia
    if (diagnostico.sistemaDetectado && !diagnostico.coordenadasValidas) {
      diagnostico.problemas.push('Coordenadas fuera del rango esperado para Colombia');
      diagnostico.soluciones.push('Verificar que el archivo corresponde a territorio colombiano');
      diagnostico.soluciones.push('Usar georreferenciación manual si es correcto');
    }
    
    return diagnostico;
  }

  // VERIFICADORES DE RANGO
  function verificarRangoWGS84(bbox) {
    const [minX, minY, maxX, maxY] = bbox;
    return minX >= -82 && maxX <= -66 && minY >= -5 && maxY <= 13;
  }

  function verificarRangoMagnaSirgas(bbox) {
    const [minX, minY, maxX, maxY] = bbox;
    return minX >= 600000 && maxX <= 1400000 && minY >= 800000 && maxY <= 1300000;
  }

  // TRANSFORMACIÓN DE COORDENADAS
  function transformarCoordenadas(bbox, sistemaOrigen) {
    if (!window.proj4) {
      throw new Error('Proj4 no está disponible. Incluye la librería proj4.js');
    }
    
    // Definir proyecciones comunes en Colombia
    proj4.defs("EPSG:3116", "+proj=tmerc +lat_0=4.596200416666666 +lon_0=-74.07750791666666 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs");
    
    const [minX, minY, maxX, maxY] = bbox;
    
    try {
      let esquinaInferiorIzq, esquinaSuperiorDer;
      
      if (sistemaOrigen === 'EPSG:3116') {
        esquinaInferiorIzq = proj4('EPSG:3116', 'EPSG:4326', [minX, minY]);
        esquinaSuperiorDer = proj4('EPSG:3116', 'EPSG:4326', [maxX, maxY]);
      } else if (sistemaOrigen === 'EPSG:3857') {
        esquinaInferiorIzq = proj4('EPSG:3857', 'EPSG:4326', [minX, minY]);
        esquinaSuperiorDer = proj4('EPSG:3857', 'EPSG:4326', [maxX, maxY]);
      } else {
        // Asumir que ya está en WGS84
        return [[minY, minX], [maxY, maxX]];
      }
      
      // Verificar que la transformación fue exitosa
      if (!esquinaInferiorIzq || !esquinaSuperiorDer || 
          !Array.isArray(esquinaInferiorIzq) || !Array.isArray(esquinaSuperiorDer)) {
        throw new Error('Transformación de coordenadas falló');
      }
      
      // Retornar en formato Leaflet: [[south, west], [north, east]]
      return [
        [esquinaInferiorIzq[1], esquinaInferiorIzq[0]], // [lat, lon]
        [esquinaSuperiorDer[1], esquinaSuperiorDer[0]]   // [lat, lon]
      ];
      
    } catch (error) {
      console.error('Error en transformación:', error);
      throw new Error(`No se pudo transformar las coordenadas: ${error.message}`);
    }
  }

  // FUNCIÓN PRINCIPAL MEJORADA
  async function visualizarPlanoDeNormaMejorado(url, index, boton) {
    if (capasNormas.has(index)) {
      const capa = capasNormas.get(index);
      map.removeLayer(capa);
      capasNormas.delete(index);
      boton.textContent = '🗺️ Ver Plano';
      boton.classList.replace('bg-red-600','bg-indigo-600');
      return;
    }

    const ext = url.split('.').pop().toLowerCase();
    if (!['tif', 'tiff'].includes(ext)) {
      alert('⚠️ Solo se soportan archivos TIFF (.tif, .tiff)');
      return;
    }

    // UI: Mostrar loading
    const textoOriginal = boton.textContent;
    boton.textContent = '⏳ Analizando...';
    boton.disabled = true;

    try {
      // 1. DIAGNÓSTICO COMPLETO
      boton.textContent = '🔍 Diagnosticando...';
      const diagnostico = await diagnosticarGeorreferenciacion(url, index);
      
      console.log('📋 Diagnóstico completado:', diagnostico);
      
      // 2. VERIFICAR SI NECESITA TRANSFORMACIÓN
      let bounds;
      if (diagnostico.necesitaTransformacion) {
        boton.textContent = '🔄 Transformando coordenadas...';
        const sistemaOrigen = diagnostico.sistemaDetectado.includes('3116') ? 'EPSG:3116' : 
                             diagnostico.sistemaDetectado.includes('3857') ? 'EPSG:3857' : null;
        
        if (!sistemaOrigen) {
          throw new Error('Sistema de coordenadas no soportado para transformación automática');
        }
        
        bounds = transformarCoordenadas(diagnostico.bbox, sistemaOrigen);
      } else {
        // Ya está en WGS84
        const [minX, minY, maxX, maxY] = diagnostico.bbox;
        bounds = [[minY, minX], [maxY, maxX]];
      }
      
      console.log('🌍 Bounds finales:', bounds);
      
      // 3. VERIFICAR QUE LAS COORDENADAS ESTÁN EN COLOMBIA
      if (!verificarUbicacionColombia(bounds)) {
        const respuesta = confirm(
          '⚠️ Las coordenadas parecen estar fuera de Colombia.\n' +
          `Bounds calculados: ${JSON.stringify(bounds)}\n\n` +
          '¿Deseas continuar de todos modos?'
        );
        if (!respuesta) {
          boton.textContent = textoOriginal;
          boton.disabled = false;
          return;
        }
      }
      
      // 4. CREAR OVERLAY CON PNG CONVERTIDO
      boton.textContent = '🖼️ Cargando imagen...';
      const filename = url.split('/').pop();
      const nameOnly = filename.replace(/\.\w+$/, '');
      const pngURL = `/planos/${nameOnly}.png`;
      
      const layer = L.imageOverlay(pngURL, bounds, { 
        opacity: 0.7,
        interactive: true
      }).addTo(map);
      
      // 5. AGREGAR POPUP CON INFO DE GEORREFERENCIACIÓN
      const info = `
        <div class="text-sm">
          <strong>Información de Georreferenciación:</strong><br>
          Sistema: ${diagnostico.sistemaDetectado}<br>
          Bounds: ${JSON.stringify(bounds)}<br>
          Transformación: ${diagnostico.necesitaTransformacion ? 'Sí' : 'No'}
        </div>
      `;
      layer.bindPopup(info);
      
      capasNormas.set(index, layer);
      map.fitBounds(bounds);
      
      // UI: Éxito
      boton.textContent = '❌ Ocultar Plano';
      boton.classList.replace('bg-indigo-600','bg-red-600');
      
    } catch (err) {
      console.error('❌ Error completo:', err);
      
      // Mostrar error específico
      const mensaje = obtenerMensajeErrorEspecifico(err.message);
      const respuesta = confirm(mensaje + '\n\n¿Quieres intentar georreferenciación manual?');
      
      if (respuesta) {
        abrirHerramientaGeorreferenciacionManual(url, index);
      }
      
      // Restaurar botón
      boton.textContent = textoOriginal;
      boton.classList.replace('bg-red-600','bg-indigo-600');
      
    } finally {
      boton.disabled = false;
    }
  }

  // VERIFICAR UBICACIÓN EN COLOMBIA
  function verificarUbicacionColombia(bounds) {
    const [[south, west], [north, east]] = bounds;
    
    // Bounding box de Colombia (aproximado)
    const colombiaBounds = {
      north: 12.5,
      south: -4.2,
      east: -66.8,
      west: -81.7
    };
    
    return (
      south >= colombiaBounds.south && north <= colombiaBounds.north &&
      west >= colombiaBounds.west && east <= colombiaBounds.east
    );
  }

  // MENSAJES DE ERROR ESPECÍFICOS
  function obtenerMensajeErrorEspecifico(errorMsg) {
    if (errorMsg.includes('404') || errorMsg.includes('no accesible')) {
      return '❌ El archivo TIFF no se encuentra en el servidor.\n\n' +
             '💡 Soluciones:\n' +
             '• Verifica que el archivo se subió correctamente\n' +
             '• Revisa la ruta del archivo en la base de datos\n' +
             '• Asegúrate de que el servidor tenga permisos de lectura';
    }
    
    if (errorMsg.includes('Sistema de coordenadas no reconocido')) {
      return '❌ El sistema de coordenadas del TIFF no es compatible.\n\n' +
             '💡 Soluciones:\n' +
             '• Reproyectar a EPSG:4326 (WGS84) usando QGIS\n' +
             '• Usar EPSG:3116 (MAGNA-SIRGAS Colombia)\n' +
             '• Verificar que el TIFF tenga georreferenciación embebida';
    }
    
    if (errorMsg.includes('Transformación de coordenadas falló')) {
      return '❌ No se pudieron transformar las coordenadas.\n\n' +
             '💡 Soluciones:\n' +
             '• El TIFF podría no estar correctamente georreferenciado\n' +
             '• Usar una herramienta externa (QGIS) para reproyectar\n' +
             '• Verificar que el archivo tenga un .tfw o coordenadas embebidas';
    }
    
    return `❌ Error: ${errorMsg}\n\n` +
           '💡 Solución general:\n' +
           '• Verifica que el TIFF esté correctamente georreferenciado\n' +
           '• Usa QGIS para asignar el sistema de coordenadas correcto\n' +
           '• Contacta al administrador del sistema';
  }

  // HERRAMIENTA DE GEORREFERENCIACIÓN MANUAL INTERACTIVA
  function abrirHerramientaGeorreferenciacionManual(url, index) {
    // Cerrar modal de diagnóstico si existe
    const modalExistente = document.querySelector('.fixed');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
        <h3 class="text-lg font-bold mb-4">🎯 Georreferenciación Manual Interactiva</h3>

        <!-- Pestañas de modo -->
        <div class="mb-4">
          <div class="flex border-b">
            <button id="tab-interactivo" class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
              🖱️ Modo Interactivo
            </button>
            <button id="tab-coordenadas" class="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              📍 Coordenadas Exactas
            </button>
          </div>
        </div>

        <!-- Panel Modo Interactivo -->
        <div id="panel-interactivo" class="tab-panel">
          <p class="text-sm text-gray-600 mb-4">
            Arrastra y redimensiona el mapa directamente sobre el fondo satelital:
          </p>

          <div class="bg-blue-50 p-3 rounded mb-4">
            <h4 class="font-bold text-blue-800 mb-2">🎮 Controles:</h4>
            <div class="text-xs space-y-1">
              <div>• <strong>Arrastrar:</strong> Mantén clic y mueve para reposicionar</div>
              <div>• <strong>Redimensionar:</strong> Arrastra las esquinas para ajustar tamaño</div>
              <div>• <strong>Girar:</strong> Ctrl + Arrastrar para rotar (opcional)</div>
              <div>• <strong>Transparencia:</strong> Usa el control deslizante</div>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">Transparencia:</label>
              <input type="range" id="opacity-slider" min="0" max="100" value="70"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <div class="flex justify-between text-xs text-gray-500">
                <span>0% (Transparente)</span>
                <span>100% (Opaco)</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2 mt-6">
            <button id="cargar-interactivo" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded text-sm">
              🎯 Cargar en Modo Interactivo
            </button>
          </div>
        </div>

        <!-- Panel Coordenadas Exactas -->
        <div id="panel-coordenadas" class="tab-panel hidden">
          <p class="text-sm text-gray-600 mb-4">
            Define manualmente las coordenadas para este plano:
          </p>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <input type="number" step="any" placeholder="Lat Norte" id="lat-norte" class="border p-2 rounded text-sm">
              <input type="number" step="any" placeholder="Lon Este" id="lon-este" class="border p-2 rounded text-sm">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input type="number" step="any" placeholder="Lat Sur" id="lat-sur" class="border p-2 rounded text-sm">
              <input type="number" step="any" placeholder="Lon Oeste" id="lon-oeste" class="border p-2 rounded text-sm">
            </div>

            <div class="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 <strong>Tips:</strong><br>
              • Usa Google Maps para obtener coordenadas<br>
              • Formato: Latitud (positiva), Longitud (negativa para Colombia)<br>
              • Ejemplo Bogotá: Norte: 4.7, Sur: 4.5, Este: -74.0, Oeste: -74.2
            </div>

            <div class="text-xs text-green-600 bg-green-50 p-2 rounded">
              <strong>Coordenadas de referencia Colombia:</strong><br>
              Norte: ~12.5° | Sur: ~-4.2° | Este: ~-66.8° | Oeste: ~-81.7°
            </div>
          </div>

          <div class="flex gap-2 mt-6">
            <button id="aplicar-coords" class="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm">
              ✅ Aplicar Coordenadas
            </button>
          </div>
        </div>

        <!-- Botones comunes -->
        <div class="flex gap-2 mt-4 pt-4 border-t">
          <button id="guardar-tiff" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded text-sm">
            💾 Guardar TIFF Georreferenciado
          </button>
          <button id="cancelar-coords" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded text-sm">
            ❌ Cancelar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Variables para el overlay interactivo
    let overlayInteractivo = null;
    let modoEdicion = false;

    // Eventos de pestañas
    document.getElementById('tab-interactivo').onclick = () => cambiarTab('interactivo');
    document.getElementById('tab-coordenadas').onclick = () => cambiarTab('coordenadas');

    function cambiarTab(tab) {
      // Actualizar pestañas
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600');
        btn.classList.add('text-gray-500');
      });

      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.add('hidden');
      });

      if (tab === 'interactivo') {
        document.getElementById('tab-interactivo').classList.add('border-blue-500', 'text-blue-600');
        document.getElementById('tab-interactivo').classList.remove('text-gray-500');
        document.getElementById('panel-interactivo').classList.remove('hidden');
      } else {
        document.getElementById('tab-coordenadas').classList.add('border-blue-500', 'text-blue-600');
        document.getElementById('tab-coordenadas').classList.remove('text-gray-500');
        document.getElementById('panel-coordenadas').classList.remove('hidden');
      }
    }

    // Cargar en modo interactivo
    document.getElementById('cargar-interactivo').onclick = () => {
      const filename = url.split('/').pop();
      const nameOnly = filename.replace(/\.\w+$/, '');
      const pngURL = `/planos/${nameOnly}.png`;

      // Bounds iniciales en el centro de Colombia
      const boundsIniciales = [
        [4.0, -75.0],   // Esquina inferior izquierda
        [5.0, -74.0]    // Esquina superior derecha
      ];

      // Remover overlay anterior si existe
      if (overlayInteractivo) {
        map.removeLayer(overlayInteractivo);
      }

      // Crear overlay draggable y redimensionable
      overlayInteractivo = crearOverlayInteractivo(pngURL, boundsIniciales);

      // Habilitar modo edición
      modoEdicion = true;

      // Actualizar transparencia
      const slider = document.getElementById('opacity-slider');
      slider.oninput = () => {
        if (overlayInteractivo) {
          overlayInteractivo.setOpacity(slider.value / 100);
        }
      };

      // Cambiar texto del botón
      document.getElementById('cargar-interactivo').textContent = '🔄 Recargar Posición';

      alert('✅ Imagen cargada en modo interactivo. Arrastra y redimensiona según necesites.');
    };

    // Eventos del panel de coordenadas exactas
    document.getElementById('aplicar-coords').onclick = () => {
      const norte = parseFloat(document.getElementById('lat-norte').value);
      const sur = parseFloat(document.getElementById('lat-sur').value);
      const este = parseFloat(document.getElementById('lon-este').value);
      const oeste = parseFloat(document.getElementById('lon-oeste').value);

      if (isNaN(norte) || isNaN(sur) || isNaN(este) || isNaN(oeste)) {
        alert('⚠️ Por favor ingresa todas las coordenadas como números válidos');
        return;
      }

      // Validar orden lógico
      if (norte <= sur) {
        alert('⚠️ La latitud Norte debe ser mayor que la latitud Sur');
        return;
      }

      if (este <= oeste) {
        alert('⚠️ La longitud Este debe ser mayor que la longitud Oeste');
        return;
      }

      // Validar rango Colombia
      if (norte < -5 || norte > 13 || sur < -5 || sur > 13 ||
          este < -82 || este > -66 || oeste < -82 || oeste > -66) {
        const continuar = confirm(
          '⚠️ Las coordenadas parecen estar fuera del rango de Colombia.\n\n' +
          'Rango válido aproximado:\n' +
          'Latitud: -4.2° a 12.5°\n' +
          'Longitud: -81.7° a -66.8°\n\n' +
          '¿Deseas continuar de todos modos?'
        );
        if (!continuar) return;
      }

      const bounds = [[sur, oeste], [norte, este]];
      crearOverlayManual(url, bounds, index);
      modal.remove();
    };

    // Guardar TIFF georreferenciado
    document.getElementById('guardar-tiff').onclick = () => {
      if (!overlayInteractivo && !capasNormas.has(index)) {
        alert('⚠️ Primero carga la imagen en modo interactivo o con coordenadas exactas');
        return;
      }

      let bounds;
      if (overlayInteractivo) {
        bounds = overlayInteractivo.getBounds();
      } else {
        bounds = capasNormas.get(index).getBounds();
      }

      guardarTiffGeorreferenciado(url, bounds, index);
    };

    document.getElementById('cancelar-coords').onclick = () => {
      if (overlayInteractivo) {
        map.removeLayer(overlayInteractivo);
      }
      modal.remove();
    };

    // Cerrar con ESC
    const cerrarConEsc = (e) => {
      if (e.key === 'Escape') {
        if (overlayInteractivo) {
          map.removeLayer(overlayInteractivo);
        }
        modal.remove();
        document.removeEventListener('keydown', cerrarConEsc);
      }
    };
    document.addEventListener('keydown', cerrarConEsc);
  }

  // CREAR OVERLAY INTERACTIVO CON DRAG & RESIZE
  function crearOverlayInteractivo(imageUrl, initialBounds) {
    // Crear el overlay básico
    const overlay = L.imageOverlay(imageUrl, initialBounds, {
      interactive: true,
      opacity: 0.7
    });

    // Variables para el control de arrastre y redimensionamiento
    let isDragging = false;
    let isResizing = false;
    let dragStartPoint = null;
    let resizeHandle = null;
    let originalBounds = null;

    // Añadir al mapa
    overlay.addTo(map);

    // Crear handles de redimensionamiento
    const handles = createResizeHandles(overlay);

    // Event listeners para drag
    overlay.on('mousedown', function(e) {
      if (e.originalEvent.ctrlKey || isResizing) return;

      isDragging = true;
      dragStartPoint = map.mouseEventToLatLng(e.originalEvent);
      originalBounds = overlay.getBounds();

      map.dragging.disable();
      L.DomEvent.stopPropagation(e);
    });

    // Event listeners globales para mouse
    map.on('mousemove', function(e) {
      if (isDragging && dragStartPoint) {
        const currentPoint = map.mouseEventToLatLng(e.originalEvent);
        const deltaLat = currentPoint.lat - dragStartPoint.lat;
        const deltaLng = currentPoint.lng - dragStartPoint.lng;

        const newBounds = L.latLngBounds([
          [originalBounds.getSouth() + deltaLat, originalBounds.getWest() + deltaLng],
          [originalBounds.getNorth() + deltaLat, originalBounds.getEast() + deltaLng]
        ]);

        overlay.setBounds(newBounds);
        updateResizeHandles(overlay, handles);
      }
    });

    map.on('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        dragStartPoint = null;
        originalBounds = null;
        map.dragging.enable();
      }
    });

    // Añadir información del overlay
    overlay.bindPopup(`
      <div class="text-sm">
        <strong>🎯 Modo Interactivo</strong><br>
        <div class="mt-2 space-y-1">
          <button onclick="mostrarCoordenadas()" class="bg-blue-500 text-white px-2 py-1 rounded text-xs">
            📍 Ver Coordenadas
          </button>
          <button onclick="resetearPosicion()" class="bg-orange-500 text-white px-2 py-1 rounded text-xs">
            🔄 Resetear
          </button>
        </div>
      </div>
    `);

    // Funciones globales para el popup
    window.mostrarCoordenadas = () => {
      const bounds = overlay.getBounds();
      const coordsText = `
        Norte: ${bounds.getNorth().toFixed(6)}
        Sur: ${bounds.getSouth().toFixed(6)}
        Este: ${bounds.getEast().toFixed(6)}
        Oeste: ${bounds.getWest().toFixed(6)}
      `;
      alert(`📍 Coordenadas actuales:\n${coordsText}`);
    };

    window.resetearPosicion = () => {
      overlay.setBounds(initialBounds);
      updateResizeHandles(overlay, handles);
    };

    return overlay;
  }

  // CREAR HANDLES DE REDIMENSIONAMIENTO
  function createResizeHandles(overlay) {
    const handles = {
      nw: null, ne: null, sw: null, se: null,
      n: null, s: null, e: null, w: null
    };

    // Crear handles en las esquinas y lados
    Object.keys(handles).forEach(position => {
      const handle = L.divIcon({
        className: `resize-handle resize-handle-${position}`,
        iconSize: [10, 10],
        html: '<div style="width:100%;height:100%;background:blue;border:2px solid white;border-radius:50%;cursor:' + getCursor(position) + ';"></div>'
      });

      handles[position] = L.marker([0, 0], {
        icon: handle,
        draggable: false,
        interactive: true
      }).addTo(map);

      // Event listeners para redimensionamiento
      handles[position].on('mousedown', function(e) {
        startResize(overlay, position, e);
      });
    });

    // Posicionar handles inicialmente
    updateResizeHandles(overlay, handles);

    return handles;
  }

  // ACTUALIZAR POSICIÓN DE HANDLES
  function updateResizeHandles(overlay, handles) {
    const bounds = overlay.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();
    const centerLat = (north + south) / 2;
    const centerLng = (east + west) / 2;

    // Posicionar handles
    handles.nw.setLatLng([north, west]);
    handles.ne.setLatLng([north, east]);
    handles.sw.setLatLng([south, west]);
    handles.se.setLatLng([south, east]);
    handles.n.setLatLng([north, centerLng]);
    handles.s.setLatLng([south, centerLng]);
    handles.e.setLatLng([centerLat, east]);
    handles.w.setLatLng([centerLat, west]);
  }

  // OBTENER CURSOR PARA HANDLE
  function getCursor(position) {
    const cursors = {
      'nw': 'nw-resize', 'ne': 'ne-resize',
      'sw': 'sw-resize', 'se': 'se-resize',
      'n': 'n-resize', 's': 's-resize',
      'e': 'e-resize', 'w': 'w-resize'
    };
    return cursors[position] || 'move';
  }

  // INICIAR REDIMENSIONAMIENTO
  function startResize(overlay, position, e) {
    isResizing = true;
    const originalBounds = overlay.getBounds();
    const startPoint = map.mouseEventToLatLng(e.originalEvent);

    map.dragging.disable();
    L.DomEvent.stopPropagation(e);

    const mouseMoveHandler = function(moveEvent) {
      const currentPoint = map.mouseEventToLatLng(moveEvent.originalEvent);
      const newBounds = calculateNewBounds(originalBounds, startPoint, currentPoint, position);

      if (newBounds) {
        overlay.setBounds(newBounds);
        updateResizeHandles(overlay, overlay._resizeHandles || {});
      }
    };

    const mouseUpHandler = function() {
      isResizing = false;
      map.dragging.enable();
      map.off('mousemove', mouseMoveHandler);
      map.off('mouseup', mouseUpHandler);
    };

    map.on('mousemove', mouseMoveHandler);
    map.on('mouseup', mouseUpHandler);

    // Guardar referencia a los handles
    overlay._resizeHandles = overlay._resizeHandles || createResizeHandles(overlay);
  }

  // CALCULAR NUEVOS BOUNDS PARA REDIMENSIONAMIENTO
  function calculateNewBounds(originalBounds, startPoint, currentPoint, position) {
    const deltaLat = currentPoint.lat - startPoint.lat;
    const deltaLng = currentPoint.lng - startPoint.lng;

    let north = originalBounds.getNorth();
    let south = originalBounds.getSouth();
    let east = originalBounds.getEast();
    let west = originalBounds.getWest();

    // Aplicar cambios según la posición del handle
    switch(position) {
      case 'nw':
        north += deltaLat;
        west += deltaLng;
        break;
      case 'ne':
        north += deltaLat;
        east += deltaLng;
        break;
      case 'sw':
        south += deltaLat;
        west += deltaLng;
        break;
      case 'se':
        south += deltaLat;
        east += deltaLng;
        break;
      case 'n':
        north += deltaLat;
        break;
      case 's':
        south += deltaLat;
        break;
      case 'e':
        east += deltaLng;
        break;
      case 'w':
        west += deltaLng;
        break;
    }

    // Validar que los bounds sean válidos
    if (north <= south || east <= west) {
      return null;
    }

    return L.latLngBounds([[south, west], [north, east]]);
  }

  function crearOverlayManual(url, bounds, index) {
    const filename = url.split('/').pop();
    const nameOnly = filename.replace(/\.\w+$/, '');
    const pngURL = `/planos/${nameOnly}.png`;
    
    try {
      const layer = L.imageOverlay(pngURL, bounds, { 
        opacity: 0.7,
        interactive: true 
      }).addTo(map);
      
      const info = `
        <div class="text-sm">
          <strong>🎯 Georreferenciación Manual</strong><br>
          Bounds: ${JSON.stringify(bounds)}<br>
          <em>Coordenadas definidas manualmente</em>
        </div>
      `;
      layer.bindPopup(info);
      
      capasNormas.set(index, layer);
      map.fitBounds(bounds);
      
      // Actualizar botón
      const boton = document.querySelector(`button[data-index="${index}"].toggle-plano`);
      if (boton) {
        boton.textContent = '❌ Ocultar Plano';
        boton.classList.replace('bg-indigo-600','bg-red-600');
      }
      
      alert('✅ Plano georreferenciado manualmente y agregado al mapa');
      
    } catch (error) {
      console.error('Error creando overlay manual:', error);
      alert('❌ Error al crear el overlay. Verifica que la imagen PNG existe en el servidor.');
    }
  }

  // GUARDAR TIFF GEORREFERENCIADO
  function guardarTiffGeorreferenciado(originalUrl, bounds, index) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">💾 Guardar TIFF Georreferenciado</h3>

        <div class="mb-4">
          <h4 class="font-bold text-gray-800 mb-2">📍 Coordenadas WGS84:</h4>
          <div class="bg-gray-50 p-3 rounded text-sm font-mono">
            <div>Norte: ${bounds.getNorth().toFixed(8)}</div>
            <div>Sur: ${bounds.getSouth().toFixed(8)}</div>
            <div>Este: ${bounds.getEast().toFixed(8)}</div>
            <div>Oeste: ${bounds.getWest().toFixed(8)}</div>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Nombre del archivo:</label>
          <input type="text" id="nombre-tiff" value="${getNombreArchivoSinExtension(originalUrl)}_georef"
                 class="w-full border p-2 rounded text-sm">
          <div class="text-xs text-gray-500 mt-1">Se guardará como: [nombre].tif</div>
        </div>

        <div class="bg-blue-50 p-3 rounded mb-4">
          <h4 class="font-bold text-blue-800 mb-2">🔧 Proceso de Georreferenciación:</h4>
          <div class="text-xs space-y-1">
            <div>1. Conversión de PNG a TIFF</div>
            <div>2. Asignación de coordenadas WGS84 (EPSG:4326)</div>
            <div>3. Generación de archivo world (.tfw)</div>
            <div>4. Embebido de georreferenciación en metadatos</div>
          </div>
        </div>

        <div id="progreso-georref" class="hidden mb-4">
          <div class="flex items-center gap-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span class="text-sm" id="estado-proceso">Iniciando proceso...</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div id="barra-progreso" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>

        <div class="flex gap-2">
          <button id="procesar-georref" class="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm">
            🚀 Procesar y Descargar
          </button>
          <button id="cerrar-guardar" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded text-sm">
            ❌ Cancelar
          </button>
        </div>

        <div class="mt-4 text-xs text-gray-600">
          <strong>Nota:</strong> El archivo resultante incluirá georreferenciación completa
          y será compatible con software GIS como QGIS, ArcGIS, etc.
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Eventos
    document.getElementById('procesar-georref').onclick = () => {
      const nombreArchivo = document.getElementById('nombre-tiff').value.trim();

      if (!nombreArchivo) {
        alert('⚠️ Por favor ingresa un nombre para el archivo');
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(nombreArchivo)) {
        alert('⚠️ El nombre solo puede contener letras, números, guiones y guiones bajos');
        return;
      }

      procesarGeorreferenciacion(originalUrl, bounds, nombreArchivo, index);
    };

    document.getElementById('cerrar-guardar').onclick = () => modal.remove();
  }

  // OBTENER NOMBRE DE ARCHIVO SIN EXTENSIÓN
  function getNombreArchivoSinExtension(url) {
    const filename = url.split('/').pop();
    return filename.replace(/\.\w+$/, '');
  }

  // PROCESAR GEORREFERENCIACIÓN
  async function procesarGeorreferenciacion(originalUrl, bounds, nombreArchivo, index) {
    const progresoDiv = document.getElementById('progreso-georref');
    const estadoSpan = document.getElementById('estado-proceso');
    const barraProgreso = document.getElementById('barra-progreso');

    progresoDiv.classList.remove('hidden');
    document.getElementById('procesar-georref').disabled = true;

    try {
      // Paso 1: Preparar datos de georreferenciación
      actualizarProgreso(estadoSpan, barraProgreso, 20, 'Preparando datos de georreferenciación...');

      const georefData = {
        originalUrl: originalUrl,
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        },
        nombreArchivo: nombreArchivo,
        srs: 'EPSG:4326' // WGS84
      };

      // Paso 2: Enviar al servidor para procesamiento
      actualizarProgreso(estadoSpan, barraProgreso, 40, 'Enviando al servidor...');

      const response = await fetch('/api/georreferenciar-tiff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(georefData)
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      // Paso 3: Procesar respuesta
      actualizarProgreso(estadoSpan, barraProgreso, 60, 'Procesando TIFF...');

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Paso 4: Descargar archivo
      actualizarProgreso(estadoSpan, barraProgreso, 80, 'Preparando descarga...');

      const downloadUrl = result.downloadUrl || `/api/download-tiff/${result.filename}`;

      // Paso 5: Iniciar descarga
      actualizarProgreso(estadoSpan, barraProgreso, 100, 'Descargando archivo...');

      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${nombreArchivo}.tif`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Éxito
      setTimeout(() => {
        alert(`✅ TIFF georreferenciado guardado exitosamente!\n\n` +
              `Archivo: ${nombreArchivo}.tif\n` +
              `Sistema: WGS84 (EPSG:4326)\n` +
              `Coordenadas embebidas: Sí\n\n` +
              `El archivo es compatible con:\n• QGIS\n• ArcGIS\n• Google Earth\n• Otros software GIS`);

        document.querySelector('.fixed').remove();
      }, 1000);

    } catch (error) {
      console.error('Error en georreferenciación:', error);

      estadoSpan.textContent = 'Error en el proceso';
      barraProgreso.style.backgroundColor = '#ef4444';

      setTimeout(() => {
        alert(`❌ Error al procesar el archivo:\n\n${error.message}\n\n` +
              `💡 Posibles soluciones:\n` +
              `• Verificar que el servidor esté funcionando\n` +
              `• Comprobar que el archivo original existe\n` +
              `• Intentar con coordenadas diferentes\n` +
              `• Contactar al administrador del sistema`);

        document.getElementById('procesar-georref').disabled = false;
        progresoDiv.classList.add('hidden');
      }, 2000);
    }
  }

  // ACTUALIZAR PROGRESO
  function actualizarProgreso(estadoSpan, barraProgreso, porcentaje, mensaje) {
    estadoSpan.textContent = mensaje;
    barraProgreso.style.width = `${porcentaje}%`;
  }

});

// ====== VERIFICAR DEPENDENCIAS AL CARGAR ======
window.addEventListener('DOMContentLoaded', () => {
  // Verificar librerías necesarias
  const dependencias = [
    { lib: 'proj4', nombre: 'Proj4.js', url: 'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.js' },
    { lib: 'GeoTIFF', nombre: 'GeoTIFF.js', url: 'https://unpkg.com/geotiff/dist/geotiff.bundle.min.js' },
    { lib: 'L', nombre: 'Leaflet', url: 'https://unpkg.com/leaflet/dist/leaflet.js' }
  ];
  
  const faltantes = dependencias.filter(dep => !window[dep.lib]);
  
  if (faltantes.length > 0) {
    console.warn('⚠️ Faltan dependencias para georreferenciación:');
    faltantes.forEach(dep => {
      console.warn(`   - ${dep.nombre}: ${dep.url}`);
    });
    
    // Mostrar alerta una vez
    if (!localStorage.getItem('normas-deps-warning')) {
      alert(
        '⚠️ Algunas funcionalidades de georreferenciación podrían no funcionar.\n\n' +
        'Dependencias faltantes:\n' + 
        faltantes.map(d => `• ${d.nombre}`).join('\n') + '\n\n' +
        'Revisa la consola para más detalles.'
      );
      localStorage.setItem('normas-deps-warning', 'shown');
    }
  }
});