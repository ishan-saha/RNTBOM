'use strict';

const mongoose = require('mongoose');

const SocialMetaSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: 'website' },
    card: { type: String, trim: true, default: 'summary_large_image' },
  },
  { _id: false }
);

const SeoSettingSchema = new mongoose.Schema(
  {
    route: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      default: '/',
    },
    pageName: {
      type: String,
      required: true,
      trim: true,
    },
    metaTitle: {
      type: String,
      required: true,
      trim: true,
    },
    metaDescription: {
      type: String,
      required: true,
      trim: true,
    },
    canonicalUrl: {
      type: String,
      trim: true,
      default: '',
    },
    keywords: {
      type: [String],
      default: [],
    },
    openGraph: {
      type: SocialMetaSchema,
      default: () => ({}),
    },
    twitter: {
      type: SocialMetaSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SeoSetting', SeoSettingSchema);