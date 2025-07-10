document.getElementById('btn-salida-grafica').addEventListener('click', () => {
  const mapEl = document.getElementById('map');
  html2canvas(mapEl, {
    useCORS: true,               // si tus tiles permiten CORS
    backgroundColor: null        // transparente si quieres
  }).then(canvas => {
    // Genera un enlace y dispara la descarga
    const link = document.createElement('a');
    link.download = `mapa_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error('Error al capturar el mapa:', err);
    alert('❌ No se pudo generar la imagen del mapa.');
  });
});
