const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

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

// ─── Servir archivos estáticos (index.html, etc.) ────
// (esto debe ir al final)
app.use(express.static(path.join(__dirname)));

// ─── Iniciar servidor ────────────────────────────────
app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});
