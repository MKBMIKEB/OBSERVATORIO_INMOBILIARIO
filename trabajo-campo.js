/**
 * trabajo-campo.js
 * Módulo para gestión de trabajo de campo - Observatorio Inmobiliario
 * Versión corregida con inicialización mejorada
 */

class TrabajoCampoManager {
  constructor() {
    this.modalElement = null;
    this.isInitialized = false;
    this.currentTab = 'peritos';
    this.updateInterval = null;
    
    // Configuración
    this.config = {
      updateIntervalMs: 30000, // 30 segundos
      apiEndpoints: {
        metricas: '/api/trabajo-campo/metricas',
        ofertas: '/api/ofertas',
        ofertasDisponibles: '/api/ofertas/disponibles',
        peritos: '/api/peritos',
        asignaciones: '/api/asignaciones',
        nuevaAsignacion: '/api/asignaciones',
        nuevoPerito: '/api/peritos'
      }
    };

    // Inicializar inmediatamente si el DOM ya está listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      // DOM ya está listo
      this.init();
    }
  }

  /**
   * Inicialización del módulo
   */
  init() {
    if (this.isInitialized) {
      console.log('🔄 TrabajoCampoManager ya está inicializado');
      return;
    }
    
    console.log('🚀 Inicializando TrabajoCampoManager...');
    
    try {
      this.setupEventListeners();
      this.isInitialized = true;
      this.currentTab = 'peritos';
      console.log('✅ TrabajoCampoManager inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando TrabajoCampoManager:', error);
    }
  }

  /**
   * Configurar event listeners principales
   */
  setupEventListeners() {
    const btnTrabajoCampo = document.getElementById('btn-trabajo-campo');
    
    if (btnTrabajoCampo) {
      console.log('✅ Botón trabajo-campo encontrado');
      btnTrabajoCampo.addEventListener('click', () => {
        console.log('🖱️ Click en botón trabajo-campo');
        this.abrirModal();
      });
    } else {
      console.warn('⚠️ Botón btn-trabajo-campo no encontrado');
    }
  }

  /**
   * Abrir modal principal de trabajo de campo
   */
  abrirModal() {
    console.log('🔓 Abriendo modal...');
    const modal = document.getElementById('modal-trabajo-campo');
    
    if (modal) {
      console.log('✅ Modal encontrado, abriendo...');
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      
      // Configurar eventos del modal si aún no están configurados
      this.configurarEventosModal();
      
      // Iniciar actualizaciones si es necesario
      this.iniciarActualizaciones();
      
      // Cargar datos iniciales
      this.cargarDatosIniciales();
      
      console.log('✅ Modal abierto correctamente');
    } else {
      console.error('❌ Modal no encontrado con ID: modal-trabajo-campo');
    }
  }

  /**
   * Cerrar modal principal
   */
  cerrarModal() {
    console.log('🔒 Cerrando modal...');
    const modal = document.getElementById('modal-trabajo-campo');
    
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
      this.detenerActualizaciones();
      console.log('✅ Modal cerrado');
    }
  }

  /**
   * Configurar eventos del modal principal
   */
  configurarEventosModal() {
    const modal = document.getElementById('modal-trabajo-campo');
    const cerrarBtn = document.getElementById('cerrar-modal-trabajo-campo');
    
    // Cerrar con botón X (evitar duplicados)
    if (cerrarBtn && !cerrarBtn.dataset.listenerAdded) {
      cerrarBtn.addEventListener('click', () => {
        console.log('🖱️ Click en cerrar modal');
        this.cerrarModal();
      });
      cerrarBtn.dataset.listenerAdded = 'true';
      console.log('✅ Event listener para cerrar agregado');
    }

    // Cerrar con ESC
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        console.log('⌨️ ESC presionado, cerrando modal');
        this.cerrarModal();
      }
    };
    
    // Remover listener anterior si existe
    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
    }
    
    // Agregar nuevo listener
    this.escapeListener = handleKeydown;
    document.addEventListener('keydown', handleKeydown);

    // Cerrar al hacer clic fuera del modal
    if (modal && !modal.dataset.outsideClickAdded) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          console.log('🖱️ Click fuera del modal, cerrando');
          this.cerrarModal();
        }
      });
      modal.dataset.outsideClickAdded = 'true';
      console.log('✅ Event listener para click fuera agregado');
    }

    // Configurar navegación por pestañas
    this.configurarPestanas();
    
    // Configurar botones específicos
    this.configurarBotones();
  }

  /**
   * Configurar navegación por pestañas
   */
  configurarPestanas() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    console.log(`🏷️ Configurando ${tabButtons.length} pestañas`);
    
    tabButtons.forEach(button => {
      if (!button.dataset.tabListenerAdded) {
        button.addEventListener('click', () => {
          const targetTab = button.getAttribute('data-tab');
          console.log(`🏷️ Cambiando a pestaña: ${targetTab}`);
          this.cambiarPestana(targetTab);
        });
        button.dataset.tabListenerAdded = 'true';
      }
    });
  }

  /**
   * Cambiar pestaña activa
   */
  cambiarPestana(targetTab) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remover clases activas
    tabButtons.forEach(btn => {
      btn.classList.remove('border-blue-500', 'text-blue-600');
      btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    tabContents.forEach(content => {
      content.classList.add('hidden');
    });
    
    // Activar pestaña seleccionada
    const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
    if (activeButton) {
      activeButton.classList.remove('border-transparent', 'text-gray-500');
      activeButton.classList.add('border-blue-500', 'text-blue-600');
    }
    
    const targetContent = document.getElementById(`tab-${targetTab}`);
    if (targetContent) {
      targetContent.classList.remove('hidden');
    }
    
    this.currentTab = targetTab;
    console.log(`✅ Pestaña cambiada a: ${targetTab}`);
    
    // Cargar datos específicos de la pestaña
    this.cargarDatosPestana(targetTab);
  }

  /**
   * Configurar botones específicos
   */
  configurarBotones() {
    // Botón Nueva Asignación
    const btnNuevaAsignacion = document.getElementById('btn-nueva-asignacion');
    if (btnNuevaAsignacion && !btnNuevaAsignacion.dataset.listenerAdded) {
      btnNuevaAsignacion.addEventListener('click', () => {
        console.log('🖱️ Click en nueva asignación');
        this.abrirModalNuevaAsignacion();
      });
      btnNuevaAsignacion.dataset.listenerAdded = 'true';
    }

    // Botón Agregar Perito
    const btnAgregarPerito = document.getElementById('btn-agregar-perito-modal');
    if (btnAgregarPerito && !btnAgregarPerito.dataset.listenerAdded) {
      btnAgregarPerito.addEventListener('click', () => {
        console.log('🖱️ Click en agregar perito');
        this.abrirModalAgregarPerito();
      });
      btnAgregarPerito.dataset.listenerAdded = 'true';
    }
  }

  /**
   * Cargar datos iniciales del modal
   */
  async cargarDatosIniciales() {
    console.log('📊 Cargando datos iniciales...');
    try {
      await this.actualizarMetricas();
      await this.cargarDatosPestana(this.currentTab);
      console.log('✅ Datos iniciales cargados');
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    }
  }

  /**
   * Cargar datos específicos de una pestaña
   */
  async cargarDatosPestana(tab) {
    console.log(`📂 Cargando datos para pestaña: ${tab}`);
    try {
      switch (tab) {
        case 'peritos':
          await this.cargarPeritos();
          break;
        case 'asignaciones':
          await this.cargarAsignaciones();
          break;
        case 'reportes':
          await this.cargarReportes();
          break;
        case 'configuracion':
          console.log('⚙️ Pestaña de configuración (estática)');
          break;
        default:
          console.warn(`⚠️ Pestaña no reconocida: ${tab}`);
      }
    } catch (error) {
      console.error(`❌ Error cargando datos de pestaña ${tab}:`, error);
    }
  }

  /**
   * Actualizar métricas principales
   */
  async actualizarMetricas() {
    console.log('📊 Actualizando métricas...');
    
    try {
      // Simular datos por ahora (ya que no tienes el endpoint)
      const data = {
        asignadas: 12,
        completadas: 8,
        en_progreso: 3,
        pendientes: 1
      };
      
      this.actualizarElementoSiExiste('metric-asignadas', data.asignadas);
      this.actualizarElementoSiExiste('metric-completadas', data.completadas);
      this.actualizarElementoSiExiste('metric-progreso', data.en_progreso);
      this.actualizarElementoSiExiste('metric-pendientes', data.pendientes);
      
      console.log('✅ Métricas actualizadas');
      
    } catch (error) {
      console.error('❌ Error actualizando métricas:', error);
    }
  }

  /**
   * Cargar lista de peritos
   */
  async cargarPeritos() {
    console.log('👥 Cargando peritos...');
    // Implementación futura
  }

  /**
   * Cargar asignaciones
   */
  async cargarAsignaciones() {
    console.log('📋 Cargando asignaciones...');
    // Implementación futura
  }

  /**
   * Cargar reportes
   */
  async cargarReportes() {
    console.log('📊 Cargando reportes...');
    // Implementación futura
  }

  /**
   * Abrir modal de nueva asignación
   */
  abrirModalNuevaAsignacion() {
    console.log('📋 Abriendo modal nueva asignación...');
    alert('🚧 Modal de nueva asignación - En desarrollo');
  }

  /**
   * Abrir modal de agregar perito
   */
  abrirModalAgregarPerito() {
    console.log('👤 Abriendo modal agregar perito...');
    alert('🚧 Modal de agregar perito - En desarrollo');
  }

  /**
   * Iniciar actualizaciones automáticas
   */
  iniciarActualizaciones() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      console.log('🔄 Actualización automática de métricas');
      this.actualizarMetricas();
    }, this.config.updateIntervalMs);
    
    console.log('⏰ Actualizaciones automáticas iniciadas');
  }

  /**
   * Detener actualizaciones automáticas
   */
  detenerActualizaciones() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Actualizaciones automáticas detenidas');
    }
  }

  /**
   * Actualizar elemento si existe
   */
  actualizarElementoSiExiste(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    } else {
      console.warn(`⚠️ Elemento no encontrado: ${id}`);
    }
  }

  /**
   * Destruir instancia y limpiar eventos
   */
  destroy() {
    console.log('🧹 Limpiando TrabajoCampoManager...');
    this.detenerActualizaciones();
    this.cerrarModal();
    
    // Limpiar listener de escape
    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
    }
    
    this.isInitialized = false;
    console.log('✅ TrabajoCampoManager limpiado');
  }
}

// Crear instancia global solo si no existe
if (!window.trabajoCampoManager) {
  console.log('🌟 Creando nueva instancia de TrabajoCampoManager');
  window.trabajoCampoManager = new TrabajoCampoManager();
} else {
  console.log('♻️ Instancia de TrabajoCampoManager ya existe');
}

// Export para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrabajoCampoManager;
}