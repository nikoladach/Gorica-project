# Quick Security Setup Guide

## 🔐 How Login Works

### Step-by-Step Process:

1. **User enters credentials** in `Login.jsx`
2. **Frontend sends POST** to `/api/auth/login` with username/password
3. **Backend validates**:
   - Checks if user exists
   - Verifies password hash using bcrypt
   - Checks if user is active
4. **Backend generates JWT token** containing user info (id, username, role, name)
5. **Token stored in two places**:
   - HTTP-only cookie (more secure, prevents XSS)
   - localStorage (fallback for Authorization header)
6. **Frontend stores** user data in Zustand store
7. **All protected API calls** include token in `Authorization: Bearer <token>` header

### JWT Token Flow:

```
Login → Generate Token → Store in Cookie + localStorage
  ↓
Every API Request → Check Token → Verify Signature → Check User Status → Allow/Deny
  ↓
Token Expires (24h) → User must login again
```

## ✅ Is JWT Working?

**Yes!** The JWT system is fully implemented:

- ✅ Tokens are generated on login
- ✅ Tokens are verified on every protected route
- ✅ Tokens expire after 24 hours
- ✅ Tokens are stored securely (HTTP-only cookies + localStorage)
- ✅ User status is checked on every request
- ✅ Invalid/expired tokens are rejected

**To verify it's working:**
1. Log in successfully
2. Check browser DevTools → Application → Cookies (should see `token` cookie)
3. Check localStorage (should see `authToken`)
4. Make an API call → Check Network tab → Request Headers (should see `Authorization: Bearer <token>`)

## 🔧 How to Change Credentials

### 1. Change User Password

```bash
cd Gorica-backend
node scripts/change_password.js <username> <new_password>
```

**Example:**
```bash
node scripts/change_password.js doctor SecurePassword123!
node scripts/change_password.js esthetician AnotherSecurePass456!
```

**Note:** The script validates password strength based on your environment settings.

### 2. Generate a Secure JWT Secret

```bash
cd Gorica-backend
node scripts/generate_jwt_secret.js
```

This will output a secure random secret. Copy it and add to your `.env` file:
```
JWT_SECRET=<generated-secret>
```

**⚠️ Important:** After changing JWT_SECRET, all existing tokens become invalid. Users must log in again.

### 3. Create a New User

Use the register endpoint (if available) or create directly in the database:

```bash
# Via API (if register endpoint is enabled)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "SecurePass123!",
    "name": "New User",
    "role": "doctor"
  }'
```

## 🛡️ Making Credentials More Secure

### Immediate Actions:

1. **Change Default Passwords**
   ```bash
   node scripts/change_password.js doctor <strong-password>
   node scripts/change_password.js esthetician <strong-password>
   ```

2. **Generate and Set JWT Secret**
   ```bash
   node scripts/generate_jwt_secret.js
   # Copy the output and add to .env file
   ```

3. **Enable Strict Password Validation** (Optional)
   Add to `.env`:
   ```
   STRICT_PASSWORD_VALIDATION=true
   ```
   This enforces:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

### Production Checklist:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Change all default user passwords
- [ ] Set `NODE_ENV=production` (enables strict password validation automatically)
- [ ] Set `STRICT_PASSWORD_VALIDATION=true` in `.env`
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set `secure: true` in cookie settings (already done conditionally)
- [ ] Add rate limiting for login attempts (recommended)
- [ ] Never commit `.env` file to version control

### Recommended Password Requirements:

**For Production:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, special characters
- Not a dictionary word
- Not related to username or personal info

**Example Strong Passwords:**
- `MyClinic2024!Secure`
- `Dr@Gorica#2024Pass`
- `Esthetician$2024!Strong`

## 🔍 Testing JWT Tokens

### Check if Token is Valid:
```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer <your-token>" \
  --cookie "token=<your-token>"
```

### Decode Token (without verification):
```bash
# Replace <your-token> with actual token
node -e "console.log(JSON.parse(Buffer.from('<your-token>'.split('.')[1], 'base64').toString()))"
```

## 📝 Current Default Credentials

**⚠️ CHANGE THESE IMMEDIATELY IN PRODUCTION!**

- Username: `doctor` / Password: `doctor`
- Username: `esthetician` / Password: `esthetician`

These are only for development/testing. Never use in production!

## 🚨 Security Best Practices

1. **Never commit secrets** - `.env` should be in `.gitignore`
2. **Use different secrets** for dev/staging/production
3. **Rotate JWT_SECRET** periodically (every 6-12 months)
4. **Monitor failed logins** for suspicious activity
5. **Use strong, unique passwords** for each user
6. **Enable HTTPS** in production
7. **Set up rate limiting** to prevent brute force attacks
8. **Log authentication events** for audit trail

## 📚 Additional Resources

- See `SECURITY_GUIDE.md` for detailed security information
- See `README.md` for general setup instructions

