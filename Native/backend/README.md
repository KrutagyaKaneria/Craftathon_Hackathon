# DriveGuard Backend API

Complete backend API for DriveGuard mobile application with authentication, JWT tokens, and MongoDB integration.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── authController.js    # Auth logic (signup, login)
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── models/
│   │   └── User.js              # User database schema
│   ├── routes/
│   │   └── authRoutes.js        # Auth endpoints
│   ├── utils/
│   │   └── tokenUtils.js        # JWT token utilities
│   └── server.js                # Express server setup
├── package.json
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

**Edit `.env`:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/driveguard
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Setup MongoDB (Local)

**Option A: Using Local MongoDB**
```bash
# Start MongoDB service
mongod
```

**Option B: Using MongoDB Atlas (Cloud)**
- Create account at https://www.mongodb.com/cloud/atlas
- Replace `MONGODB_URI` in `.env` with your cluster connection string

**Option C: Using Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start Backend Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server runs on: `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "user_id_here",
    "email": "user@example.com",
    "token": "jwt_token_here"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "user_id_here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "jwt_token_here"
  }
}
```

#### Verify Token
```http
POST /api/auth/verify-token
Authorization: Bearer your_jwt_token_here
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user_id_here",
    "email": "user@example.com"
  }
}
```

#### Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer your_jwt_token_here
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id_here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

#### Health Check
```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "Backend is running",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 409 Conflict (Email Already Exists)
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error during login"
}
```

## Testing Backend

### Using cURL

**Sign Up:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

1. Import the API collection
2. Set `{{BASE_URL}}` environment variable to `http://localhost:5000`
3. Use the endpoints with the documented request/response format

## CORS Configuration

The backend accepts requests from:
- `http://localhost:8081` (Expo development)
- `http://localhost:3000` (React web development)
- `exp://localhost:8081` (Expo protocol)
- All origins in development mode

**To restrict in production, edit `src/server.js` CORS configuration.**

## Database Schema

### User Model

```typescript
{
  _id: ObjectId,
  email: String (unique, required, lowercase),
  password: String (hashed, required),
  firstName: String (optional),
  lastName: String (optional),
  phone: String (optional),
  isActive: Boolean (default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Deployment

### Heroku Deployment

1. Create Heroku account and app
2. Add MongoDB URI environment variable
3. Deploy:
```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Docker Deployment

```bash
docker build -t driveguard-backend .
docker run -p 5000:5000 driveguard-backend
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/driveguard |
| JWT_SECRET | JWT signing secret | your_secret_key |
| JWT_REFRESH_SECRET | Refresh token secret | your_refresh_secret |
| JWT_EXPIRE | Token expiration time | 7d |
| NODE_ENV | Environment mode | development/production |

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB service is running: `mongod`
- Check MONGODB_URI in `.env`
- Verify MongoDB is accessible on localhost:27017

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### JWT Token Error
- Ensure JWT_SECRET is set in `.env`
- Check token format: `Bearer <token>`

## Technologies Used

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin support
- **dotenv** - Environment management

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
