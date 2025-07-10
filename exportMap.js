// exportMap.js

// Asegúrate de que el DOM esté cargado antes de buscar los elementos
document.addEventListener('DOMContentLoaded', () => {
  const mapWrapper = document.getElementById('mapWrapper');
  const logoElem   = document.getElementById('mapLogo');
  const statsElem  = document.getElementById('mapStats');
  const btnExport  = document.getElementById('btn-salida-grafica');

  // Funciones de cálculo de ejemplo (rellénalas con tu lógica)
  function calcularTotalPuntos() {
    // ...tu código...
    return 42;
  }
  function calcularDistanciaMedia() {
    // ...tu código...
    return 123.45;
  }
  function calcularErrorMáximo() {
    // ...tu código...
    return 0.78;
  }

  // Devuelve el panel HTML con las estadísticas
  function obtenerEstadisticasHTML() {
    const total   = calcularTotalPuntos();
    const media   = calcularDistanciaMedia();
    const error   = calcularErrorMáximo();
    return `
      <strong>Estadísticas:</strong><br>
      • Total de puntos: ${total}<br>
      • Distancia media: ${media.toFixed(2)} m<br>
      • Error máximo: ${error.toFixed(2)} mm
    `;
  }

  // Función principal de exportación
  async function exportarVista() {
    logoElem.hidden = false;
    statsElem.innerHTML = obtenerEstadisticasHTML();
    statsElem.hidden = false;

    try {
      const canvas = await html2canvas(mapWrapper, {
        useCORS: true,
        scale: 2
      });
      canvas.toBlob(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Empresa_mapa_stats_${new Date().toISOString().slice(0,10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 'image/png');
    } catch (err) {
      console.error('Error exportando vista:', err);
    } finally {
      logoElem.hidden = true;
      statsElem.hidden = true;
    }
  }

  // Conecta el botón con la función
  btnExport.addEventListener('click', exportarVista);
});
