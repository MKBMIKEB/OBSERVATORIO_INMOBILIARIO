/**
 * reportBuilder.js - Constructor de Reportes
 * Maneja la exportación final en diferentes formatos
 * Versión: 2.0.0 - Corregido y Completo
 */

class ReportBuilder {
    constructor() {
        this.layoutGenerator = null;
        this.bibliotecasExternas = {
            jsPDF: false,
            html2canvas: false
        };
        
        this.init();
    }

    /**
     * Inicializa el constructor de reportes
     */
    async init() {
        try {
            await this.verificarBibliotecas();
            console.log('📄 ReportBuilder inicializado correctamente');
        } catch (error) {
            console.warn('⚠️ ReportBuilder inicializado con limitaciones:', error.message);
        }
    }

    /**
     * Verifica y carga las bibliotecas externas necesarias
     */
    async verificarBibliotecas() {
        // Verificar html2canvas
        if (typeof html2canvas !== 'undefined') {
            this.bibliotecasExternas.html2canvas = true;
            console.log('✅ html2canvas disponible');
        } else {
            console.log('📚 Cargando html2canvas...');
            try {
                await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
                this.bibliotecasExternas.html2canvas = true;
                console.log('✅ html2canvas cargado exitosamente');
            } catch (error) {
                console.warn('⚠️ No se pudo cargar html2canvas');
            }
        }

        // Verificar jsPDF
        if (typeof window.jspdf !== 'undefined') {
            this.bibliotecasExternas.jsPDF = true;
            console.log('✅ jsPDF disponible');
        } else {
            console.log('📚 jsPDF se cargará cuando sea necesario');
        }

        console.log('📋 Estado de bibliotecas:', this.bibliotecasExternas);
    }

    /**
     * Carga un script externo de forma asíncrona
     */
    cargarScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si ya existe
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Error cargando ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Exporta el reporte en el formato especificado
     */
    async exportarReporte(configuracion) {
        try {
            console.log(`📄 Iniciando exportación en formato ${configuracion.formato}...`);
            
            // Inicializar layout generator si no existe
            if (!this.layoutGenerator) {
                if (typeof window.LayoutGenerator === 'undefined') {
                    throw new Error('LayoutGenerator no está disponible');
                }
                this.layoutGenerator = new window.LayoutGenerator();
            }

            // Validar configuración
            this.validarConfiguracion(configuracion);

            // Exportar según el formato
            const formato = configuracion.formato.toLowerCase();
            
            switch (formato) {
                case 'pdf':
                    await this.exportarPDF(configuracion);
                    break;
                case 'png':
                    await this.exportarPNG(configuracion);
                    break;
                case 'jpg':
                case 'jpeg':
                    await this.exportarJPG(configuracion);
                    break;
                case 'svg':
                    await this.exportarSVG(configuracion);
                    break;
                default:
                    throw new Error(`Formato ${configuracion.formato} no soportado`);
            }

            console.log(`✅ Reporte exportado exitosamente en formato ${formato}`);
            this.mostrarMensajeExito(configuracion);

        } catch (error) {
            console.error('❌ Error exportando reporte:', error);
            this.mostrarMensajeError(error, configuracion);
            throw error;
        }
    }

    /**
     * Valida la configuración antes de exportar
     */
    validarConfiguracion(config) {
        const errores = [];

        if (!config.titulo || !config.titulo.trim()) {
            errores.push('El título del proyecto es requerido');
        }

        if (!config.empresa || !config.empresa.trim()) {
            errores.push('El nombre de la empresa es requerido');
        }

        if (!config.imagenMapa && (!config.estadisticas || Object.keys(config.estadisticas).length === 0)) {
            errores.push('Se requiere al menos una imagen del mapa o estadísticas válidas');
        }

        if (errores.length > 0) {
            throw new Error('Configuración incompleta:\n• ' + errores.join('\n• '));
        }
    }

