import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const useApi = () => {
    const { getToken } = useAuth();

    const apiInstance = useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
        });

        // Interceptor that fetches a fresh Clerk token for every request
        instance.interceptors.request.use(async (config) => {
            try {
                const token = await getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (err) {
                console.error('Failed to get auth token:', err);
            }
            return config;
        });

        return instance;
    // getToken is stable from useAuth — safe to include
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return apiInstance;
};

// Standalone instance for non-hook contexts (no auth)
const api = axios.create({
    baseURL: API_BASE_URL,
});

export default api;
