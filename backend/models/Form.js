const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const fieldSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  type: { type: String, required: true },
  label: { type: String, required: true },
  name: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [String],
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  title: { type: String, required: true },
  fields: [fieldSchema],
}, { _id: false });

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  sections: [sectionSchema],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isEditable: { type: Boolean, default: false },
  allowDeletion: { type: Boolean, default: false },
  customLink: { 
    type: String,
    sparse: true,
    unique: true,
    set: v => v === '' ? undefined : v
  },
  urlId: { 
    type: String, 
    default: uuidv4,
    unique: true
  },
  expiryDate: { type: Date },
  lastEditedAt: { type: Date },
  published: { type: Boolean, default: true },
}, { timestamps: true });

// Remove the compound index
formSchema.index({ customLink: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Form', formSchema);
