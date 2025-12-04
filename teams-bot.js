// =====================================================
// BOT DE MICROSOFT TEAMS - Observatorio Inmobiliario
// =====================================================
// Bot simple para recibir notificaciones y comandos
// =====================================================

const axios = require('axios');

class TeamsBot {
  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    this.enabled = !!this.webhookUrl;

    if (!this.enabled) {
      console.warn('⚠️ TEAMS_WEBHOOK_URL no configurado. Bot de Teams deshabilitado.');
    } else {
      console.log('✅ Bot de Teams habilitado');
    }
  }

  /**
   * Enviar mensaje simple a Teams
   * @param {string} message - Mensaje de texto
   * @returns {Promise<boolean>}
   */
  async sendMessage(message) {
    if (!this.enabled) {
      console.log('📤 (Teams deshabilitado):', message);
      return false;
    }

    try {
      await axios.post(this.webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        text: message
      });

      console.log('✅ Mensaje enviado a Teams');
      return true;
    } catch (error) {
      console.error('❌ Error al enviar mensaje a Teams:', error.message);
      return false;
    }
  }

  /**
   * Enviar tarjeta adaptativa con formato
   * @param {Object} options - Opciones de la tarjeta
   * @returns {Promise<boolean>}
   */
  async sendCard(options) {
    if (!this.enabled) {
      console.log('📤 (Teams deshabilitado) - Tarjeta:', options.title);
      return false;
    }

    const {
      title,
      subtitle,
      text,
      color = '10b981', // Verde por defecto
      actions = [],
      facts = []
    } = options;

    try {
      const card = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        themeColor: color,
        summary: title,
        sections: [
          {
            activityTitle: title,
            activitySubtitle: subtitle,
            activityImage: `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/House/3D/house_3d.png`,
            facts: facts,
            text: text
          }
        ],
        potentialAction: actions.map(action => ({
          '@type': 'OpenUri',
          name: action.name,
          targets: [
            { os: 'default', uri: action.url }
          ]
        }))
      };

      await axios.post(this.webhookUrl, card);
      console.log('✅ Tarjeta enviada a Teams:', title);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar tarjeta a Teams:', error.message);
      return false;
    }
  }

  /**
   * Notificar nueva oferta inmobiliaria
   * @param {Object} oferta - Datos de la oferta
   * @returns {Promise<boolean>}
   */
  async notifyNewOffer(oferta) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    return this.sendCard({
      title: '🏠 Nueva Oferta Registrada',
      subtitle: oferta['Tipo de Inmueble'] || 'Sin especificar',
      text: oferta.Descripción || 'Sin descripción',
      color: '10b981',
      facts: [
        { name: 'ID:', value: oferta.ID || 'N/A' },
        { name: 'Transacción:', value: oferta.Transacción || 'N/A' },
        { name: 'Área:', value: `${oferta['Área Hec'] || 0} Ha` },
        { name: 'Valor Unitario:', value: `$${(oferta['Valor por unidad (COP)'] || 0).toLocaleString('es-CO')} COP` },
        { name: 'Valor Integral:', value: `$${(oferta['valor Integral (COP)'] || 0).toLocaleString('es-CO')} COP` },
        { name: 'Fecha:', value: oferta['Fecha del Registro'] || 'N/A' }
      ],
      actions: [
        {
          name: 'Ver en Mapa',
          url: `${appUrl}/index.html?oferta=${oferta.ID}`
        },
        {
          name: 'Ver Detalles',
          url: `${appUrl}/api/ofertas`
        }
      ]
    });
  }

  /**
   * Notificar nueva norma registrada
   * @param {Object} norma - Datos de la norma
   * @returns {Promise<boolean>}
   */
  async notifyNewNorm(norma) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    return this.sendCard({
      title: '📋 Nueva Norma Registrada',
      subtitle: norma.titulo || 'Sin título',
      text: `Normativa urbanística para ${norma.municipio}, ${norma.departamento}`,
      color: '667eea',
      facts: [
        { name: 'Año:', value: norma.ano || 'N/A' },
        { name: 'Decretos:', value: norma.decretos || 'N/A' },
        { name: 'Departamento:', value: norma.departamento || 'N/A' },
        { name: 'Municipio:', value: norma.municipio || 'N/A' },
        { name: 'Fecha Registro:', value: new Date(norma.fechaRegistro).toLocaleDateString('es-CO') }
      ],
      actions: [
        {
          name: 'Ver Plano',
          url: `${appUrl}${norma.plano}`
        },
        {
          name: 'Descargar PDF',
          url: `${appUrl}${norma.archivo}`
        }
      ]
    });
  }

  /**
   * Notificar error crítico
   * @param {string} errorMessage - Mensaje de error
   * @param {Object} details - Detalles adicionales
   * @returns {Promise<boolean>}
   */
  async notifyError(errorMessage, details = {}) {
    return this.sendCard({
      title: '⚠️ Error en Observatorio',
      subtitle: 'Error Crítico',
      text: errorMessage,
      color: 'ff0000',
      facts: Object.entries(details).map(([key, value]) => ({
        name: key,
        value: String(value)
      }))
    });
  }

  /**
   * Notificar estadísticas diarias
   * @param {Object} stats - Estadísticas
   * @returns {Promise<boolean>}
   */
  async notifyDailyStats(stats) {
    return this.sendCard({
      title: '📊 Reporte Diario',
      subtitle: new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      text: 'Resumen de actividad del observatorio inmobiliario',
      color: '667eea',
      facts: [
        { name: 'Ofertas Totales:', value: String(stats.totalOfertas || 0) },
        { name: 'Nuevas Hoy:', value: String(stats.nuevasHoy || 0) },
        { name: 'Normas Registradas:', value: String(stats.totalNormas || 0) },
        { name: 'Consultas API:', value: String(stats.consultasAPI || 0) },
        { name: 'Valor Promedio/Ha:', value: `$${(stats.valorPromedioHa || 0).toLocaleString('es-CO')} COP` }
      ]
    });
  }
}

// Exportar instancia única (Singleton)
const teamsBot = new TeamsBot();

module.exports = teamsBot;
