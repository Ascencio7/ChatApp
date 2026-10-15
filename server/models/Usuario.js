const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio y debe ser un texto.'],
      trim: true,
    },
    correo: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio y debe ser un texto.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    contrasena: {
      type: String,
      required: [true, 'La contraseña (hash) es obligatoria y debe ser un texto.'],
    },
    avatar: {
      type: String,
      default: '',
    },
    estado: {
      type: String,
      enum: ['activo', 'offline'],
      default: 'activo',
      required: [true, "El estado debe ser 'activo' u 'offline'."],
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
    collection: 'usuarios',
    versionKey: false,
  }
);

usuarioSchema.pre('save', function (next) {
  this.fechaActualizacion = new Date();
  if (!this.fechaCreacion) {
    this.fechaCreacion = new Date();
  }
  next();
});

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios');

