import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, User, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-pink-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-pink-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                DevTinder
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard')
                  ? 'bg-pink-100 text-pink-600'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="hidden sm:inline">Discover</span>
            </Link>

            <Link
              to="/matches"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/matches')
                  ? 'bg-pink-100 text-pink-600'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Matches</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/profile')
                  ? 'bg-pink-100 text-pink-600'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-sm text-gray-600">
                Hi, {user?.firstName}!
              </div>
              
              {user?.profilePicture && (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover border-2 border-pink-200"
                />
              )}

              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;