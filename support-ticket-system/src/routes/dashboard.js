const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { auth } = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'client') {
      query.client = req.user._id;
    } else if (req.user.role === 'engineer') {
      query.assignedTo = req.user._id;
    }

    const totalTickets = await Ticket.countDocuments(query);
    const openTickets = await Ticket.countDocuments({ ...query, status: { $in: ['open', 'in-progress'] } });
    const resolvedTickets = await Ticket.countDocuments({ ...query, status: 'resolved' });

    const avgResponseTime = '2 hours'; 

    res.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResponseTime
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;