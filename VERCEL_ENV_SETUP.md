# Vercel Environment Variables Setup Guide

This guide explains how to configure environment variables in Vercel to fix the OTP generation errors.

## Current Error Analysis

The error `Failed to store OTP: TypeError: fetch failed` occurs because:

1. **Missing Environment Variables**: Vercel deployment doesn't have access to the `.env` file
2. **HTTP vs HTTPS**: SMS service was using HTTP which may be blocked by Vercel
3. **Supabase Configuration**: Environment variables for Supabase connection may not be set

## Required Environment Variables

You need to set these environment variables in your Vercel dashboard:

### Supabase Configuration
```
SUPABASE_URL=https://pcgngpfkgkpqrljgekzq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZ25ncGZrZ2twcXJsamdla3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDM4OTUsImV4cCI6MjA3MTE3OTg5NX0.uqrkLKvhX5tPx_rdnTMFLSwymlFxWOFSyzH8YiI40Os
```

### SMS Service Configuration
```
SMS_SECRET=xledocqmXkNPrTesuqWr
SMS_SENDER=NIGHAI
SMS_TEMPID=1207174264191607433
SMS_ROUTE=TA
SMS_MSGTYPE=1
SMS_BASE_URL=https://43.252.88.250/index.php/smsapi/httpapi/
```

### Server Configuration
```
PORT=3001
```

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Navigate to your project: `smart-home-backend-eta`

2. **Access Settings**:
   - Click on your project
   - Go to "Settings" tab
   - Click on "Environment Variables" in the sidebar

3. **Add Each Variable**:
   - Click "Add New"
   - Enter the variable name (e.g., `SUPABASE_URL`)
   - Enter the variable value
   - Select environment: `Production`, `Preview`, and `Development`
   - Click "Save"

4. **Repeat for All Variables**:
   - Add all the variables listed above
   - Make sure each is enabled for Production

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to your backend directory
cd backend

# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SMS_SECRET
vercel env add SMS_SENDER
vercel env add SMS_TEMPID
vercel env add SMS_ROUTE
vercel env add SMS_MSGTYPE
vercel env add SMS_BASE_URL
vercel env add PORT
```

## Redeploy After Setting Variables

After adding environment variables, you need to redeploy:

### Option 1: Automatic Redeploy
- Push any change to your GitHub repository
- Vercel will automatically redeploy with new environment variables

### Option 2: Manual Redeploy
```bash
cd backend
vercel --prod
```

### Option 3: Dashboard Redeploy
- Go to Vercel Dashboard → Your Project → Deployments
- Click the three dots on the latest deployment
- Select "Redeploy"

## Verification Steps

1. **Check Health Endpoint**:
   ```
   GET https://smart-home-backend-eta.vercel.app/health
   ```
   Should return Supabase connection status

2. **Test OTP Generation**:
   ```bash
   curl -X POST https://smart-home-backend-eta.vercel.app/v1/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "8184930950"}'
   ```

3. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on a function to see logs
   - Look for environment variable status messages

## Troubleshooting

### If OTP Storage Still Fails:

1. **Check Supabase Connection**:
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
   - Test connection from Vercel function logs

2. **Check Database Permissions**:
   - Ensure `otp_verifications` table exists
   - Verify RLS policies allow inserts

3. **Check Function Timeout**:
   - Vercel functions have a 10-second timeout by default
   - Check if operations are completing within time limit

### If SMS Still Fails:

1. **HTTPS vs HTTP**:
   - Ensure SMS_BASE_URL uses `https://`
   - Some Vercel regions block HTTP requests

2. **SMS Service Availability**:
   - Test SMS endpoint directly
   - Check if SMS service supports HTTPS

3. **Network Restrictions**:
   - Vercel may have restrictions on certain IP ranges
   - Consider using a different SMS provider if needed

## Updated Code Changes

The following improvements have been made:

1. **Environment Variable Support**: SMS configuration now uses environment variables
2. **HTTPS Support**: Updated SMS base URL to use HTTPS
3. **Better Error Handling**: More detailed logging and error messages
4. **Graceful Degradation**: OTP storage succeeds even if SMS fails
5. **Request Timeout**: Added 10-second timeout for SMS requests

## Next Steps

1. Set all environment variables in Vercel dashboard
2. Redeploy the backend
3. Test OTP generation from frontend
4. Monitor Vercel function logs for any remaining issues

After completing these steps, your OTP generation should work properly!