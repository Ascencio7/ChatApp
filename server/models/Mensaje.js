const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema(
  {
    conversacionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversacion',
      required: [true, 'El ID de la conversación es obligatorio y debe ser un ObjectId.'],
    },
    remitente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El ID del usuario remitente es obligatorio.'],
    },
    texto: {
      type: String,
      required: [true, 'El contenido textual del mensaje es obligatorio.'],
    },
    leido: {
      type: Boolean,
      default: false,
      required: [true, 'El indicador de lectura debe ser verdadero o falso.'],
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
      required: [true, 'Marca de tiempo de envío obligatoria.'],
    },
    fechaActualizacion: {
      type: Date,
      default: Date.now,
      required: [true, 'Marca de tiempo de modificación obligatoria.'],
    },
  },
  {
    collection: 'mensajes',
    versionKey: false,
  }
);

mensajeSchema.pre('save', function (next) {
  this.fechaActualizacion = new Date();
  if (!this.fechaCreacion) {
    this.fechaCreacion = new Date();
  }
  next();
});

module.exports = mongoose.model('Mensaje', mensajeSchema, 'mensajes');

