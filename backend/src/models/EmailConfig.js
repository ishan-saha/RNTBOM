'use strict';

const mongoose = require('mongoose');

const EmailConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
      default: 'gmail',
    },
    host: {
      type: String,
      required: true,
      trim: true,
    },
    port: {
      type: Number,
      required: true,
      default: 587,
    },
    secure: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    fromName: {
      type: String,
      required: true,
      trim: true,
    },
    fromEmail: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

EmailConfigSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.passwordStatus = ret.password ? 'configured' : 'not-configured';
    delete ret.password;
    return ret;
  },
});

EmailConfigSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.passwordStatus = ret.password ? 'configured' : 'not-configured';
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('EmailConfig', EmailConfigSchema);