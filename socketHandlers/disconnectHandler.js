const serverStore =  require('../serverStore')


const  disconnectHandler = async (socket,io) =>{
    const userDetails = socket.user
    serverStore.removeConnectedUser(socket.id)




}

module.exports = disconnectHandler