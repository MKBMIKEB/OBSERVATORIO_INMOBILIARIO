/**
 * layoutGenerator.js - Generador de Layout Visual Profesional
 * Crea layouts cartográficos profesionales siguiendo estándares GIS
 * 
 * Versión: 3.0.0 - Mejorado con estándares cartográficos profesionales
 * 
 * Mejoras implementadas:
 * - Norte geográfico reposicionado (esquina superior derecha)
 * - Escala gráfica mejorada con cálculo dinámico
 * - Leyenda profesional con símbolos estándar
 * - Coordenadas dinámicas basadas en bounds reales
 * - Metadatos técnicos completos (EPSG, fuentes cartográficas)
 * - Layout optimizado para reportes gubernamentales/municipales
 * - Validación y normalización de configuración
 * - Diseño visual mejorado siguiendo principios de jerarquía visual
 */

class LayoutGenerator {
    constructor() {
        this.modalId = 'layout-preview-modal';
        this.estilosInyectados = false;
    }

    /**
     * Genera vista previa del layout en modal
     */
    async generarVistaPrevia(configuracion) {
        try {
            console.log('🎨 Generando vista previa del layout...');
            
            // Validar y normalizar configuración
            const configValidada = this.validarConfiguracion(configuracion);
            
            this.inyectarEstilos();
            const layoutHTML = this.generarLayoutHTML(configValidada);
            this.mostrarModal(layoutHTML, configValidada);
            
            console.log('✅ Vista previa mostrada');
            
        } catch (error) {
            console.error('❌ Error generando vista previa:', error);
            throw error;
        }
    }

