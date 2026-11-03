## Live Link : https://togetherly-client-murex.vercel.app/
# Togetherly - Backend API

The backend service for **Togetherly**, a social development events platform.

This REST API handles event management, user authentication verification, event participation, and participant information using Express.js and MongoDB.

## 🌐 Live API

[https://togetherly-server-seven.vercel.app/](https://togetherly-server-seven.vercel.app/)

## ✨ Key Features

- **RESTful API:** Provides endpoints for managing events and participation.
- **Create Events:** Authenticated users can create community service events.
- **Retrieve Events:** Fetch all upcoming events and individual event details.
- **Update Events:** Allows event creators to update their own events.
- **Delete Events:** Allows event creators to delete their own events.
- **JWT Authentication:** Verifies Better Auth JWT tokens before accessing protected endpoints.
- **Event Participation:** Authenticated users can join and leave events.
- **Duplicate Join Prevention:** Prevents multiple participation records for the same user and event.
- **Participant Information:** Retrieves event participant lists and total participant counts.
- **Joined Events:** Retrieves events joined by the authenticated user.
- **Ownership Authorization:** Ensures users can only update or delete their own events.
- **MongoDB Integration:** Uses MongoDB native driver for database operations.
- **CORS Configuration:** Allows requests from the configured frontend origin.

## 🛠️ Technology Stack

- Node.js
- Express.js
- JavaScript (ES Modules)
- MongoDB
- MongoDB Native Driver
- Better Auth JWT
- JOSE
- CORS
- dotenv
- Vercel

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/raihankabir1952/togetherly-server.git
cd togetherly-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

CLIENT_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000

MONGODB_URI=your_mongodb_connection_string
```

Replace the placeholder MongoDB connection string with your actual credentials.

### 4. Run the Development Server

```bash
npm run dev
```

The backend server will run at:

[http://localhost:5000](http://localhost:5000)

## 🔌 API Endpoints

### General

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check server status |

### Events

| Method | Endpoint | Description |
|---|---|---|
| GET | `/events` | Get upcoming events |
| GET | `/events/:id` | Get event details |
| POST | `/events` | Create an event |
| PUT | `/events/:id` | Update an event |
| DELETE | `/events/:id` | Delete an event |
| GET | `/my-events` | Get events created by the logged-in user |

### Event Participation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/events/:id/join` | Join an event |
| GET | `/events/:id/join-status` | Check participation status |
| DELETE | `/events/:id/leave` | Leave an event |
| GET | `/events/:id/participants` | Get event participants |
| GET | `/joined-events` | Get joined events |

**Note:** Protected endpoints require a valid JWT token in the Authorization header.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🗄️ Database

Togetherly uses MongoDB with the following collections:

- `events` - Stores event information.
- `user` - Stores user information managed by Better Auth.
- `account` - Stores authentication account information.
- `eventParticipants` - Stores event participation records.

A unique compound index on event ID and user email helps prevent duplicate participation records.

## 🔐 Security

- JWT-based authentication for protected API routes.
- User ownership verification for event updates and deletion.
- Input validation for event data.
- MongoDB ObjectId validation.
- CORS configuration.
- Duplicate participation prevention.

## 🚀 Deployment

The backend is deployed on Vercel.

Production environment variables:

```env
CLIENT_URL=https://togetherly-client-murex.vercel.app
BETTER_AUTH_URL=https://togetherly-client-murex.vercel.app
MONGODB_URI=your_mongodb_connection_string
```

Configure these variables in the Vercel project settings. Never commit secret credentials to GitHub.

## 🔗 Related Repository

**Frontend Repository:**  
[https://github.com/raihankabir1952/togetherly-client](https://github.com/raihankabir1952/togetherly-client)

## 👨‍💻 Author

**Md Raihan Kabir**

- GitHub: [raihankabir1952](https://github.com/raihankabir1952)

---

*Togetherly — Small Acts. Greater Impact.*
