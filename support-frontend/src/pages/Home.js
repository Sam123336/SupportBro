import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TicketIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      name: 'Smart Ticket Management',
      description: 'Automatically assign tickets to the best available support engineers based on expertise and workload.',
      icon: TicketIcon,
    },
    {
      name: 'Real-time Communication',
      description: 'Chat with support engineers in real-time and get instant updates on your tickets.',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Expert Team',
      description: 'Our support engineers specialize in different areas to provide you with the best assistance.',
      icon: UserGroupIcon,
    },
    {
      name: '24/7 Support',
      description: 'Get help whenever you need it with our round-the-clock support system.',
      icon: ClockIcon,
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Welcome to <span className="text-blue-600">SupportBro</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Your intelligent support ticket system that connects you with the right experts, 
              at the right time, for the right solution.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isAuthenticated ? (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-lg text-gray-700">
                    Welcome back, {user?.name}!
                  </p>
                  <div className="flex space-x-4">
                    <Link
                      to="/dashboard"
                      className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Go to Dashboard
                    </Link>
                    <Link
                      to={user?.role === 'client' ? '/client' : '/engineer'}
                      className="rounded-md bg-gray-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                    >
                      {user?.role === 'client' ? 'Client Portal' : 'Engineer Portal'}
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Get started
                  </Link>
                  <Link
                    to="/login"
                    className="text-sm font-semibold leading-6 text-gray-900"
                  >
                    Sign in <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              Efficient Support
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for excellent customer support
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform provides intelligent ticket routing, real-time communication, 
              and expert support to resolve your issues quickly and efficiently.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by support teams worldwide
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Join thousands of companies that rely on SupportBro for their customer support needs.
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {[
                { id: 1, name: 'Tickets Resolved', value: '50K+' },
                { id: 2, name: 'Response Time', value: '<2min' },
                { id: 3, name: 'Customer Satisfaction', value: '98%' },
                { id: 4, name: 'Active Engineers', value: '500+' },
              ].map((stat) => (
                <div key={stat.id} className="flex flex-col bg-white p-8">
                  <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      {!isAuthenticated && (
        <div className="bg-blue-600">
          <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
                Join SupportBro today and experience the future of customer support. 
                Choose your role and get started in minutes.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/register"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Sign up as Client
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  Join as Engineer
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;