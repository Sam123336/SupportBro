const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io, queueManager, aiService) => {
    const clients = {};
    
    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (!user || !user.isActive) {
                return next(new Error('Authentication error: Invalid token or user not active'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}, User ID: ${socket.user._id}, Role: ${socket.user.role}`);

        // Store client connection
        clients[socket.id] = {
            userId: socket.user._id.toString(),
            role: socket.user.role,
            socket: socket
        };

        socket.on('joinQueue', async () => {
            const clientId = socket.user._id.toString();
            console.log(`Client ${socket.user.name} (${clientId}) joined the queue`);
            
            // Only allow clients to join the queue
            if (socket.user.role !== 'client') {
                socket.emit('error', { message: 'Only clients can join the support queue' });
                return;
            }
            
            try {
                // Add client to queue using queue manager
                const result = await queueManager.assignClient({
                    _id: socket.user._id,
                    name: socket.user.name,
                    queuePosition: null,
                    assignedEngineer: null
                });
                
                if (result.assigned) {
                    socket.emit('engineerAssigned', {
                        engineer: result.engineer,
                        message: 'You have been connected to a support engineer!'
                    });
                } else {
                    socket.emit('queuePosition', result.position);
                }
            } catch (error) {
                console.error('Error adding client to queue:', error);
                socket.emit('error', { message: 'Failed to join queue. Please try again.' });
            }
        });

        socket.on('sendMessage', async (message) => {
            const clientId = socket.user._id.toString();
            console.log(`Message from client ${clientId}:`, message);
            
            if (socket.user.role !== 'client') {
                socket.emit('error', { message: 'Only clients can send messages to AI' });
                return;
            }
            
            try {
                const response = await aiService.sendMessageToAI(message);
                socket.emit('airesponse', response);
            } catch (error) {
                console.error(`Error processing message for client ${clientId}:`, error);
                socket.emit('airesponse', {
                    error: 'Failed to process your message. Please try again later.'
                });
            }
        });

        // Engineer events
        socket.on('engineerAvailable', async () => {
            if (socket.user.role !== 'engineer') {
                socket.emit('error', { message: 'Only engineers can set availability' });
                return;
            }
            
            try {
                const engineerId = socket.user._id.toString();
                const assignedClient = await queueManager.engineerAvailable(engineerId);
                
                if (assignedClient) {
                    socket.emit('clientAssigned', assignedClient);
                    
                    // Notify the client
                    const clientSocket = findClientSocket(assignedClient._id.toString());
                    if (clientSocket) {
                        clientSocket.emit('engineerAssigned', {
                            engineer: socket.user,
                            message: 'You have been connected to a support engineer!'
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling engineer availability:', error);
                socket.emit('error', { message: 'Failed to update availability' });
            }
        });

        // Direct chat between client and engineer for assigned tickets
        socket.on('sendTicketMessage', async (data) => {
            const { ticketId, content } = data;
            
            try {
                // Find the ticket to verify assignment
                const Ticket = require('../models/Ticket');
                const ticket = await Ticket.findById(ticketId).populate('client assignedTo');
                
                if (!ticket) {
                    socket.emit('error', { message: 'Ticket not found' });
                    return;
                }

                let canMessage = false;
                let recipientUserId = null;
                let senderDocId = null;
                let senderModel = '';

                if (socket.user.role === 'client') {
                    const Client = require('../models/Client');
                    const client = await Client.findOne({ user: socket.user._id });
                    
                    if (client && ticket.client && ticket.client._id.toString() === client._id.toString()) {
                        canMessage = true;
                        senderDocId = client._id;
                        senderModel = 'Client';
               
                        if (ticket.assignedTo) {
                            const SupportEngineer = require('../models/SupportEngineer');
                            const engineer = await SupportEngineer.findById(ticket.assignedTo._id).populate('user');
                            if (engineer && engineer.user) {
                                recipientUserId = engineer.user._id.toString();
                            }
                        }
                    }
                } else if (socket.user.role === 'engineer') {
                    const SupportEngineer = require('../models/SupportEngineer');
                    const engineer = await SupportEngineer.findOne({ user: socket.user._id });
                    
                    // Check if engineer exists and is assigned to this ticket
                    if (engineer && ticket.assignedTo && ticket.assignedTo._id.toString() === engineer._id.toString()) {
                        canMessage = true;
                        senderDocId = engineer._id;
                        senderModel = 'SupportEngineer';
                        
                        // Send to client
                        if (ticket.client) {
                            const Client = require('../models/Client');
                            const client = await Client.findById(ticket.client._id).populate('user');
                            if (client && client.user) {
                                recipientUserId = client.user._id.toString();
                            }
                        }
                    }
                }

                if (!canMessage) {
                    socket.emit('error', { message: 'You do not have permission to message on this ticket' });
                    return;
                }

                const message = {
                    sender: senderDocId,
                    senderModel: senderModel,
                    content,
                    createdAt: new Date()
                };

                ticket.messages.push(message);
                await ticket.save();

                await ticket.populate('messages.sender', 'name');
                const newMessage = ticket.messages[ticket.messages.length - 1];

                socket.emit('ticketMessageReceived', {
                    ticketId: ticket._id,
                    message: newMessage
                });

                // Send to the other participant if they're online
                if (recipientUserId) {
                    const recipientSocket = findClientSocket(recipientUserId);
                    if (recipientSocket) {
                        recipientSocket.emit('ticketMessageReceived', {
                            ticketId: ticket._id,
                            message: newMessage
                        });
                    }
                }

            } catch (error) {
                console.error('Error sending ticket message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle ticket resolution
        socket.on('resolveTicket', async (data) => {
            const { ticketId } = data;
            
            try {
                const Ticket = require('../models/Ticket');
                const ticket = await Ticket.findById(ticketId);
                
                if (!ticket) {
                    socket.emit('error', { message: 'Ticket not found' });
                    return;
                }

                // Only engineers can resolve tickets
                if (socket.user.role !== 'engineer') {
                    socket.emit('error', { message: 'Only engineers can resolve tickets' });
                    return;
                }

                // Verify engineer is assigned to this ticket
                const SupportEngineer = require('../models/SupportEngineer');
                const engineer = await SupportEngineer.findOne({ user: socket.user._id });
                if (!engineer || !ticket.assignedTo || ticket.assignedTo.toString() !== engineer._id.toString()) {
                    socket.emit('error', { message: 'You are not assigned to this ticket' });
                    return;
                }

                // Update ticket status
                ticket.status = 'resolved';
                await ticket.save();

                await ticket.populate([
                    { path: 'client', select: 'name' },
                    { path: 'assignedTo', select: 'name' }
                ]);

                // Notify both client and engineer
                socket.emit('ticketResolved', ticket);

                // Notify client if online
                const Client = require('../models/Client');
                const client = await Client.findById(ticket.client._id).populate('user');
                if (client) {
                    const clientSocket = findClientSocket(client.user._id.toString());
                    if (clientSocket) {
                        clientSocket.emit('ticketResolved', ticket);
                    }
                }

                // Broadcast to all engineers
                io.emit('ticketUpdated', ticket);

            } catch (error) {
                console.error('Error resolving ticket:', error);
                socket.emit('error', { message: 'Failed to resolve ticket' });
            }
        });

        socket.on('getQueueStatus', () => {
            if (socket.user.role !== 'engineer') {
                socket.emit('error', { message: 'Only engineers can view queue status' });
                return;
            }
            
            try {
                const queueStatus = queueManager.getQueueStatus();
                socket.emit('queueUpdate', queueStatus);
            } catch (error) {
                console.error('Error getting queue status:', error);
                socket.emit('error', { message: 'Failed to get queue status' });
            }
        });

        socket.on('disconnect', () => {
            const clientId = socket.user._id.toString();
            console.log(`Client ${socket.user.name} (${clientId}) disconnected`);
            
            // Remove from clients list
            delete clients[socket.id];
            
            // If client was in queue, remove them
            if (socket.user.role === 'client') {
                queueManager.removeClientFromQueue(clientId).catch(error => {
                    console.error('Error removing client from queue:', error);
                });
            }
        });
    });

    // Helper function to find client socket by user ID
    function findClientSocket(userId) {
        for (const socketId in clients) {
            if (clients[socketId].userId === userId) {
                return clients[socketId].socket;
            }
        }
        return null;
    }

    // Broadcast queue updates to all engineers
    function broadcastQueueUpdate() {
        const queueStatus = queueManager.getQueueStatus();
        
        for (const socketId in clients) {
            const client = clients[socketId];
            if (client.role === 'engineer') {
                client.socket.emit('queueUpdate', queueStatus);
            }
        }
    }

    // Set up periodic queue updates
    setInterval(broadcastQueueUpdate, 10000); // Every 10 seconds
};

module.exports = socketHandler;