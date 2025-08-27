const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const SupportEngineer = require('../models/SupportEngineer');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, capacity, specializations } = req.body;

        // Validate required fields
        if (!email || !password || !name || !role) {
            return res.status(400).json({ 
                error: 'Email, password, name, and role are required' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email already exists' 
            });
        }

        // Validate role
        if (!['client', 'engineer'].includes(role)) {
            return res.status(400).json({ 
                error: 'Role must be either "client" or "engineer"' 
            });
        }

        // Create user
        const user = new User({
            email,
            password,
            name,
            role
        });

        await user.save();

        // Create role-specific profile
        let roleSpecificData = null;
        if (role === 'client') {
            const client = new Client({
                user: user._id,
                name
            });
            await client.save();
            roleSpecificData = client;
        } else if (role === 'engineer') {
            const engineer = new SupportEngineer({
                user: user._id,
                name,
                capacity: capacity || 5,
                specializations: specializations || []
            });
            await engineer.save();
            roleSpecificData = engineer;
        }

        // Generate token
        const token = generateToken(user._id);

        // Prepare user object for React frontend
        const userForFrontend = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            ...(role === 'engineer' && { 
                capacity: roleSpecificData.capacity,
                specializations: roleSpecificData.specializations 
            })
        };

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userForFrontend
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed. Please try again.' 
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ 
                error: 'Account is deactivated. Please contact support.' 
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Get role-specific data
        let roleData = null;
        if (user.role === 'client') {
            roleData = await Client.findOne({ user: user._id });
        } else if (user.role === 'engineer') {
            roleData = await SupportEngineer.findOne({ user: user._id });
        }

        // Prepare user object for React frontend
        const userForFrontend = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            ...(user.role === 'engineer' && roleData && { 
                capacity: roleData.capacity,
                specializations: roleData.specializations 
            })
        };

        res.json({
            message: 'Login successful',
            token,
            user: userForFrontend
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed. Please try again.' 
        });
    }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        let roleData = null;
        
        if (req.user.role === 'client') {
            roleData = await Client.findOne({ user: req.user._id })
                .populate('assignedEngineer', 'name specializations');
        } else if (req.user.role === 'engineer') {
            roleData = await SupportEngineer.findOne({ user: req.user._id });
        }

        // Prepare user object for React frontend
        const userForFrontend = {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            ...(req.user.role === 'engineer' && roleData && { 
                capacity: roleData.capacity,
                specializations: roleData.specializations 
            })
        };

        res.json({
            user: userForFrontend
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch profile' 
        });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, capacity, specializations } = req.body;

        // Update user name if provided
        if (name) {
            req.user.name = name;
            await req.user.save();
        }

        // Update role-specific data
        if (req.user.role === 'engineer') {
            const engineer = await SupportEngineer.findOne({ user: req.user._id });
            if (engineer) {
                if (capacity !== undefined) engineer.capacity = capacity;
                if (specializations !== undefined) engineer.specializations = specializations;
                if (name) engineer.name = name;
                await engineer.save();
            }
        } else if (req.user.role === 'client') {
            const client = await Client.findOne({ user: req.user._id });
            if (client && name) {
                client.name = name;
                await client.save();
            }
        }

        res.json({
            message: 'Profile updated successfully',
            user: req.user
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            error: 'Failed to update profile' 
        });
    }
});

// Logout (client-side token removal, but we can track this server-side if needed)
router.post('/logout', auth, async (req, res) => {
    try {
        // In a more advanced implementation, you might want to blacklist the token
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;