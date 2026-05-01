// Mock everything before imports
jest.mock('axios', () => {
    const mockAxios = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
    };
    mockAxios.create.mockReturnValue(mockAxios);
    return { default: mockAxios, ...mockAxios };
});

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    setItemAsync: jest.fn(() => Promise.resolve()),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-file-system/legacy', () => ({}));
jest.mock('expo-sharing', () => ({}));
jest.mock('expo-location', () => ({}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('react-native-maps', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));

const mockClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
    },
};

jest.mock('../api/client', () => ({
    __esModule: true,
    default: mockClient,
    BASE_URL: 'http://192.168.1.28:8081',
}));

const BASE_URL = 'http://192.168.1.28:8081';

const {
    register,
    login,
    getAllPosts,
    getPostsByUser,
    createPost,
    updatePostStatus,
    getLikes,
    likePost,
    unlikePost,
    getComments,
    addComment,
    getMe,
    getUserById,
    updateMe,
    updatePost,
    deletePost,
    reverseGeocode,
    getImageUrl,
} = require('../api/api');

// ─── Reset mocks before each test ────────────────────────────────────────────
beforeEach(() => {
    jest.clearAllMocks();
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
describe('Auth API', () => {
    test('register sends POST to /api/users with user data', async () => {
        const userData = { username: 'ana', password: '123', email: 'ana@test.com' };
        mockClient.post.mockResolvedValueOnce({ data: { id: 1, ...userData } });

        await register(userData);

        expect(mockClient.post).toHaveBeenCalledWith('/api/users', userData);
    });

    test('login sends POST to /api/auth/login with credentials', async () => {
        const credentials = { username: 'ana', password: '123' };
        mockClient.post.mockResolvedValueOnce({ data: { token: 'abc123' } });

        await login(credentials);

        expect(mockClient.post).toHaveBeenCalledWith('/api/auth/login', credentials);
    });

    test('login returns response data on success', async () => {
        mockClient.post.mockResolvedValueOnce({ data: { token: 'abc123' } });

        const res = await login({ username: 'ana', password: '123' });

        expect(res.data.token).toBe('abc123');
    });

    test('login throws error on wrong credentials', async () => {
        mockClient.post.mockRejectedValueOnce(new Error('Unauthorized'));

        await expect(login({ username: 'wrong', password: 'wrong' }))
            .rejects.toThrow('Unauthorized');
    });
});

// ─── POSTS ────────────────────────────────────────────────────────────────────
describe('Posts API', () => {
    test('getAllPosts sends GET with default page and size', async () => {
        mockClient.get.mockResolvedValueOnce({ data: [] });

        await getAllPosts();

        expect(mockClient.get).toHaveBeenCalledWith('/api/posts?page=0&size=20');
    });

    test('getAllPosts sends GET with custom page and size', async () => {
        mockClient.get.mockResolvedValueOnce({ data: [] });

        await getAllPosts(2, 10);

        expect(mockClient.get).toHaveBeenCalledWith('/api/posts?page=2&size=10');
    });

    test('getPostsByUser sends GET with correct userId', async () => {
        mockClient.get.mockResolvedValueOnce({ data: [] });

        await getPostsByUser(42);

        expect(mockClient.get).toHaveBeenCalledWith('/api/posts/user/42');
    });

    test('getPostsByUser returns list of posts', async () => {
        const mockPosts = [{ id: 1, description: 'Broken road' }];
        mockClient.get.mockResolvedValueOnce({ data: mockPosts });

        const res = await getPostsByUser(1);

        expect(res.data).toHaveLength(1);
        expect(res.data[0].description).toBe('Broken road');
    });

    test('createPost sends POST to /api/posts/create', async () => {
        const postData = { description: 'Pothole', category: 'ROAD' };
        mockClient.post.mockResolvedValueOnce({ data: { id: 5, ...postData } });

        await createPost(postData);

        expect(mockClient.post).toHaveBeenCalledWith('/api/posts/create', postData);
    });

    test('updatePostStatus sends PUT with correct postId and status', async () => {
        mockClient.put.mockResolvedValueOnce({ data: { id: 1, status: 'RESOLVED' } });

        await updatePostStatus(1, 'RESOLVED');

        expect(mockClient.put).toHaveBeenCalledWith('/api/posts/1/status?status=RESOLVED');
    });

    test('updatePost sends PUT with correct postId and data', async () => {
        const updateData = { description: 'Updated description' };
        mockClient.put.mockResolvedValueOnce({ data: { id: 1, ...updateData } });

        await updatePost(1, updateData);

        expect(mockClient.put).toHaveBeenCalledWith('/api/posts/1', updateData);
    });

    test('deletePost sends DELETE with correct postId', async () => {
        mockClient.delete.mockResolvedValueOnce({ data: {} });

        await deletePost(1);

        expect(mockClient.delete).toHaveBeenCalledWith('/api/posts/1');
    });
});

// ─── LIKES ────────────────────────────────────────────────────────────────────
describe('Likes API', () => {
    test('getLikes sends GET with correct postId', async () => {
        mockClient.get.mockResolvedValueOnce({ data: { count: 5 } });

        await getLikes(10);

        expect(mockClient.get).toHaveBeenCalledWith('/api/posts/10/likes');
    });

    test('likePost sends POST with correct postId', async () => {
        mockClient.post.mockResolvedValueOnce({ data: {} });

        await likePost(10);

        expect(mockClient.post).toHaveBeenCalledWith('/api/posts/10/likes');
    });

    test('unlikePost sends DELETE with correct postId', async () => {
        mockClient.delete.mockResolvedValueOnce({ data: {} });

        await unlikePost(10);

        expect(mockClient.delete).toHaveBeenCalledWith('/api/posts/10/likes');
    });
});

// ─── COMMENTS ─────────────────────────────────────────────────────────────────
describe('Comments API', () => {
    test('getComments sends GET with correct postId', async () => {
        mockClient.get.mockResolvedValueOnce({ data: [] });

        await getComments(7);

        expect(mockClient.get).toHaveBeenCalledWith('/api/posts/7/comments');
    });

    test('addComment sends POST with correct postId and content', async () => {
        mockClient.post.mockResolvedValueOnce({ data: { id: 1, content: 'Nice report!' } });

        await addComment(7, 'Nice report!');

        expect(mockClient.post).toHaveBeenCalledWith('/api/posts/7/comments', { content: 'Nice report!' });
    });

    test('addComment returns created comment', async () => {
        mockClient.post.mockResolvedValueOnce({ data: { id: 1, content: 'Test comment' } });

        const res = await addComment(7, 'Test comment');

        expect(res.data.content).toBe('Test comment');
    });
});

// ─── USERS ────────────────────────────────────────────────────────────────────
describe('Users API', () => {
    test('getMe sends GET to /api/users/me', async () => {
        mockClient.get.mockResolvedValueOnce({ data: { id: 1, username: 'ana' } });

        await getMe();

        expect(mockClient.get).toHaveBeenCalledWith('/api/users/me');
    });

    test('getUserById sends GET with correct userId', async () => {
        mockClient.get.mockResolvedValueOnce({ data: { id: 3, username: 'teodora' } });

        await getUserById(3);

        expect(mockClient.get).toHaveBeenCalledWith('/api/users/3');
    });

    test('updateMe sends PUT to /api/users/me with data', async () => {
        const updateData = { username: 'ana_new' };
        mockClient.put.mockResolvedValueOnce({ data: { id: 1, ...updateData } });

        await updateMe(updateData);

        expect(mockClient.put).toHaveBeenCalledWith('/api/users/me', updateData);
    });
});

// ─── GEOCODE ──────────────────────────────────────────────────────────────────
describe('Geocode API', () => {
    test('reverseGeocode sends GET with correct lat and lng', async () => {
        mockClient.get.mockResolvedValueOnce({ data: { address: 'Skopje' } });

        await reverseGeocode(41.9981, 21.4254);

        expect(mockClient.get).toHaveBeenCalledWith('/api/posts/geocode/reverse?lat=41.9981&lng=21.4254');
    });
});

// ─── getImageUrl UTILITY ──────────────────────────────────────────────────────
describe('getImageUrl utility', () => {
    test('returns null for null input', () => {
        expect(getImageUrl(null)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(getImageUrl('')).toBeNull();
    });

    test('returns null for "null" string', () => {
        expect(getImageUrl('null')).toBeNull();
    });

    test('returns null for "undefined" string', () => {
        expect(getImageUrl('undefined')).toBeNull();
    });

    test('returns full URL as-is if starts with http://', () => {
        expect(getImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
    });

    test('returns full URL as-is if starts with https://', () => {
        expect(getImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    });

    test('prepends BASE_URL if path starts with /', () => {
        expect(getImageUrl('/uploads/image.jpg')).toBe(`${BASE_URL}/uploads/image.jpg`);
    });

    test('returns null for non-string input', () => {
        expect(getImageUrl(123)).toBeNull();
    });
});