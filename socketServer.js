const authSocket = require('./utils/authSocket');
const newConnectionHandler = require('./socketHandlers/newConnectionHandler');
const disconnectHandler = require('./socketHandlers/disconnectHandler');
const serverStore = require('./serverStore');
const registerSocketServer = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'PUT', 'POST', 'DELETE,PATCH'],
    },
  });

  serverStore.setSocketServerInstance(io);

  io.use((socket, next) => {
    authSocket(socket, next);
  });

  io.on('connection', (socket) => {
    console.log('=============>');
    console.log('User connected');
    newConnectionHandler(socket, io);

    socket.on('disconnect', () => {
      console.log('User disconnected');
      disconnectHandler(socket);
    });
  });
};

module.exports = {
  registerSocketServer,
};
