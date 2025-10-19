const Joi = require('joi');

const UsersPayloadSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30)
    .required(),
  password: Joi.string().min(6).required(),
  fullname: Joi.string().min(3).max(100).required(),
});

module.exports = { UsersPayloadSchema };
