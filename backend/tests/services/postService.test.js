const postService = require('../../src/services/postService');
const pool = require('../../src/db/connection');
const { broadcastNewMessage } = require('../../src/utils/activeUsers');
const { getOrCreateUser } = require('../../src/utils/userHelper');
const { checkContentSafety } = require('../../src/services/aiService');

// Mocks
jest.mock('../../src/db/connection');
jest.mock('../../src/utils/activeUsers');
jest.mock('../../src/utils/userHelper');
jest.mock('../../src/services/aiService');

describe('PostService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createPost', () => {
        it('should create a post successfully when content is safe', async () => {
            // Arrange
            const mockUser = { id: 1, nickname: 'TestUser', anonymous_id: 'test-uuid' };
            const mockPost = { id: 1, content: 'Hello', subway_line_id: 1, user_id: 1 };

            checkContentSafety.mockResolvedValue({ safe: true });
            getOrCreateUser.mockResolvedValue(mockUser);
            // Only one query for INSERT if no reply_to
            pool.query.mockResolvedValue({ rows: [mockPost] });

            // Act
            const result = await postService.createPost({ id: 'user-ctx' }, {
                content: 'Hello',
                subway_line_id: 1
            });

            // Assert
            expect(result).toEqual(mockPost);
            expect(broadcastNewMessage).toHaveBeenCalled();
        });

        it('should throw error when AI detects unsafe content', async () => {
            // Arrange
            checkContentSafety.mockResolvedValue({ safe: false, reason: 'Hate speech' });

            // Act & Assert
            await expect(postService.createPost({}, { content: 'Bad word' }))
                .rejects
                .toThrow('AI Cleanbot: Hate speech');
        });

        it('should throw error when content is empty', async () => {
            await expect(postService.createPost({}, { content: '' }))
                .rejects
                .toThrow('내용을 입력해주세요.');
        });
    });
});
