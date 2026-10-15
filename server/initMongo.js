require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkAndInitMongo() {
  console.log('Intentando conectar a MongoDB Atlas...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión a MongoDB Atlas exitosa!');

    const db = mongoose.connection.db;

    // Crear colecciones si no existen
    const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);
    console.log('Colecciones existentes en la BD:', existingCollections);

    // Asegurar índices según especificación
    console.log('Verificando y creando índices...');
    await db.collection('usuarios').createIndex({ correo: 1 }, { unique: true });
    console.log('✅ Índice db.usuarios.createIndex({ correo: 1 }, { unique: true }) verificado.');

    await db.collection('conversaciones').createIndex({ participantes: 1 });
    console.log('✅ Índice db.conversaciones.createIndex({ participantes: 1 }) verificado.');

    await db.collection('mensajes').createIndex({ conversacionId: 1, fechaCreacion: 1 });
    console.log('✅ Índice db.mensajes.createIndex({ conversacionId: 1, fechaCreacion: 1 }) verificado.');

    console.log('🎉 Inicialización de MongoDB completada con éxito.');
  } catch (err) {
    console.error('❌ Error conectando o inicializando MongoDB Atlas:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
  }
}

checkAndInitMongo();

