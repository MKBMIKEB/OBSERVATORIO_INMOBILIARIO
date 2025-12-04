// =====================================================
// CONFIGURACIÓN DE AZURE BLOB STORAGE (OPCIONAL)
// =====================================================
// Este archivo contiene la configuración para migrar
// el almacenamiento de archivos locales a Azure Blob Storage
// =====================================================

const { BlobServiceClient } = require('@azure/storage-blob');

class AzureBlobManager {
  constructor() {
    // Validar que las variables de entorno estén configuradas
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING no configurado. Usando almacenamiento local.');
      this.enabled = false;
      return;
    }

    this.enabled = true;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'observatorio-uploads';

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      console.log('✅ Azure Blob Storage configurado correctamente');
    } catch (error) {
      console.error('❌ Error al configurar Azure Blob Storage:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Inicializar el contenedor (crear si no existe)
   */
  async initialize() {
    if (!this.enabled) return false;

    try {
      await this.containerClient.createIfNotExists({
        access: 'blob' // Acceso público a nivel de blob
      });
      console.log(`✅ Contenedor "${this.containerName}" listo`);
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar contenedor:', error.message);
      return false;
    }
  }

  /**
   * Subir un archivo a Azure Blob Storage
   * @param {Buffer} buffer - Buffer del archivo
   * @param {string} filename - Nombre del archivo
   * @param {string} contentType - Tipo de contenido (opcional)
   * @returns {Promise<string>} URL del blob
   */
  async uploadFile(buffer, filename, contentType = 'application/octet-stream') {
    if (!this.enabled) {
      throw new Error('Azure Blob Storage no está habilitado');
    }

    try {
      const blobName = `${Date.now()}-${filename}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: { blobContentType: contentType }
      });

      console.log(`✅ Archivo subido: ${blobName}`);
      return blockBlobClient.url;
    } catch (error) {
      console.error('❌ Error al subir archivo:', error.message);
      throw error;
    }
  }

  /**
   * Descargar un archivo de Azure Blob Storage
   * @param {string} blobName - Nombre del blob
   * @returns {Promise<Buffer>} Buffer del archivo
   */
  async downloadFile(blobName) {
    if (!this.enabled) {
      throw new Error('Azure Blob Storage no está habilitado');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download();

      const chunks = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('❌ Error al descargar archivo:', error.message);
      throw error;
    }
  }

  /**
   * Eliminar un archivo de Azure Blob Storage
   * @param {string} blobName - Nombre del blob
   * @returns {Promise<boolean>}
   */
  async deleteFile(blobName) {
    if (!this.enabled) {
      throw new Error('Azure Blob Storage no está habilitado');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      console.log(`✅ Archivo eliminado: ${blobName}`);
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar archivo:', error.message);
      return false;
    }
  }

  /**
   * Listar todos los archivos en el contenedor
   * @param {string} prefix - Prefijo para filtrar (opcional)
   * @returns {Promise<Array>}
   */
  async listFiles(prefix = '') {
    if (!this.enabled) {
      throw new Error('Azure Blob Storage no está habilitado');
    }

    try {
      const files = [];
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        files.push({
          name: blob.name,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified,
          contentType: blob.properties.contentType,
          url: `${this.containerClient.url}/${blob.name}`
        });
      }
      return files;
    } catch (error) {
      console.error('❌ Error al listar archivos:', error.message);
      throw error;
    }
  }

  /**
   * Obtener URL de un blob
   * @param {string} blobName - Nombre del blob
   * @returns {string} URL del blob
   */
  getBlobUrl(blobName) {
    if (!this.enabled) {
      throw new Error('Azure Blob Storage no está habilitado');
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }
}

// Exportar instancia única (Singleton)
const azureBlobManager = new AzureBlobManager();

module.exports = azureBlobManager;
