const express = require('express');
const router = express.Router();
const SupportEngineer = require('../models/SupportEngineer');

// Create a new support engineer
router.post('/', async (req, res) => {
    const { name, capacity } = req.body;
    const engineer = new SupportEngineer({ name, capacity });
    try {
        await engineer.save();
        res.status(201).json(engineer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all support engineers
router.get('/', async (req, res) => {
    try {
        const engineers = await SupportEngineer.find();
        res.json(engineers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a support engineer
router.put('/:id', async (req, res) => {
    const { name, capacity } = req.body;
    try {
        const engineer = await SupportEngineer.findByIdAndUpdate(req.params.id, { name, capacity }, { new: true });
        if (!engineer) return res.status(404).json({ message: 'Engineer not found' });
        res.json(engineer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a support engineer
router.delete('/:id', async (req, res) => {
    try {
        const engineer = await SupportEngineer.findByIdAndDelete(req.params.id);
        if (!engineer) return res.status(404).json({ message: 'Engineer not found' });
        res.json({ message: 'Engineer deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;