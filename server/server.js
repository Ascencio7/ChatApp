require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Usuario = require('./models/Usuario');
const Conversacion = require('./models/Conversacion');
const Mensaje = require('./models/Mensaje');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'avasa_secret_key_2026';

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(' Conectado exitosamente a MongoDB Atlas');
  })
  .catch((err) => {
    console.error(' Error conectando a MongoDB Atlas:', err);
  });

// --- RUTAS DE AUTENTICACIÓN Y USUARIOS ---

// 1. Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena, avatar } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    }

    const cleanEmail = correo.trim().toLowerCase();

    // Verificar si el correo ya existe
    const existe = await Usuario.findOne({ correo: cleanEmail });
    if (existe) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena.trim(), salt);

    const now = new Date();
    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      correo: cleanEmail,
      contrasena: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(cleanEmail)}`,
      estado: 'activo',
      fechaCreacion: now,
      fechaActualizacion: now,
    });

    await nuevoUsuario.save();

    const token = jwt.sign({ id: nuevoUsuario._id, correo: nuevoUsuario.correo }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      user: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        avatar: nuevoUsuario.avatar,
        estado: nuevoUsuario.estado,
      },
      token,
    });
  } catch (error) {
    console.error('Error en /api/auth/register:', error);
    res.status(500).json({ error: error.message || 'Error en el servidor al registrar usuario.' });
  }
});

// 1b. Login con Google (crea o recupera usuario)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { nombre, correo, avatar, googleId } = req.body;

    if (!correo) {
      return res.status(400).json({ error: 'Correo es obligatorio para Google Sign-In.' });
    }

    const cleanEmail = correo.trim().toLowerCase();
    const now = new Date();

    // Buscar usuario existente por correo
    let usuario = await Usuario.findOne({ correo: cleanEmail });

    if (!usuario) {
      // Crear nuevo usuario Google (sin contraseña)
      usuario = new Usuario({
        nombre: nombre || cleanEmail.split('@')[0],
        correo: cleanEmail,
        contrasena: await bcrypt.hash(googleId || Math.random().toString(36), 10),
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(cleanEmail)}`,
        estado: 'activo',
        provider: 'google',
        fechaCreacion: now,
        fechaActualizacion: now,
      });
      await usuario.save();
    } else {
      // Actualizar a activo
      usuario.estado = 'activo';
      usuario.fechaActualizacion = now;
      if (avatar && !usuario.avatar?.includes('dicebear')) usuario.avatar = avatar;
      await usuario.save();
    }

    const token = jwt.sign({ id: usuario._id, correo: usuario.correo }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      user: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        avatar: usuario.avatar,
        estado: usuario.estado,
      },
      token,
    });
  } catch (error) {
    console.error('Error en /api/auth/google:', error);
    res.status(500).json({ error: error.message || 'Error al autenticar con Google.' });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos.' });
    }

    const cleanEmail = correo.trim().toLowerCase();
    const usuario = await Usuario.findOne({ correo: cleanEmail });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado con ese correo.' });
    }

    const coincide = await bcrypt.compare(contrasena.trim(), usuario.contrasena);
    if (!coincide) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    // Actualizar estado a activo
    usuario.estado = 'activo';
    usuario.fechaActualizacion = new Date();
    await usuario.save();

    const token = jwt.sign({ id: usuario._id, correo: usuario.correo }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      user: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        avatar: usuario.avatar,
        estado: usuario.estado,
      },
      token,
    });
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    res.status(500).json({ error: error.message || 'Error en el servidor al iniciar sesión.' });
  }
});

// 3. Logout (marcar offline)
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      await Usuario.findByIdAndUpdate(userId, {
        estado: 'offline',
        fechaActualizacion: new Date(),
      });
    }
    res.json({ success: true, message: 'Sesión cerrada correctamente.' });
  } catch (error) {
    console.error('Error en /api/auth/logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
});

// 4. Listar usuarios (para iniciar conversaciones)
app.get('/api/usuarios', async (req, res) => {
  try {
    const { currentUserId } = req.query;
    const filter = {};
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      filter._id = { $ne: currentUserId };
    }

    const usuarios = await Usuario.find(filter)
      .select('-contrasena')
      .sort({ nombre: 1 });

    res.json(usuarios);
  } catch (error) {
    console.error('Error en /api/usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// --- RUTAS DE CONVERSACIONES ---

// 5. Obtener conversaciones de un usuario
app.get('/api/conversaciones', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'userId válido es obligatorio.' });
    }

    const conversaciones = await Conversacion.find({
      participantes: new mongoose.Types.ObjectId(userId),
    })
      .populate('participantes', 'nombre correo avatar estado')
      .populate('ultimoMensaje.remitente', 'nombre correo avatar')
      .sort({ fechaActualizacion: -1 });

    res.json(conversaciones);
  } catch (error) {
    console.error('Error en /api/conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones.' });
  }
});

