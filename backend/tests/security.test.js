process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_KEY = 'test-admin-key';

const request = require('supertest');
const express = require('express');

const authMiddleware = require('../src/middleware/authMiddleware');
const adminMiddleware = require('../src/middleware/adminMiddleware');
const authController = require('../src/controllers/authController');

const app = express();
app.use(express.json());

app.post('/api/auth/anonymous', authController.issueAnonymousSignature);
app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ ok: true, userType: req.user?.type || null });
});
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
    res.json({ ok: true });
});

describe('Security Hardening Tests', () => {
    describe('Anonymous Authentication', () => {
        let serverId;
        let serverSignature;

        it('should allow anonymous access without signature', async () => {
            const res = await request(app)
                .get('/api/protected')
                .set('x-anonymous-id', 'some-fake-id');

            expect(res.status).toBe(200);
            expect(res.body.userType).toBe('anonymous');
        });

        it('should issue a new anonymous ID and signature from server', async () => {
            const res = await request(app)
                .post('/api/auth/anonymous');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('anonymousId');
            expect(res.body).toHaveProperty('signature');

            serverId = res.body.anonymousId;
            serverSignature = res.body.signature;
        });

        it('should accept request with valid server-issued signature', async () => {
            const res = await request(app)
                .get('/api/protected')
                .set('x-anonymous-id', serverId)
                .set('x-anonymous-signature', serverSignature);

            expect(res.status).toBe(200);
            expect(res.body.userType).toBe('anonymous');
        });

        it('should reject request with tampered signature (403)', async () => {
            const res = await request(app)
                .get('/api/protected')
                .set('x-anonymous-id', serverId)
                .set('x-anonymous-signature', 'fake-signature');

            expect(res.status).toBe(403);
        });
    });
});

describe('Admin Authentication', () => {
    it('should block admin endpoint without key', async () => {
        const res = await request(app).get('/api/admin/stats');
        expect(res.status).toBe(403);
    });

    it('should block admin endpoint with wrong key', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('x-admin-key', 'wrong-key');

        expect(res.status).toBe(403);
    });
});
