const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const archiver = require('archiver');

console.log('🏗️ Generando paquete de Teams para Observatorio Inmobiliario\n');

// Configuración
const config = {
  url: process.argv[2] || 'https://TU-DOMINIO.com',
  appId: process.argv[3] || randomUUID(),
};

console.log('📋 Configuración:');
console.log(`   URL: ${config.url}`);
console.log(`   App ID: ${config.appId}\n`);

// Leer el manifest template
const manifestPath = path.join(__dirname, 'manifest.json');
let manifest = fs.readFileSync(manifestPath, 'utf8');

// Reemplazar placeholders
manifest = manifest
  .replace(/\{\{GENERA-UN-GUID-UNICO\}\}/g, config.appId)
  .replace(/\{\{TU-DOMINIO\}\}\.com/g, config.url.replace('https://', '').replace('http://', ''))
  .replace(/\{\{AZURE-APP-ID\}\}/g, config.appId);

// Guardar manifest actualizado
const manifestOut = path.join(__dirname, 'manifest-generated.json');
fs.writeFileSync(manifestOut, manifest);
console.log('✅ Manifest generado: manifest-generated.json');

// Verificar que existen los iconos
const colorIcon = path.join(__dirname, 'color.png');
const outlineIcon = path.join(__dirname, 'outline.png');

if (!fs.existsSync(colorIcon)) {
  console.warn('⚠️  ADVERTENCIA: No se encontró color.png');
  console.log('   Por favor crea un icono de 192x192px y guárdalo como color.png');
}

if (!fs.existsSync(outlineIcon)) {
  console.warn('⚠️  ADVERTENCIA: No se encontró outline.png');
  console.log('   Por favor crea un icono de 32x32px y guárdalo como outline.png');
}

// Crear el archivo ZIP
const output = fs.createWriteStream(path.join(__dirname, '..', 'ObservatorioInmobiliario.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log('\n✅ Paquete creado exitosamente!');
  console.log(`   Tamaño: ${(archive.pointer() / 1024).toFixed(2)} KB`);
  console.log(`   Archivo: ObservatorioInmobiliario.zip\n`);
  console.log('📦 Próximos pasos:');
  console.log('   1. Verifica que los iconos estén correctos');
  console.log('   2. Sube ObservatorioInmobiliario.zip a Microsoft Teams');
  console.log('   3. Configura la aplicación en tu equipo/canal');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Agregar archivos al ZIP
archive.file(manifestOut, { name: 'manifest.json' });

if (fs.existsSync(colorIcon)) {
  archive.file(colorIcon, { name: 'color.png' });
} else {
  console.log('⚠️  Saltando color.png (no encontrado)');
}

if (fs.existsSync(outlineIcon)) {
  archive.file(outlineIcon, { name: 'outline.png' });
} else {
  console.log('⚠️  Saltando outline.png (no encontrado)');
}

archive.finalize();
