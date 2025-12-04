/**
 * exportMap.js - Controlador Principal de Exportación
 * Orquesta todos los módulos para la generación de reportes
 * Versión: 2.0.0
 */

class ExportMapController {
    constructor() {
        this.formatoSeleccionado = 'pdf';
        this.estadisticasOriginales = {};
        this.imagenMapaCapturada = null;
        this.logoEmpresa = null;
        this.isInitialized = false;
        
        // Referencias a módulos
        this.screenshotModule = null;
        this.layoutModule = null;
        this.reportModule = null;
    }

    /**
     * Inicializa el controlador cuando el DOM está listo
     */
    async init() {
        if (this.isInitialized) return;

        try {
            await this.waitForDependencies();
            this.setupEventListeners();
            this.configurarFechaActual();
            this.cargarEstadisticasIniciales();
            this.isInitialized = true;
            
            console.log('✅ ExportMap Controller inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando ExportMap Controller:', error);
        }
    }

    /**
     * Espera a que todos los módulos dependientes estén cargados
     */
    async waitForDependencies() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50;
            let attempts = 0;

            const checkDependencies = () => {
                attempts++;
                
                if (window.ScreenshotCapture && window.LayoutGenerator && window.ReportBuilder) {
                    this.screenshotModule = new window.ScreenshotCapture();
                    this.layoutModule = new window.LayoutGenerator();
                    this.reportModule = new window.ReportBuilder();
                    resolve();
                } else if (attempts < maxAttempts) {
                    setTimeout(checkDependencies, 100);
                } else {
                    reject(new Error('No se pudieron cargar todas las dependencias'));
                }
            };

