const Joi = require('joi');
const validator = require('express-joi-validation').createValidator({});

const signupSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
  passwordConfirm: Joi.string().required(),
  pharmacy_name: Joi.string().required(),
  mobile_no: Joi.string().required(),
  location: Joi.string().required(),
  lat_long: Joi.array().items(Joi.number()).required(),
  postcode: Joi.string(),
  country_code: Joi.string(),
  timeZone: Joi.string(),
  country: Joi.string().required(),
  state: Joi.string().required(),
  city: Joi.string().required(),
  pharmacy_owner: Joi.string().required(),
  pharmacy_license_number: Joi.string().required(),
  pharmacy_landline_num: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().required(),
  passwordConfirm: Joi.string().required(),
});

const resetPasswordTokenSchema = Joi.object({
  token: Joi.string().required(),
});

const updatePasswordSchema = Joi.object({
  password: Joi.string().required(),
  passwordConfirm: Joi.string().required(),
  passwordCurrent: Joi.string().required(),
});

const updateEmailSchema = Joi.object({
  email: Joi.string().required(),
  pharmacyId: Joi.string().required(),
});

exports.validator = {
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  updatePasswordSchema,
  updateEmailSchema,
  validator,
};