    /**
     * Inyecta estilos CSS necesarios
     */
    inyectarEstilos() {
        if (this.estilosInyectados) return;

        const estilos = `
            <style id="layout-generator-styles">
                .layout-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(5px);
                }

                .layout-container {
                    width: 210mm;
                    height: 297mm;
                    background: white;
                    border: 2px solid #000;
                    position: relative;
                    font-family: Arial, sans-serif;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    transform: scale(0.7);
                    transform-origin: center;
                }

                @media (max-width: 1200px) {
                    .layout-container {
                        transform: scale(0.5);
                    }
                }

                @media (max-width: 800px) {
                    .layout-container {
                        transform: scale(0.4);
                        width: 180mm;
                        height: 254mm;
                    }
                }

                .header-section {
                    height: 85mm;
                    border-bottom: 3px solid #2c3e50;
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    position: relative;
                    padding: 15mm;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-section::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3mm;
                    background: linear-gradient(90deg, #2c3e50 0%, #3498db 50%, #2c3e50 100%);
                }

                .company-info {
                    flex: 1;
                }

                .company-title {
                    font-size: 24pt;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 8mm;
                    text-transform: uppercase;
                    line-height: 1.2;
                }

                .project-title {
                    font-size: 16pt;
                    color: #34495e;
                    margin-bottom: 5mm;
                    font-weight: 600;
                    line-height: 1.3;
                }

                .report-subtitle {
                    font-size: 12pt;
                    color: #7f8c8d;
                    line-height: 1.4;
                }

                .logo-container {
                    width: 60mm;
                    height: 50mm;
                    background: white;
                    border: 2px solid #bdc3c7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .logo-container img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }

                .content-area {
                    height: 212mm;
                    display: flex;
                }

                .map-section {
                    flex: 2;
                    border-right: 2px solid #000;
                    position: relative;
                    background: #f8f9fa;
                }

                .map-container {
                    width: calc(100% - 20mm);
                    height: 140mm;
                    margin: 10mm;
                    background: white;
                    border: 2px solid #bdc3c7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    position: relative;
                    overflow: hidden;
                }

                .map-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .map-placeholder {
                    color: #7f8c8d;
                    text-align: center;
                    font-size: 14pt;
                }

                .map-controls {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .north-arrow {
                    position: absolute;
                    top: 15mm;
                    right: 15mm;
                    width: 20mm;
                    height: 25mm;
                    background: white;
                    border: 2px solid #2c3e50;
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14pt;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
                    z-index: 10;
                }

                .north-arrow::before {
                    content: '▲';
                    font-size: 18pt;
                    color: #2c3e50;
                    margin-bottom: 1mm;
                }

                .north-arrow::after {
                    content: 'N';
                    font-size: 10pt;
                    font-weight: bold;
                    color: #2c3e50;
                }

                .scale-bar {
                    position: absolute;
                    bottom: 15mm;
                    left: 15mm;
                    background: white;
                    padding: 4mm;
                    border: 2px solid #2c3e50;
                    border-radius: 4px;
                    font-size: 9pt;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
                    min-width: 40mm;
                    z-index: 10;
                }

                .scale-graphic {
                    width: 40mm;
                    height: 4mm;
                    background: linear-gradient(to right, #2c3e50 0%, #2c3e50 25%, #fff 25%, #fff 50%, #2c3e50 50%, #2c3e50 75%, #fff 75%, #fff 100%);
                    border: 1px solid #2c3e50;
                    margin: 2mm 0;
                }

                .scale-text {
                    text-align: center;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 1mm;
                }

                .scale-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 7pt;
                    color: #2c3e50;
                    margin-top: 1mm;
                }

                .coordinate-labels {
                    position: absolute;
                    font-size: 8pt;
                    color: #2c3e50;
                    font-weight: bold;
                }

                .coord-top {
                    top: 5mm;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .coord-bottom {
                    bottom: 5mm;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .coord-left {
                    left: 5mm;
                    top: 50%;
                    transform: translateY(-50%) rotate(-90deg);
                }

                .coord-right {
                    right: 5mm;
                    top: 50%;
                    transform: translateY(-50%) rotate(90deg);
                }

                .watermark {
                    position: absolute;
                    bottom: 20mm;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(52, 152, 219, 0.1);
                    border: 2px solid #3498db;
                    padding: 5mm 10mm;
                    border-radius: 8px;
                    font-size: 12pt;
                    font-weight: bold;
                    color: #3498db;
                    text-transform: uppercase;
                }

                .legend-panel {
                    position: absolute;
                    top: 50mm;
                    right: 15mm;
                    background: white;
                    border: 2px solid #2c3e50;
                    border-radius: 4px;
                    padding: 6mm;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
                    max-width: 45mm;
                    z-index: 10;
                }

                .legend-title {
                    font-size: 10pt;
                    font-weight: bold;
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 4mm;
                    border-bottom: 1px solid #bdc3c7;
                    padding-bottom: 2mm;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 2mm;
                    font-size: 8pt;
                }

                .legend-symbol {
                    width: 4mm;
                    height: 4mm;
                    margin-right: 2mm;
                    border: 1px solid #2c3e50;
                    flex-shrink: 0;
                }

                .legend-symbol.venta {
                    background: #e74c3c;
                }

                .legend-symbol.arriendo {
                    background: #f39c12;
                }

                .legend-symbol.poligono {
                    background: rgba(52, 152, 219, 0.3);
                    border: 2px solid #3498db;
                }

                .legend-text {
                    color: #2c3e50;
                    font-weight: 500;
                    line-height: 1.2;
                }

                .stats-section {
                    flex: 1;
                    background: #f8f9fa;
                    padding: 8mm;
                    display: flex;
                    flex-direction: column;
                    gap: 6mm;
                }

                .stats-title {
                    font-size: 13pt;
                    font-weight: bold;
                    color: white;
                    text-align: center;
                    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
                    padding: 4mm;
                    border-radius: 4px;
                    border: 1px solid #2c3e50;
                    text-transform: uppercase;
                    letter-spacing: 0.5mm;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                }

                .stat-card {
                    background: white;
                    border: 1px solid #bdc3c7;
                    border-radius: 4px;
                    padding: 4mm;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border-left: 4px solid #3498db;
                }

                .stat-card.total {
                    border-left-color: #27ae60;
                    background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
                }

                .stat-card.venta {
                    border-left-color: #2980b9;
                }

                .stat-card.arriendo {
                    border-left-color: #f39c12;
                }

                .stat-label {
                    font-size: 9pt;
                    color: #7f8c8d;
                    font-weight: 600;
                    margin-bottom: 2mm;
                }

                .stat-value {
                    font-size: 14pt;
                    color: #2c3e50;
                    font-weight: bold;
                }

                .stat-value.large {
                    font-size: 18pt;
                    color: #27ae60;
                }

                .stat-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3mm;
                }

                .metadata-section {
                    background: white;
                    border: 1px solid #bdc3c7;
                    border-radius: 4px;
                    padding: 4mm;
                    font-size: 8pt;
                    margin-top: auto;
                }

                .metadata-title {
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 2mm;
                    font-size: 9pt;
                }

                .metadata-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .metadata-table td {
                    padding: 1mm 2mm;
                    border-bottom: 1px solid #ecf0f1;
                    font-size: 7pt;
                }

                .metadata-table .label {
                    font-weight: bold;
                    color: #7f8c8d;
                    width: 40%;
                }

                .modal-controls {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    gap: 10px;
                    z-index: 10;
                }

                .control-btn {
                    background: rgba(255, 255, 255, 0.9);
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                    backdrop-filter: blur(5px);
                }

                .control-btn:hover {
                    background: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .close-btn {
                    background: #e74c3c;
                    color: white;
                    border: none;
                }

                .close-btn:hover {
                    background: #c0392b;
                }

                @media print {
                    .layout-modal {
                        position: static;
                        background: white;
                        backdrop-filter: none;
                    }
                    
                    .layout-container {
                        transform: none;
                        width: 100%;
                        height: 100vh;
                        border: none;
                        box-shadow: none;
                    }
                    
                    .modal-controls {
                        display: none;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', estilos);
        this.estilosInyectados = true;
    }

    /**
     * Genera el HTML completo del layout
     */
    generarLayoutHTML(config) {
        return `
            <div class="layout-container">
                ${this.generarHeader(config)}
                ${this.generarContenido(config)}
            </div>
        `;
    }

    /**
     * Genera el header del reporte
     */
    generarHeader(config) {
        const logoHTML = config.logoEmpresa 
            ? `<img src="${config.logoEmpresa}" alt="Logo ${config.empresa}">`
            : `<div style="color: #bdc3c7; font-size: 12pt; text-align: center;">
                <div style="font-size: 24pt; margin-bottom: 5px;">🏢</div>
                <div>LOGO</div>
               </div>`;

        return `
            <div class="header-section">
                <div class="company-info">
                    <div class="company-title">${config.empresa}</div>
                    <div class="project-title">${config.titulo}</div>
                    <div class="report-subtitle">Zona de Estudio: ${config.zona}</div>
                    <div class="report-subtitle">Fecha: ${this.formatearFecha(config.fecha)}</div>
                </div>
                <div class="logo-container">
                    ${logoHTML}
                </div>
            </div>
        `;
    }

    /**
     * Genera el contenido principal
     */
    generarContenido(config) {
        return `
            <div class="content-area">
                ${this.generarSeccionMapa(config)}
                ${this.generarSeccionEstadisticas(config)}
            </div>
        `;
    }

    /**
     * Genera la sección del mapa
     */
    generarSeccionMapa(config) {
        const mapaHTML = config.imagenMapa
            ? `<img src="${config.imagenMapa}" alt="Mapa del análisis" class="map-image">`
            : `<div class="map-placeholder">
                <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
                <div>ÁREA DEL MAPA</div>
                <div style="font-size: 10pt; margin-top: 5mm;">
                    Mapa del análisis geoespacial
                </div>
               </div>`;

        const coordenadas = this.generarCoordenadas(config.bounds);
        const coordenadasHTML = config.opciones.coordenadas ? `
            <div class="coordinate-labels coord-top">${coordenadas.north}</div>
            <div class="coordinate-labels coord-bottom">${coordenadas.south}</div>
            <div class="coordinate-labels coord-left">${coordenadas.west}</div>
            <div class="coordinate-labels coord-right">${coordenadas.east}</div>
        ` : '';

        const escalaDinamica = this.generarEscalaDinamica(config.zoom, config.mapWidth);
        const escalaHTML = config.opciones.escala ? `
            <div class="scale-bar">
                <div class="scale-text">ESCALA GRÁFICA</div>
                <div class="scale-graphic"></div>
                <div class="scale-labels">
                    ${escalaDinamica.distancias.map(dist => `<span>${dist}</span>`).join('')}
                </div>
                <div style="text-align: center; font-size: 7pt; margin-top: 1mm; font-weight: bold;">
                    ${escalaDinamica.escala}
                </div>
            </div>
        ` : '';

        const leyendaHTML = config.opciones.leyenda !== false ? `
            <div class="legend-panel">
                <div class="legend-title">LEYENDA</div>
                <div class="legend-item">
                    <div class="legend-symbol venta"></div>
                    <div class="legend-text">Ofertas en Venta</div>
                </div>
                <div class="legend-item">
                    <div class="legend-symbol arriendo"></div>
                    <div class="legend-text">Ofertas en Arriendo</div>
                </div>
                <div class="legend-item">
                    <div class="legend-symbol poligono"></div>
                    <div class="legend-text">Zona de Estudio</div>
                </div>
            </div>
        ` : '';

        const marcaAguaHTML = config.opciones.marcaAgua ? `
            <div class="watermark">VERSIÓN PRELIMINAR</div>
        ` : '';

        return `
            <div class="map-section">
                <div class="map-container">
                    ${mapaHTML}
                </div>
                
                <div class="map-controls">
                    <div class="north-arrow"></div>
                    ${escalaHTML}
                    ${leyendaHTML}
                </div>
                
                ${coordenadasHTML}
                ${marcaAguaHTML}
            </div>
        `;
    }

    /**
     * Genera la sección de estadísticas
     */
    generarSeccionEstadisticas(config) {
        const stats = config.estadisticas || {};
        
        return `
            <div class="stats-section">
                <div class="stats-title">Estadísticas del Análisis</div>
                
                <!-- Total Ofertas -->
                <div class="stat-card total">
                    <div class="stat-label">Total de Ofertas</div>
                    <div class="stat-value large">${stats.total || '0'}</div>
                </div>

                <!-- Grid de Transacciones -->
                <div class="stat-grid">
                    <div class="stat-card venta">
                        <div class="stat-label">Venta</div>
                        <div class="stat-value">${stats.venta || '0'}</div>
                    </div>
                    <div class="stat-card arriendo">
                        <div class="stat-label">Arriendo</div>
                        <div class="stat-value">${stats.arriendo || '0'}</div>
                    </div>
                </div>

                <!-- Grid de Métricas -->
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-label">Promedio</div>
                        <div class="stat-value" style="font-size: 10pt;">${stats.promedio || '—'}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Desv. Estándar</div>
                        <div class="stat-value">${stats.std || '—'}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Coef. Variación</div>
                        <div class="stat-value">${stats.cv || '—'}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Valor Adoptado</div>
                        <div class="stat-value" style="font-size: 10pt;">${stats.adoptado || '—'}</div>
                    </div>
                </div>

                <!-- Grid de Límites -->
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-label">Límite Inferior</div>
                        <div class="stat-value" style="font-size: 10pt;">${stats.limiteInf || '—'}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Límite Superior</div>
                        <div class="stat-value" style="font-size: 10pt;">${stats.limiteSup || '—'}</div>
                    </div>
                </div>

                ${config.opciones.metadatos ? this.generarMetadatos(config) : ''}
            </div>
        `;
    }

    /**
     * Genera la sección de metadatos
     */
    generarMetadatos(config) {
        const escalaDinamica = this.generarEscalaDinamica(config.zoom, config.mapWidth);
        
        return `
            <div class="metadata-section">
                <div class="metadata-title">INFORMACIÓN TÉCNICA</div>
                <table class="metadata-table">
                    <tr>
                        <td class="label">SISTEMA COORD.:</td>
                        <td>MAGNA-SIRGAS</td>
                    </tr>
                    <tr>
                        <td class="label">PROYECCIÓN:</td>
                        <td>Colombia Bogotá Zone</td>
                    </tr>
                    <tr>
                        <td class="label">DATUM:</td>
                        <td>MAGNA-SIRGAS</td>
                    </tr>
                    <tr>
                        <td class="label">EPSG:</td>
                        <td>3116</td>
                    </tr>
                    <tr>
                        <td class="label">ESCALA:</td>
                        <td>${escalaDinamica.escala}</td>
                    </tr>
                    <tr>
                        <td class="label">RESOLUCIÓN:</td>
                        <td>${config.resolucion || 300} DPI</td>
                    </tr>
                    <tr>
                        <td class="label">FORMATO:</td>
                        <td>${(config.formato || 'PDF').toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td class="label">FUENTE CARTOG.:</td>
                        <td>IGAC - ANT</td>
                    </tr>
                    <tr>
                        <td class="label">GENERADO:</td>
                        <td>${this.formatearFechaHora(new Date())}</td>
                    </tr>
                </table>
            </div>
        `;
    }

    /**
     * Muestra el modal con el layout
     */
    mostrarModal(layoutHTML, config) {
        // Remover modal existente
        this.cerrarModal();

        const modalHTML = `
            <div id="${this.modalId}" class="layout-modal">
                <div class="modal-controls">
                    <button class="control-btn" onclick="window.print()" title="Imprimir">
                        🖨️ Imprimir
                    </button>
                    <button class="control-btn" onclick="layoutGenerator.capturarLayout()" title="Capturar">
                        📸 Capturar
                    </button>
                    <button class="control-btn close-btn" onclick="layoutGenerator.cerrarModal()" title="Cerrar">
                        ✕
                    </button>
                </div>
                ${layoutHTML}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Agregar event listeners
        this.configurarEventListeners();

        // Exponer referencia global para los botones
        window.layoutGenerator = this;
    }

    /**
     * Configura event listeners del modal
     */
    configurarEventListeners() {
        const modal = document.getElementById(this.modalId);
        if (!modal) return;

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarModal();
            }
        });

        // Cerrar clickeando fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cerrarModal();
            }
        });
    }

    /**
     * Captura el layout actual
     */
    async capturarLayout() {
        try {
            const layoutContainer = document.querySelector(`#${this.modalId} .layout-container`);
            if (!layoutContainer) {
                throw new Error('Layout no encontrado');
            }

            // Usar html2canvas para capturar el layout
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas no está disponible. Incluya la librería para usar esta funcionalidad.');
            }

            console.log('📸 Capturando layout...');

            const canvas = await html2canvas(layoutContainer, {
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                scale: 2, // Alta resolución
                logging: false
            });

            // Crear enlace de descarga
            const link = document.createElement('a');
            link.download = `reporte-layout-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png', 0.95);
            link.click();

            console.log('✅ Layout capturado y descargado');

        } catch (error) {
            console.error('❌ Error capturando layout:', error);
            alert('Error capturando layout: ' + error.message);
        }
    }

    /**
     * Cierra el modal
     */
    cerrarModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.remove();
        }

        // Limpiar referencia global
        if (window.layoutGenerator === this) {
            delete window.layoutGenerator;
        }
    }

    /**
     * Genera layout para exportación (sin modal)
     */
    generarLayoutParaExportacion(config) {
        this.inyectarEstilos();
        return this.generarLayoutHTML(config);
    }

    /**
     * Obtiene el layout como imagen
     */
    async obtenerLayoutComoImagen(config, escala = 2) {
        try {
            // Crear elemento temporal
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = this.generarLayoutParaExportacion(config);
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            
            document.body.appendChild(tempContainer);

            // Verificar html2canvas
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas requerido para generar imagen del layout');
            }

            // Capturar
            const layoutElement = tempContainer.querySelector('.layout-container');
            const canvas = await html2canvas(layoutElement, {
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                scale: escala,
                logging: false
            });

            // Limpiar elemento temporal
            document.body.removeChild(tempContainer);

            return canvas.toDataURL('image/png', 0.95);

        } catch (error) {
            console.error('❌ Error generando imagen del layout:', error);
            throw error;
        }
    }

    /**
     * Utilidades de formato
     */
    formatearFecha(fecha) {
        if (!fecha) return new Date().toLocaleDateString('es-ES');
        return new Date(fecha).toLocaleDateString('es-ES');
    }

    formatearFechaHora(fecha) {
        return fecha.toLocaleDateString('es-ES') + ' ' + fecha.toLocaleTimeString('es-ES');
    }

    /**
     * Obtiene dimensiones del layout en píxeles
     */
    obtenerDimensiones(resolucion = 300) {
        // A4: 210mm x 297mm
        const mmAPulgadas = 25.4;
        const anchoPulgadas = 210 / mmAPulgadas;
        const altoPulgadas = 297 / mmAPulgadas;
        
        return {
            ancho: Math.round(anchoPulgadas * resolucion),
            alto: Math.round(altoPulgadas * resolucion),
            ratio: anchoPulgadas / altoPulgadas
        };
    }

    /**
     * Genera coordenadas dinámicas basadas en los bounds del mapa
     */
    generarCoordenadas(bounds) {
        if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
            // Coordenadas por defecto para Colombia (zona centro)
            return {
                north: "1'040,000 N",
                south: "1'020,000 N", 
                east: "1'020,000 E",
                west: "1'000,000 E"
            };
        }

        // Formatear coordenadas reales
        const formatCoord = (value, type) => {
            const rounded = Math.round(value);
            const formatted = rounded.toLocaleString('es-ES').replace(/\./g, "'");
            return `${formatted} ${type}`;
        };

        return {
            north: formatCoord(bounds.north, 'N'),
            south: formatCoord(bounds.south, 'N'),
            east: formatCoord(bounds.east, 'E'),
            west: formatCoord(bounds.west, 'E')
        };
    }

    /**
     * Valida y normaliza la configuración del layout
     */
    validarConfiguracion(config) {
        const configuracionPorDefecto = {
            empresa: 'OBSERVATORIO INMOBILIARIO',
            titulo: 'Análisis de Mercado Inmobiliario',
            zona: 'Área de Estudio',
            fecha: new Date(),
            opciones: {
                coordenadas: true,
                escala: true,
                leyenda: true,
                metadatos: true,
                marcaAgua: false
            },
            estadisticas: {
                total: 0,
                venta: 0,
                arriendo: 0,
                promedio: '—',
                std: '—',
                cv: '—',
                adoptado: '—',
                limiteInf: '—',
                limiteSup: '—'
            },
            formato: 'PDF',
            resolucion: 300
        };

        // Combinar configuración por defecto con la proporcionada
        return {
            ...configuracionPorDefecto,
            ...config,
            opciones: {
                ...configuracionPorDefecto.opciones,
                ...(config.opciones || {})
            },
            estadisticas: {
                ...configuracionPorDefecto.estadisticas,
                ...(config.estadisticas || {})
            }
        };
    }

    /**
     * Genera escala dinámica basada en el nivel de zoom
     */
    generarEscalaDinamica(zoom, width) {
        if (!zoom || !width) {
            return {
                escala: "1:25,000",
                distancias: ["0", "500m", "1km"]
            };
        }

        // Calcular escala aproximada basada en zoom y ancho del mapa
        const metrosPorPixel = 156543.03392 * Math.cos(4.5 * Math.PI / 180) / Math.pow(2, zoom);
        const metrosPorMapa = metrosPorPixel * width;
        
        // Determinar intervalos apropiados de escala
        let intervalos, etiquetas, denominador;
        
        if (metrosPorMapa > 50000) {
            intervalos = [0, 10000, 20000];
            etiquetas = ["0", "10km", "20km"];
            denominador = Math.round(metrosPorMapa / 40);
        } else if (metrosPorMapa > 10000) {
            intervalos = [0, 2000, 4000];
            etiquetas = ["0", "2km", "4km"];
            denominador = Math.round(metrosPorMapa / 40);
        } else if (metrosPorMapa > 2000) {
            intervalos = [0, 500, 1000];
            etiquetas = ["0", "500m", "1km"];
            denominador = Math.round(metrosPorMapa / 40);
        } else {
            intervalos = [0, 100, 200];
            etiquetas = ["0", "100m", "200m"];
            denominador = Math.round(metrosPorMapa / 40);
        }

        return {
            escala: `1:${denominador.toLocaleString('es-ES')}`,
            distancias: etiquetas
        };
    }
}

// Exponer clase globalmente
window.LayoutGenerator = LayoutGenerator;

console.log('🎨 LayoutGenerator v3.0.0 cargado - Layout cartográfico profesional con estándares GIS disponible');