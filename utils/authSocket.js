const jwt = require('jsonwebtoken');

require('dotenv').config();

const verifyTokenSocket = (socket, next) => {
  try {
    const token = socket?.handshake?.auth?.token;

    const decoded = jwt.verify(token, 'secret');

    socket.user = decoded;
  } catch (err) {
    const socketError = new Error('NOT_AUTHORIZED');
    return next(socketError);
  }
  next();
};

module.exports = verifyTokenSocket;
