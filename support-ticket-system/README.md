# Support Ticket System

A real-time support ticket platform built with Node.js, Express.js, MongoDB, and Socket.IO. The system enables clients to request support from engineers, manages queues efficiently, and provides real-time chat functionality with AI-powered assistance.

## Features

- **Real-time Communication**: Live chat using Socket.IO for instant updates
- **Queue Management**: Intelligent queue system with position tracking and engineer capacity management
- **AI Integration**: AI-powered assistant (Groq API) to handle initial client inquiries
- **Role-based Authentication**: Secure JWT-based authentication for clients and engineers
- **Engineer Dashboard**: Capacity management and client assignment interface
- **Client Portal**: Queue status tracking and chat interface
- **RESTful API**: Comprehensive API endpoints for system management

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JSON Web Tokens (JWT)
- **AI Service**: Groq API
- **Frontend**: EJS templating, Bootstrap CSS
- **Styling**: Tailwind CSS

## Folder Structure

```
support-ticket-system/
├── src/
│   ├── server.js              # Application entry point
│   ├── config/
│   │   └── database.js        # MongoDB connection configuration
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── models/               # Mongoose data models
│   │   ├── User.js
│   │   ├── Client.js
│   │   └── SupportEngineer.js
│   ├── routes/               # API route handlers
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── clients.js        # Client management endpoints
│   │   └── engineers.js      # Engineer management endpoints
│   ├── services/             # Business logic services
│   │   ├── queueManager.js   # Queue management system
│   │   └── aiService.js      # AI integration service
│   └── socket/
│       └── socketHandler.js  # Socket.IO event handling
├── views/                    # EJS templates
├── public/                   # Static assets (CSS, JS, images)
├── package.json
├── .env.example             # Environment variables template
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sam123336/SupportBro.git
   cd support-ticket-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your actual configuration
   nano .env  # or use your preferred editor
   ```

4. **Configure Environment Variables:**
   
   Update the `.env` file with your actual values:
   ```bash
   # Database Configuration
   MONGODB_URI=your-mongodb-connection-string
   
   # JWT Configuration (use a strong secret in production)
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   
   # Server Configuration
   PORT=5000
   
   # AI Service Configuration
   GROQ_API_KEY=your-groq-api-key-here
   GEMINI_API_KEY=your-gemini-api-key-here  # Optional
   TAVILY_API_KEY=your-tavily-api-key-here  # Optional
   ```

5. **Start the application:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application:**
   - Open your browser and navigate to `http://localhost:5000`
   - Register as a client or engineer to start using the system

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Client Management
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id/status` - Update client status

### Engineer Management
- `GET /api/engineers` - Get all engineers
- `POST /api/engineers` - Create new engineer
- `PUT /api/engineers/:id` - Update engineer details

## Usage

### For Clients
1. Register/Login as a client
2. Access the client portal at `/client`
3. Choose between AI chat or join the human support queue
4. Chat with AI assistant for immediate help
5. Wait in queue for human engineer support

### For Engineers
1. Register/Login as an engineer
2. Access the engineer dashboard at `/engineer`
3. Set availability status and capacity
4. Monitor the client queue in real-time
5. Accept and chat with assigned clients

## Development

### Running in Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Environment Variables
- Copy `.env.example` to `.env`
- Never commit the actual `.env` file
- Rotate API keys regularly for security

### Database Schema
- **User**: Base user model with authentication
- **Client**: Client-specific data and queue information
- **SupportEngineer**: Engineer profile with capacity and specializations

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Protected API endpoints
- Environment variable security

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue in the GitHub repository.
