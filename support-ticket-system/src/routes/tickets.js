const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Client = require('../models/Client');
const SupportEngineer = require('../models/SupportEngineer');
const { auth } = require('../middleware/auth');

// Get all tickets for a client
router.get('/my-tickets', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find the client record first
    const client = await Client.findOne({ user: req.user._id });
    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const tickets = await Ticket.find({ client: client._id })
      .populate('assignedTo', 'name')
      .populate('messages.sender', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching client tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tickets assigned to an engineer
router.get('/assigned-to-me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'engineer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find the engineer record first
    const engineer = await SupportEngineer.findOne({ user: req.user._id });
    if (!engineer) {
      return res.status(404).json({ error: 'Engineer profile not found' });
    }

    const tickets = await Ticket.find({ assignedTo: engineer._id })
      .populate('client', 'name')
      .populate('messages.sender', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching engineer tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available tickets for engineers
router.get('/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'engineer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find the engineer record by user reference
    const engineer = await SupportEngineer.findOne({ user: req.user._id });
    if (!engineer) {
      return res.status(404).json({ error: 'Engineer profile not found' });
    }

    // For now, show all open unassigned tickets regardless of specialization
    // This helps with debugging and ensures engineers can see available work
    const tickets = await Ticket.find({ 
      assignedTo: null, 
      status: 'open'
      // Temporarily removed: category: { $in: engineer.specializations || [] }
    })
      .populate('client', 'name email')
      .sort({ priority: -1, createdAt: 1 });

    console.log(`Engineer ${engineer.name} requesting available tickets - found ${tickets.length} tickets`);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching available tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent tickets for dashboard
router.get('/recent', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'client') {
      // Find the client record first
      const client = await Client.findOne({ user: req.user._id });
      if (!client) {
        return res.status(404).json({ error: 'Client profile not found' });
      }
      query.client = client._id;
    } else if (req.user.role === 'engineer') {
      // Find the engineer record first
      const engineer = await SupportEngineer.findOne({ user: req.user._id });
      if (!engineer) {
        return res.status(404).json({ error: 'Engineer profile not found' });
      }
      query.assignedTo = engineer._id;
    }

    const tickets = await Ticket.find(query)
      .populate('assignedTo', 'name')
      .populate('client', 'name')
      .populate('messages.sender', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching recent tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new ticket
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can create tickets' });
    }

    // Find the client record first
    const client = await Client.findOne({ user: req.user._id });
    if (!client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    const { subject, description, priority, category } = req.body;

    const ticket = new Ticket({
      subject,
      description,
      priority: priority || 'medium',
      category,
      client: client._id,
      status: 'open'
    });

    await ticket.save();
    await ticket.populate('client', 'name');

    // Emit to available engineers
    req.app.get('io').emit('newTicketAvailable', ticket);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign ticket to engineer
router.post('/:id/assign', auth, async (req, res) => {
  try {
    if (req.user.role !== 'engineer') {
      return res.status(403).json({ error: 'Only engineers can assign tickets' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.assignedTo) {
      return res.status(400).json({ error: 'Ticket already assigned' });
    }

    // Find the engineer record by user reference
    const engineer = await SupportEngineer.findOne({ user: req.user._id });
    if (!engineer) {
      return res.status(404).json({ error: 'Engineer profile not found' });
    }

    // Check engineer capacity using the correct engineer ID
    const assignedCount = await Ticket.countDocuments({ 
      assignedTo: engineer._id, 
      status: { $in: ['open', 'in-progress'] }
    });

    if (assignedCount >= engineer.capacity) {
      return res.status(400).json({ error: 'Engineer at capacity' });
    }

    // Assign using the engineer document ID, not user ID
    ticket.assignedTo = engineer._id;
    ticket.status = 'in-progress';
    await ticket.save();
    
    await ticket.populate([
      { path: 'client', select: 'name' },
      { path: 'assignedTo', select: 'name' }
    ]);

    // Emit ticket update
    req.app.get('io').emit('ticketUpdated', ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update ticket status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions with proper document ID lookups
    if (req.user.role === 'client') {
      const client = await Client.findOne({ user: req.user._id });
      if (!client || ticket.client.toString() !== client._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'engineer') {
      const engineer = await SupportEngineer.findOne({ user: req.user._id });
      if (!engineer || ticket.assignedTo?.toString() !== engineer._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    ticket.status = status;
    await ticket.save();

    await ticket.populate([
      { path: 'client', select: 'name' },
      { path: 'assignedTo', select: 'name' },
      { path: 'messages.sender', select: 'name' }
    ]);

    // Emit ticket update
    req.app.get('io').emit('ticketUpdated', ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add message to ticket
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions with proper document ID lookups
    let canAccess = false;
    let senderDocId = null;

    if (req.user.role === 'client') {
      const client = await Client.findOne({ user: req.user._id });
      if (client && ticket.client.toString() === client._id.toString()) {
        canAccess = true;
        senderDocId = client._id;
      }
    } else if (req.user.role === 'engineer') {
      const engineer = await SupportEngineer.findOne({ user: req.user._id });
      if (engineer && ticket.assignedTo?.toString() === engineer._id.toString()) {
        canAccess = true;
        senderDocId = engineer._id;
      }
    }

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = {
      sender: senderDocId,
      senderModel: req.user.role === 'client' ? 'Client' : 'SupportEngineer',
      content,
      createdAt: new Date()
    };

    ticket.messages.push(message);
    await ticket.save();

    await ticket.populate('messages.sender', 'name');
    const newMessage = ticket.messages[ticket.messages.length - 1];

    // Emit new message
    req.app.get('io').emit('newMessage', {
      ticketId: ticket._id,
      ...newMessage.toObject()
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;