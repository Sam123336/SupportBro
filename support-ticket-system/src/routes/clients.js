const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { addClientToQueue, updateClientStatus } = require('../services/queueManager');

router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        const newClient = new Client({ name, queuePosition: null, assignedEngineer: null });
        await newClient.save();
        addClientToQueue(newClient);
        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ message: 'Error creating client', error });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching client', error });
    }
});

router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const updatedClient = await updateClientStatus(req.params.id, status);
        if (!updatedClient) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.json(updatedClient);
    } catch (error) {
        res.status(500).json({ message: 'Error updating client status', error });
    }
});

module.exports = router;