    /**
     * Exporta como PDF
     */
    async exportarPDF(config) {
        try {
            console.log('📄 Generando PDF...');

            // Cargar jsPDF si no está disponible
            if (!this.bibliotecasExternas.jsPDF) {
                console.log('📚 Cargando jsPDF...');
                await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                
                // Verificar si se cargó correctamente
                if (typeof window.jspdf === 'undefined') {
                    throw new Error('No se pudo cargar jsPDF');
                }
                this.bibliotecasExternas.jsPDF = true;
            }

            // Generar imagen del layout
            console.log('🎨 Generando imagen del layout...');
            const imagenLayout = await this.layoutGenerator.obtenerLayoutComoImagen(config, 2);

            // Crear PDF
            console.log('📄 Creando documento PDF...');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // Dimensiones A4 en mm
            const pdfWidth = 210;
            const pdfHeight = 297;

            // Agregar imagen al PDF
            pdf.addImage(imagenLayout, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');

            // Agregar metadatos
            pdf.setProperties({
                title: config.titulo,
                subject: `Reporte de Análisis - ${config.zona}`,
                author: config.empresa,
                creator: 'Sistema de Exportación de Mapas v2.0.0',
                keywords: 'mapa, análisis, inmobiliario, reporte, estadísticas',
                creationDate: new Date()
            });

            // Generar nombre de archivo y descargar
            const nombreArchivo = this.generarNombreArchivo(config, 'pdf');
            pdf.save(nombreArchivo);

            console.log('✅ PDF generado y descargado:', nombreArchivo);

        } catch (error) {
            console.error('❌ Error exportando PDF:', error);
            this.mostrarFallbackPDF(config);
            throw new Error('Error generando PDF. Se mostró opción alternativa.');
        }
    }

    /**
     * Exporta como PNG
     */
    async exportarPNG(config) {
        try {
            console.log('🖼️ Generando PNG...');
            
            const escala = this.calcularEscala(config.resolucion || 300);
            const imagenLayout = await this.layoutGenerator.obtenerLayoutComoImagen(config, escala);

            // Crear enlace de descarga
            const link = document.createElement('a');
            const nombreArchivo = this.generarNombreArchivo(config, 'png');
            link.download = nombreArchivo;
            link.href = imagenLayout;
            
            // Simular click para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ PNG generado y descargado:', nombreArchivo);

        } catch (error) {
            console.error('❌ Error exportando PNG:', error);
            throw error;
        }
    }

    /**
     * Exporta como JPG
     */
    async exportarJPG(config) {
        try {
            console.log('📷 Generando JPG...');
            
            const escala = this.calcularEscala(config.resolucion || 300);
            const imagenPNG = await this.layoutGenerator.obtenerLayoutComoImagen(config, escala);

            // Convertir PNG a JPG
            const calidadJPG = (config.calidad || 85) / 100;
            const imagenJPG = await this.convertirPNGaJPG(imagenPNG, calidadJPG);

            // Crear enlace de descarga
            const link = document.createElement('a');
            const nombreArchivo = this.generarNombreArchivo(config, 'jpg');
            link.download = nombreArchivo;
            link.href = imagenJPG;
            
            // Simular click para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ JPG generado y descargado:', nombreArchivo);

        } catch (error) {
            console.error('❌ Error exportando JPG:', error);
            throw error;
        }
    }

    /**
     * Exporta como SVG
     */
    async exportarSVG(config) {
        try {
            console.log('🎨 Generando SVG...');
            
            // Generar contenido SVG
            const svgContent = this.generarSVGLayout(config);

            // Crear blob y enlace de descarga
            const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            const nombreArchivo = this.generarNombreArchivo(config, 'svg');
            link.download = nombreArchivo;
            link.href = url;
            
            // Simular click para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpiar URL temporal
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            console.log('✅ SVG generado y descargado:', nombreArchivo);

        } catch (error) {
            console.error('❌ Error exportando SVG:', error);
            throw error;
        }
    }

    /**
     * Convierte imagen PNG a JPG
     */
    convertirPNGaJPG(imagenPNG, calidad = 0.85) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // Fondo blanco para JPG (no soporta transparencia)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Dibujar imagen
                ctx.drawImage(img, 0, 0);

                // Convertir a JPG con calidad especificada
                const jpgDataUrl = canvas.toDataURL('image/jpeg', calidad);
                resolve(jpgDataUrl);
            };

