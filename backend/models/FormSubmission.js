const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  form: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  formTitle: { type: String, required: true },
  responses: { type: Object, required: true },
  fieldLabels: { type: Object, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
