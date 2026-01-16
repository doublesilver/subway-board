const { Server } = require('socket.io');
const logger = require('./logger');

let io = null;

const init = (httpServer, options) => {
    io = new Server(httpServer, options);
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
};

module.exports = {
    init,
    getIO
};