// 6. Crear o recuperar conversación existente entre 2 usuarios
app.post('/api/conversaciones', async (req, res) => {
  try {
    const { remitenteId, destinatarioId } = req.body;

    if (!remitenteId || !destinatarioId) {
      return res.status(400).json({ error: 'remitenteId y destinatarioId son requeridos.' });
    }

    if (remitenteId === destinatarioId) {
      return res.status(400).json({ error: 'No puedes crear una conversación contigo mismo.' });
    }

    // Buscar si ya existe una conversación entre estos dos usuarios
    let conversacion = await Conversacion.findOne({
      participantes: { $all: [remitenteId, destinatarioId] },
    })
      .populate('participantes', 'nombre correo avatar estado')
      .populate('ultimoMensaje.remitente', 'nombre correo avatar');

    if (conversacion) {
      return res.json({ success: true, conversacion, isNew: false });
    }

    const now = new Date();
    conversacion = new Conversacion({
      participantes: [remitenteId, destinatarioId],
      fechaCreacion: now,
      fechaActualizacion: now,
    });

    await conversacion.save();

    conversacion = await Conversacion.findById(conversacion._id)
      .populate('participantes', 'nombre correo avatar estado')
      .populate('ultimoMensaje.remitente', 'nombre correo avatar');

    res.status(201).json({ success: true, conversacion, isNew: true });
  } catch (error) {
    console.error('Error en POST /api/conversaciones:', error);
    res.status(500).json({ error: error.message || 'Error al crear conversación.' });
  }
});

// --- RUTAS DE MENSAJES ---

// 7. Obtener mensajes de una conversación
app.get('/api/mensajes/:conversacionId', async (req, res) => {
  try {
    const { conversacionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversacionId)) {
      return res.status(400).json({ error: 'ID de conversación inválido.' });
    }

    const mensajes = await Mensaje.find({ conversacionId })
      .populate('remitente', 'nombre correo avatar estado')
      .sort({ fechaCreacion: 1 });

    res.json(mensajes);
  } catch (error) {
    console.error('Error en GET /api/mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes.' });
  }
});

// 8. Enviar mensaje
app.post('/api/mensajes', async (req, res) => {
  try {
    const { conversacionId, remitente, texto } = req.body;

    if (!conversacionId || !remitente || !texto) {
      return res.status(400).json({ error: 'conversacionId, remitente y texto son requeridos.' });
    }

    const now = new Date();
    const nuevoMensaje = new Mensaje({
      conversacionId: new mongoose.Types.ObjectId(conversacionId),
      remitente: new mongoose.Types.ObjectId(remitente),
      texto: texto.trim(),
      leido: false,
      fechaCreacion: now,
      fechaActualizacion: now,
    });

    await nuevoMensaje.save();

    // Actualizar ultimoMensaje y fechaActualizacion en la conversación
    await Conversacion.findByIdAndUpdate(conversacionId, {
      ultimoMensaje: {
        texto: texto.trim(),
        remitente: new mongoose.Types.ObjectId(remitente),
        fecha: now,
      },
      fechaActualizacion: now,
    });

    const populatedMensaje = await Mensaje.findById(nuevoMensaje._id).populate(
      'remitente',
      'nombre correo avatar estado'
    );

    res.status(201).json({ success: true, mensaje: populatedMensaje });
  } catch (error) {
    console.error('Error en POST /api/mensajes:', error);
    res.status(500).json({ error: error.message || 'Error al enviar mensaje.' });
  }
});

// 9. Marcar mensajes de una conversación como leídos
app.put('/api/mensajes/leer/:conversacionId', async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const { currentUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversacionId)) {
      return res.status(400).json({ error: 'ID de conversación inválido.' });
    }

    const filter = { conversacionId, leido: false };
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      // Marcar solo los mensajes enviados por el otro usuario
      filter.remitente = { $ne: new mongoose.Types.ObjectId(currentUserId) };
    }

    await Mensaje.updateMany(filter, {
      $set: { leido: true, fechaActualizacion: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar leídos:', error);
    res.status(500).json({ error: 'Error al marcar mensajes como leídos.' });
  }
});

// Ruta de estado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado',
    timestamp: new Date(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(` Servidor de ChatApp corriendo en http://localhost:${PORT}`);
  console.log(` Endpoint de salud: http://localhost:${PORT}/api/health`);
});

