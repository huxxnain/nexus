const jwt = require('jsonwebtoken');

exports.signToken = (id) => {
  return jwt.sign({ id }, 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
