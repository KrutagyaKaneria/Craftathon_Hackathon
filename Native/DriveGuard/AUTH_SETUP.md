# DriveGuard - Authentication System

## Project Structure

```
DriveGuard/
├── app/
│   ├── _layout.tsx          # Root navigation layout
│   ├── login.tsx            # Login screen route
│   ├── signup.tsx           # Signup screen route
│   ├── (tabs)/              # Protected routes (tabs navigation)
│   └── modal.tsx
├── components/
│   ├── AuthNavigationWrapper.tsx  # Navigation logic wrapper
│   └── [other components...]
├── hooks/
│   ├── useAuth.ts           # Custom authentication hook
│   └── [other hooks...]
├── screens/
│   ├── LoginScreen.tsx      # Login UI
│   ├── SignupScreen.tsx     # Signup UI
├── services/
│   └── api.ts               # Axios API client with interceptors
├── store/
│   └── authStore.ts         # Zustand auth state management
└── [other files...]
```

## Architecture Overview

### 1. **State Management (Zustand)**
- **File**: `store/authStore.ts`
- Manages global authentication state
- Stores: `token`, `isAuthenticated`, `isLoading`, `error`
- Methods: `setToken()`, `clearAuth()`, `setError()`, `setLoading()`, `initializeAuth()`

### 2. **API Service (Axios)**
- **File**: `services/api.ts`
- Configurable base URL via `EXPO_PUBLIC_API_URL`
- Auto-attaches JWT token to requests
- Handles 401 errors and token expiration
- Endpoints:
  - `POST /auth/login` - User login
  - `POST /auth/signup` - User registration
  - `POST /auth/logout` - User logout
  - `POST /auth/verify` - Token verification

### 3. **Custom Hook (useAuth)**
- **File**: `hooks/useAuth.ts`
- Wrapper around Zustand store and API calls
- Methods:
  - `login(email, password)` - Login user
  - `signup(email, password)` - Register new user
  - `logout()` - Logout user
- Returns loading, error, and auth state

### 4. **UI Screens**
- **Login Screen** (`screens/LoginScreen.tsx`)
  - Email and password inputs
  - Form validation with React Hook Form
  - Error display
  - Loading state on button
  - Links to signup and forgot password

- **Signup Screen** (`screens/SignupScreen.tsx`)
  - Email, password, and confirm password inputs
  - Password matching validation
  - Form validation with React Hook Form
  - Error display
  - Loading state on button
  - Link to login

## Setup Instructions

### 1. Install Dependencies

All dependencies have been pre-installed:
```bash
npm install react-hook-form axios zustand @react-native-async-storage/async-storage
```

### 2. Configure API Base URL

Set environment variable in `.env.local` or `.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_API_URL/api
```

Default: `http://localhost:3000/api`

### 3. API Response Format

The backend should return responses in this format:

**Login/Signup Success:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

**Login/Signup Error:**
```json
{
  "message": "Invalid email or password"
}
```

## Features

### ✅ Form Validation
- Required field validation
- Email format validation
- Password length validation (min 6 characters)
- Password matching (signup only)

### ✅ State Management
- Global auth state with Zustand
- Token persistence with AsyncStorage
- Loading state during API calls
- Error handling and display

### ✅ Security
- JWT token stored in AsyncStorage
- Automatic token attachment to API requests
- Token cleanup on 401 errors
- Secure password fields with toggle visibility

### ✅ User Experience
- Form error messages below inputs
- API error messages in error box
- Disabled buttons during loading
- Loading spinner on button during API call
- Navigation after successful login/signup
- Dashboard redirect for authenticated users

## Navigation Flow

```
App Start
   ↓
Initialize Auth (check stored token)
   ↓
   ├─→ Authenticated? → Dashboard (tabs)
   │
   └─→ Not Authenticated? → Login Screen
       ├─→ Login Success → Dashboard (tabs)
       ├─→ Go to Signup → Signup Screen
       │   ├─→ Signup Success → Dashboard (tabs)
       │   └─→ Back to Login → Login Screen
       └─→ Forgot Password → (implement as needed)
```

## API Integration

### Backend Requirements

Your backend should have these endpoints:

```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: {...} }

POST /api/auth/signup
Body: { email: string, password: string }
Response: { token: string, user: {...} }

POST /api/auth/logout
Headers: Authorization: Bearer {token}
Response: { message: "Logged out" }

POST /api/auth/verify
Headers: Authorization: Bearer {token}
Response: { valid: boolean }
```

## Customization

### Change API Base URL
Edit `services/api.ts`:
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_URL/api';
```

### Modify Form Validation Rules
Edit the `rules` prop in `useForm()` call in:
- `screens/LoginScreen.tsx`
- `screens/SignupScreen.tsx`

### Update Colors/Styling
All styles are in `StyleSheet.create()` at the bottom of screen files.

Key colors:
- Background: `#0F1419`
- Primary: `#A8B4FF`
- Text: `#FFFFFF`
- Secondary: `#6DA8D8`

### Add More Fields
1. Add field to form state in `useForm()`
2. Add Controller component in JSX
3. Update API request payload in `useAuth.ts`
4. Update backend endpoint

## Error Handling

Errors are displayed in three ways:

1. **Validation Errors** - Below input fields (red text)
2. **API Errors** - In error box above button
3. **Form Errors** - Alert popups for critical issues

The error box appears when:
- Invalid credentials
- Network errors
- Email already exists (signup)
- Server errors (500, etc.)

## Testing

### Test Login Flow
1. Enter valid email and password
2. Check if token is stored
3. Check if user is redirected to dashboard
4. Check console logs for token

### Test Error Handling
1. Enter invalid email format
2. Leave fields empty
3. Enter wrong password
4. Check error messages display

### Test State Persistence
1. Login and close app
2. Reopen app
3. Check if already logged in (no login screen)

## Troubleshooting

**Issue**: Getting `Cannot find module` errors
**Solution**: Make sure all files are created in correct paths

**Issue**: Screens not showing up
**Solution**: Ensure routes are configured in `app/_layout.tsx`

**Issue**: Token not persisting
**Solution**: Check AsyncStorage is properly initialized

**Issue**: API calls failing
**Solution**: Verify `EXPO_PUBLIC_API_URL` is set correctly

## Future Enhancements

- [ ] Refresh token mechanism
- [ ] Social login (Google, Apple)
- [ ] Email verification
- [ ] Forgot password flow
- [ ] Two-factor authentication
- [ ] Remember me functionality
- [ ] Role-based access control

---

**Note**: Make sure to update your backend API URL before deploying to production.
