# Frontend-Backend Integration Guide

This document outlines the changes made to connect the frontend React application with the deployed Vercel backend.

## Changes Made

### 1. Updated API Endpoints in Frontend

**File: `src/contexts/AuthContext.tsx`**
- Updated OTP generation endpoint from `http://localhost:3001/v1/auth/send-otp` to use deployed URL
- Updated OTP verification endpoint from `http://localhost:3001/v1/auth/verify-otp` to use deployed URL
- Added import for centralized API configuration

### 2. Created Centralized API Configuration

**File: `src/config/api.ts` (NEW)**
- Created centralized configuration for all API endpoints
- Base URL: `https://smart-home-backend-eta.vercel.app`
- Organized endpoints by category (AUTH, GPS, SMS, HEALTH)
- Includes commented option to switch back to localhost for development

### 3. Updated Backend Test Files

**File: `backend/test-otp.js`**
- Updated BASE_URL from `http://localhost:3001` to deployed Vercel URL
- Allows testing of production backend functionality

## API Endpoints Available

Your deployed backend is now accessible at:

- **Health Check**: `https://smart-home-backend-eta.vercel.app/health`
- **Authentication**:
  - Send OTP: `https://smart-home-backend-eta.vercel.app/v1/auth/send-otp`
  - Verify OTP: `https://smart-home-backend-eta.vercel.app/v1/auth/verify-otp`
- **GPS/Device Management**:
  - Update Location: `https://smart-home-backend-eta.vercel.app/v1/gps-signal/update-location`
  - Current Location: `https://smart-home-backend-eta.vercel.app/v1/gps-signal/current-location`
- **SMS**: `https://smart-home-backend-eta.vercel.app/v1/sms/send`

## How to Test

1. **Frontend Testing**:
   ```bash
   npm run dev
   ```
   - The frontend will now connect to the deployed backend
   - Test login/signup functionality with OTP

2. **Backend Health Check**:
   - Visit: `https://smart-home-backend-eta.vercel.app/health`
   - Should return JSON with status information

3. **API Testing**:
   ```bash
   cd backend
   node test-otp.js
   ```
   - Tests will run against the deployed backend

## Development vs Production

### For Development (Local Backend)
If you want to switch back to local development:

1. Update `src/config/api.ts`:
   ```typescript
   // Comment out production URL
   // export const API_BASE_URL = 'https://smart-home-backend-eta.vercel.app';
   
   // Uncomment local URL
   export const API_BASE_URL = 'http://localhost:3001';
   ```

2. Start local backend:
   ```bash
   cd backend
   npm run dev
   ```

### For Production (Deployed Backend)
- No changes needed - already configured
- Frontend connects to deployed Vercel backend automatically

## Architecture Overview

```
Frontend (React + Vite)     →     Backend (Node.js + Express)
├── Authentication          →     ├── OTP Generation/Verification
├── Device Management       →     ├── GPS Data Storage
├── User Interface          →     ├── SMS Integration
└── Supabase Client         →     └── Database Operations
    (Direct DB Access)              (API + Direct DB Access)
```

## Important Notes

1. **Hybrid Architecture**: The application uses both direct Supabase client connections (for most database operations) and backend API calls (for OTP authentication and SMS services).

2. **Environment Variables**: Make sure all required environment variables are set in your Vercel dashboard for the backend to function properly.

3. **CORS**: The backend is configured with CORS to allow requests from your frontend domain.

4. **Error Handling**: Both frontend and backend include comprehensive error handling and logging.

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure backend CORS is properly configured
2. **Environment Variables**: Check Vercel dashboard for missing env vars
3. **Network Issues**: Verify the backend URL is accessible
4. **OTP Issues**: Check SMS service configuration in backend

### Debug Steps:

1. Check browser console for frontend errors
2. Check Vercel function logs for backend errors
3. Test health endpoint: `https://smart-home-backend-eta.vercel.app/health`
4. Verify Supabase connection in health check response

Your application is now fully integrated and ready for production use!