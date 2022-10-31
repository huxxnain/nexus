const Joi = require('joi');
const validator = require('express-joi-validation').createValidator({});

const productInventorySchema = Joi.object({
  quantity: Joi.number().required(),
  product: Joi.string().required(),
  pharmacy: Joi.string().required(),
  expiry_date: Joi.date().required(),
  price: Joi.number().required(),
  DIN_NUMBER: Joi.string().required(),
});

const subInventorySchema = Joi.object().keys({
  quantity: Joi.number().required(),
  expiry_date: Joi.date().required(),
});

const productSchema = Joi.object({
  quantity: Joi.number().required(),
  expiry_date: Joi.date().required(),
  product_name: Joi.string().required(),
  sub_brand: Joi.string(),
  imageCover: Joi.object().keys(),
  images: Joi.array().items(Joi.object().keys().allow('')),
  PACKAGING_SIZE: Joi.string().required(),
  price: Joi.number().required(),
  pharmacy_id: Joi.string().required(),
  // payment: Joi.string(),
  // fullfillment: Joi.string(),
  description: Joi.string().required(),
  DRUG_CODE: Joi.number(),
  PRODUCT_CATEGORIZATION: Joi.string(),
  CLASS: Joi.string(),
  brand: Joi.string().required(),
  DRUG_IDENTIFICATION_NUMBER: Joi.string(),
  BRAND_NAME: Joi.string(),
  product_category_name: Joi.string().required(),
  batch_number: Joi.string().required(),
  PRODUCT_FORM: Joi.string().required(),
  DESCRIPTOR: Joi.string().allow(''),
  ADDRESS_BILLING_FLAG: Joi.string().allow(''),
  BRAND_NAME_F: Joi.string().allow(''),
  DESCRIPTOR_F: Joi.string().allow(''),
  PEDIATRIC_FLAG: Joi.string().allow(''),
  NUMBER_OF_AIS: Joi.string().allow(''),
  LAST_UPDATE_DATE: Joi.string().allow(''),
  AI_GROUP_NO: Joi.string().allow(''),
  CLASS_F: Joi.string().optional(),
  BRAND_NAME_F: Joi.string().allow(''),
  DESCRIPTOR_F: Joi.string().allow(''),
  status: Joi.array().items(Joi.object().keys().allow('')),
  ingredients: Joi.array().items(Joi.object().keys().allow('')),
  form: Joi.array().items(Joi.object().keys().allow('')),
  companies: Joi.array().items(Joi.object().keys().allow('')),
  package: Joi.array().items(Joi.object().keys().allow('')),
  route: Joi.array().items(Joi.object().keys().allow('')),
});

exports.validator = {
  validator,
  productSchema,
  productInventorySchema,
};
