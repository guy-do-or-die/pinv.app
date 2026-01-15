import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serveWithSWR } from '../../services/swr';

const { mockRedis, mockMemoryCache } = vi.hoisted(() => {
    return {
        mockRedis: {
            status: 'ready',
            getBuffer: vi.fn(),
            exists: vi.fn(),
            set: vi.fn().mockImplementation((...args) => {
                console.log('DEBUG: mockRedis.set called with:', args);
                return Promise.resolve('OK');
            }),
            setBuffer: vi.fn().mockResolvedValue('OK'),
            del: vi.fn().mockResolvedValue(1),
            on: vi.fn(),
        },
        mockMemoryCache: {
            get: vi.fn(),
            set: vi.fn(),
        }
    }
});

vi.mock('../../infra/cache', () => ({
    redis: mockRedis,
    memoryCache: mockMemoryCache,
}));

vi.mock('../../utils/logger', () => ({
    logToFile: vi.fn(),
}));

describe('SWR Service', () => {
    let mockReply: any;
    let mockGenerator: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRedis.status = 'ready'; // Default status

        mockReply = {
            header: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            code: vi.fn().mockReturnThis(),
            type: vi.fn().mockReturnThis(),
        };
        mockGenerator = vi.fn().mockResolvedValue(Buffer.from('generated-image'));
    });

    it('should serve from Memory Cache (L1 Hit)', async () => {
        // Setup L1 Hit
        mockMemoryCache.get.mockReturnValue({ data: Buffer.from('l1-image'), expires: Date.now() + 1000 });

        await serveWithSWR({
            pinId: 1,
            cacheKey: 'test-key',
            lockKey: 'test-lock',
            generatorFn: mockGenerator,
            reply: mockReply,
            forceRefresh: false,
            isBundle: false
        });

        // Verify: Served L1, No Redis calls, No Generation
        expect(mockReply.send).toHaveBeenCalledWith(Buffer.from('l1-image'));
        expect(mockRedis.getBuffer).not.toHaveBeenCalled();
        expect(mockGenerator).not.toHaveBeenCalled();
    });

    it('should serve from Redis and Populate Memory (L2 Hit -> L1 Populate)', async () => {
        // Setup L1 Miss, L2 Hit
        mockMemoryCache.get.mockReturnValue(undefined);
        mockRedis.getBuffer.mockResolvedValue(Buffer.from('l2-image'));
        mockRedis.exists.mockResolvedValue(1); // Fresh

        await serveWithSWR({
            pinId: 1,
            cacheKey: 'test-key',
            lockKey: 'test-lock',
            generatorFn: mockGenerator,
            reply: mockReply,
            forceRefresh: false,
            isBundle: false
        });

        // Verify: Served L2
        expect(mockReply.send).toHaveBeenCalledWith(Buffer.from('l2-image'));

        // Verify Read-Through: Memory was set
        expect(mockMemoryCache.set).toHaveBeenCalledWith('test-key', expect.objectContaining({
            data: Buffer.from('l2-image')
        }));
    });

    it('should generate on Full Miss (L1 & L2 Miss)', async () => {
        // Setup Misses
        mockMemoryCache.get.mockReturnValue(undefined);
        mockRedis.getBuffer.mockResolvedValue(null);
        mockRedis.set.mockResolvedValue('OK'); // Lock acquired

        console.log('DEBUG: mockRedis.status is', mockRedis.status); // Verify mock state

        await serveWithSWR({
            pinId: 1,
            cacheKey: 'test-key',
            lockKey: 'test-lock',
            generatorFn: mockGenerator,
            reply: mockReply,
            forceRefresh: false,
            isBundle: false
        });

        // Verify: Generation called
        expect(mockGenerator).toHaveBeenCalled();

        // Verify: Served generated
        expect(mockReply.send).toHaveBeenCalledWith(Buffer.from('generated-image'));

        // Verify: Memory Cache Updated
        expect(mockMemoryCache.set).toHaveBeenCalled();

        // Verify: Redis updates
        expect(mockRedis.del).toHaveBeenCalled();
        expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should serve Stub Image with 200 OK on NO_UI_CODE (Soft Failure)', async () => {
        // Setup Soft Failure
        mockGenerator.mockRejectedValue(new Error('NO_UI_CODE'));

        await serveWithSWR({
            pinId: 1,
            cacheKey: 'test-key',
            lockKey: 'test-lock',
            generatorFn: mockGenerator,
            reply: mockReply,
            forceRefresh: false,
            isBundle: false
        });

        // Verify: Status 200 (Success for Stub)
        expect(mockReply.code).toHaveBeenCalledWith(200);
        expect(mockReply.type).toHaveBeenCalledWith('image/png');

        // Verify: Sent a buffer (Stub)
        expect(mockReply.send).toHaveBeenCalledWith(expect.any(Buffer));
    });
});
