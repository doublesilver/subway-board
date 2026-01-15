const request = require('supertest');
const express = require('express');
const fs = require('fs');

function log(msg) {
    fs.appendFileSync('debug_log.txt', msg + '\n');
}

// DEFINING MOCKS FIRST
jest.mock('../src/db/connection', () => ({
    query: jest.fn()
}));

jest.mock('../src/utils/activeUsers', () => ({
    recordActivity: jest.fn(),
    broadcastNewMessage: jest.fn(),
    removeActivity: jest.fn()
}));

jest.mock('../src/utils/userHelper', () => ({
    getOrCreateUser: jest.fn()
}));

const { getPostsByLine, createPost, deletePost } = require('../src/controllers/postController');
const { ErrorCodes } = require('../src/utils/errorCodes');
const pool = require('../src/db/connection');
const { getOrCreateUser } = require('../src/utils/userHelper');

const app = express();
app.use(express.json());

// Mock Auth Middleware
app.use((req, res, next) => {
    req.user = req.headers['x-user-id'] ? { id: req.headers['x-user-id'] } : null;
    next();
});

// Routes
app.get('/api/posts/line/:lineId', getPostsByLine);
app.post('/api/posts', createPost);
app.delete('/api/posts/:postId', deletePost);

// Error Handler
app.use((err, req, res, next) => {
    log('EXPRESS ERROR HANDLER: ' + err.message + ' Code: ' + err.errorCode);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: {
            message: err.message,
            code: err.errorCode || 'UNKNOWN_ERROR'
        }
    });
});

describe('Post Controller', () => {
    beforeAll(() => {
        fs.writeFileSync('debug_log.txt', 'START TESTING\n');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/posts/line/:lineId', () => {
        it('should return 200 and posts for valid line', async () => {
            pool.query
                .mockResolvedValueOnce({ rows: [{ id: 1, content: 'Hello' }] })
                .mockResolvedValueOnce({ rows: [{ count: '1' }] });

            const res = await request(app).get('/api/posts/line/1?page=1');

            if (res.statusCode !== 200) {
                log('FAIL GET /line/1: ' + res.statusCode + ' ' + JSON.stringify(res.body));
            }
            expect(res.statusCode).toBe(200);
        });

        it('should return 400 for invalid line ID', async () => {
            const res = await request(app).get('/api/posts/line/999');

            if (res.statusCode !== 400) {
                log('FAIL GET /line/999: ' + res.statusCode + ' ' + JSON.stringify(res.body));
            }
            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/posts', () => {
        it('should create a post if authenticated', async () => {
            const mockUser = { id: 1, nickname: 'Tester', anonymous_id: 'uuid-123' };
            getOrCreateUser.mockResolvedValue(mockUser);

            pool.query.mockResolvedValueOnce({ rows: [{ id: 10, content: 'New Post', created_at: new Date() }] });

            const res = await request(app)
                .post('/api/posts')
                .set('x-user-id', 'user-123')
                .send({ content: 'New Post', subway_line_id: 2 });

            if (res.statusCode !== 201) {
                log('FAIL POST /posts: ' + res.statusCode + ' ' + JSON.stringify(res.body));
            }
            expect(res.statusCode).toBe(201);
        });
    });
});
