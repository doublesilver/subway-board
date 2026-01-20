const { Server } = require('socket.io');
const logger = require('./logger');

let io = null;

/**
 * Socket.IO 서버 초기화
 * Redis Adapter 사용 시: REDIS_URL 환경변수 설정
 * 예: REDIS_URL=redis://localhost:6379
 */
const init = async (httpServer, options) => {
    io = new Server(httpServer, options);

    // Redis Adapter (수평 확장 시 활성화)
    if (process.env.REDIS_URL) {
        try {
            const { createAdapter } = require('@socket.io/redis-adapter');
            const { createClient } = require('redis');

            const pubClient = createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);

            io.adapter(createAdapter(pubClient, subClient));
            logger.info('Socket.IO Redis Adapter connected');
        } catch (err) {
            logger.warn('Redis Adapter failed, using default in-memory adapter:', err.message);
        }
    }

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
