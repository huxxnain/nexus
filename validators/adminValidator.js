const Joi = require('joi');
const validator = require('express-joi-validation').createValidator({});

const signupSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
  passwordConfirm: Joi.string().required(),
  first_name: Joi.string().required(),
  phone_number: Joi.string().required(),
  address: Joi.string(),
  last_name: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().required(),
});

const updatePasswordSchema = Joi.object({
  password: Joi.string().required(),
  passwordConfirm: Joi.string().required(),
  passwordCurrent: Joi.string().required(),
});
const resetPasswordSchema = Joi.object({
  password: Joi.string().required(),
  passwordConfirm: Joi.string().required(),
});

const resetPasswordTokenSchema = Joi.object({
  token: Joi.string().required(),
});

exports.validator = {
  signupSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  validator,
};
