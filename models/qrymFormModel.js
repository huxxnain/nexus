const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const qrymDrugFORMSchema = new Schema({
  DRUG_CODE: {
    type: mongoose.Schema.Types.Number,
    ref: 'QRYM_DRUG_PRODUCT',
    index: true,
  },

  PHARM_FORM_CODE: {
    type: Number,
    max: 207,
  },
  PHARMACEUTICAL_FORM: {
    type: String,
    max: 40,
  },
  PHARMACEUTICAL_FORM_F: {
    type: String,
    max: 80,
  },
});

const QRYM_DRUG_FORM = mongoose.model('QRYM_DRUG_FORM', qrymDrugFORMSchema);
module.exports = QRYM_DRUG_FORM;