            checkDependencies();
        });
    }

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Panel principal
        this.bindElement('btn-salida-grafica', 'click', () => this.abrirPanel());
        this.bindElement('cerrarSalidaGrafica', 'click', () => this.cerrarPanel());

        // Cerrar panel clickeando fuera
        const panel = document.getElementById('panelSalidaGrafica');
        if (panel) {
            panel.addEventListener('click', (e) => {
                if (e.target === panel) this.cerrarPanel();
            });
        }

        // Configuración de formato
        this.setupFormatSelection();

        // Control de calidad
        this.setupQualityControl();

        // Captura de pantalla
        this.setupScreenshotControls();

        // Manejo de archivos
        this.setupFileHandlers();

        // Botones de acción
        this.setupActionButtons();

        // Inputs de configuración
        this.setupConfigurationInputs();
    }

    /**
     * Bind de eventos con manejo de errores
     */
    bindElement(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`⚠️ Elemento ${id} no encontrado`);
        }
    }

    /**
     * Configura la selección de formato
     */
    setupFormatSelection() {
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.format-option').forEach(opt => {
                    opt.classList.remove('selected', 'border-purple-500', 'bg-purple-50');
                    opt.classList.add('border-gray-300');
                });
                
                e.currentTarget.classList.add('selected', 'border-purple-500', 'bg-purple-50');
                e.currentTarget.classList.remove('border-gray-300');
                
                this.formatoSeleccionado = e.currentTarget.dataset.format;
                console.log(`📄 Formato seleccionado: ${this.formatoSeleccionado}`);
            });
        });
    }

    /**
     * Configura el control de calidad
     */
    setupQualityControl() {
        const slider = document.getElementById('calidad-slider');
        const valor = document.getElementById('calidad-valor');

        if (slider && valor) {
            slider.addEventListener('input', (e) => {
                valor.textContent = e.target.value + '%';
            });
        }
    }

    /**
     * Configura los controles de captura de pantalla
     */
    setupScreenshotControls() {
        this.bindElement('capturar-pantalla', 'click', () => this.mostrarOpcionesCaptura());
        this.bindElement('cargar-archivo-btn', 'click', () => this.mostrarCargaArchivo());
        this.bindElement('ejecutar-captura', 'click', () => this.ejecutarCaptura());
        this.bindElement('eliminar-imagen', 'click', () => this.eliminarImagen());
    }

    /**
     * Configura el manejo de archivos
     */
    setupFileHandlers() {
        // Mapa principal
        this.bindElement('mapa-principal', 'change', (e) => {
            this.manejarArchivoMapa(e.target.files[0]);
        });

        // Logo empresa
        this.bindElement('logo-empresa', 'change', (e) => {
            this.manejarArchivoLogo(e.target.files[0]);
        });
    }

    /**
     * Configura los botones de acción
     */
    setupActionButtons() {
        this.bindElement('generar-vista-previa', 'click', () => this.generarVistaPrevia());
        this.bindElement('exportar-reporte', 'click', () => this.exportarReporte());
    }

    /**
     * Configura los inputs de configuración
     */
    setupConfigurationInputs() {
        // Los inputs se manejan automáticamente al leer la configuración
        // No necesitan listeners específicos
    }

    /**
     * Configura la fecha actual
     */
    configurarFechaActual() {
        const fechaInput = document.getElementById('fecha-reporte');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Abre el panel lateral
     */
    abrirPanel() {
        const panel = document.getElementById('panelSalidaGrafica');
        if (panel) {
            panel.classList.remove('translate-x-full');
            panel.setAttribute('aria-hidden', 'false');
            this.cargarEstadisticas();
            console.log('📊 Panel de salida gráfica abierto');
        }
    }

    /**
     * Cierra el panel lateral
     */
    cerrarPanel() {
        const panel = document.getElementById('panelSalidaGrafica');
        if (panel) {
            panel.classList.add('translate-x-full');
            panel.setAttribute('aria-hidden', 'true');
            console.log('📊 Panel de salida gráfica cerrado');
        }
    }

    /**
     * Carga las estadísticas del panel izquierdo
     */
    cargarEstadisticas() {
        try {
            // Leer estadísticas reales del panel izquierdo
            this.estadisticasOriginales = {
                total: this.obtenerTextoElemento('stat-total', '42'),
                venta: this.obtenerTextoElemento('stat-venta', '28'),
                arriendo: this.obtenerTextoElemento('stat-arriendo', '14'),
                promedio: this.obtenerTextoElemento('stat-prom', '$2,450,000'),
                std: this.obtenerTextoElemento('stat-std-unit', '15.2%'),
                cv: this.obtenerTextoElemento('stat-cv-unit', '0.18'),
                limiteInf: this.obtenerTextoElemento('stat-low-unit', '$1,890,000'),
                limiteSup: this.obtenerTextoElemento('stat-high-unit', '$2,980,000'),
                adoptado: this.obtenerValorSelect('select-adopted-unit', '$2,380,000')
            };

            this.actualizarElementosPanel();
            console.log('📈 Estadísticas cargadas:', this.estadisticasOriginales);
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        }
    }

    /**
     * Obtiene texto de elemento con valor por defecto
     */
    obtenerTextoElemento(id, valorPorDefecto) {
        const elemento = document.getElementById(id);
        return elemento?.textContent?.trim() || valorPorDefecto;
    }

    /**
     * Obtiene valor de select con valor por defecto
     */
    obtenerValorSelect(id, valorPorDefecto) {
        const elemento = document.getElementById(id);
        return elemento?.value || valorPorDefecto;
    }

    /**
     * Actualiza los elementos del panel con las estadísticas
     */
    actualizarElementosPanel() {
        const mapeo = {
            'export-stat-total': this.estadisticasOriginales.total,
            'export-stat-venta': this.estadisticasOriginales.venta,
            'export-stat-arriendo': this.estadisticasOriginales.arriendo,
            'export-stat-promedio': this.estadisticasOriginales.promedio,
            'export-stat-std': this.estadisticasOriginales.std,
            'export-stat-cv': this.estadisticasOriginales.cv,
            'export-stat-limite-inf': this.estadisticasOriginales.limiteInf,
            'export-stat-limite-sup': this.estadisticasOriginales.limiteSup,
            'export-stat-adoptado': this.estadisticasOriginales.adoptado
        };

        Object.entries(mapeo).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        });
    }

    /**
     * Muestra las opciones de captura
     */
    mostrarOpcionesCaptura() {
        const areaSeleccion = document.getElementById('area-seleccion');
        const fileContainer = document.getElementById('file-input-container');
        
        if (areaSeleccion) areaSeleccion.classList.remove('hidden');
        if (fileContainer) fileContainer.classList.add('hidden');
    }

    /**
     * Muestra la opción de carga de archivo
     */
    mostrarCargaArchivo() {
        const areaSeleccion = document.getElementById('area-seleccion');
        const fileContainer = document.getElementById('file-input-container');
        
        if (areaSeleccion) areaSeleccion.classList.add('hidden');
        if (fileContainer) fileContainer.classList.remove('hidden');
    }

    /**
     * Ejecuta la captura de pantalla
     */
    async ejecutarCaptura() {
        if (!this.screenshotModule) {
            console.error('❌ Módulo de captura no disponible');
            return;
        }

        try {
            const areaSeleccionada = document.querySelector('input[name="area-captura"]:checked')?.value || 'pantalla-completa';
            
            this.mostrarEstadoCaptura('iniciando');
            
            let imagenCapturada;
            
            if (areaSeleccionada === 'mapa-principal') {
                // Captura específica del mapa sin elementos UI
                console.log('🗺️ Capturando solo el área del mapa...');
                imagenCapturada = await this.screenshotModule.capturarMapaLimpio('#map');
            } else {
                // Captura de pantalla completa
                imagenCapturada = await this.screenshotModule.capturarPantalla({
                    tipo: areaSeleccionada,
                    selector: null
                });
            }

            this.imagenMapaCapturada = imagenCapturada;
            this.mostrarImagenCapturada(imagenCapturada, areaSeleccionada);
            this.ocultarEstadoCaptura();
            
            console.log('✅ Captura exitosa:', areaSeleccionada);
            
        } catch (error) {
            console.error('❌ Error en captura:', error);
            this.mostrarErrorCaptura(error.message);
        }
    }

    /**
     * Muestra el estado de la captura
     */
    mostrarEstadoCaptura(tipo) {
        const estadoCaptura = document.getElementById('captura-estado');
        if (!estadoCaptura) return;

        const mensajes = {
            iniciando: 'Iniciando captura de pantalla...',
            procesando: 'Procesando captura...'
        };

        estadoCaptura.classList.remove('hidden');
        estadoCaptura.innerHTML = `
            <div class="flex items-center gap-2 text-blue-700">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                <span>${mensajes[tipo] || tipo}</span>
            </div>
        `;
    }

    /**
     * Oculta el estado de captura
     */
    ocultarEstadoCaptura() {
        const estadoCaptura = document.getElementById('captura-estado');
        const areaSeleccion = document.getElementById('area-seleccion');
        
        if (estadoCaptura) estadoCaptura.classList.add('hidden');
        if (areaSeleccion) areaSeleccion.classList.add('hidden');
    }

    /**
     * Muestra error de captura
     */
    mostrarErrorCaptura(mensaje) {
        const estadoCaptura = document.getElementById('captura-estado');
        if (!estadoCaptura) return;

        estadoCaptura.innerHTML = `
            <div class="text-red-700">
                <p class="font-semibold mb-2">❌ Error: ${mensaje}</p>
                <p class="text-sm mb-2">Alternativas:</p>
                <ul class="text-xs space-y-1">
                    <li>• Use Ctrl+Shift+S en Firefox para captura manual</li>
                    <li>• Use la herramienta de recorte del sistema</li>
                    <li>• Cargue una imagen desde archivo</li>
                </ul>
                <button onclick="document.getElementById('cargar-archivo-btn')?.click()" 
                        class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs">
                    Cargar desde archivo
                </button>
            </div>
        `;
    }

    /**
     * Muestra la imagen capturada
     */
    mostrarImagenCapturada(imagen, tipoCaptura) {
        const previewImg = document.getElementById('preview-mapa-img');
        const previewContainer = document.getElementById('preview-mapa');
        const imagenInfo = document.getElementById('imagen-info');
        
        if (previewImg && previewContainer) {
            previewImg.src = imagen;
            previewContainer.classList.remove('hidden');
        }
        
        if (imagenInfo) {
            const timestamp = new Date().toLocaleString();
            imagenInfo.textContent = `Captura de ${tipoCaptura} - ${timestamp}`;
        }
    }

    /**
     * Elimina la imagen cargada
     */
    eliminarImagen() {
        const previewContainer = document.getElementById('preview-mapa');
        const previewImg = document.getElementById('preview-mapa-img');
        const inputFile = document.getElementById('mapa-principal');
        
        if (previewContainer) previewContainer.classList.add('hidden');
        if (previewImg) previewImg.src = '';
        if (inputFile) inputFile.value = '';
        
        this.imagenMapaCapturada = null;
        console.log('🗑️ Imagen eliminada');
    }

    /**
     * Maneja la carga de archivo de mapa
     */
    manejarArchivoMapa(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagenMapaCapturada = e.target.result;
            this.mostrarImagenCapturada(e.target.result, 'archivo cargado');
            console.log('📁 Archivo de mapa cargado');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Maneja la carga de archivo de logo
     */
    manejarArchivoLogo(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.logoEmpresa = e.target.result;
            const previewImg = document.getElementById('preview-logo-img');
            const previewContainer = document.getElementById('preview-logo');
            
            if (previewImg && previewContainer) {
                previewImg.src = e.target.result;
                previewContainer.classList.remove('hidden');
            }
            console.log('🏢 Logo de empresa cargado');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Obtiene la configuración actual completa
     */
    obtenerConfiguracion() {
        return {
            // Formato y calidad
            formato: this.formatoSeleccionado,
            calidad: parseInt(document.getElementById('calidad-slider')?.value || '85'),
            resolucion: parseInt(document.getElementById('resolucion-select')?.value || '300'),
            
            // Información del proyecto
            titulo: document.getElementById('proyecto-titulo')?.value || 'Análisis de Mercado Inmobiliario',
            empresa: document.getElementById('empresa-nombre')?.value || 'INGENIERÍA LEGAL',
            fecha: document.getElementById('fecha-reporte')?.value || new Date().toISOString().split('T')[0],
            zona: document.getElementById('zona-estudio')?.value || 'Bogotá D.C.',
            
            // Opciones avanzadas
            opciones: {
                metadatos: document.getElementById('incluir-metadatos')?.checked || true,
                coordenadas: document.getElementById('incluir-coordenadas')?.checked || true,
                escala: document.getElementById('incluir-escala')?.checked || true,
                marcaAgua: document.getElementById('marca-agua')?.checked || false
            },
            
            // Datos del análisis
            estadisticas: this.estadisticasOriginales,
            
            // Recursos
            imagenMapa: this.imagenMapaCapturada,
            logoEmpresa: this.logoEmpresa,
            
            // Metadatos técnicos
            generadoEn: new Date().toISOString(),
            version: '2.0.0'
        };
    }

    /**
     * Genera vista previa del layout
     */
    async generarVistaPrevia() {
        if (!this.layoutModule) {
            console.error('❌ Módulo de layout no disponible');
            return;
        }

        try {
            const configuracion = this.obtenerConfiguracion();
            
            console.log('👁️ Generando vista previa...');
            
            await this.layoutModule.generarVistaPrevia(configuracion);
            
            console.log('✅ Vista previa generada');
            
        } catch (error) {
            console.error('❌ Error generando vista previa:', error);
            alert('Error generando vista previa: ' + error.message);
        }
    }

    /**
     * Exporta el reporte final
     */
    async exportarReporte() {
        if (!this.reportModule) {
            console.error('❌ Módulo de reporte no disponible');
            return;
        }

        const loadingSpinner = document.getElementById('loading-spinner');
        const exportarTexto = document.getElementById('exportar-texto');
        const botonExportar = document.getElementById('exportar-reporte');
        
        try {
            // Mostrar estado de carga
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            if (exportarTexto) exportarTexto.textContent = 'Exportando...';
            if (botonExportar) botonExportar.disabled = true;
            
            const configuracion = this.obtenerConfiguracion();
            
            console.log('💾 Iniciando exportación...');
            console.log('📋 Configuración:', configuracion);
            
            // Validar configuración
            this.validarConfiguracion(configuracion);
            
            // Exportar usando el módulo correspondiente
            await this.reportModule.exportarReporte(configuracion);
            
            console.log('✅ Reporte exportado exitosamente');
            
        } catch (error) {
            console.error('❌ Error exportando reporte:', error);
            alert('Error exportando reporte: ' + error.message);
        } finally {
            // Restaurar estado del botón
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            if (exportarTexto) exportarTexto.textContent = '💾 Exportar Reporte';
            if (botonExportar) botonExportar.disabled = false;
        }
    }

    /**
     * Valida la configuración antes de exportar
     */
    validarConfiguracion(config) {
        const errores = [];

        if (!config.imagenMapa) {
            errores.push('Debe capturar o cargar una imagen del mapa');
        }

        if (!config.titulo.trim()) {
            errores.push('El título del proyecto es requerido');
        }

        if (!config.empresa.trim()) {
            errores.push('El nombre de la empresa es requerido');
        }

        if (errores.length > 0) {
            throw new Error('Configuración incompleta:\n• ' + errores.join('\n• '));
        }
    }

    /**
     * Carga estadísticas iniciales
     */
    cargarEstadisticasIniciales() {
        setTimeout(() => {
            this.cargarEstadisticas();
        }, 1000); // Dar tiempo a que el panel izquierdo se inicialice
    }

    /**
     * API pública para actualizar estadísticas externamente
     */
    actualizarEstadisticas(nuevasEstadisticas) {
        if (typeof nuevasEstadisticas === 'object' && nuevasEstadisticas !== null) {
            this.estadisticasOriginales = { ...this.estadisticasOriginales, ...nuevasEstadisticas };
            this.actualizarElementosPanel();
            console.log('📊 Estadísticas actualizadas externamente');
        }
    }

    /**
     * API pública para obtener el estado actual
     */
    obtenerEstado() {
        return {
            inicializado: this.isInitialized,
            formato: this.formatoSeleccionado,
            tieneImagen: !!this.imagenMapaCapturada,
            tieneLogo: !!this.logoEmpresa,
            estadisticas: this.estadisticasOriginales
        };
    }
}

// Instancia global del controlador
const exportMapController = new ExportMapController();

// Inicialización automática cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => exportMapController.init());
} else {
    exportMapController.init();
}

// APIs públicas para integración externa
window.ExportMapAPI = {
    // Control principal
    controller: exportMapController,
    
    // Métodos de control
    abrir: () => exportMapController.abrirPanel(),
    cerrar: () => exportMapController.cerrarPanel(),
    
    // Gestión de datos
    actualizarEstadisticas: (stats) => exportMapController.actualizarEstadisticas(stats),
    obtenerConfiguracion: () => exportMapController.obtenerConfiguracion(),
    obtenerEstado: () => exportMapController.obtenerEstado(),
    
    // Funciones de exportación
    vistaPrevia: () => exportMapController.generarVistaPrevia(),
    exportar: () => exportMapController.exportarReporte(),
    
    // Gestión de recursos
    setImagenMapa: (imagen) => exportMapController.imagenMapaCapturada = imagen,
    setLogo: (logo) => exportMapController.logoEmpresa = logo,
    
    // Configuración
    setFormato: (formato) => exportMapController.formatoSeleccionado = formato,
    getFormato: () => exportMapController.formatoSeleccionado
};

// API legacy para compatibilidad
window.PanelSalidaGrafica = window.ExportMapAPI;

console.log('🚀 ExportMap Controller v2.0.0 cargado - API disponible en window.ExportMapAPI');