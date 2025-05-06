const BASE_URL = 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
    REGISTER: `${BASE_URL}/app/v1/user/register`,
    LOGIN: `${BASE_URL}/app/v1/user/login`,
    ME: `${BASE_URL}/app/v1/user/me`,
    RESET_PASSWORD: `${BASE_URL}/app/v1/user/reset-password`,
    RESET_PASSWORD_CONFIRM: `${BASE_URL}/app/v1/user/reset-password/confirm`,
};

export default API_ENDPOINTS;