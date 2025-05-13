const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(cors());

// 👉 Sirve TODOS tus archivos estáticos (index.html, JS, CSS, etc.)
app.use(express.static(path.join(__dirname)));

// Asegurar que exista la carpeta uploads y servirla
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Multer: configuramos dos campos, imágenes y polígono
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// — POST /api/ofertas — recibe 'imagenes' (array) y 'poligono' (single)
app.post(
  '/api/ofertas',
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'poligono',  maxCount: 1  }
  ]),
  (req, res) => {
    // ─── 1) Logs iniciales ─────────────────────────────────────────────
    console.log('📥 req.body:',  req.body);
    console.log('📥 req.files:', req.files);

    try {
      // ─── 2) Parse seguro de unidadesFisiograficas ───────────────────
      const datos = req.body;
      let unidades = [];
      if (datos.unidadesFisiograficas) {
        try {
          unidades = JSON.parse(datos.unidadesFisiograficas);
          console.log('✅ unidadesFisiograficas PARSED:', unidades);
        } catch(parseErr) {
          console.error('❌ Error parsing unidadesFisiograficas:', parseErr, 'raw:', datos.unidadesFisiograficas);
          unidades = [];
        }
      }

      // ─── 3) Montar resto de datos y archivos ────────────────────────
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

      // ─── 4) Guardar en inmuebles.json ────────────────────────────────
      const filePath = path.join(__dirname, 'inmuebles.json');
      let todas = [];
      if (fs.existsSync(filePath)) {
        todas = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
      }
      todas.push(oferta);
      fs.writeFileSync(filePath, JSON.stringify(todas, null, 2), 'utf-8');

      // ─── 5) Responder con la nueva oferta ────────────────────────────
      res.json({ oferta });
    }
    catch (err) {
      // ─── 6) Error handling mejorado ─────────────────────────────────
      console.error('🔥 Error interno al guardar oferta:', err);
      res.status(500).json({
        error: err.message,
        stack: err.stack.split('\n').slice(0,3)
      });
    }
  }
);

// GET /api/ofertas — devuelve todas las ofertas
app.get('/api/ofertas', (req, res) => {
  const filePath = path.join(__dirname, 'inmuebles.json');
  if (!fs.existsSync(filePath)) return res.json([]);
  const contenido = fs.readFileSync(filePath, 'utf-8') || '[]';
  res.json(JSON.parse(contenido));
});

// (Opcional) mantener tu ruta antigua /api/inmuebles
app.get('/api/inmuebles', (req, res) => {
  res.redirect(301, '/api/ofertas');
});

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});
