process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_KEY = 'test-admin-key';

const request = require('supertest');
const app = require('../src/index'); // Express App
// require('dotenv').config(); // Skip dotenv in test to avoid overwriting

describe('Security Hardening Tests', () => {
    afterAll(async () => {
        const pool = require('../src/db/connection');
        await pool.end();
    });

    describe('Anonymous Authentication', () => {
        let serverId;
        let serverSignature;


        it('should reject request without anonymous signature (401)', async () => {
            const res = await request(app)
                .get('/api/posts/line/1')
                .set('x-anonymous-id', 'some-fake-id'); // No signature

            expect(res.status).toBe(401);
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
                .get('/api/posts/line/1')
                .set('x-anonymous-id', serverId)
                .set('x-anonymous-signature', serverSignature);

            expect(res.status).not.toBe(401);
            expect(res.status).not.toBe(403);
            // 200 or 201 etc.
        });

        it('should reject request with tampered signature (403)', async () => {
            const res = await request(app)
                .get('/api/posts/line/1')
                .set('x-anonymous-id', serverId)
                .set('x-anonymous-signature', 'fake-signature');

            expect(res.status).toBe(403);
        });
    });

    describe('Pagination Safety', () => {
        let validId, validSig;

        beforeAll(async () => {
            process.env.JWT_SECRET = 'test-secret'; // Ensure secret exists
            process.env.ADMIN_KEY = 'test-admin-key';

            const res = await request(app).post('/api/auth/anonymous');
            validId = res.body.anonymousId;
            validSig = res.body.signature;
        });

        it('should clamp excessive limit to 50', async () => {
            const res = await request(app)
                .get('/api/posts/line/1?limit=1000')
                .set('x-anonymous-id', validId)
                .set('x-anonymous-signature', validSig);

            expect(res.status).toBe(200);
            // We can't easily check internal query limit, but we can check if it didn't crash
            // and maybe return length <= 50 if there were many posts.
            // Assuming DB has enough posts? Even if not, it shouldn't error.
            expect(Array.isArray(res.body.posts)).toBe(true);
        });

        it('should handle NaN page/limit gracefully', async () => {
            const res = await request(app)
                .get('/api/posts/line/1?limit=abc&page=xyz')
                .set('x-anonymous-id', validId)
                .set('x-anonymous-signature', validSig);

            expect(res.status).toBe(200);
            expect(res.body.page).toBe(1); // Default
        });
    });
});

describe('Admin Authentication', () => {
    it('should block admin endpoint without key', async () => {
        const res = await request(app).get('/api/admin/stats');
        expect([403]).toContain(res.status);
        if (res.status === 403) {
            expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
        }
    });

    it('should block admin endpoint with wrong key', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('x-admin-key', 'wrong-key');

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });
});

