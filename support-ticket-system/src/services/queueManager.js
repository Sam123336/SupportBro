const mongoose = require('mongoose');
const SupportEngineer = require('../models/SupportEngineer');
const Client = require('../models/Client');

// Queue data structure class
class SupportQueue {
    constructor() {
        this.queue = [];
        this.engineers = [];
    }

    // Add client to queue
    enqueue(client) {
        this.queue.push(client);
        return this.queue.length;
    }

    // Remove and return first client from queue
    dequeue() {
        return this.queue.shift();
    }

    // Get queue size
    size() {
        return this.queue.length;
    }

    // Check if queue is empty
    isEmpty() {
        return this.queue.length === 0;
    }

    // Get client position in queue
    getPosition(clientId) {
        const index = this.queue.findIndex(client => client._id.toString() === clientId);
        return index === -1 ? null : index + 1;
    }

    // Remove specific client from queue
    removeClient(clientId) {
        const index = this.queue.findIndex(client => client._id.toString() === clientId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            this.updateQueuePositions();
            return true;
        }
        return false;
    }

    // Get all clients in queue
    getAllClients() {
        return this.queue;
    }

    // Update queue positions for all clients
    updateQueuePositions() {
        this.queue.forEach((client, index) => {
            client.queuePosition = index + 1;
        });
    }

    // Peek at first client without removing
    peek() {
        return this.queue.length > 0 ? this.queue[0] : null;
    }
}

// Create singleton instance
const supportQueue = new SupportQueue();

// Function to add an engineer to the available engineers list
const addEngineer = async (engineer) => {
    try {
        // Check if engineer already exists in the list
        const existingIndex = supportQueue.engineers.findIndex(e => e._id.toString() === engineer._id.toString());
        
        if (existingIndex === -1) {
            supportQueue.engineers.push(engineer);
        } else {
            // Update existing engineer
            supportQueue.engineers[existingIndex] = engineer;
        }
        
        return true;
    } catch (error) {
        console.error('Error adding engineer:', error);
        return false;
    }
};

// Function to assign a client to an available engineer or queue them
const assignClient = async (client) => {
    try {
        // Find available engineer with capacity
        const availableEngineer = supportQueue.engineers.find(engineer => {
            return engineer.currentClients < engineer.capacity && engineer.isAvailable;
        });

        if (availableEngineer) {
            // Assign client to engineer
            const clientDoc = await Client.findOneAndUpdate(
                { user: client._id },
                { assignedEngineer: availableEngineer._id, queuePosition: 0 },
                { new: true, upsert: true }
            );

            // Update engineer's current client count
            await SupportEngineer.findByIdAndUpdate(
                availableEngineer._id,
                { $inc: { currentClients: 1 } }
            );

            // Update local engineer object
            availableEngineer.currentClients += 1;

            return { assigned: true, engineer: availableEngineer, client: clientDoc };
        } else {
            // Add to queue
            const position = supportQueue.enqueue(client);
            
            // Update client in database
            const clientDoc = await Client.findOneAndUpdate(
                { user: client._id },
                { queuePosition: position, isInQueue: true },
                { new: true, upsert: true }
            );

            return { assigned: false, position: position, client: clientDoc };
        }
    } catch (error) {
        console.error('Error assigning client:', error);
        throw error;
    }
};

// Function to handle when an engineer becomes available
const engineerAvailable = async (engineerId) => {
    try {
        if (!supportQueue.isEmpty()) {
            const client = supportQueue.dequeue();
            
            // Update client assignment
            const updatedClient = await Client.findOneAndUpdate(
                { user: client._id },
                { 
                    assignedEngineer: engineerId, 
                    queuePosition: 0, 
                    isInQueue: false 
                },
                { new: true }
            );

            // Update engineer's current client count
            await SupportEngineer.findByIdAndUpdate(
                engineerId,
                { $inc: { currentClients: 1 } }
            );

            // Update local engineer object
            const engineer = supportQueue.engineers.find(e => e._id.toString() === engineerId);
            if (engineer) {
                engineer.currentClients += 1;
            }

            // Update queue positions for remaining clients
            supportQueue.updateQueuePositions();
            
            // Update remaining clients in database
            const updatePromises = supportQueue.getAllClients().map(client => 
                Client.findOneAndUpdate(
                    { user: client._id },
                    { queuePosition: client.queuePosition }
                )
            );
            await Promise.all(updatePromises);

            return updatedClient;
        }
        return null;
    } catch (error) {
        console.error('Error handling engineer availability:', error);
        throw error;
    }
};

// Function to get queue status
const getQueueStatus = () => {
    return {
        size: supportQueue.size(),
        clients: supportQueue.getAllClients().map(client => ({
            id: client._id,
            name: client.name,
            position: client.queuePosition
        }))
    };
};

// Function to remove client from queue
const removeClientFromQueue = async (clientId) => {
    try {
        const removed = supportQueue.removeClient(clientId);
        
        if (removed) {
            // Update client in database
            await Client.findOneAndUpdate(
                { user: clientId },
                { queuePosition: 0, isInQueue: false }
            );

            // Update all remaining clients' positions in database
            const updatePromises = supportQueue.getAllClients().map(client => 
                Client.findOneAndUpdate(
                    { user: client._id },
                    { queuePosition: client.queuePosition }
                )
            );
            await Promise.all(updatePromises);
        }
        
        return removed;
    } catch (error) {
        console.error('Error removing client from queue:', error);
        throw error;
    }
};

// Function to release a client from an engineer
const releaseClient = async (clientId, engineerId) => {
    try {
        // Update client
        await Client.findOneAndUpdate(
            { user: clientId },
            { 
                assignedEngineer: null, 
                queuePosition: 0, 
                isInQueue: false 
            }
        );

        // Update engineer's current client count
        await SupportEngineer.findByIdAndUpdate(
            engineerId,
            { $inc: { currentClients: -1 } }
        );

        // Update local engineer object
        const engineer = supportQueue.engineers.find(e => e._id.toString() === engineerId);
        if (engineer && engineer.currentClients > 0) {
            engineer.currentClients -= 1;
        }

        return true;
    } catch (error) {
        console.error('Error releasing client:', error);
        throw error;
    }
};

// Function to get queue position for a specific client
const getQueuePosition = (clientId) => {
    return supportQueue.getPosition(clientId);
};

// Function to initialize engineers from database
const initializeEngineers = async () => {
    try {
        const engineers = await SupportEngineer.find({ isAvailable: true }).populate('user');
        supportQueue.engineers = engineers;
        console.log(`Initialized ${engineers.length} engineers`);
    } catch (error) {
        console.error('Error initializing engineers:', error);
    }
};

module.exports = {
    addEngineer,
    assignClient,
    engineerAvailable,
    getQueueStatus,
    removeClientFromQueue,
    releaseClient,
    getQueuePosition,
    initializeEngineers,
    supportQueue
};