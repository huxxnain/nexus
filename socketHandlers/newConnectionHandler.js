const serverStore = require('../serverStore');

const newConnectionHandler = async (socket, io) => {
  const userDetails = socket.user;

  serverStore.addNewConnectedUser({
    socketId: socket.id,
    userId: userDetails.id,
  });
};

module.exports = newConnectionHandler;
