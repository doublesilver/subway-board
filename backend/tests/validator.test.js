const { validatePost, validateComment } = require('../src/middleware/validator');
const { ErrorCodes } = require('../src/utils/errorCodes');
const httpMocks = require('node-mocks-http');

describe('Validator Middleware', () => {
    describe('validatePost', () => {
        it('should call next() for valid input', () => {
            const req = httpMocks.createRequest({
                body: { content: 'Valid content', subway_line_id: 1 }
            });
            const res = httpMocks.createResponse();
            const next = jest.fn();

            validatePost(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should return 400 for empty content', () => {
            const req = httpMocks.createRequest({
                body: { content: '', subway_line_id: 1 }
            });
            const res = httpMocks.createResponse();
            const next = jest.fn();

            validatePost(req, res, next);
            expect(res.statusCode).toBe(400);
            expect(JSON.parse(res._getData()).error.code).toBe(ErrorCodes.VALIDATION_EMPTY_CONTENT);
        });

        it('should return 400 for SQL injection attempts', () => {
            const req = httpMocks.createRequest({
                body: { content: 'SELECT * FROM users', subway_line_id: 1 }
            });
            const res = httpMocks.createResponse();
            const next = jest.fn();

            validatePost(req, res, next);
            expect(res.statusCode).toBe(400);
            expect(JSON.parse(res._getData()).error.code).toBe(ErrorCodes.VALIDATION_INVALID_FORMAT);
        });
    });
});
