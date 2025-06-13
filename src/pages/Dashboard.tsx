import React, { useState, useEffect } from 'react';
import { Heart, X, MapPin, Github, Linkedin, Code, Filter, Briefcase, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PotentialMatch {
  _id: string;
  firstName: string;
  lastName: string;
  age: number;
  bio?: string;
  skills?: string[];
  profilePicture?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  experienceLevel?: string;
  jobTitle?: string;
  company?: string;
  lookingFor?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface FilterOptions {
  minAge: string;
  maxAge: string;
  skills: string;
  experienceLevel: string;
  location: string;
  lookingFor: string;
}

function Dashboard() {
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    minAge: '',
    maxAge: '',
    skills: '',
    experienceLevel: '',
    location: '',
    lookingFor: ''
  });

  useEffect(() => {
    fetchPotentialMatches();
  }, []);

  const fetchPotentialMatches = async (filterParams?: FilterOptions) => {
    try {
      const params = new URLSearchParams();
      
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await axios.get(`/users/potential-matches?${params.toString()}`);
      setPotentialMatches(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load potential matches');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (swiping || currentIndex >= potentialMatches.length) return;
    
    setSwiping(true);
    const currentUser = potentialMatches[currentIndex];
    
    try {
      const response = await axios.post('/matches/swipe', {
        targetUserId: currentUser._id,
        action
      });

      if (response.data.isMatch) {
        toast.success("🎉 It's a match! You can now chat with each other!");
      }

      // Move to next user
      if (currentIndex < potentialMatches.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // No more users, fetch new ones
        await fetchPotentialMatches(filters);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Swipe failed';
      toast.error(message);
    } finally {
      setSwiping(false);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setLoading(true);
    fetchPotentialMatches(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      minAge: '',
      maxAge: '',
      skills: '',
      experienceLevel: '',
      location: '',
      lookingFor: ''
    });
    setLoading(true);
    fetchPotentialMatches();
    setShowFilters(false);
  };

  const getOnlineStatus = (user: PotentialMatch) => {
    if (user.isOnline) return 'Online';
    if (user.lastSeen) {
      const lastSeen = new Date(user.lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
    return 'Offline';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (potentialMatches.length === 0 || currentIndex >= potentialMatches.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No more profiles!</h2>
          <p className="text-gray-600 mb-6">Check back later for new developers to connect with.</p>
          <div className="space-y-3">
            <button
              onClick={() => fetchPotentialMatches()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all block w-full"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center w-full"
            >
              <Filter className="h-5 w-5 mr-2" />
              Adjust Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = potentialMatches[currentIndex];

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-sm w-full">
        {/* Filter Button */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setShowFilters(true)}
            className="bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full shadow-lg hover:bg-white transition-all flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentUser._id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Profile Image */}
            <div className="relative h-96 bg-gradient-to-br from-pink-100 to-purple-100">
              {currentUser.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt={`${currentUser.firstName} ${currentUser.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-6xl font-bold text-pink-300">
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </div>
                </div>
              )}
              
              {/* Age badge */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-gray-800">{currentUser.age}</span>
              </div>

              {/* Online status */}
              <div className="absolute top-4 left-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                  currentUser.isOnline 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    currentUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span>{getOnlineStatus(currentUser)}</span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentUser.firstName} {currentUser.lastName}
                </h2>
                
                {/* Job Info */}
                {(currentUser.jobTitle || currentUser.company) && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {currentUser.jobTitle}
                      {currentUser.jobTitle && currentUser.company && ' at '}
                      {currentUser.company}
                    </span>
                  </div>
                )}
                
                {currentUser.location && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{currentUser.location}</span>
                  </div>
                )}

                {/* Experience Level */}
                {currentUser.experienceLevel && (
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {currentUser.experienceLevel}
                    </span>
                  </div>
                )}
              </div>

              {/* Looking For */}
              {currentUser.lookingFor && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Target className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Looking For</span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {currentUser.lookingFor}
                  </span>
                </div>
              )}

              {currentUser.bio && (
                <p className="text-gray-700 mb-4 leading-relaxed">{currentUser.bio}</p>
              )}

              {/* Skills */}
              {currentUser.skills && currentUser.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Code className="h-4 w-4 text-pink-500 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="flex space-x-4 mb-6">
                {currentUser.github && (
                  <a
                    href={currentUser.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Github className="h-5 w-5 mr-1" />
                    <span className="text-sm">GitHub</span>
                  </a>
                )}
                
                {currentUser.linkedin && (
                  <a
                    href={currentUser.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Linkedin className="h-5 w-5 mr-1" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSwipe('pass')}
                  disabled={swiping}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <X className="h-6 w-6 mr-2" />
                  Pass
                </button>
                
                <button
                  onClick={() => handleSwipe('like')}
                  disabled={swiping}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <Heart className="h-6 w-6 mr-2" />
                  Like
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {currentIndex + 1} of {potentialMatches.length}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Filter Preferences</h3>
            
            <div className="space-y-4">
              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minAge}
                    onChange={(e) => handleFilterChange('minAge', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAge}
                    onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <input
                  type="text"
                  placeholder="React, Node.js, Python..."
                  value={filters.skills}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Any Level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Architect">Architect</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, Country"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Looking For */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Looking For</label>
                <select
                  value={filters.lookingFor}
                  onChange={(e) => handleFilterChange('lookingFor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Anything</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Mentorship">Mentorship</option>
                  <option value="Networking">Networking</option>
                  <option value="Job Opportunities">Job Opportunities</option>
                  <option value="Friendship">Friendship</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={clearFilters}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                Apply Filters
              </button>
            </div>

            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;