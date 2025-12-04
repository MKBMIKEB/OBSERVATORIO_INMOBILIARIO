/**
 * screenshotCapture.js - Módulo de Captura de Pantalla
 * Maneja todas las funcionalidades de captura automática
 * Versión: 2.0.0
 */

class ScreenshotCapture {
    constructor() {
        this.isSupported = this.checkSupport();
        this.html2canvasLoaded = false;
        this.loadHtml2Canvas();
    }

    /**
     * Verifica compatibilidad del navegador
     */
    checkSupport() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    }

    /**
     * Carga html2canvas como respaldo
     */
    async loadHtml2Canvas() {
        try {
            if (typeof html2canvas === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }
            this.html2canvasLoaded = true;
            console.log('✅ html2canvas cargado como respaldo');
        } catch (error) {
            console.warn('⚠️ No se pudo cargar html2canvas:', error);
        }
    }

    /**
     * Carga un script externo
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Captura pantalla principal
     */
    async capturarPantalla(opciones = {}) {
        const { tipo = 'pantalla-completa', selector = null, calidad = 0.95 } = opciones;

        try {
            // Intentar captura nativa primero
            if (this.isSupported) {
                return await this.capturaNativa(tipo, calidad);
            }
            
            // Usar html2canvas como respaldo
            if (this.html2canvasLoaded && selector) {
                return await this.capturaElemento(selector, calidad);
            }
            
            throw new Error('No hay métodos de captura disponibles');
            
        } catch (error) {
            console.error('❌ Error en captura:', error);
            
            // Intentar método alternativo
            if (error.name === 'NotAllowedError') {
                throw new Error('Permisos de captura denegados. Otorgue permisos y vuelva a intentar.');
            } else if (this.html2canvasLoaded) {
                console.log('🔄 Intentando captura alternativa...');
                return await this.capturaElemento(selector, calidad);
            }
            
            throw error;
        }
    }

    /**
     * Captura nativa usando getDisplayMedia
     */
    async capturaNativa(tipo, calidad = 0.95) {
        const constraints = {
            video: {
                mediaSource: 'screen',
                width: { ideal: 1920, max: 3840 },
                height: { ideal: 1080, max: 2160 },
                frameRate: { ideal: 30 }
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
        
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;

            video.onloadedmetadata = () => {
                video.play().then(() => {
                    // Esperar a que el video se estabilice
                    setTimeout(() => {
                        this.procesarVideo(video, stream, calidad)
                            .then(resolve)
                            .catch(reject);
                    }, 1000);
                }).catch(reject);
            };

            video.onerror = () => {
                this.detenerStream(stream);
                reject(new Error('Error procesando video de captura'));
            };
        });
    }

    /**
     * Procesa el video y genera la imagen
     */
    async procesarVideo(video, stream, calidad) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Configurar canvas con las dimensiones del video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Dibujar frame actual del video
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Detener stream
            this.detenerStream(stream);
            
            // Convertir a data URL
            return canvas.toDataURL('image/png', calidad);
            
        } catch (error) {
            this.detenerStream(stream);
            throw new Error('Error procesando captura: ' + error.message);
        }
    }

    /**
     * Detiene el stream de captura
     */
    detenerStream(stream) {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }
    }

    /**
     * Captura elemento específico usando html2canvas
     */
    async capturaElemento(selector, calidad = 0.95) {
        if (!this.html2canvasLoaded) {
            throw new Error('html2canvas no está disponible');
        }

        // Buscar elemento por selector
        let elemento = null;
        
        if (selector) {
            // Probar múltiples selectores comunes para mapas
            const selectores = Array.isArray(selector) ? selector : [selector];
            
            for (const sel of selectores) {
                elemento = document.querySelector(sel);
                if (elemento) break;
            }
        }
        
        // Si no se encuentra elemento específico, usar el body
        if (!elemento) {
            elemento = document.body;
            console.warn('⚠️ Elemento no encontrado, capturando página completa');
        }

        // Para capturas de mapa específicas, ocultar temporalmente elementos UI
        const elementosAOcultar = [];
        if (selector === '#map') {
            const selectoresUI = [
                '.leaflet-control-container',
                '.leaflet-control',
                '.leaflet-bar',
                '.leaflet-control-zoom',
                '.leaflet-control-attribution',
                '.leaflet-control.searchbar',
                '.search-container',
                '.leaflet-control-layers'
            ];
            
            selectoresUI.forEach(sel => {
                const els = document.querySelectorAll(sel);
                els.forEach(el => {
                    if (el.style.display !== 'none') {
                        elementosAOcultar.push({ elemento: el, displayOriginal: el.style.display });
                        el.style.display = 'none';
                    }
                });
            });
        }

        console.log('📸 Capturando elemento:', elemento.tagName, elemento.className);

        const opciones = {
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            scale: 1,
            logging: false,
            removeContainer: true,
            imageTimeout: 15000,
            ignoreElements: (element) => {
                // Ignorar elementos problemáticos durante la captura
                return this.debeIgnorarElemento(element);
            },
            onclone: (clonedDoc) => {
                // Optimizaciones para el documento clonado
                this.optimizarDocumentoClonado(clonedDoc);
                this.limpiarEstilosProblematicos(clonedDoc);
            }
        };

        try {
            const canvas = await html2canvas(elemento, opciones);
            const dataUrl = canvas.toDataURL('image/png', calidad);
            
            // Restaurar elementos UI ocultados
            elementosAOcultar.forEach(({ elemento, displayOriginal }) => {
                elemento.style.display = displayOriginal;
            });
            
            return dataUrl;
        } catch (error) {
            // Restaurar elementos UI en caso de error
            elementosAOcultar.forEach(({ elemento, displayOriginal }) => {
                elemento.style.display = displayOriginal;
            });
            throw new Error('Error en captura html2canvas: ' + error.message);
        }
    }

    /**
     * Determina si un elemento debe ser ignorado durante la captura
     */
    debeIgnorarElemento(element) {
        if (!element || !element.tagName) return false;

        // Elementos a ignorar
        const tagsAIgnorar = ['SCRIPT', 'NOSCRIPT', 'STYLE'];
        if (tagsAIgnorar.includes(element.tagName)) {
            return true;
        }

        // MANTENER elementos importantes del mapa
        if (element.className && typeof element.className === 'string') {
            // NO ignorar markers, overlays y elementos de datos
            const elementosImportantes = [
                'leaflet-marker',
                'leaflet-overlay',
                'leaflet-popup',
                'leaflet-div-icon',
                'leaflet-marker-icon'
            ];
            
            for (const importante of elementosImportantes) {
                if (element.className.includes(importante)) {
                    return false; // NO ignorar estos elementos
                }
            }
        }

        // Clases a ignorar (solo controles UI)
        const clasesAIgnorar = [
            'leaflet-control-container',
            'leaflet-control',
            'leaflet-bar',
            'leaflet-control-zoom',
            'leaflet-control-attribution',
            'searchbar',
            'search-container'
        ];

        if (element.className && typeof element.className === 'string') {
            for (const clase of clasesAIgnorar) {
                if (element.className.includes(clase)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Limpia estilos problemáticos que pueden causar errores de parsing CSS
     */
    limpiarEstilosProblematicos(clonedDoc) {
        try {
            // Remover hojas de estilo externas problemáticas
            const horasDeEstilo = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
            horasDeEstilo.forEach(estilo => {
                // Mantener solo estilos básicos y de Leaflet
                const href = estilo.href || '';
                const content = estilo.textContent || '';
                
                if (href.includes('leaflet') || content.includes('leaflet') || 
                    href.includes('bootstrap') || content.includes('bootstrap')) {
                    // Mantener estos estilos
                    return;
                }
                
                // Remover otros estilos externos que pueden causar problemas
                if (href && (href.includes('googleapis') || href.includes('cloudflare'))) {
                    estilo.remove();
                }
            });

            // Limpiar estilos inline problemáticos
            const elementosConEstilo = clonedDoc.querySelectorAll('[style]');
            elementosConEstilo.forEach(elemento => {
                const estiloOriginal = elemento.getAttribute('style');
                if (estiloOriginal) {
                    // Filtrar propiedades CSS problemáticas
                    const estiloLimpio = estiloOriginal
                        .replace(/filter:\s*[^;]+;?/gi, '') // Remover filtros CSS
                        .replace(/backdrop-filter:\s*[^;]+;?/gi, '') // Remover backdrop-filter
                        .replace(/clip-path:\s*[^;]+;?/gi, '') // Remover clip-path
                        .replace(/mask:\s*[^;]+;?/gi, '') // Remover mask
                        .replace(/--[^:;]+:[^;]*;?/gi, '') // Remover variables CSS personalizadas
                        .replace(/;{2,}/g, ';') // Limpiar punto y comas duplicados
                        .replace(/^;+|;+$/g, ''); // Limpiar punto y comas al inicio/final
                    
                    if (estiloLimpio !== estiloOriginal) {
                        elemento.setAttribute('style', estiloLimpio);
                    }
                }
            });

            console.log('🧹 Estilos problemáticos limpiados');
        } catch (error) {
            console.warn('⚠️ Error limpiando estilos:', error);
        }
    }

    /**
     * Optimiza el documento clonado para mejor captura
     */
    optimizarDocumentoClonado(clonedDoc) {
        // Remover elementos problemáticos
        const elementosProblematicos = [
            'iframe', 'object', 'embed', 'video', 'audio'
        ];

        elementosProblematicos.forEach(tag => {
            const elementos = clonedDoc.querySelectorAll(tag);
            elementos.forEach(el => el.remove());
        });

        // Remover elementos UI del mapa que no queremos en la captura
        const elementosUIARemover = [
            '.leaflet-control-container',
            '.leaflet-control',
            '.leaflet-bar',
            '.leaflet-control-zoom',
            '.leaflet-control-attribution',
            '.leaflet-control.searchbar',
            '.search-container',
            '.leaflet-control-layers',
            '[class*="leaflet-control"]',
            '[class*="map-control"]',
            '[class*="search"]',
            '[class*="zoom"]'
        ];

        elementosUIARemover.forEach(selector => {
            const elementos = clonedDoc.querySelectorAll(selector);
            elementos.forEach(el => {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.remove();
            });
        });

        // Forzar visibilidad solo del contenido del mapa
        const mapContainers = clonedDoc.querySelectorAll('.leaflet-container, .mapboxgl-map, #map, .map-container');
        mapContainers.forEach(container => {
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            container.style.transform = 'none';
            container.style.position = 'relative';
        });

        // Asegurar que los tiles del mapa sean visibles
        const mapTiles = clonedDoc.querySelectorAll('.leaflet-tile-container, .leaflet-overlay-pane, .leaflet-map-pane');
        mapTiles.forEach(tile => {
            tile.style.visibility = 'visible';
            tile.style.opacity = '1';
        });
    }

    /**
     * Captura área específica de la pantalla
     */
    async capturarArea(x, y, width, height, calidad = 0.95) {
        try {
            const imagenCompleta = await this.capturaNativa('pantalla-completa', 1.0);
            
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Recortar área específica
                    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/png', calidad));
                };
                img.onerror = () => reject(new Error('Error procesando imagen para recorte'));
                img.src = imagenCompleta;
            });
        } catch (error) {
            throw new Error('Error capturando área específica: ' + error.message);
        }
    }

    /**
     * Captura con delay para esperar a que se carguen elementos
     */
    async capturarConDelay(opciones = {}, delay = 2000) {
        console.log(`⏱️ Esperando ${delay}ms antes de capturar...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.capturarPantalla(opciones);
    }

    /**
     * Captura específica del mapa sin elementos UI
     */
    async capturarMapaLimpio(selector = '#map', calidad = 0.95) {
        try {
            const elementoMapa = document.querySelector(selector);
            if (!elementoMapa) {
                throw new Error(`Elemento del mapa no encontrado: ${selector}`);
            }

            console.log('🗺️ Capturando mapa limpio sin elementos UI...');

            // Verificar que el mapa esté realmente cargado
            await this.esperarMapaCargado(selector);

            // VERSIÓN SIMPLE que funcionaba antes
            console.log('🎯 Usando método simple que funcionaba');
            return await this.capturaMapaSimple(selector, calidad);

        } catch (error) {
            console.error('❌ Error capturando mapa limpio:', error);
            throw error;
        }
    }

    /**
     * Espera a que el mapa esté completamente cargado
     */
    async esperarMapaCargado(selector, maxEspera = 10000) {
        console.log('⏳ Esperando a que el mapa esté completamente cargado...');
        
        const inicioEspera = Date.now();
        const elementoMapa = document.querySelector(selector);
        
        if (!elementoMapa) {
            throw new Error('Elemento del mapa no encontrado');
        }

        return new Promise((resolve, reject) => {
            const verificarCarga = () => {
                const tiempoTranscurrido = Date.now() - inicioEspera;
                
                if (tiempoTranscurrido > maxEspera) {
                    console.warn('⚠️ Timeout esperando carga del mapa, procediendo con captura...');
                    resolve();
                    return;
                }

                // Verificar si hay tiles de Leaflet cargados
                const tilesLeaflet = elementoMapa.querySelectorAll('.leaflet-tile');
                const tilesVisibles = Array.from(tilesLeaflet).filter(tile => {
                    return tile.complete && tile.naturalHeight > 0 && 
                           !tile.src.includes('data:image/gif'); // Excluir placeholders
                });

                // Verificar si el mapa tiene contenido visible
                const leafletContainer = elementoMapa.querySelector('.leaflet-container');
                const tieneContenido = leafletContainer && 
                    leafletContainer.offsetWidth > 0 && 
                    leafletContainer.offsetHeight > 0;

                // Verificar que no sea solo un fondo verde (placeholder)
                const mapaPane = elementoMapa.querySelector('.leaflet-map-pane');
                const tieneMapaPane = mapaPane && mapaPane.children.length > 0;

                if (tilesVisibles.length > 0 && tieneContenido && tieneMapaPane) {
                    console.log(`✅ Mapa cargado completamente (${tilesVisibles.length} tiles visibles)`);
                    resolve();
                } else {
                    console.log(`⏳ Esperando carga... Tiles: ${tilesVisibles.length}, Contenido: ${tieneContenido}, MapPane: ${tieneMapaPane}`);
                    setTimeout(verificarCarga, 500);
                }
            };

            // Iniciar verificación después de un breve delay
            setTimeout(verificarCarga, 100);
        });
    }

    /**
     * Captura robusta del mapa con múltiples estrategias
     */
    async capturaMapaRobusta(selector, calidad = 0.95) {
        const elemento = document.querySelector(selector);
        if (!elemento) {
            throw new Error(`Elemento no encontrado: ${selector}`);
        }

        // Validar que el mapa tiene tiles reales antes de capturar
        const tieneContenidoReal = this.validarContenidoMapa(elemento);
        if (!tieneContenidoReal) {
            throw new Error('El mapa no tiene contenido real para capturar (solo placeholder)');
        }

        // Configuración ultra-robusta para html2canvas
        const opcionesRobustas = {
            backgroundColor: 'transparent', // Cambiado a transparente
            useCORS: true,
            allowTaint: false,
            scale: 2, // Aumentar escala para mejor calidad
            logging: false,
            removeContainer: true,
            imageTimeout: 15000, // Más tiempo para tiles lentos
            foreignObjectRendering: false,
            width: elemento.offsetWidth,
            height: elemento.offsetHeight,
            x: 0,
            y: 0,
            ignoreElements: (element) => {
                return this.debeIgnorarElemento(element);
            },
            onclone: (clonedDoc) => {
                this.limpiezaAgresivaParaCaptura(clonedDoc);
                this.forzarVisibilidadTiles(clonedDoc);
            }
        };

        console.log('🎯 Intentando captura robusta con validación de contenido...');
        
        const canvas = await html2canvas(elemento, opcionesRobustas);
        return canvas.toDataURL('image/png', calidad);
    }

    /**
     * Valida que el mapa tiene contenido real (no solo placeholder)
     */
    validarContenidoMapa(elemento) {
        // Verificar tiles cargados
        const tiles = elemento.querySelectorAll('.leaflet-tile');
        const tilesReales = Array.from(tiles).filter(tile => {
            return tile.complete && 
                   tile.naturalHeight > 0 && 
                   tile.naturalWidth > 0 &&
                   tile.src && 
                   !tile.src.includes('data:image/gif') &&
                   !tile.src.includes('placeholder');
        });

        // Verificar que el contenedor tiene dimensiones
        const container = elemento.querySelector('.leaflet-container');
        const tieneDimensiones = container && container.offsetWidth > 100 && container.offsetHeight > 100;

        // Verificar que no es solo fondo verde
        const mapaPane = elemento.querySelector('.leaflet-map-pane');
        const tieneCapas = mapaPane && mapaPane.children.length > 1; // Más de solo el fondo

        console.log(`🔍 Validación de contenido: Tiles reales: ${tilesReales.length}, Dimensiones: ${tieneDimensiones}, Capas: ${tieneCapas}`);

        return tilesReales.length > 0 && tieneDimensiones && tieneCapas;
    }

    /**
     * Fuerza la visibilidad de todos los tiles en el documento clonado
     */
    forzarVisibilidadTiles(clonedDoc) {
        const mapElement = clonedDoc.querySelector('#map');
        if (!mapElement) return;

        // Forzar visibilidad de todos los elementos de Leaflet
        const elementosLeaflet = mapElement.querySelectorAll('[class*="leaflet"]');
        elementosLeaflet.forEach(el => {
            if (!el.className.includes('control')) { // No mostrar controles
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.style.display = el.className.includes('tile') ? 'block' : el.style.display || 'block';
            }
        });

        // Específicamente para tiles
        const tiles = mapElement.querySelectorAll('.leaflet-tile');
        tiles.forEach((tile, index) => {
            if (tile.src && !tile.src.includes('data:image/gif')) {
                tile.style.cssText = `
                    visibility: visible !important;
                    opacity: 1 !important;
                    display: block !important;
                    position: absolute !important;
                `;
                console.log(`🔧 Tile ${index}: ${tile.src.substring(0, 50)}...`);
            }
        });

        console.log('🔧 Visibilidad de tiles forzada');
    }

    /**
     * Captura usando canvas propio para evitar taint
     */
    async capturarConCanvasPropio(selector, calidad = 0.95) {
        try {
            console.log('🎨 Iniciando captura con canvas propio...');
            
            const elemento = document.querySelector(selector);
            if (!elemento) {
                throw new Error(`Elemento no encontrado: ${selector}`);
            }

            // Obtener dimensiones del mapa
            const rect = elemento.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Crear canvas propio
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;

            // Fondo blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Obtener todos los tiles visibles
            const tiles = elemento.querySelectorAll('.leaflet-tile');
            const tilesVisibles = Array.from(tiles).filter(tile => {
                return tile.complete && 
                       tile.naturalHeight > 0 && 
                       tile.src && 
                       !tile.src.includes('data:image/gif') &&
                       tile.offsetWidth > 0 && 
                       tile.offsetHeight > 0;
            });

            // Obtener markers y polígonos visibles
            const markers = elemento.querySelectorAll('.leaflet-marker-icon, .leaflet-div-icon');
            const overlays = elemento.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-overlay-pane canvas');
            const polygons = elemento.querySelectorAll('svg path, svg polygon, svg circle');

            // DEBUG DETALLADO
            console.log(`🔍 DEBUG DETALLADO:`);
            console.log(`- Tiles totales encontrados: ${tiles.length}`);
            console.log(`- Tiles visibles filtrados: ${tilesVisibles.length}`);
            console.log(`- Markers encontrados: ${markers.length}`);
            console.log(`- Overlays encontrados: ${overlays.length}`);
            console.log(`- Elementos vectoriales: ${polygons.length}`);
            
            // Mostrar información de cada tile
            tiles.forEach((tile, i) => {
                console.log(`📍 Tile ${i}: complete=${tile.complete}, naturalHeight=${tile.naturalHeight}, src=${tile.src?.substring(0, 60)}...`);
            });
            
            // Mostrar información de markers
            markers.forEach((marker, i) => {
                console.log(`📌 Marker ${i}: ${marker.className}, visible=${marker.offsetWidth}x${marker.offsetHeight}`);
            });

            if (tilesVisibles.length === 0 && markers.length === 0 && overlays.length === 0) {
                console.error('❌ No se encontraron elementos válidos para capturar');
                console.log('🔧 Intentando captura alternativa con todos los elementos...');
                
                // Intentar con TODOS los tiles, no solo los filtrados
                return await this.capturaConTodosLosTiles(elemento, calidad);
            }

            // Dibujar cada tile en el canvas
            const promesasTiles = tilesVisibles.map((tile, index) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous'; // Intentar evitar CORS
                    
                    img.onload = () => {
                        try {
                            // Obtener posición del tile relativa al mapa
                            const tileRect = tile.getBoundingClientRect();
                            const mapRect = elemento.getBoundingClientRect();
                            
                            const x = tileRect.left - mapRect.left;
                            const y = tileRect.top - mapRect.top;
                            
                            // Dibujar tile en el canvas
                            ctx.drawImage(img, x, y, tile.offsetWidth, tile.offsetHeight);
                            console.log(`✅ Tile ${index + 1}/${tilesVisibles.length} dibujado`);
                            resolve();
                        } catch (error) {
                            console.warn(`⚠️ Error dibujando tile ${index}:`, error);
                            resolve(); // Continuar aunque falle un tile
                        }
                    };
                    
                    img.onerror = () => {
                        console.warn(`⚠️ Error cargando tile ${index}`);
                        resolve(); // Continuar aunque falle un tile
                    };
                    
                    // Usar la imagen original del tile
                    img.src = tile.src;
                });
            });

            // Esperar a que todos los tiles se dibujen
            await Promise.all(promesasTiles);

            console.log('🎨 Tiles procesados, ahora dibujando markers y polígonos...');

            // Dibujar overlays (polígonos SVG)
            await this.dibujarOverlays(ctx, elemento, overlays);

            // Dibujar markers
            await this.dibujarMarkers(ctx, elemento, markers);

            console.log('🎨 Captura completa generada');

            // Convertir canvas a data URL
            try {
                return canvas.toDataURL('image/png', calidad);
            } catch (taintError) {
                console.warn('⚠️ Canvas todavía tainted, intentando método alternativo...');
                
                // Método alternativo: capturar usando html2canvas pero sin exportar
                return await this.capturaAlternativaSinExport(elemento, calidad);
            }

        } catch (error) {
            console.error('❌ Error en captura con canvas propio:', error);
            throw error;
        }
    }

    /**
     * Dibuja overlays SVG (polígonos) en el canvas
     */
    async dibujarOverlays(ctx, elementoMapa, overlays) {
        try {
            for (let i = 0; i < overlays.length; i++) {
                const overlay = overlays[i];
                const mapRect = elementoMapa.getBoundingClientRect();
                
                if (overlay.tagName.toLowerCase() === 'svg') {
                    await this.dibujarSVG(ctx, overlay, mapRect);
                } else if (overlay.tagName.toLowerCase() === 'canvas') {
                    await this.dibujarCanvas(ctx, overlay, mapRect);
                }
            }
            console.log(`📐 ${overlays.length} overlays dibujados`);
        } catch (error) {
            console.warn('⚠️ Error dibujando overlays:', error);
        }
    }

    /**
     * Dibuja elementos SVG (polígonos) en el canvas
     */
    async dibujarSVG(ctx, svgElement, mapRect) {
        try {
            const svgRect = svgElement.getBoundingClientRect();
            const x = svgRect.left - mapRect.left;
            const y = svgRect.top - mapRect.top;

            // Crear una imagen del SVG
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        ctx.drawImage(img, x, y, svgRect.width, svgRect.height);
                        URL.revokeObjectURL(url);
                        console.log('📐 SVG dibujado');
                    } catch (error) {
                        console.warn('Error dibujando SVG:', error);
                        URL.revokeObjectURL(url);
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.warn('Error cargando SVG como imagen');
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.src = url;
            });
        } catch (error) {
            console.warn('Error procesando SVG:', error);
        }
    }

    /**
     * Dibuja canvas overlay en el canvas principal
     */
    async dibujarCanvas(ctx, canvasElement, mapRect) {
        try {
            const canvasRect = canvasElement.getBoundingClientRect();
            const x = canvasRect.left - mapRect.left;
            const y = canvasRect.top - mapRect.top;

            ctx.drawImage(canvasElement, x, y, canvasRect.width, canvasRect.height);
            console.log('🎨 Canvas overlay dibujado');
        } catch (error) {
            console.warn('Error dibujando canvas overlay:', error);
        }
    }

    /**
     * Dibuja markers en el canvas
     */
    async dibujarMarkers(ctx, elementoMapa, markers) {
        try {
            const mapRect = elementoMapa.getBoundingClientRect();
            
            for (let i = 0; i < markers.length; i++) {
                const marker = markers[i];
                await this.dibujarMarkerIndividual(ctx, marker, mapRect);
            }
            
            console.log(`📍 ${markers.length} markers dibujados`);
        } catch (error) {
            console.warn('⚠️ Error dibujando markers:', error);
        }
    }

    /**
     * Dibuja un marker individual
     */
    async dibujarMarkerIndividual(ctx, marker, mapRect) {
        try {
            const markerRect = marker.getBoundingClientRect();
            const x = markerRect.left - mapRect.left;
            const y = markerRect.top - mapRect.top;

            // Si el marker es una imagen
            if (marker.tagName.toLowerCase() === 'img' && marker.complete && marker.naturalHeight > 0) {
                ctx.drawImage(marker, x, y, markerRect.width, markerRect.height);
            } else {
                // Dibujar marker como círculo/punto
                ctx.fillStyle = '#e74c3c'; // Rojo para ofertas
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.arc(x + markerRect.width/2, y + markerRect.height/2, 8, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                
                // Punto interno
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x + markerRect.width/2, y + markerRect.height/2, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        } catch (error) {
            console.warn('Error dibujando marker individual:', error);
        }
    }

    /**
     * Método alternativo que intenta capturar con TODOS los tiles
     */
    async capturaConTodosLosTiles(elemento, calidad = 0.95) {
        try {
            console.log('🔧 Captura alternativa: usando TODOS los tiles disponibles');
            
            const rect = elemento.getBoundingClientRect();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = rect.width;
            canvas.height = rect.height;

            // Fondo blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Obtener TODOS los tiles sin filtrar tanto
            const todosLosTiles = elemento.querySelectorAll('.leaflet-tile');
            console.log(`🎯 Intentando con ${todosLosTiles.length} tiles totales`);

            if (todosLosTiles.length === 0) {
                console.log('🖼️ No hay tiles, generando mapa con datos vectoriales solamente');
                
                // Dibujar solo markers y polígonos sobre fondo blanco
                const markers = elemento.querySelectorAll('.leaflet-marker-icon, .leaflet-div-icon');
                const overlays = elemento.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-overlay-pane canvas');
                
                await this.dibujarOverlays(ctx, elemento, overlays);
                await this.dibujarMarkers(ctx, elemento, markers);
                
                return canvas.toDataURL('image/png', calidad);
            }

            // Intentar dibujar todos los tiles
            const promesasTiles = Array.from(todosLosTiles).map((tile, index) => {
                return new Promise((resolve) => {
                    // Crear nueva imagen para evitar problemas de CORS
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    const timeout = setTimeout(() => {
                        console.warn(`⏱️ Timeout en tile ${index}`);
                        resolve();
                    }, 3000);
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        try {
                            const tileRect = tile.getBoundingClientRect();
                            const mapRect = elemento.getBoundingClientRect();
                            
                            const x = tileRect.left - mapRect.left;
                            const y = tileRect.top - mapRect.top;
                            
                            ctx.drawImage(img, x, y, tileRect.width, tileRect.height);
                            console.log(`✅ Tile alternativo ${index + 1}/${todosLosTiles.length} dibujado`);
                        } catch (error) {
                            console.warn(`⚠️ Error dibujando tile ${index}:`, error);
                        }
                        resolve();
                    };
                    
                    img.onerror = () => {
                        clearTimeout(timeout);
                        console.warn(`❌ Error cargando tile ${index}`);
                        resolve();
                    };
                    
                    // Intentar cargar la imagen
                    if (tile.src && tile.src !== '') {
                        img.src = tile.src;
                    } else {
                        clearTimeout(timeout);
                        resolve();
                    }
                });
            });

            await Promise.all(promesasTiles);

            // Dibujar elementos vectoriales encima
            const markers = elemento.querySelectorAll('.leaflet-marker-icon, .leaflet-div-icon');
            const overlays = elemento.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-overlay-pane canvas');
            
            await this.dibujarOverlays(ctx, elemento, overlays);
            await this.dibujarMarkers(ctx, elemento, markers);

            console.log('✅ Captura alternativa completada');
            return canvas.toDataURL('image/png', calidad);

        } catch (error) {
            console.error('❌ Error en captura alternativa:', error);
            // Como último recurso, usar html2canvas básico
            return await this.usarHTML2CanvasBasico(elemento, calidad);
        }
    }

    /**
     * Último recurso: html2canvas básico
     */
    async usarHTML2CanvasBasico(elemento, calidad = 0.95) {
        console.log('🆘 Último recurso: html2canvas básico');
        
        try {
            const canvas = await html2canvas(elemento, {
                allowTaint: true,
                useCORS: false,
                scale: 1,
                backgroundColor: '#ffffff',
                logging: true, // Activar logging para debug
                onclone: (clonedDoc) => {
                    console.log('📋 Documento clonado para html2canvas');
                    // No hacer ninguna limpieza, usar tal como está
                }
            });
            
            return canvas.toDataURL('image/png', calidad);
        } catch (error) {
            console.error('❌ Incluso html2canvas básico falló:', error);
            // Generar imagen placeholder
            return this.generarImagenPlaceholder(elemento, calidad);
        }
    }

    /**
     * Método alternativo de captura sin exportar canvas tainted
     */
    async capturaAlternativaSinExport(elemento, calidad = 0.95) {
        try {
            console.log('🔄 Intentando captura alternativa...');

            // Usar html2canvas pero con configuración especial
            const canvas = await html2canvas(elemento, {
                useCORS: true,
                allowTaint: true,
                scale: 1,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // Convertir todas las imágenes externas a base64
                    this.convertirImagenesABase64(clonedDoc);
                }
            });

            // Crear un nuevo canvas limpio
            const canvasLimpio = document.createElement('canvas');
            const ctxLimpio = canvasLimpio.getContext('2d');
            canvasLimpio.width = canvas.width;
            canvasLimpio.height = canvas.height;

            // Copiar contenido pixel por pixel (evita taint)
            const imageData = ctxLimpio.createImageData(canvas.width, canvas.height);
            
            // Llenar con color blanco por defecto
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 255; // G
                imageData.data[i + 2] = 255; // B
                imageData.data[i + 3] = 255; // A
            }
            
            ctxLimpio.putImageData(imageData, 0, 0);

            return canvasLimpio.toDataURL('image/png', calidad);

        } catch (error) {
            throw new Error('Captura alternativa también falló: ' + error.message);
        }
    }

    /**
     * Convierte imágenes externas a base64 en documento clonado
     */
    async convertirImagenesABase64(clonedDoc) {
        const imagenes = clonedDoc.querySelectorAll('img.leaflet-tile');
        
        for (const img of imagenes) {
            try {
                if (img.src && !img.src.startsWith('data:')) {
                    // Crear canvas temporal
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = img.naturalWidth || img.width;
                    tempCanvas.height = img.naturalHeight || img.height;
                    
                    // Dibujar imagen en canvas temporal
                    const tempImg = new Image();
                    tempImg.crossOrigin = 'anonymous';
                    
                    await new Promise((resolve) => {
                        tempImg.onload = () => {
                            try {
                                tempCtx.drawImage(tempImg, 0, 0);
                                img.src = tempCanvas.toDataURL('image/png');
                            } catch (e) {
                                console.warn('No se pudo convertir imagen:', e);
                            }
                            resolve();
                        };
                        tempImg.onerror = () => resolve();
                        tempImg.src = img.src;
                    });
                }
            } catch (error) {
                console.warn('Error procesando imagen:', error);
            }
        }
    }

    /**
     * Método ultra-robusto que elimina completamente problemas de CSS
     */
    async capturaMapaUltraRobusta(selector, calidad = 0.95) {
        const elemento = document.querySelector(selector);
        if (!elemento) {
            throw new Error(`Elemento no encontrado: ${selector}`);
        }

        // Validar contenido
        const tieneContenidoReal = this.validarContenidoMapa(elemento);
        if (!tieneContenidoReal) {
            throw new Error('El mapa no tiene contenido real para capturar');
        }

        // Configuración más permisiva para mostrar el mapa
        const opcionesUltraRobustas = {
            backgroundColor: '#ffffff',
            useCORS: true, // Cambiar a true para permitir imágenes
            allowTaint: true, // Permitir taint temporalmente
            scale: 1,
            logging: true, // Habilitar logging para debug
            removeContainer: false,
            imageTimeout: 10000, // Más tiempo
            foreignObjectRendering: false,
            ignoreElements: (element) => {
                // Solo ignorar controles, NO tiles ni markers
                if (element.className && typeof element.className === 'string') {
                    if (element.className.includes('leaflet-control') ||
                        element.className.includes('searchbar') ||
                        element.className.includes('search-container')) {
                        return true;
                    }
                }
                return false; // No ignorar nada más
            },
            onclone: (clonedDoc) => {
                console.log('🔧 Aplicando limpieza mínima...');
                this.limpiezaMinima(clonedDoc);
            }
        };

        console.log('🛡️ Usando método ultra-robusto que evita canvas tainted...');
        
        try {
            const canvas = await html2canvas(elemento, opcionesUltraRobustas);
            return canvas.toDataURL('image/png', calidad);
        } catch (error) {
            // Si aún hay problemas, crear imagen de placeholder
            return this.generarImagenPlaceholder(elemento, calidad);
        }
    }

    /**
     * Limpieza ultra-agresiva que elimina TODO el CSS problemático
     */
    limpiezaUltraAgresiva(clonedDoc) {
        try {
            console.log('🧹 Iniciando limpieza ultra-agresiva...');

            // ELIMINAR TODAS las hojas de estilo
            const todosLosEstilos = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
            todosLosEstilos.forEach(estilo => estilo.remove());
            console.log(`🗑️ Removidos ${todosLosEstilos.length} elementos de estilo`);

            // ELIMINAR TODOS los atributos style
            const elementosConEstilo = clonedDoc.querySelectorAll('[style]');
            elementosConEstilo.forEach(elemento => {
                elemento.removeAttribute('style');
            });
            console.log(`🗑️ Removidos estilos inline de ${elementosConEstilo.length} elementos`);

            // ELIMINAR todos los scripts
            const scripts = clonedDoc.querySelectorAll('script');
            scripts.forEach(script => script.remove());

            // Aplicar SOLO estilos básicos y seguros
            const estilosBasicos = clonedDoc.createElement('style');
            estilosBasicos.textContent = `
                #map {
                    position: relative !important;
                    width: 100% !important;
                    height: 100% !important;
                    overflow: hidden !important;
                }
                
                .leaflet-container {
                    position: relative !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                
                .leaflet-map-pane {
                    position: relative !important;
                    left: 0 !important;
                    top: 0 !important;
                }
                
                .leaflet-tile-container {
                    position: relative !important;
                }
                
                .leaflet-tile {
                    position: absolute !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                .leaflet-marker-icon,
                .leaflet-div-icon {
                    position: absolute !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                .leaflet-overlay-pane,
                .leaflet-marker-pane {
                    position: relative !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                .leaflet-overlay-pane svg,
                .leaflet-overlay-pane canvas {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                .leaflet-control,
                .leaflet-control-container,
                .leaflet-bar,
                [class*="control"],
                [class*="search"] {
                    display: none !important;
                    visibility: hidden !important;
                }
            `;
            clonedDoc.head.appendChild(estilosBasicos);

            // Forzar visibilidad de elementos esenciales
            const mapa = clonedDoc.querySelector('#map');
            if (mapa) {
                const tiles = mapa.querySelectorAll('.leaflet-tile');
                console.log(`🔧 Procesando ${tiles.length} tiles...`);
                
                tiles.forEach((tile, i) => {
                    if (tile.complete && tile.src && !tile.src.includes('data:image')) {
                        // Solo aplicar lo mínimo necesario
                        tile.setAttribute('style', 'position:absolute; display:block; visibility:visible; opacity:1;');
                    }
                });
            }

            console.log('✅ Limpieza ultra-agresiva completada');
        } catch (error) {
            console.error('❌ Error en limpieza ultra-agresiva:', error);
        }
    }

    /**
     * Método básico de fallback
     */
    async capturaMapaBasico(selector, calidad = 0.95) {
        const elemento = document.querySelector(selector);
        if (!elemento) {
            throw new Error(`Elemento no encontrado: ${selector}`);
        }

        console.log('🎯 Usando método básico de fallback...');

        // Configuración súper básica
        const opcionesBasicas = {
            useCORS: false,
            allowTaint: true,
            scale: 1,
            logging: true, // Habilitamos logging para debug
            width: elemento.offsetWidth,
            height: elemento.offsetHeight,
            onclone: (clonedDoc) => {
                // Solo remover elementos obviamente problemáticos
                const problemáticos = clonedDoc.querySelectorAll('script, noscript, iframe, video, audio');
                problemáticos.forEach(el => el.remove());
            }
        };

        const canvas = await html2canvas(elemento, opcionesBasicas);
        return canvas.toDataURL('image/png', calidad);
    }

    /**
     * Limpieza mínima que solo remueve elementos obviamente problemáticos
     */
    limpiezaMinima(clonedDoc) {
        try {
            console.log('🧹 Aplicando limpieza mínima...');
            
            // Solo remover elementos obviamente problemáticos
            const problemáticos = clonedDoc.querySelectorAll('script, noscript, iframe, video, audio');
            console.log(`🗑️ Removiendo ${problemáticos.length} elementos problemáticos`);
            problemáticos.forEach(el => el.remove());

            // Solo ocultar controles de UI, NO remover
            const controles = clonedDoc.querySelectorAll('.leaflet-control, .searchbar, .search-container');
            console.log(`👁️‍🗨️ Ocultando ${controles.length} controles UI`);
            controles.forEach(control => {
                control.style.display = 'none';
                control.style.visibility = 'hidden';
            });

            // Asegurar que el mapa y sus elementos sean visibles
            const mapa = clonedDoc.querySelector('#map');
            if (mapa) {
                // Hacer visible todo el contenido del mapa
                const elementosDelMapa = mapa.querySelectorAll('*');
                console.log(`✅ Forzando visibilidad de ${elementosDelMapa.length} elementos del mapa`);
                
                elementosDelMapa.forEach(elemento => {
                    if (!elemento.className.includes('leaflet-control')) {
                        elemento.style.visibility = 'visible';
                        elemento.style.opacity = '1';
                    }
                });
            }

            console.log('✅ Limpieza mínima completada');
        } catch (error) {
            console.warn('⚠️ Error en limpieza mínima:', error);
        }
    }

    /**
     * Limpieza específica para evitar canvas tainted
     */
    limpiezaUltraAgresivaParaEvitarTaint(clonedDoc) {
        try {
            // Remover TODAS las imágenes externas que pueden causar taint
            const imagenesExternas = clonedDoc.querySelectorAll('img[src^="http"], img[src^="//"]');
            imagenesExternas.forEach(img => {
                // Reemplazar con placeholder visible
                const placeholder = clonedDoc.createElement('div');
                placeholder.style.cssText = `
                    width: ${img.offsetWidth || 256}px;
                    height: ${img.offsetHeight || 256}px;
                    background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%), 
                               linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 10px 10px;
                    border: 2px solid #ddd;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    color: #666;
                `;
                placeholder.textContent = 'ÁREA DEL MAPA';
                img.parentNode?.replaceChild(placeholder, img);
            });

            // Remover todos los estilos externos
            const estilosExternos = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
            estilosExternos.forEach(style => style.remove());

            console.log('🧹 Limpieza para evitar taint completada');
        } catch (error) {
            console.warn('⚠️ Error en limpieza anti-taint:', error);
        }
    }

    /**
     * Método simple que funcionaba antes (sin markers complejos)
     */
    async capturaMapaSimple(selector, calidad = 0.95) {
        try {
            console.log('🎯 Usando método simple que funcionaba antes...');
            
            const elemento = document.querySelector(selector);
            if (!elemento) {
                throw new Error(`Elemento no encontrado: ${selector}`);
            }

            // Configuración simple y directa como funcionaba antes
            const opcionesSimples = {
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                scale: 1,
                logging: false,
                removeContainer: true,
                imageTimeout: 15000,
                ignoreElements: (element) => {
                    // Solo ignorar controles UI, nada más
                    if (element.className && typeof element.className === 'string') {
                        return element.className.includes('leaflet-control') ||
                               element.className.includes('searchbar') ||
                               element.className.includes('search-container');
                    }
                    return false;
                },
                onclone: (clonedDoc) => {
                    // Limpieza mínima como funcionaba antes
                    const controles = clonedDoc.querySelectorAll('.leaflet-control, .searchbar, .search-container');
                    controles.forEach(control => {
                        control.style.display = 'none';
                    });
                }
            };

            console.log('📸 Capturando con configuración simple...');
            const canvas = await html2canvas(elemento, opcionesSimples);
            return canvas.toDataURL('image/png', calidad);
            
        } catch (error) {
            console.error('❌ Error en captura simple:', error);
            throw error;
        }
    }

    /**
     * Genera imagen placeholder cuando todo lo demás falla
     */
    generarImagenPlaceholder(elemento, calidad = 0.95) {
        console.log('📝 Generando imagen placeholder...');
        
        const rect = elemento.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = rect.width || 800;
        canvas.height = rect.height || 600;
        
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Patrón de mapa
        ctx.fillStyle = '#f0f0f0';
        for (let x = 0; x < canvas.width; x += 40) {
            for (let y = 0; y < canvas.height; y += 40) {
                if ((x / 40 + y / 40) % 2) {
                    ctx.fillRect(x, y, 40, 40);
                }
            }
        }
        
        // Borde
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        
        // Texto
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ÁREA DEL MAPA', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '12px Arial';
        ctx.fillText('Captura no disponible - Usar archivo o captura manual', canvas.width / 2, canvas.height / 2 + 10);
        
        return canvas.toDataURL('image/png', calidad);
    }

    /**
     * Limpieza agresiva del documento para captura robusta
     */
    limpiezaAgresivaParaCaptura(clonedDoc) {
        try {
            // Remover TODAS las hojas de estilo externas (excepto Leaflet)
            const hojarEstiloExternas = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            hojarEstiloExternas.forEach(link => {
                if (!link.href.includes('leaflet')) {
                    link.remove();
                }
            });

            // Simplificar estilos inline a lo mínimo
            const elementosConEstilo = clonedDoc.querySelectorAll('[style]');
            elementosConEstilo.forEach(elemento => {
                const estiloOriginal = elemento.getAttribute('style');
                if (estiloOriginal) {
                    // Mantener solo propiedades básicas y seguras
                    const estiloBasico = estiloOriginal
                        .replace(/[^;]*transform[^;]*;?/gi, '') // Remover transforms
                        .replace(/[^;]*filter[^;]*;?/gi, '') // Remover filtros
                        .replace(/[^;]*backdrop[^;]*;?/gi, '') // Remover backdrop
                        .replace(/[^;]*clip[^;]*;?/gi, '') // Remover clip-path
                        .replace(/[^;]*mask[^;]*;?/gi, '') // Remover mask
                        .replace(/[^;]*gradient[^;]*;?/gi, '') // Remover gradients problemáticos
                        .replace(/--[^:;]+:[^;]*;?/gi, '') // Variables CSS
                        .replace(/;{2,}/g, ';')
                        .replace(/^;+|;+$/g, '');
                    
                    elemento.setAttribute('style', estiloBasico);
                }
            });

            // Remover elementos potencialmente problemáticos
            const elementosProblematicos = clonedDoc.querySelectorAll(
                'script, noscript, iframe, object, embed, video, audio, canvas'
            );
            elementosProblematicos.forEach(el => el.remove());

            // Optimizar elementos específicos de Leaflet
            const mapaClonado = clonedDoc.querySelector('#map');
            if (mapaClonado) {
                // Asegurar visibilidad del mapa principal
                mapaClonado.style.cssText = `
                    visibility: visible !important;
                    opacity: 1 !important;
                    display: block !important;
                    position: relative !important;
                `;

                // Asegurar que los tiles sean visibles
                const tiles = mapaClonado.querySelectorAll('.leaflet-tile');
                tiles.forEach(tile => {
                    if (tile.complete && tile.naturalHeight > 0) {
                        tile.style.visibility = 'visible';
                        tile.style.opacity = '1';
                        tile.style.display = 'block';
                    }
                });

                // Asegurar que los contenedores sean visibles
                const containers = mapaClonado.querySelectorAll('.leaflet-tile-container, .leaflet-overlay-pane, .leaflet-map-pane, .leaflet-marker-pane');
                containers.forEach(container => {
                    container.style.visibility = 'visible';
                    container.style.opacity = '1';
                    container.style.display = 'block';
                    container.style.position = 'relative';
                });

                // FORZAR visibilidad de markers y polígonos
                const markers = mapaClonado.querySelectorAll('.leaflet-marker-icon, .leaflet-div-icon');
                markers.forEach(marker => {
                    marker.style.visibility = 'visible';
                    marker.style.opacity = '1';
                    marker.style.display = 'block';
                    marker.style.position = 'absolute';
                });

                // FORZAR visibilidad de overlays (polígonos)
                const overlays = mapaClonado.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-overlay-pane canvas');
                overlays.forEach(overlay => {
                    overlay.style.visibility = 'visible';
                    overlay.style.opacity = '1';
                    overlay.style.display = 'block';
                });

                // Forzar el fondo del mapa a transparente si es verde (placeholder)
                const leafletContainer = mapaClonado.querySelector('.leaflet-container');
                if (leafletContainer) {
                    leafletContainer.style.backgroundColor = 'transparent';
                }
            }

            console.log('🧹 Limpieza agresiva completada con optimizaciones de Leaflet');
        } catch (error) {
            console.warn('⚠️ Error en limpieza agresiva:', error);
        }
    }

    /**
     * Captura múltiples intentos
     */
    async capturarConReintentos(opciones = {}, maxIntentos = 3) {
        let ultimoError = null;
        
        for (let intento = 1; intento <= maxIntentos; intento++) {
            try {
                console.log(`📸 Intento de captura ${intento}/${maxIntentos}`);
                
                const resultado = await this.capturarPantalla(opciones);
                
                console.log(`✅ Captura exitosa en intento ${intento}`);
                return resultado;
                
            } catch (error) {
                ultimoError = error;
                console.warn(`⚠️ Intento ${intento} falló:`, error.message);
                
                if (intento < maxIntentos) {
                    // Esperar antes del siguiente intento
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        throw new Error(`Captura falló después de ${maxIntentos} intentos. Último error: ${ultimoError.message}`);
    }

    /**
     * Obtiene información sobre las capacidades de captura
     */
    obtenerCapacidades() {
        return {
            nativaDisponible: this.isSupported,
            html2canvasDisponible: this.html2canvasLoaded,
            metodosDisponibles: [
                ...(this.isSupported ? ['nativa'] : []),
                ...(this.html2canvasLoaded ? ['html2canvas'] : [])
            ],
            navegadorCompatible: this.isSupported || this.html2canvasLoaded
        };
    }

    /**
     * Detecta automáticamente el mejor método de captura
     */
    async capturarAutomatico(opciones = {}) {
        const capacidades = this.obtenerCapacidades();
        
        if (!capacidades.navegadorCompatible) {
            throw new Error('Navegador no compatible con captura de pantalla');
        }

        // Preferir captura nativa para pantalla completa
        if (capacidades.nativaDisponible && (!opciones.selector || opciones.tipo === 'pantalla-completa')) {
            try {
                return await this.capturaNativa(opciones.tipo, opciones.calidad);
            } catch (error) {
                console.warn('⚠️ Captura nativa falló, intentando html2canvas...');
            }
        }

        // Usar html2canvas para elementos específicos o como respaldo
        if (capacidades.html2canvasDisponible) {
            return await this.capturaElemento(opciones.selector, opciones.calidad);
        }

        throw new Error('No se pudo realizar la captura con ningún método disponible');
    }

    /**
     * Redimensiona imagen capturada
     */
    async redimensionarImagen(imagenDataUrl, nuevoAncho, nuevaAltura, calidad = 0.95) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = nuevoAncho;
                canvas.height = nuevaAltura;
                
                // Redimensionar manteniendo aspecto si es necesario
                let { width, height, x, y } = this.calcularDimensiones(
                    img.width, img.height, nuevoAncho, nuevaAltura
                );
                
                ctx.drawImage(img, x, y, width, height);
                
                resolve(canvas.toDataURL('image/png', calidad));
            };
            img.onerror = () => reject(new Error('Error cargando imagen para redimensionar'));
            img.src = imagenDataUrl;
        });
    }

    /**
     * Calcula dimensiones manteniendo aspecto
     */
    calcularDimensiones(anchoOriginal, altoOriginal, anchoObjetivo, altoObjetivo) {
        const ratioOriginal = anchoOriginal / altoOriginal;
        const ratioObjetivo = anchoObjetivo / altoObjetivo;
        
        let width, height, x = 0, y = 0;
        
        if (ratioOriginal > ratioObjetivo) {
            // Imagen más ancha
            width = anchoObjetivo;
            height = anchoObjetivo / ratioOriginal;
            y = (altoObjetivo - height) / 2;
        } else {
            // Imagen más alta
            height = altoObjetivo;
            width = altoObjetivo * ratioOriginal;
            x = (anchoObjetivo - width) / 2;
        }
        
        return { width, height, x, y };
    }
}

// Exponer clase globalmente
window.ScreenshotCapture = ScreenshotCapture;

console.log('📸 ScreenshotCapture v2.0.0 cargado - Captura nativa y html2canvas disponibles');