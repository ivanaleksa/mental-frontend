const BASE_URL = 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
    REGISTER: `${BASE_URL}/app/v1/user/register`,
    LOGIN: `${BASE_URL}/app/v1/user/login`,
    ME: `${BASE_URL}/app/v1/user/me`,
    RESET_PASSWORD: `${BASE_URL}/app/v1/user/reset-password`,
    RESET_PASSWORD_CONFIRM: `${BASE_URL}/app/v1/user/reset-password/confirm`,
    UPDATE_PHOTO: `${BASE_URL}/app/v1/user/me/photo`,
    UPDATE_PROFILE: `${BASE_URL}/app/v1/user/me`,
    PSYCHOLOGIST_REQUESTS: `${BASE_URL}/app/v1/user/psychologist-request`,
    ACCEPT_REQUEST: (requestId: number) => `${BASE_URL}/app/v1/user/psychologist-request/${requestId}/accept`,
    REJECT_REQUEST: (requestId: number) => `${BASE_URL}/app/v1/user/psychologist-request/${requestId}/reject`,
    CHANGE_PASSWORD: `${BASE_URL}/app/v1/user/change-password`,
    CLIENT_REQUEST_STATUS: `${BASE_URL}/app/v1/user/client-request-status`,
    APPLY_FOR_PSYCHOLOGIST: `${BASE_URL}/app/v1/user/apply-for-psychologist`,
};

export default API_ENDPOINTS;