            img.onerror = () => reject(new Error('Error cargando imagen para conversión a JPG'));
            img.src = imagenPNG;
        });
    }

    /**
     * Genera contenido SVG completo
     */
    generarSVGLayout(config) {
        const dimensiones = { ancho: 794, alto: 1123 }; // A4 a 96 DPI
        const stats = config.estadisticas || {};

        return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${dimensiones.ancho}" height="${dimensiones.alto}" 
     viewBox="0 0 ${dimensiones.ancho} ${dimensiones.alto}"
     xmlns="http://www.w3.org/2000/svg">
     
    <!-- Definiciones -->
    <defs>
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8f9fa"/>
            <stop offset="100%" style="stop-color:#e9ecef"/>
        </linearGradient>
        <pattern id="scalePattern" x="0" y="0" width="20" height="8" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="8" fill="#000"/>
            <rect x="10" y="0" width="10" height="8" fill="#fff"/>
        </pattern>
    </defs>
    
    <!-- Fondo -->
    <rect width="100%" height="100%" fill="#ffffff" stroke="#000" stroke-width="2"/>
    
    <!-- Header -->
    <rect x="0" y="0" width="${dimensiones.ancho}" height="300" 
          fill="url(#headerGradient)" stroke="#000" stroke-width="2"/>
    
    <!-- Título de la empresa -->
    <text x="40" y="80" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#2c3e50">
        ${this.escaparTextoSVG(config.empresa)}
    </text>
    
    <!-- Título del proyecto -->
    <text x="40" y="140" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#34495e">
        ${this.escaparTextoSVG(config.titulo)}
    </text>
    
    <!-- Zona de estudio -->
    <text x="40" y="180" font-family="Arial, sans-serif" font-size="18" fill="#7f8c8d">
        Zona de Estudio: ${this.escaparTextoSVG(config.zona)}
    </text>
    
    <!-- Fecha -->
    <text x="40" y="210" font-family="Arial, sans-serif" font-size="18" fill="#7f8c8d">
        Fecha: ${this.formatearFecha(config.fecha)}
    </text>
    
    <!-- Área del logo -->
    <rect x="${dimensiones.ancho - 180}" y="40" width="140" height="100" 
          fill="#ffffff" stroke="#bdc3c7" stroke-width="2" rx="8"/>
    
    ${config.logoEmpresa ? 
        `<image x="${dimensiones.ancho - 170}" y="50" width="120" height="80" 
                href="${config.logoEmpresa}" preserveAspectRatio="xMidYMid meet"/>` :
        `<text x="${dimensiones.ancho - 110}" y="95" font-family="Arial, sans-serif" 
               font-size="16" text-anchor="middle" fill="#bdc3c7">LOGO</text>`
    }
    
    <!-- Línea separadora -->
    <line x1="0" y1="300" x2="${dimensiones.ancho}" y2="300" stroke="#000" stroke-width="2"/>
    
    <!-- Área del mapa -->
    <rect x="0" y="300" width="530" height="${dimensiones.alto - 300}" 
          fill="#f8f9fa" stroke="#000" stroke-width="2"/>
    
    <!-- Contenedor del mapa -->
    <rect x="30" y="330" width="470" height="400" 
          fill="#ffffff" stroke="#bdc3c7" stroke-width="2" rx="4"/>
    
    ${config.imagenMapa ? 
        `<image x="35" y="335" width="460" height="390" 
                href="${config.imagenMapa}" preserveAspectRatio="xMidYMid slice"/>` :
        `<text x="265" y="530" font-family="Arial, sans-serif" 
               font-size="24" text-anchor="middle" fill="#7f8c8d">🗺️ ÁREA DEL MAPA</text>`
    }
    
    <!-- Rosa de los vientos -->
    <circle cx="80" cy="380" r="25" fill="#ffffff" stroke="#2c3e50" stroke-width="2"/>
    <text x="80" y="390" font-family="Arial, sans-serif" font-size="18" 
          text-anchor="middle" font-weight="bold" fill="#2c3e50">N</text>
    
    <!-- Sección de estadísticas -->
    <rect x="530" y="300" width="264" height="${dimensiones.alto - 300}" fill="#f8f9fa"/>
    
    <!-- Título de estadísticas -->
    <rect x="550" y="320" width="224" height="40" 
          fill="#e9ecef" stroke="#bdc3c7" stroke-width="1" rx="4"/>
    <text x="662" y="345" font-family="Arial, sans-serif" 
          font-size="16" text-anchor="middle" font-weight="bold" fill="#2c3e50">
        📊 ESTADÍSTICAS
    </text>
    
    <!-- Total de ofertas -->
    <rect x="550" y="380" width="224" height="50" 
          fill="#ffffff" stroke="#27ae60" stroke-width="0 0 0 4" rx="4"/>
    <text x="560" y="400" font-family="Arial, sans-serif" font-size="12" fill="#7f8c8d">
        Total de Ofertas
    </text>
    <text x="560" y="420" font-family="Arial, sans-serif" 
          font-size="20" font-weight="bold" fill="#27ae60">
        ${stats.total || '0'}
    </text>
    
    <!-- Venta y Arriendo -->
    <rect x="550" y="450" width="109" height="40" 
          fill="#ffffff" stroke="#2980b9" stroke-width="0 0 0 4" rx="4"/>
    <text x="560" y="468" font-family="Arial, sans-serif" font-size="11" fill="#7f8c8d">Venta</text>
    <text x="560" y="485" font-family="Arial, sans-serif" 
          font-size="16" font-weight="bold" fill="#2980b9">${stats.venta || '0'}</text>
    
    <rect x="665" y="450" width="109" height="40" 
          fill="#ffffff" stroke="#f39c12" stroke-width="0 0 0 4" rx="4"/>
    <text x="675" y="468" font-family="Arial, sans-serif" font-size="11" fill="#7f8c8d">Arriendo</text>
    <text x="675" y="485" font-family="Arial, sans-serif" 
          font-size="16" font-weight="bold" fill="#f39c12">${stats.arriendo || '0'}</text>
    
    <!-- Métricas adicionales -->
    <rect x="550" y="510" width="109" height="40" 
          fill="#ffffff" stroke="#3498db" stroke-width="0 0 0 4" rx="4"/>
    <text x="560" y="528" font-family="Arial, sans-serif" font-size="10" fill="#7f8c8d">Promedio</text>
    <text x="560" y="545" font-family="Arial, sans-serif" 
          font-size="12" font-weight="bold" fill="#3498db">${this.truncarTexto(stats.promedio || '—', 12)}</text>
    
    <rect x="665" y="510" width="109" height="40" 
          fill="#ffffff" stroke="#9b59b6" stroke-width="0 0 0 4" rx="4"/>
    <text x="675" y="528" font-family="Arial, sans-serif" font-size="10" fill="#7f8c8d">Desv. Estándar</text>
    <text x="675" y="545" font-family="Arial, sans-serif" 
          font-size="12" font-weight="bold" fill="#9b59b6">${stats.std || '—'}</text>
    
    <!-- Metadatos -->
    ${config.opciones?.metadatos ? `
    <rect x="550" y="${dimensiones.alto - 200}" width="224" height="160" 
          fill="#ffffff" stroke="#bdc3c7" stroke-width="1" rx="4"/>
    <text x="560" y="${dimensiones.alto - 180}" font-family="Arial, sans-serif" 
          font-size="12" font-weight="bold" fill="#2c3e50">INFORMACIÓN TÉCNICA</text>
    <text x="560" y="${dimensiones.alto - 160}" font-family="Arial, sans-serif" 
          font-size="10" fill="#7f8c8d">PROYECCIÓN: MAGNA SIRGAS</text>
    <text x="560" y="${dimensiones.alto - 145}" font-family="Arial, sans-serif" 
          font-size="10" fill="#7f8c8d">RESOLUCIÓN: ${config.resolucion} DPI</text>
    <text x="560" y="${dimensiones.alto - 130}" font-family="Arial, sans-serif" 
          font-size="10" fill="#7f8c8d">FORMATO: ${config.formato.toUpperCase()}</text>
    <text x="560" y="${dimensiones.alto - 115}" font-family="Arial, sans-serif" 
          font-size="10" fill="#7f8c8d">GENERADO: ${this.formatearFechaHora(new Date())}</text>
    ` : ''}
    
    <!-- Metadatos del documento -->
    <metadata>
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns:dc="http://purl.org/dc/elements/1.1/">
            <rdf:Description>
                <dc:title>${this.escaparTextoSVG(config.titulo)}</dc:title>
                <dc:creator>${this.escaparTextoSVG(config.empresa)}</dc:creator>
                <dc:date>${config.fecha}</dc:date>
                <dc:description>Reporte generado por Sistema de Exportación de Mapas v2.0.0</dc:description>
            </rdf:Description>
        </rdf:RDF>
    </metadata>
</svg>`;
    }

    /**
     * Escapa texto para SVG
     */
    escaparTextoSVG(texto) {
        if (!texto) return '';
        return texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Trunca texto si es muy largo
     */
    truncarTexto(texto, maxLength) {
        if (!texto || texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength - 3) + '...';
    }

    /**
     * Calcula escala basada en resolución
     */
    calcularEscala(resolucion) {
        const escalas = {
            96: 1,
            150: 1.5,
            300: 2,
            600: 3
        };
        return escalas[resolucion] || 2;
    }

    /**
     * Genera nombre de archivo único
     */
    generarNombreArchivo(config, extension) {
        const fecha = (config.fecha || new Date().toISOString().split('T')[0]).replace(/-/g, '');
        const empresa = (config.empresa || 'reporte')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase()
            .substring(0, 15);
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .split('T')[1]
            .split('.')[0];
        
        return `reporte-${empresa}-${fecha}-${timestamp}.${extension}`;
    }

    /**
     * Muestra fallback para PDF
     */
    mostrarFallbackPDF(config) {
        const mensaje = `No se pudo generar el PDF automáticamente.

Opciones alternativas:
• Usar Ctrl+P para imprimir/guardar como PDF
• Abrir vista previa y usar herramientas del navegador
• Descargar en formato PNG de alta resolución

¿Desea abrir la vista previa del layout?`;
        
        if (confirm(mensaje)) {
            if (this.layoutGenerator) {
                this.layoutGenerator.generarVistaPrevia(config);
            }
        }
    }

    /**
     * Muestra mensaje de éxito
     */
    mostrarMensajeExito(config) {
        const estadisticas = this.generarEstadisticasReporte(config);
        
        const mensaje = `✅ Reporte exportado exitosamente

📋 Detalles:
• Formato: ${config.formato.toUpperCase()}
• Resolución: ${config.resolucion} DPI
• Calidad: ${config.calidad}%
• Tamaño estimado: ${estadisticas.tamaño}

📊 Contenido incluido:
• ${estadisticas.elementos.tieneImagen ? '✅' : '❌'} Imagen del mapa
• ${estadisticas.elementos.tieneLogo ? '✅' : '❌'} Logo de empresa
• ${estadisticas.elementos.tieneEstadisticas ? '✅' : '❌'} Estadísticas del análisis
• ${estadisticas.elementos.tieneMetadatos ? '✅' : '❌'} Metadatos técnicos

El archivo se ha descargado automáticamente.`;

        console.log(mensaje);
        
        // Mostrar notificación discreta
        this.mostrarNotificacion('Reporte exportado exitosamente', 'success');
    }

    /**
     * Muestra mensaje de error
     */
    mostrarMensajeError(error, config) {
        const mensaje = `❌ Error exportando reporte: ${error.message}`;
        console.error(mensaje);
        
        // Mostrar notificación de error
        this.mostrarNotificacion(`Error: ${error.message}`, 'error');
    }

    /**
     * Muestra notificación temporal
     */
    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            tipo === 'success' ? 'bg-green-500 text-white' :
            tipo === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notificacion.textContent = mensaje;
        
        // Agregar al DOM
        document.body.appendChild(notificacion);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            notificacion.style.opacity = '0';
            notificacion.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Genera estadísticas del reporte
     */
    generarEstadisticasReporte(config) {
        const stats = config.estadisticas || {};
        
        return {
            generadoEn: new Date().toISOString(),
            formato: config.formato,
            resolucion: config.resolucion || 300,
            calidad: config.calidad || 85,
            tamaño: this.calcularTamañoEstimado(config),
            elementos: {
                tieneImagen: !!config.imagenMapa,
                tieneLogo: !!config.logoEmpresa,
                tieneEstadisticas: Object.keys(stats).length > 0,
                tieneMetadatos: config.opciones?.metadatos || false
            },
            configuracion: {
                coordenadas: config.opciones?.coordenadas || false,
                escala: config.opciones?.escala || false,
                marcaAgua: config.opciones?.marcaAgua || false
            }
        };
    }

    /**
     * Calcula tamaño estimado del archivo
     */
    calcularTamañoEstimado(config) {
        const dimensiones = { ancho: 2480, alto: 3508 }; // A4 a 300 DPI por defecto
        const pixeles = dimensiones.ancho * dimensiones.alto;
        
        const factores = {
            png: 4,
            jpg: 0.3,
            jpeg: 0.3,
            pdf: 1,
            svg: 0.1
        };

        const factor = factores[config.formato.toLowerCase()] || 1;
        const tamañoBytes = pixeles * factor * ((config.calidad || 85) / 100);
        
        return this.formatearTamaño(tamañoBytes);
    }

    /**
     * Formatea tamaño en bytes
     */
    formatearTamaño(bytes) {
        const unidades = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        
        while (bytes >= 1024 && i < unidades.length - 1) {
            bytes /= 1024;
            i++;
        }
        
        return `${bytes.toFixed(1)} ${unidades[i]}`;
    }

    /**
     * Formatea fecha
     */
    formatearFecha(fecha) {
        if (!fecha) return new Date().toLocaleDateString('es-ES');
        return new Date(fecha).toLocaleDateString('es-ES');
    }

    /**
     * Formatea fecha y hora
     */
    formatearFechaHora(fecha) {
        return fecha.toLocaleDateString('es-ES') + ' ' + fecha.toLocaleTimeString('es-ES');
    }

    /**
     * Obtiene capacidades del sistema
     */
    obtenerCapacidades() {
        return {
            bibliotecas: this.bibliotecasExternas,
            formatos: ['pdf', 'png', 'jpg', 'svg'],
            navegador: {
                userAgent: navigator.userAgent,
                idioma: navigator.language,
                plataforma: navigator.platform
            },
            pantalla: {
                ancho: screen.width,
                alto: screen.height,
                densidad: window.devicePixelRatio
            }
        };
    }

    /**
     * Valida compatibilidad del navegador
     */
    validarCompatibilidad() {
        const errores = [];
        const advertencias = [];

        // Verificar Canvas API
        if (!document.createElement('canvas').getContext) {
            errores.push('Canvas API no soportado');
        }

        // Verificar Blob API
        if (!window.Blob) {
            errores.push('Blob API no soportado');
        }

        // Verificar URL API
        if (!window.URL || !window.URL.createObjectURL) {
            errores.push('URL API no soportado');
        }

        // Advertencias para funcionalidades opcionales
        if (!this.bibliotecasExternas.html2canvas) {
            advertencias.push('html2canvas no disponible - funcionalidad limitada');
        }

        if (!this.bibliotecasExternas.jsPDF) {
            advertencias.push('jsPDF no disponible - exportación PDF limitada');
        }

        return {
            compatible: errores.length === 0,
            errores,
            advertencias
        };
    }

    /**
     * Optimiza configuración según las capacidades
     */
    optimizarConfiguracion(config) {
        const configOptimizada = { ...config };
        const capacidades = this.validarCompatibilidad();

        // Ajustar resolución según la pantalla
        if (window.devicePixelRatio && window.devicePixelRatio > 1) {
            if (!configOptimizada.resolucion || configOptimizada.resolucion < 200) {
                configOptimizada.resolucion = 300;
            }
        }

        // Ajustar calidad para archivos grandes
        if (configOptimizada.resolucion > 300 && configOptimizada.calidad > 90) {
            configOptimizada.calidad = 85;
            console.log('⚡ Calidad ajustada para optimizar rendimiento');
        }

        // Fallback de formato si no hay soporte
        if (configOptimizada.formato === 'pdf' && !this.bibliotecasExternas.jsPDF) {
            configOptimizada.formato = 'png';
            console.log('⚠️ Formato cambiado a PNG (PDF no disponible)');
        }

        return configOptimizada;
    }

    /**
     * Limpia recursos temporales
     */
    limpiarRecursos() {
        // Limpiar URLs temporales que puedan quedar
        if (this.urlsTemporales) {
            this.urlsTemporales.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {
                    // Ignorar errores de limpieza
                }
            });
            this.urlsTemporales = [];
        }

        console.log('🧹 Recursos temporales limpiados');
    }

    /**
     * Método para debugging
     */
    debug() {
        return {
            version: '2.0.0',
            estado: 'activo',
            capacidades: this.obtenerCapacidades(),
            compatibilidad: this.validarCompatibilidad(),
            bibliotecas: this.bibliotecasExternas,
            layoutGenerator: !!this.layoutGenerator
        };
    }

    /**
     * Exporta múltiples formatos simultáneamente
     */
    async exportarMultiple(configuracion, formatos = ['pdf', 'png']) {
        const resultados = [];
        const errores = [];

        for (const formato of formatos) {
            try {
                const configFormato = { ...configuracion, formato };
                await this.exportarReporte(configFormato);
                resultados.push({ formato, estado: 'exitoso' });
                
                // Pequeña pausa entre exportaciones
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                errores.push({ formato, error: error.message });
                console.error(`❌ Error exportando ${formato}:`, error);
            }
        }

        const resumen = {
            total: formatos.length,
            exitosos: resultados.length,
            fallidos: errores.length,
            resultados,
            errores
        };

        console.log('📊 Resumen de exportación múltiple:', resumen);
        return resumen;
    }

    /**
     * Genera vista previa rápida
     */
    async generarVistaPreviaRapida(configuracion) {
        try {
            if (!this.layoutGenerator) {
                if (typeof window.LayoutGenerator === 'undefined') {
                    throw new Error('LayoutGenerator no disponible');
                }
                this.layoutGenerator = new window.LayoutGenerator();
            }

            return await this.layoutGenerator.generarVistaPrevia(configuracion);
        } catch (error) {
            console.error('❌ Error generando vista previa:', error);
            throw error;
        }
    }

    /**
     * Destructor de la clase
     */
    destruir() {
        this.limpiarRecursos();
        this.layoutGenerator = null;
        this.bibliotecasExternas = { jsPDF: false, html2canvas: false };
        console.log('🗑️ ReportBuilder destruido');
    }
}

// Exponer clase globalmente
window.ReportBuilder = ReportBuilder;

// Inicialización automática si no existe
if (!window.reportBuilderInstance) {
    window.reportBuilderInstance = new ReportBuilder();
}

console.log('📄 ReportBuilder v2.0.0 cargado completamente - Todas las funcionalidades disponibles');

// Exportar para módulos ES6 si están disponibles
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportBuilder;
}