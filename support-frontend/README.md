# Support Ticket System - React Frontend

A modern React frontend for the Support Ticket System with real-time messaging and role-based access.

## Features

- **Role-based Registration**: Different registration forms for clients and engineers
- **Authentication**: JWT-based authentication with automatic token refresh
- **Real-time Updates**: WebSocket integration for live ticket updates and messaging
- **Client Portal**: Create and manage support tickets
- **Engineer Portal**: View assigned and available tickets, manage workload
- **Responsive Design**: Built with Tailwind CSS for mobile-first design

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- MongoDB running locally or connection string
- Backend server running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## User Roles

### Client Registration
- **Name**: Full name
- **Email**: Valid email address
- **Password**: Minimum 6 characters
- **Role**: Client (default)

### Engineer Registration
- **Name**: Full name
- **Email**: Valid email address
- **Password**: Minimum 6 characters
- **Role**: Engineer
- **Capacity**: Number of tickets (1-20)
- **Specializations**: Areas of expertise (e.g., "Technical Support", "Bug Fixes")

## Key Differences from EJS Version

1. **Single Page Application**: No page refreshes, smooth navigation
2. **Real-time Updates**: Instant notifications for ticket changes
3. **Enhanced UX**: Better form validation and error handling
4. **Mobile Responsive**: Optimized for all device sizes
5. **Component-based**: Reusable UI components

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api` with the following endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/tickets/my-tickets` - Client tickets
- `GET /api/tickets/assigned-to-me` - Engineer tickets
- `POST /api/tickets` - Create new ticket
- `POST /api/tickets/:id/assign` - Assign ticket to engineer

## Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components
│   └── UI/             # Generic UI components
├── contexts/           # React contexts
│   ├── AuthContext.js  # Authentication state
│   └── SocketContext.js # WebSocket connection
├── pages/              # Page components
│   ├── Home.js         # Landing page
│   ├── Login.js        # Login form
│   ├── Register.js     # Registration form
│   ├── Dashboard.js    # User dashboard
│   ├── ClientPortal.js # Client interface
│   └── EngineerPortal.js # Engineer interface
└── App.js              # Main app component
```

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `build/` directory.

## Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
