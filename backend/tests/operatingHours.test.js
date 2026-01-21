const checkOperatingHours = require('../src/middleware/checkOperatingHours');
const { ErrorCodes } = require('../src/utils/errorCodes');
const httpMocks = require('node-mocks-http');

describe('Operating Hours Middleware (Unit)', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        process.env.IGNORE_OPERATING_HOURS = 'false';
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('✅ Should call next() during operating hours (Mon 08:30)', () => {
        // 2026-01-14 is Wednesday (Weekday). 08:30 KST.
        jest.setSystemTime(new Date('2026-01-14T08:30:00+09:00'));

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();
        const next = jest.fn();

        checkOperatingHours(req, res, next);
        // Should call next() without arguments
        expect(next).toHaveBeenCalledWith();
    });

    it('🚫 Should return 403 during non-operating hours (Mon 14:00)', () => {
        // 14:00 KST is outside 07:00 ~ 09:00
        jest.setSystemTime(new Date('2026-01-14T14:00:00+09:00'));

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();
        const next = jest.fn();

        checkOperatingHours(req, res, next);

        // Should call next with error
        expect(next).toHaveBeenCalled();
        const errorArg = next.mock.calls[0][0];
        expect(errorArg).toBeDefined();
        expect(errorArg.statusCode).toBe(403);
        expect(errorArg.errorCode).toBe(ErrorCodes.SERVICE_CLOSED);
    });

    it('🚫 Should return 403 on weekends (Sat 08:30)', () => {
        // 2026-01-17 is Saturday
        jest.setSystemTime(new Date('2026-01-17T08:30:00+09:00'));

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();
        const next = jest.fn();

        checkOperatingHours(req, res, next);

        expect(next).toHaveBeenCalled();
        const errorArg = next.mock.calls[0][0];
        expect(errorArg).toBeDefined();
        expect(errorArg.statusCode).toBe(403);
    });
});
