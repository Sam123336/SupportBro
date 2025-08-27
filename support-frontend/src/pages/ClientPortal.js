import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  PlusIcon, 
  TicketIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import AIHelper from '../components/UI/AIHelper';

const ClientPortal = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: ''
  });
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('ticketUpdated', (updatedTicket) => {
        setTickets(prev => prev.map(ticket => 
          ticket._id === updatedTicket._id ? updatedTicket : ticket
        ));
      });

      socket.on('newMessage', (message) => {
        if (selectedTicket && selectedTicket._id === message.ticketId) {
          setSelectedTicket(prev => ({
            ...prev,
            messages: [...(prev.messages || []), message]
          }));
        }
      });

      // Real-time chat for tickets
      socket.on('ticketMessageReceived', (data) => {
        const { ticketId, message } = data;
        
        // Update the selected ticket if it matches
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(prev => ({
            ...prev,
            messages: [...(prev.messages || []), message]
          }));
        }
        
        // Update tickets list to show new message count
        setTickets(prev => prev.map(ticket => {
          if (ticket._id === ticketId) {
            return {
              ...ticket,
              messages: [...(ticket.messages || []), message]
            };
          }
          return ticket;
        }));
      });

      // Handle ticket resolution
      socket.on('ticketResolved', (resolvedTicket) => {
        setTickets(prev => prev.map(ticket => 
          ticket._id === resolvedTicket._id ? resolvedTicket : ticket
        ));
        
        if (selectedTicket && selectedTicket._id === resolvedTicket._id) {
          setSelectedTicket(resolvedTicket);
        }
      });

      return () => {
        socket.off('ticketUpdated');
        socket.off('newMessage');
        socket.off('ticketMessageReceived');
        socket.off('ticketResolved');
      };
    }
  }, [socket, selectedTicket]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/tickets/my-tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/tickets', newTicket);
      setTickets(prev => [response.data, ...prev]);
      setNewTicket({
        subject: '',
        description: '',
        priority: 'medium',
        category: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || !socket) return;

    // Use socket for real-time messaging with engineers
    socket.emit('sendTicketMessage', {
      ticketId: selectedTicket._id,
      content: newMessage.trim()
    });
    
    setNewMessage('');
  };

  const handleResolveTicket = () => {
    if (!selectedTicket || !socket) return;
    
    if (window.confirm('Are you sure you want to mark this ticket as resolved? This will end the chat session with the engineer.')) {
      socket.emit('resolveTicket', {
        ticketId: selectedTicket._id
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <TicketIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
            <p className="text-gray-600">
              Manage your support tickets and communicate with our support team
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Ticket
          </button>
        </div>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Create New Support Ticket</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                required
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Brief description of your issue"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                required
                value={newTicket.category}
                onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing</option>
                <option value="general">General Inquiry</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                value={newTicket.priority}
                onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                required
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Detailed description of your issue..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">My Tickets</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        {!ticket.assignedTo && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            AI Available
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {ticket.description}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                        <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>Category: {ticket.category}</span>
                        {ticket.assignedTo ? (
                          <span>Assigned to: {ticket.assignedTo.name}</span>
                        ) : (
                          <span className="text-orange-600 font-medium">No engineer assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ticket.messages && ticket.messages.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        {ticket.messages.length}
                      </span>
                    )}
                    <span className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                      View Details
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first support ticket to get help from our team.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTicket.subject}
              </h3>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setShowAIHelper(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Ticket Details */}
              <div className="lg:col-span-2">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <span className="ml-2">{selectedTicket.category}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Assigned to:</span>
                      <span className="ml-2">
                        {selectedTicket.assignedTo ? (
                          selectedTicket.assignedTo.name
                        ) : (
                          <span className="text-orange-600 font-medium">No engineer assigned</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedTicket.description}</p>
                </div>

                {/* Chat Interface for Assigned Tickets */}
                {selectedTicket.assignedTo && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Chat with Engineer</h4>
                      {selectedTicket.status === 'in-progress' && (
                        <button
                          onClick={handleResolveTicket}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        <div className="space-y-3">
                          {selectedTicket.messages.map((message, index) => (
                            <div
                              key={index}
                              className={`flex ${
                                message.senderModel === 'Client' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                  message.senderModel === 'Client'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-medium ${
                                    message.senderModel === 'Client' ? 'text-blue-200' : 'text-gray-600'
                                  }`}>
                                    {message.senderModel === 'Client' ? 'You' : 'Engineer'}
                                  </span>
                                  <span className={`text-xs ${
                                    message.senderModel === 'Client' ? 'text-blue-200' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 text-sm">
                          <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          No messages yet. Start a conversation with your engineer!
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                      <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message to the engineer..."
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          disabled={!selectedTicket.assignedTo}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || !selectedTicket.assignedTo}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Send
                        </button>
                      </form>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm text-green-800 font-medium">
                          This ticket has been resolved. Chat session ended.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - AI Helper or Engineer Info */}
              <div className="lg:col-span-1">
                {!selectedTicket.assignedTo ? (
                  <div>
                    {!showAIHelper ? (
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 text-center">
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <SparklesIcon className="h-12 w-12 text-purple-600" />
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white"></div>
                          </div>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          AI Assistant Available
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          No engineer has been assigned to your ticket yet. Our AI assistant can provide immediate help and guidance while you wait.
                        </p>
                        <button
                          onClick={() => setShowAIHelper(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-all duration-200"
                        >
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Chat with AI Assistant
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Available 24/7 • Instant responses
                        </p>
                      </div>
                    ) : (
                      <AIHelper 
                        ticket={selectedTicket} 
                        onClose={() => setShowAIHelper(false)} 
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-3">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-900">
                        Engineer Assigned
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Your ticket has been assigned to a support engineer.
                    </p>
                    <div className="bg-white rounded-md p-3 border border-green-200">
                      <p className="font-medium text-gray-900">
                        {selectedTicket.assignedTo.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Support Engineer
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <button
                    onClick={handleResolveTicket}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;