import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  TicketIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const EngineerPortal = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned');
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('ticketUpdated', (updatedTicket) => {
        setAssignedTickets(prev => prev.map(ticket => 
          ticket._id === updatedTicket._id ? updatedTicket : ticket
        ));
        setAvailableTickets(prev => prev.filter(ticket => 
          ticket._id !== updatedTicket._id
        ));
      });

      socket.on('newTicketAvailable', (ticket) => {
        if (ticket.category && user?.specializations?.includes(ticket.category)) {
          setAvailableTickets(prev => [ticket, ...prev]);
        }
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
        
        // Update assigned tickets list to show new message count
        setAssignedTickets(prev => prev.map(ticket => {
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
        setAssignedTickets(prev => prev.map(ticket => 
          ticket._id === resolvedTicket._id ? resolvedTicket : ticket
        ));
        
        if (selectedTicket && selectedTicket._id === resolvedTicket._id) {
          setSelectedTicket(resolvedTicket);
        }
      });

      return () => {
        socket.off('ticketUpdated');
        socket.off('newTicketAvailable');
        socket.off('newMessage');
        socket.off('ticketMessageReceived');
        socket.off('ticketResolved');
      };
    }
  }, [socket, selectedTicket, user]);

  const fetchTickets = async () => {
    try {
      const [assignedResponse, availableResponse] = await Promise.all([
        axios.get('/tickets/assigned-to-me'),
        axios.get('/tickets/available')
      ]);
      
      setAssignedTickets(assignedResponse.data);
      setAvailableTickets(availableResponse.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId) => {
    try {
      const response = await axios.post(`/tickets/${ticketId}/assign`);
      setAssignedTickets(prev => [response.data, ...prev]);
      setAvailableTickets(prev => prev.filter(ticket => ticket._id !== ticketId));
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      const response = await axios.patch(`/tickets/${ticketId}/status`, { status });
      setAssignedTickets(prev => prev.map(ticket => 
        ticket._id === ticketId ? response.data : ticket
      ));
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(response.data);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || !socket) return;

    // Use socket for real-time messaging
    socket.emit('sendTicketMessage', {
      ticketId: selectedTicket._id,
      content: newMessage.trim()
    });
    
    setNewMessage('');
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
            <h1 className="text-2xl font-bold text-gray-900">Engineer Portal</h1>
            <p className="text-gray-600">
              Manage assigned tickets and help clients resolve their issues
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Capacity:</span>
              <span className="ml-1">{assignedTickets.length}/{user?.capacity || 10}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {user?.specializations?.map((spec, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assigned Tickets ({assignedTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Tickets ({availableTickets.length})
            </button>
          </nav>
        </div>

        {/* Ticket Lists */}
        <div className="divide-y divide-gray-200">
          {activeTab === 'assigned' ? (
            assignedTickets.length > 0 ? (
              assignedTickets.map((ticket) => (
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
                        </div>
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {ticket.description}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                          <span>Client: {ticket.client?.name}</span>
                          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>Category: {ticket.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {ticket.status === 'open' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(ticket._id, 'in-progress');
                            }}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Start Work
                          </button>
                        )}
                        {ticket.status === 'in-progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(ticket._id, 'resolved');
                            }}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                      {ticket.messages && ticket.messages.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                          {ticket.messages.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned tickets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check the available tickets tab to pick up new work.
                </p>
              </div>
            )
          ) : (
            availableTickets.length > 0 ? (
              availableTickets.map((ticket) => (
                <div key={ticket._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(ticket.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {ticket.subject}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          {user?.specializations?.includes(ticket.category) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Matches expertise
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {ticket.description}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                          <span>Client: {ticket.client?.name}</span>
                          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>Category: {ticket.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAssignTicket(ticket._id)}
                        disabled={assignedTickets.length >= (user?.capacity || 10)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HandRaisedIcon className="h-4 w-4 mr-1" />
                        Take Ticket
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No available tickets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All tickets are currently assigned. New tickets will appear here.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTicket.subject}
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ticket Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
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
                      <span className="font-medium">Client:</span>
                      <span className="ml-2">{selectedTicket.client?.name} ({selectedTicket.client?.email})</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 bg-white p-3 rounded border">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Status Update Buttons */}
                <div className="flex space-x-2">
                  {selectedTicket.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'in-progress')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Start Working
                    </button>
                  )}
                  {selectedTicket.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Mark as Resolved
                      </button>
                    </>
                  )}
                  {selectedTicket.status === 'resolved' && (
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-medium">Ticket Resolved - Chat Ended</span>
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'closed')}
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Close Ticket
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Panel */}
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col h-96">
                <h4 className="font-medium text-gray-900 mb-3">Messages</h4>
                
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.sender._id === user._id 
                            ? 'bg-blue-100 ml-4' 
                            : 'bg-white mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-900">
                            {message.sender.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{message.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center">No messages yet</p>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineerPortal;