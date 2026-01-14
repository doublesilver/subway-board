const request = require('supertest');
const express = require('express');
const app = express();

// Basic app setup for testing health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

describe('Health Check Endpoint', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('OK');
    });
});
