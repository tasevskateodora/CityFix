import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your computer's local IP address
export const BASE_URL = 'http://172.20.46.162:8081';

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

client.interceptors.request.use(async (config) => {
    const username = await SecureStore.getItemAsync('username');
    const password = await SecureStore.getItemAsync('password');

    if (username && password) {
        const encoded = btoa(`${username}:${password}`);
        config.headers.Authorization = `Basic ${encoded}`;
    }

    return config;
});

export default client;