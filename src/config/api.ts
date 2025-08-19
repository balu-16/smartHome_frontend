// API Configuration
// This file centralizes all API endpoint configurations

// Backend API Base URL
export const API_BASE_URL = 'https://smart-home-backend-eta.vercel.app';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: `${API_BASE_URL}/v1/auth/send-otp`,
    VERIFY_OTP: `${API_BASE_URL}/v1/auth/verify-otp`,
    REGISTER: `${API_BASE_URL}/v1/auth/register`,
    PROFILE: `${API_BASE_URL}/v1/auth/profile`,
  },
  GPS: {
    UPDATE_LOCATION: `${API_BASE_URL}/v1/gps-signal/update-location`,
    CURRENT_LOCATION: `${API_BASE_URL}/v1/gps-signal/current-location`,
  },
  SMS: {
    SEND: `${API_BASE_URL}/v1/sms/send`,
  },
  HEALTH: `${API_BASE_URL}/health`,
};

// For development, you can override the base URL
// export const API_BASE_URL = 'http://localhost:3001';