const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const sharp   = require('sharp');
const JSZip   = require('jszip');


const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── Carpeta de uploads ──────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// ─── Multer configuración ─────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });
// ─── Ruta para convertir TIFF a PNG on-the-fly ─────────────────────────
app.get('/planos/:name.png', async (req, res) => {
  try {
    const nombre  = req.params.name; // ej. "1749402858155-usos_g"
    const tiffPath = path.join(uploadsDir, nombre + '.tif');

    // Leer y convertir a PNG en memoria
    const pngBuffer = await sharp(tiffPath)
      .png()
      .toBuffer();

    // Devolver como imagen PNG
    res.type('image/png').send(pngBuffer);
  } catch (err) {
    console.error('Error convirtiendo TIFF a PNG:', err);
    res.status(404).send('Plano no encontrado o error al convertir.');
  }
});
// ─── POST /api/ofertas ───────────────────────────────
app.post(
  '/api/ofertas',
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'poligono', maxCount: 1 }
  ]),
  (req, res) => {
    console.log('📥 req.body:', req.body);
    console.log('📥 req.files:', req.files);

    try {
      const datos = req.body;
      let unidades = [];

      if (datos.unidadesFisiograficas) {
        try {
          unidades = JSON.parse(datos.unidadesFisiograficas);
        } catch (parseErr) {
          console.error('❌ Error parsing unidadesFisiograficas:', parseErr);
          unidades = [];
        }
      }

      const files = req.files || {};
      const imgs  = (files.imagenes || []).map(f => `/uploads/${f.filename}`);
      const poly  = files.poligono?.[0]
                  ? `/uploads/${files.poligono[0].filename}`
                  : null;

      const oferta = {
        ID:                        datos.ID,
        'Tipo de Inmueble':        datos['Tipo de Inmueble'],
        Transacción:               datos.Transaccion,
        Clasificacion:             datos.Clasificacion,
        Regimen:                   datos.Regimen,
        'Área Hec':                parseFloat(datos['Area Hec']) || 0,
        'Valor por unidad (COP)':  parseFloat(datos['Valor por unidad (COP)']) || 0,
        'valor Integral (COP)':    parseFloat(datos['valor Integral (COP)'])   || 0,
        Latitud:                   parseFloat(datos.Latitud)  || null,
        Longitud:                  parseFloat(datos.Longitud) || null,
        'Fecha del Registro':      datos['Fecha del Registro'],
        Descripción:               datos.Descripción || '',
        unidadesFisiograficas:     unidades,
        imagenes:                  imgs,
        poligono:                  poly
      };

      const filePath = path.join(__dirname, 'inmuebles.json');
      let todas = [];
      if (fs.existsSync(filePath)) {
        todas = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
      }
      todas.push(oferta);
      fs.writeFileSync(filePath, JSON.stringify(todas, null, 2), 'utf-8');

      res.json({ oferta });
    } catch (err) {
      console.error('🔥 Error interno al guardar oferta:', err);
      res.status(500).json({
        error: err.message,
        stack: err.stack.split('\n').slice(0, 3)
      });
    }
  }
);

// ─── GET /api/ofertas ────────────────────────────────
app.get('/api/ofertas', (req, res) => {
  const filePath = path.join(__dirname, 'inmuebles.json');
  if (!fs.existsSync(filePath)) return res.json([]);
  const contenido = fs.readFileSync(filePath, 'utf-8') || '[]';
  res.json(JSON.parse(contenido));
});

// ─── Redirección antigua ─────────────────────────────
app.get('/api/inmuebles', (req, res) => {
  res.redirect(301, '/api/ofertas');
});

// ─── POST /api/capas-imagen ──────────────────────────
app.post('/api/capas-imagen', (req, res) => {
  const { imagen, corners } = req.body;

  if (!imagen || !corners || !Array.isArray(corners)) {
    return res.status(400).json({ error: 'Faltan datos: imagen o corners' });
  }

  const base64Data = imagen.replace(/^data:image\/\w+;base64,/, '');
  const ext = imagen.split(';')[0].split('/')[1] || 'png';
  const nombreArchivo = `capa-${Date.now()}.${ext}`;
  const rutaArchivo = path.join(uploadsDir, nombreArchivo);

  fs.writeFile(rutaArchivo, base64Data, 'base64', err => {
    if (err) {
      console.error('❌ Error al guardar imagen:', err);
      return res.status(500).json({ error: 'Error al guardar imagen' });
    }

    const nuevaCapa = {
      url: `/uploads/${nombreArchivo}`,
      corners,
      fecha: new Date().toISOString()
    };

    const capasPath = path.join(__dirname, 'capas.json');
    let capas = [];
    if (fs.existsSync(capasPath)) {
      try {
        capas = JSON.parse(fs.readFileSync(capasPath, 'utf-8') || '[]');
      } catch (err) {
        console.warn('⚠️ capas.json inválido, creando uno nuevo');
        capas = [];
      }
    }

    capas.push(nuevaCapa);
    fs.writeFileSync(capasPath, JSON.stringify(capas, null, 2), 'utf-8');

    res.json({ mensaje: '✅ Capa guardada', capa: nuevaCapa });
  });
});

// ─── GET /api/capas-imagen ───────────────────────────
app.get('/api/capas-imagen', (req, res) => {
  const capasPath = path.join(__dirname, 'capas.json');
  if (!fs.existsSync(capasPath)) return res.json([]);
  const contenido = fs.readFileSync(capasPath, 'utf-8') || '[]';
  try {
    res.json(JSON.parse(contenido));
  } catch (err) {
    console.error('❌ Error al leer capas.json:', err);
    res.status(500).json({ error: 'Archivo capas.json inválido' });
  }
});
// ─── POST /api/normas ───────────────────────────────
const normasFile = path.join(__dirname, 'normas.json');

