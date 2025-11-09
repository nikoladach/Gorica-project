# Security Guide - Authentication & JWT

## How the Login Process Works

### 1. **User Login Flow**

```
Frontend (Login.jsx)
    ↓
POST /api/auth/login (username, password)
    ↓
Backend (routes/auth.js)
    ↓
1. Validates username/password
2. Checks if user exists and is active
3. Compares password hash using bcrypt
4. Generates JWT token
5. Sets HTTP-only cookie with token
6. Returns user data + token
    ↓
Frontend (useAppStore.js)
    ↓
1. Stores token in localStorage
2. Stores user data in Zustand store
3. Sets isAuthenticated = true
4. Fetches appointments
```

### 2. **JWT Token Flow**

The JWT token is stored in **two places** for redundancy:
- **HTTP-only Cookie**: More secure, not accessible via JavaScript (prevents XSS)
- **localStorage**: Used as fallback for Authorization header

**Token Structure:**
```json
{
  "id": 1,
  "username": "doctor",
  "role": "doctor",
  "name": "Doctor",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### 3. **Authentication Middleware**

Every protected route (`/api/patients`, `/api/appointments`) uses `authenticateToken` middleware:

1. Checks for token in `Authorization: Bearer <token>` header
2. Falls back to `req.cookies.token` if header not found
3. Verifies token signature and expiration
4. Checks if user still exists and is active in database
5. Attaches `req.user` to request object

### 4. **Token Verification on App Load**

When the app loads (`App.jsx`):
- Calls `GET /api/auth/verify`
- If token is valid, user stays logged in
- If token is invalid/expired, redirects to login

## Current Security Status

### ✅ **What's Working Well:**
- Passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- HTTP-only cookies prevent XSS attacks
- Tokens verified on every request
- User status checked (is_active flag)
- CORS configured for production

### ⚠️ **Security Improvements Needed:**

1. **JWT_SECRET**: Currently using default/weak secret
2. **Default Passwords**: Default users have weak passwords (`doctor/doctor`, `esthetician/esthetician`)
3. **Password Requirements**: Minimum 6 characters (should be stronger)
4. **Rate Limiting**: No protection against brute force attacks
5. **HTTPS**: Not enforced in production (secure cookies require HTTPS)

## How to Change Credentials

### Option 1: Use the Password Change Script (Recommended)

Run the provided script:
```bash
cd Gorica-backend
node scripts/change_password.js <username> <new_password>
```

### Option 2: Direct Database Update

1. Hash a new password:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourNewPassword', 10).then(hash => console.log(hash));"
```

2. Update in database:
```sql
UPDATE users SET password_hash = '<hashed_password>' WHERE username = 'doctor';
```

### Option 3: Use the Register Endpoint

If you have access, you can create a new user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "StrongPassword123!",
    "name": "New User",
    "role": "doctor"
  }'
```

## Making Credentials More Secure

### 1. **Change JWT Secret**

Generate a strong random secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `.env`:
```
JWT_SECRET=<your-strong-random-secret>
```

**⚠️ Important**: If you change JWT_SECRET, all existing tokens will be invalidated. Users will need to log in again.

### 2. **Change Default User Passwords**

Use the password change script:
```bash
node scripts/change_password.js doctor <strong-password>
node scripts/change_password.js esthetician <strong-password>
```

### 3. **Enforce Stronger Password Requirements**

Update `routes/auth.js` to require:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 4. **Add Rate Limiting**

Install `express-rate-limit`:
```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', loginLimiter);
```

### 5. **Enable HTTPS in Production**

Update cookie settings in `routes/auth.js`:
```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // Only send over HTTPS
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
});
```

### 6. **Add Password Expiration (Optional)**

Add a `password_changed_at` column to users table and require password change every 90 days.

## Testing JWT Tokens

### Check if Token is Valid:
```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer <your-token>" \
  --cookie "token=<your-token>"
```

### Decode Token (without verification):
```bash
node -e "console.log(JSON.parse(Buffer.from('<your-token>'.split('.')[1], 'base64').toString()))"
```

## Best Practices

1. **Never commit `.env` file** - It contains secrets
2. **Use different JWT_SECRET for each environment** (dev, staging, production)
3. **Rotate JWT_SECRET periodically** (e.g., every 6 months)
4. **Monitor failed login attempts** for suspicious activity
5. **Use strong, unique passwords** for each user
6. **Enable 2FA** for production (future enhancement)
7. **Log authentication events** for audit trail

