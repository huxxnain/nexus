const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const qrymDrugProductSchema = new Schema({
  DRUG_CODE: {
    type: Number,

    index: true,
  },

  PRODUCT_CATEGORIZATION: {
    type: String,
    max: 80,
  },
  CLASS: {
    type: String,
    max: 40,
  },
  DRUG_IDENTIFICATION_NUMBER: {
    type: String,
    max: 29,
    index: true,
  },
  BRAND_NAME: {
    type: String,
    max: 200,
    index: true,
  },
  DESCRIPTOR: {
    type: String,
    max: 150,
  },
  ADDRESS_BILLING_FLAG: {
    type: String,
    max: 1,
  },
  PEDIATRIC_FLAG: {
    type: String,
    max: 1,
  },
  PEDIATRIC_FLAG: {
    type: String,
    max: 5,
  },
  NUMBER_OF_AIS: {
    type: String,
    max: 10,
  },
  LAST_UPDATE_DATE: {
    type: String,
  },

  AI_GROUP_NO: {
    type: String,
    max: 10,
  },
  CLASS_F: {
    type: String,
    max: 80,
  },
  BRAND_NAME_F: {
    type: String,
    max: 300,
  },
  DESCRIPTOR_F: {
    type: String,
    max: 200,
  },
  status: {
    type: Array,
    default: [],
  },

  ingredients: {
    type: Array,
    default: [],
  },
  form: {
    type: Array,
    default: [],
  },
  companies: {
    type: Array,
    default: [],
  },
  package: {
    type: Array,
    default: [],
  },
  route: {
    type: Array,
    default: [],
  },
});
qrymDrugProductSchema.index({ DRUG_CODE: 1 });
qrymDrugProductSchema.index({ DRUG_IDENTIFICATION_NUMBER: 1 });
const QRYM_DRUG_PRODUCT = mongoose.model(
  'QRYM_DRUG_PRODUCT',
  qrymDrugProductSchema
);
module.exports = QRYM_DRUG_PRODUCT;
