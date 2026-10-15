const mongoose = require('mongoose');

const ultimoMensajeSchema = new mongoose.Schema(
  {
    texto: {
      type: String,
      required: true,
    },
    remitente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const conversacionSchema = new mongoose.Schema(
  {
    participantes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Usuario',
        },
      ],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 2;
        },
        message: 'Se requiere un arreglo con al menos dos IDs de usuarios participantes.',
      },
      required: true,
    },
    ultimoMensaje: {
      type: ultimoMensajeSchema,
      required: false,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
      required: true,
    },
    fechaActualizacion: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: 'conversaciones',
    versionKey: false,
  }
);

conversacionSchema.pre('save', function (next) {
  this.fechaActualizacion = new Date();
  if (!this.fechaCreacion) {
    this.fechaCreacion = new Date();
  }
  next();
});

module.exports = mongoose.model('Conversacion', conversacionSchema, 'conversaciones');

