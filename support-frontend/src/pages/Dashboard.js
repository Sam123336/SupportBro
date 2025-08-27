import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TicketIcon, 
  UserGroupIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: '0 min'
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, ticketsResponse] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/tickets/recent')
      ]);
      
      setStats(statsResponse.data);
      setRecentTickets(ticketsResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
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
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'client' 
                ? 'Manage your support tickets and track their progress'
                : 'Handle support tickets and help clients resolve their issues'
              }
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(user?.role === 'client' ? '/client' : '/engineer')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {user?.role === 'client' ? 'Go to Client Portal' : 'Go to Engineer Portal'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TicketIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tickets
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Open Tickets
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.openTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolved Tickets
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.resolvedTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Response Time
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.avgResponseTime}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Tickets</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => (
              <div key={ticket._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {ticket.subject}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority} priority
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {ticket.description}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.assignedTo && (
                        <span>Assigned to: {ticket.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'client' 
                  ? 'You haven\'t created any tickets yet.'
                  : 'No tickets have been assigned to you yet.'
                }
              </p>
              {user?.role === 'client' && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/client')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create New Ticket
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user?.role === 'client' ? (
            <>
              <button
                onClick={() => navigate('/client')}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-blue-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 group-hover:bg-blue-100">
                    <TicketIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">Create New Ticket</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Submit a new support request and get help from our experts.
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigate('/client')}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-blue-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 group-hover:bg-green-100">
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">View My Tickets</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Check the status of your existing support tickets.
                  </p>
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/engineer')}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-blue-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 group-hover:bg-blue-100">
                    <TicketIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">View Assigned Tickets</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    See all tickets assigned to you and their current status.
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigate('/engineer')}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-blue-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 group-hover:bg-yellow-100">
                    <UserGroupIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">Available Tickets</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Browse unassigned tickets that match your expertise.
                  </p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;