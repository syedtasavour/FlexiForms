const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create a new form
router.post('/', auth, async (req, res) => {
  try {
    const { title, sections, isEditable, allowDeletion, requireAccount, customLink, expiryDate } = req.body;
    
    console.log('Received form data:', req.body);

    const formData = {
      title,
      sections,
      owner: req.user.userId,
      isEditable,
      allowDeletion,
      requireAccount,
      expiryDate,
      urlId: uuidv4(), // Always generate a UUID
    };

    // Only add customLink to formData if it's provided and not an empty string
    if (customLink && customLink.trim() !== '') {
      // Check if custom link is already in use
      const existingForm = await Form.findOne({ customLink: customLink.trim() });
      if (existingForm) {
        return res.status(400).json({ error: 'This custom link is already in use' });
      }
      formData.customLink = customLink.trim();
    }

    const form = new Form(formData);
    await form.save();
    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get a form by ID or custom link (public route)
router.get('/:idOrCustomLink', async (req, res) => {
  try {
    const { idOrCustomLink } = req.params;
    let form;

    // Check if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(idOrCustomLink)) {
      form = await Form.findById(idOrCustomLink);
    } else {
      // If not a valid ObjectId, try to find by custom link
      form = await Form.findOne({ customLink: idOrCustomLink });
    }

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Remove the expiry check here to allow fetching expired forms
    // if (form.expiryDate && new Date() > new Date(form.expiryDate)) {
    //   return res.status(403).json({ error: 'This form has expired' });
    // }

    // Instead, add an 'expired' flag to the response
    const isExpired = form.expiryDate && new Date() > new Date(form.expiryDate);
    
    res.json({
      ...form.toObject(),
      expired: isExpired
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit a form response (public route, but tracks user if logged in)
router.post('/:id/submit', optionalAuth, upload.any(), async (req, res) => {
  try {
    console.log('Received form submission request for form ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const form = await Form.findById(req.params.id);
    if (!form) {
      console.log('Form not found');
      return res.status(404).json({ error: 'Form not found' });
    }
    console.log('Found form:', form);

    if (form.expiryDate && new Date() > new Date(form.expiryDate)) {
      console.log('Form has expired');
      return res.status(403).json({ error: 'This form has expired' });
    }
    
    // Prevent form creator from submitting
    if (req.user && form.owner.toString() === req.user.userId) {
      console.log('Form creator attempted to submit their own form');
      return res.status(403).json({ error: 'Form creators cannot submit their own forms' });
    }

    let responses = req.body.responses;
    console.log('Received responses:', responses);

    // Validate responses against form fields
    const validResponses = {};
    const fieldLabels = {};
    form.sections.forEach(section => {
      section.fields.forEach(field => {
        if (responses.hasOwnProperty(field._id)) {
          validResponses[field._id] = responses[field._id];
          fieldLabels[field._id] = field.label;
        }
      });
    });
    console.log('Validated responses:', validResponses);
    console.log('Field labels:', fieldLabels);

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      console.log('Received files:', req.files);
      req.files.forEach(file => {
        if (responses.hasOwnProperty(file.fieldname)) {
          validResponses[file.fieldname] = file.filename;
        }
      });
    }

    const submission = new FormSubmission({
      form: form._id,
      formTitle: form.title,
      responses: validResponses,
      fieldLabels: fieldLabels,
      submittedBy: req.user ? req.user.userId : null,
    });

    console.log('Submission object before save:', submission);
    await submission.save();
    console.log('Saved submission:', submission);
    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's form submissions
router.get('/user/submissions', auth, async (req, res) => {
  try {
    console.log('Fetching submissions for user:', req.user.userId);
    const submissions = await FormSubmission.find({ submittedBy: req.user.userId })
      .populate('form', 'title isEditable allowDeletion')
      .sort({ createdAt: -1 });
    console.log('Submissions found:', submissions.length);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get form submissions (for a specific form)
router.get('/:id/submissions', auth, async (req, res) => {
  try {
    console.log('Fetching submissions for form:', req.params.id);
    const form = await Form.findById(req.params.id);
    if (!form) {
      console.log('Form not found');
      return res.status(404).json({ error: 'Form not found' });
    }
    // Remove this check to allow all authenticated users to view submissions
    // if (form.creator.toString() !== req.user.userId) {
    //   console.log('Unauthorized access attempt');
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }
    const submissions = await FormSubmission.find({ form: form._id }).sort({ createdAt: -1 });
    console.log('Submissions found:', submissions.length);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a form
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, sections, isEditable, allowDeletion, requireAccount, customLink, expiryDate } = req.body;
    
    console.log('Received form update data:', req.body);
    
    const updateData = {
      title,
      sections,
      isEditable,
      allowDeletion,
      requireAccount,
      expiryDate,
      lastEditedAt: new Date(),
    };

    // Only update customLink if it's provided and not an empty string
    if (customLink && customLink.trim() !== '') {
      // Check if custom link is already in use by another form
      const existingForm = await Form.findOne({ customLink: customLink.trim(), _id: { $ne: req.params.id } });
      if (existingForm) {
        return res.status(400).json({ error: 'Custom link is already in use' });
      }
      updateData.customLink = customLink.trim();
    } else {
      // If customLink is empty or not provided, remove it from the form
      updateData.$unset = { customLink: 1 };
    }

    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      updateData,
      { new: true }
    );
    
    if (!form) {
      console.log('Form not found or unauthorized');
      return res.status(404).json({ error: 'Form not found or unauthorized' });
    }
    
    console.log('Updated form:', form);
    res.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all forms for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching forms for user:', req.user.userId);
    const forms = await Form.find({ owner: req.user.userId });
    console.log('Forms found:', forms.length);
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a form (hard delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const form = await Form.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or unauthorized' });
    }
    
    // Optionally, you can also delete associated submissions
    // await FormSubmission.deleteMany({ form: req.params.id });
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a shared form by custom link, UUID, or ID (public route)
router.get('/shared/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log('Fetching shared form with identifier:', identifier);
    
    let form;

    // First, try to find by custom link
    form = await Form.findOne({ customLink: identifier }).select('-owner');
    
    // If not found by custom link, try to find by UUID
    if (!form) {
      form = await Form.findOne({ urlId: identifier }).select('-owner');
    }

    // If still not found, try to find by ID
    if (!form && mongoose.Types.ObjectId.isValid(identifier)) {
      form = await Form.findById(identifier).select('-owner');
    }

    if (!form) {
      console.log('Form not found for identifier:', identifier);
      return res.status(404).json({ error: 'Form not found' });
    }

    console.log('Found form:', form);

    if (form.expiryDate && new Date() > new Date(form.expiryDate)) {
      console.log('Form has expired:', form._id);
      return res.status(403).json({ error: 'This form has expired' });
    }

    res.json(form);
  } catch (error) {
    console.error('Error fetching shared form:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific submission
router.get('/submissions/:id', auth, async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id).populate({
      path: 'form',
      select: 'title sections owner'
    });
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Check if the user is the form owner or the submission creator
    if (submission.form.owner.toString() !== req.user.userId && 
        submission.submittedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a submission
router.delete('/submissions/:id', auth, async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id).populate('form');
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (submission.submittedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Check if the form exists
    if (!submission.form) {
      // If the form doesn't exist, we can still delete the submission
      await submission.remove();
      return res.json({ message: 'Submission deleted successfully' });
    }
    
    // If the form exists, check its properties
    if (submission.form.isDeleted) {
      return res.status(400).json({ error: 'Cannot delete submission for a deleted form' });
    }
    if (!submission.form.allowDeletion) {
      return res.status(403).json({ error: 'Deletion not allowed for this form' });
    }
    
    await submission.remove();
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a submission
router.put('/submissions/:id', auth, async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id).populate('form');
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Check if the user is authorized to edit this submission
    if (submission.submittedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this submission' });
    }
    
    // Check if the form allows editing
    if (!submission.form.isEditable) {
      return res.status(403).json({ error: 'This form does not allow editing submissions' });
    }
    
    // Update the submission
    submission.responses = req.body.responses;
    await submission.save();
    
    res.json({ message: 'Submission updated successfully', submission });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get expired forms
router.get('/expired', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    console.log('Fetching expired forms for user:', req.user.userId);
    console.log('Current date:', currentDate);
    const expiredForms = await Form.find({
      owner: req.user.userId,
      expiryDate: { $lt: currentDate },
      isDeleted: false // Only fetch non-deleted forms
    });
    console.log('Expired forms found:', expiredForms.length);
    console.log('Expired forms:', expiredForms.map(form => ({
      id: form._id,
      title: form.title,
      expiryDate: form.expiryDate
    })));
    res.json(expiredForms);
  } catch (error) {
    console.error('Error fetching expired forms:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Expire a form immediately
router.put('/:id/expire', auth, async (req, res) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { expiryDate: new Date(), published: false },
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or unauthorized' });
    }
    
    res.json({ message: 'Form expired successfully', form });
  } catch (error) {
    console.error('Error expiring form:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Publish or unpublish a form
router.put('/:id/publish', auth, async (req, res) => {
  try {
    const { published } = req.body;
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { published, expiryDate: published ? null : new Date() },
      { new: true }
    );
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or unauthorized' });
    }
    
    res.json({ message: `Form ${published ? 'published' : 'unpublished'} successfully`, form });
  } catch (error) {
    console.error('Error updating form publish state:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
