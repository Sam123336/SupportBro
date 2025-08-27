const mongoose = require('mongoose');
require('dotenv').config();
const Ticket = require('./src/models/Ticket');
const Client = require('./src/models/Client');
const User = require('./src/models/User');

async function fixOrphanedTickets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supportticket');
    console.log('Connected to database');
    
    // Find tickets with null client references
    const orphanedTickets = await Ticket.find({ 
      $or: [
        { client: null },
        { client: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orphanedTickets.length} orphaned tickets`);
    
    if (orphanedTickets.length === 0) {
      console.log('No orphaned tickets to fix');
      return;
    }
    
    // Get the first available client to assign tickets to
    const firstClient = await Client.findOne();
    
    if (!firstClient) {
      console.log('No client records found. Creating a default client...');
      
      // Find or create a client user
      let clientUser = await User.findOne({ role: 'client' });
      if (!clientUser) {
        console.log('No client users found. Please create a client account first.');
        return;
      }
      
      // Create client record
      const newClient = new Client({
        user: clientUser._id,
        name: clientUser.name
      });
      await newClient.save();
      console.log(`Created client record for ${clientUser.name}`);
    }
    
    const targetClient = firstClient || await Client.findOne();
    
    // Update all orphaned tickets
    const updateResult = await Ticket.updateMany(
      { 
        $or: [
          { client: null },
          { client: { $exists: false } }
        ]
      },
      { client: targetClient._id }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} tickets`);
    
    // Verify the fix
    const verifyTickets = await Ticket.find().populate('client', 'name');
    console.log('\n=== Verification ===');
    verifyTickets.forEach((ticket, i) => {
      console.log(`${i+1}. ${ticket.subject} -> Client: ${ticket.client ? ticket.client.name : 'NULL'}`);
    });
    
    console.log('\n✅ Ticket migration completed successfully');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
}

fixOrphanedTickets();