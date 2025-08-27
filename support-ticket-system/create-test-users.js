require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Client = require('./src/models/Client');
const SupportEngineer = require('./src/models/SupportEngineer');

async function createTestUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Check if test users already exist
        const existingClient = await User.findOne({ email: 'test@example.com' });
        const existingEngineer = await User.findOne({ email: 'engineer@example.com' });
        
        if (!existingClient) {
            // Create test client
            const clientUser = new User({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test Client',
                role: 'client'
            });
            await clientUser.save();
            
            const client = new Client({
                user: clientUser._id,
                name: 'Test Client'
            });
            await client.save();
            
            console.log('✅ Test client created: test@example.com / password123');
        } else {
            console.log('ℹ️  Test client already exists: test@example.com / password123');
        }
        
        if (!existingEngineer) {
            // Create test engineer
            const engineerUser = new User({
                email: 'engineer@example.com',
                password: 'password123',
                name: 'Test Engineer',
                role: 'engineer'
            });
            await engineerUser.save();
            
            const engineer = new SupportEngineer({
                user: engineerUser._id,
                name: 'Test Engineer',
                capacity: 5,
                specializations: ['Technical Support', 'Bug Fixes']
            });
            await engineer.save();
            
            console.log('✅ Test engineer created: engineer@example.com / password123');
        } else {
            console.log('ℹ️  Test engineer already exists: engineer@example.com / password123');
        }
        
        console.log('\n🎉 Test users are ready!');
        console.log('📧 Client login: test@example.com / password123');
        console.log('🔧 Engineer login: engineer@example.com / password123');
        
    } catch (error) {
        console.error('❌ Error creating test users:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

createTestUsers();