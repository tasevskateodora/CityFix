import client, { BASE_URL } from './client';

// Auth
export const register = (data) => client.post('/api/users', data);
export const login = (data) => client.post('/api/auth/login', data);

// Posts
export const getAllPosts = () => client.get('/api/posts');
export const getPostsByUser = (userId) => client.get(`/api/posts/user/${userId}`);
export const createPost = (data) => client.post('/api/posts/create', data);
export const updatePostStatus = (postId, status) =>
    client.put(`/api/posts/${postId}/status?status=${status}`);

// Likes
export const getLikes = (postId) => client.get(`/api/posts/${postId}/likes`);
export const likePost = (postId) => client.post(`/api/posts/${postId}/likes`);
export const unlikePost = (postId) => client.delete(`/api/posts/${postId}/likes`);

// Comments
export const getComments = (postId) => client.get(`/api/posts/${postId}/comments`);
export const addComment = (postId, content) =>
    client.post(`/api/posts/${postId}/comments`, { content });

// Users
export const getMe = () => client.get('/api/users/me');
export const getUserById = (userId) => client.get(`/api/users/${userId}`);
export const updateMe = (data) => client.put('/api/users/me', data);

// Upload
export const uploadImage = async (uri) => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const ext = filename.split('.').pop();
    formData.append('file', {
        uri,
        name: filename,
        type: `image/${ext}`,
    });

    const response = await client.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
};

export const deletePost = (postId) => client.delete(`/api/posts/${postId}`);

// Geocode
export const reverseGeocode = (lat, lng) =>
    client.get(`/api/posts/geocode/reverse?lat=${lat}&lng=${lng}`);

export const getImageUrl = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return `${BASE_URL}${trimmed}`;
    return null;
};