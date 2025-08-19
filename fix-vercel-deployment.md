# Fix Vercel Deployment Issue

## Problem Identified

The API is deployed to Vercel but failing because:
1. **Supabase connection failing**: `TypeError: fetch failed` in health check
2. **Missing environment variables**: Vercel doesn't have access to your `.env` file
3. **OTP generation failing**: Cannot store OTP due to database connection issues

## Solution: Set Environment Variables in Vercel

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Find your project: `smart-home-backend-eta`
3. Click on the project name

### Step 2: Add Environment Variables
1. Click **Settings** tab
2. Click **Environment Variables** in the sidebar
3. Add each variable below:

#### Required Variables:
```
SUPABASE_URL=https://pcgngpfkgkpqrljgekzq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZ25ncGZrZ2twcXJsamdla3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDM4OTUsImV4cCI6MjA3MTE3OTg5NX0.uqrkLKvhX5tPx_rdnTMFLSwymlFxWOFSyzH8YiI40Os
SMS_SECRET=xledocqmXkNPrTesuqWr
SMS_SENDER=NIGHAI
SMS_TEMPID=1207174264191607433
SMS_ROUTE=TA
SMS_MSGTYPE=1
SMS_BASE_URL=https://43.252.88.250/index.php/smsapi/httpapi/
PORT=3001
```

#### How to Add Each Variable:
1. Click **"Add New"**
2. Enter **Name** (e.g., `SUPABASE_URL`)
3. Enter **Value** (e.g., `https://pcgngpfkgkpqrljgekzq.supabase.co`)
4. Select **Environment**: Check `Production`, `Preview`, and `Development`
5. Click **Save**
6. Repeat for all variables above

### Step 3: Redeploy
After adding all environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** on the latest deployment
3. Select **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Test the Fix

#### Test Health Endpoint:
```bash
# Should return healthy status with Supabase connected
curl https://smart-home-backend-eta.vercel.app/health
```

#### Test OTP Generation:
```bash
# Should successfully generate and store OTP
curl -X POST https://smart-home-backend-eta.vercel.app/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "8184930950"}'
```

## Expected Results After Fix

### Health Endpoint Should Return:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-20T01:02:10.892Z",
  "supabase": {
    "status": "connected"
  },
  "services": {
    "sms": "available",
    "otp": "available"
  }
}
```

### OTP Endpoint Should Return:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phoneNumber": "8184930950",
  "userExists": false,
  "smsStatus": true
}
```

## Troubleshooting

### If Still Not Working:

1. **Check Environment Variables**:
   - Ensure all variables are set correctly
   - Verify no extra spaces or quotes
   - Make sure they're enabled for Production

2. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Functions
   - Click on your function to see real-time logs
   - Look for error messages

3. **Verify Supabase Credentials**:
   - Test the Supabase URL and key in your local environment
   - Ensure the database tables exist

4. **SMS Service Issues**:
   - The SMS service might still fail due to HTTPS requirements
   - OTP will still be stored in database even if SMS fails

## Quick Verification Commands

Run these in PowerShell to test:

```powershell
# Test health
Invoke-WebRequest -Uri "https://smart-home-backend-eta.vercel.app/health" -Method GET

# Test OTP generation
Invoke-WebRequest -Uri "https://smart-home-backend-eta.vercel.app/v1/auth/send-otp" -Method POST -ContentType "application/json" -Body '{"phoneNumber": "8184930950"}'
```

## Important Notes

1. **Environment variables are case-sensitive**
2. **No quotes needed** when entering values in Vercel dashboard
3. **Redeploy is required** after adding environment variables
4. **Changes take 1-2 minutes** to propagate

Once you complete these steps, your backend API should work properly with both Postman and your web application!