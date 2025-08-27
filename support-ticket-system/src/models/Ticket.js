const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Client', 'SupportEngineer']
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  category: {
    type: String,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportEngineer',
    default: null
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ticketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set senderModel for messages based on sender reference
  this.messages.forEach(async (message) => {
    if (!message.senderModel) {
      try {
        const Client = mongoose.model('Client');
        const SupportEngineer = mongoose.model('SupportEngineer');
        
        const client = await Client.findById(message.sender);
        if (client) {
          message.senderModel = 'Client';
        } else {
          message.senderModel = 'SupportEngineer';
        }
      } catch (error) {
        console.error('Error setting senderModel:', error);
      }
    }
  });
  
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);