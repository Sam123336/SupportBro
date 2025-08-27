require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/database.js');
const authRoutes = require('./routes/auth.js');
const clientRoutes = require('./routes/clients.js');
const engineerRoutes = require('./routes/engineers.js');
const ticketRoutes = require('./routes/tickets.js');
const dashboardRoutes = require('./routes/dashboard.js');
const socketHandler = require('./socket/socketHandler.js');
const queueManager = require('./services/queueManager.js');
const aiService = require('./services/aiService.js');
const airoutes = require('./routes/airoutes.js');


const app = express();

// View engine setup (for legacy EJS routes)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Layout configuration
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// CORS configuration for React frontend
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Connect to database
connectDB();

// API Routes for React frontend
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/engineers', engineerRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai',airoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../support-frontend/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../support-frontend/build/index.html'));
    });
} else {
    // Legacy EJS routes for development
    app.get('/', (req, res) => {
        res.render('index', { title: 'Support Ticket System' });
    });

    app.get('/login', (req, res) => {
        res.render('login', { title: 'Login - Support System' });
    });

    app.get('/register', (req, res) => {
        res.render('register', { title: 'Register - Support System' });
    });

    app.get('/dashboard', (req, res) => {
        res.render('dashboard', { title: 'Dashboard - Support System' });
    });

    app.get('/client', (req, res) => {
        res.render('client', { title: 'Client Portal - Support System' });
    });

    app.get('/engineer', (req, res) => {
        res.render('engineer', { title: 'Engineer Portal - Support System' });
    });

    // Debug route for testing login
    app.get('/test-login', (req, res) => {
        res.render('test-login', { title: 'Login Debug Test' });
    });
}

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup with CORS for React
const io = socketIo(server, {
    cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
});

// Make io accessible to routes
app.set('io', io);

// Initialize queue manager with engineers from database
async function initializeSystem() {
    try {
        await queueManager.initializeEngineers();
        console.log('Queue manager initialized');
    } catch (error) {
        console.error('Error initializing queue manager:', error);
    }
}

// Initialize socket handler
socketHandler(io, queueManager, aiService);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/api`);
    console.log(`React frontend dev server should run on: http://localhost:3000`);
    
    // Initialize system after server starts
    await initializeSystem();
});
