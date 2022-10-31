const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const pharmacyverifiactionDocumentSchema = mongoose.Schema({
  id_type: {
    type: String,
    required: [true, 'Please tell us your document type!'],
  },
  front_picture: {
    type: String,
    required: [true, 'Front picture  is required'],
  },
  back_picture: {
    type: String,
    required: [true, 'Back picture  is required'],
  },
  pharmacy_id: {
    type: String,
  },
});

const PharmacyVerificationDocument = mongoose.model(
  'PharmacyvVerificationDocument',
  pharmacyverifiactionDocumentSchema
);
module.exports = PharmacyVerificationDocument;