app.post(
  '/api/normas',
  upload.fields([
    { name: 'archivo', maxCount: 1 },  // PDF de la norma
    { name: 'plano', maxCount: 1 }     // Plano georreferenciado (TIFF/KML/etc.)
  ]),
  (req, res) => {
    try {
      const datos = req.body;
      const archivos = req.files;

      if (!archivos || !archivos.archivo || !archivos.plano) {
        return res.status(400).json({ error: 'Faltan archivo PDF o plano georreferenciado' });
      }

      const nuevaNorma = {
        titulo: datos.titulo,
        ano: datos.ano,
        decretos: datos.decretos,
        departamento: datos.departamento,
        municipio: datos.municipio,
        archivo: `/uploads/${archivos.archivo[0].filename}`,
        plano: `/uploads/${archivos.plano[0].filename}`,
        fechaRegistro: new Date().toISOString()
      };

      let todas = [];
      if (fs.existsSync(normasFile)) {
        todas = JSON.parse(fs.readFileSync(normasFile, 'utf-8') || '[]');
      }
      todas.push(nuevaNorma);
      fs.writeFileSync(normasFile, JSON.stringify(todas, null, 2), 'utf-8');

      res.json({ mensaje: '✅ Norma guardada', norma: nuevaNorma });
    } catch (err) {
      console.error('❌ Error al guardar norma:', err);
      res.status(500).json({ error: 'Error interno al guardar norma' });
    }
  }
);


// ─── GET /api/normas ────────────────────────────────
app.get('/api/normas', (req, res) => {
  try {
    if (!fs.existsSync(normasFile)) return res.json([]);
    
    const contenido = fs.readFileSync(normasFile, 'utf-8') || '[]';
    const normas = JSON.parse(contenido);
    
    res.json(normas);
  } catch (err) {
    console.error('❌ Error al guardar norma:', err.message);
    console.error(err.stack);
    console.error('❌ Error leyendo normas.json:', err);
    res.status(500).json({ error: 'normas.json inválido' });
  }
});

// ─── GET /api/kmz/banco-agrario - KML SIN FILTROS ─────────────────────
app.get('/api/kmz/banco-agrario', async (req, res) => {
  console.log('🏛️ ===== PETICIÓN BANCO AGRARIO RECIBIDA =====');
  console.log('🏛️ Timestamp:', new Date().toISOString());
  console.log('🏛️ IP Cliente:', req.ip);
  console.log('🏛️ User-Agent:', req.get('User-Agent'));

  try {
    const kmzPath = path.join(uploadsDir, 'RURALES_BANCO_AGRARIO.kmz');
    console.log('🏛️ Buscando archivo en:', kmzPath);

    if (!fs.existsSync(kmzPath)) {
      console.log('❌ Archivo KMZ NO encontrado en:', kmzPath);
      return res.status(404).json({ error: 'Archivo KMZ no encontrado' });
    }

    console.log('✅ Archivo KMZ encontrado, tamaño:', fs.statSync(kmzPath).size, 'bytes');

    // Extraer KML directamente del KMZ
    console.log('📦 Cargando archivo KMZ...');
    const kmzData = fs.readFileSync(kmzPath);
    console.log('📦 Archivo KMZ cargado en memoria');

    const zip = await JSZip.loadAsync(kmzData);
    console.log('📦 ZIP procesado, archivos encontrados:', Object.keys(zip.files));

    const kmlFile = zip.file('doc.kml') || Object.values(zip.files).find(file => file.name.endsWith('.kml'));

    if (!kmlFile) {
      console.log('❌ No se encontró archivo KML dentro del KMZ');
      console.log('❌ Archivos disponibles:', Object.keys(zip.files));
      return res.status(500).json({ error: 'No se encontró archivo KML dentro del KMZ' });
    }

    console.log('✅ Archivo KML encontrado:', kmlFile.name);

    // Obtener contenido KML sin modificaciones
    console.log('📄 Extrayendo contenido KML...');
    const kmlContent = await kmlFile.async('text');
    console.log('✅ Contenido KML extraído, tamaño:', kmlContent.length, 'caracteres');

    res.set({
      'Content-Type': 'application/vnd.google-earth.kml+xml',
      'Content-Disposition': 'inline; filename="banco_agrario_raw.kml"'
    });

    console.log('📤 Enviando respuesta KML al cliente...');
    res.send(kmlContent);
    console.log('✅ Respuesta KML enviada exitosamente');
    console.log('🏛️ ===== FIN PETICIÓN BANCO AGRARIO =====\n');

  } catch (err) {
    console.error('❌ Error procesando KMZ:', err);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ error: 'Error al procesar KMZ' });
  }
});


// ─── GET /api/kmz/info ──────────────────────────────
app.get('/api/kmz/info', (req, res) => {
  const kmzPath = path.join(uploadsDir, 'RURALES_BANCO_AGRARIO.kmz');
  
  if (!fs.existsSync(kmzPath)) {
    return res.status(404).json({ error: 'Archivo KMZ no encontrado' });
  }

  const stats = fs.statSync(kmzPath);
  
  res.json({
    nombre: 'RURALES_BANCO_AGRARIO.kmz',
    tamaño: stats.size,
    fechaModificacion: stats.mtime,
    disponible: true,
    descripcion: 'Datos rurales del Banco Agrario - Red de oficinas y cobertura rural'
  });
});


// ─── Servir archivos estáticos (index.html, etc.) ────
// (esto debe ir al final)
app.use(express.static(path.join(__dirname)));

// ─── Iniciar servidor ────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔍 Logs del Banco Agrario activados - FRONTEND INTEGRADO');
});
