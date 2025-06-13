import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Match {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  bio?: string;
  age: number;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Chat {
  _id: string;
  participants: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: string;
  }[];
  lastMessage?: {
    content: string;
    sender: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    timestamp: string;
  };
  unreadCount?: number;
}

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'chats'>('matches');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesResponse, chatsResponse] = await Promise.all([
        axios.get('/matches/my-matches'),
        axios.get('/chat/my-chats')
      ]);
      
      setMatches(matchesResponse.data);
      setChats(chatsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load matches and chats');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const getOtherParticipant = (chat: Chat) => {
    // This would normally filter out the current user, but for simplicity we'll take the first participant
    return chat.participants[0];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOnlineStatus = (user: { isOnline?: boolean; lastSeen?: string }) => {
    if (user.isOnline) return { text: 'Online', color: 'text-green-600' };
    if (user.lastSeen) {
      const lastSeen = new Date(user.lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 60) return { text: `${diffInMinutes}m ago`, color: 'text-gray-500' };
      if (diffInMinutes < 1440) return { text: `${Math.floor(diffInMinutes / 60)}h ago`, color: 'text-gray-500' };
      return { text: `${Math.floor(diffInMinutes / 1440)}d ago`, color: 'text-gray-500' };
    }
    return { text: 'Offline', color: 'text-gray-500' };
  };

  const getTotalUnreadCount = () => {
    return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Connections</h1>
            <p className="opacity-90">Your matches and conversations</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'matches'
                  ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Heart className="inline h-5 w-5 mr-2" />
              Matches ({matches.length})
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors relative ${
                activeTab === 'chats'
                  ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <MessageCircle className="inline h-5 w-5 mr-2" />
              Chats ({chats.length})
              {getTotalUnreadCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {getTotalUnreadCount()}
                </span>
              )}
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'matches' && (
              <div>
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-pink-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No matches yet</h3>
                    <p className="text-gray-600">Start swiping to find your perfect developer match!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches.map((match) => {
                      const status = getOnlineStatus(match);
                      return (
                        <div key={match._id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                {match.profilePicture ? (
                                  <img
                                    src={match.profilePicture}
                                    alt={`${match.firstName} ${match.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-xl font-bold text-pink-300">
                                    {match.firstName[0]}{match.lastName[0]}
                                  </div>
                                )}
                              </div>
                              {/* Online indicator */}
                              {match.isOnline && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {match.firstName} {match.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">Age: {match.age}</p>
                              <p className={`text-xs ${status.color}`}>{status.text}</p>
                              {match.bio && (
                                <p className="text-sm text-gray-600 truncate mt-1">{match.bio}</p>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              // Find existing chat or create new one
                              const existingChat = chats.find(chat => 
                                chat.participants.some(p => p._id === match._id)
                              );
                              
                              if (existingChat) {
                                handleChatClick(existingChat._id);
                              } else {
                                toast.error('Chat not available yet');
                              }
                            }}
                            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
                          >
                            <MessageCircle className="inline h-4 w-4 mr-2" />
                            Message
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chats' && (
              <div>
                {chats.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-pink-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No conversations yet</h3>
                    <p className="text-gray-600">Start chatting with your matches!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chats.map((chat) => {
                      const otherUser = getOtherParticipant(chat);
                      const status = getOnlineStatus(otherUser);
                      return (
                        <div
                          key={chat._id}
                          onClick={() => handleChatClick(chat._id)}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors relative"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                              {otherUser.profilePicture ? (
                                <img
                                  src={otherUser.profilePicture}
                                  alt={`${otherUser.firstName} ${otherUser.lastName}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-lg font-bold text-pink-300">
                                  {otherUser.firstName[0]}{otherUser.lastName[0]}
                                </div>
                              )}
                            </div>
                            {/* Online indicator */}
                            {otherUser.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-800">
                                {otherUser.firstName} {otherUser.lastName}
                              </h3>
                              <div className="flex items-center space-x-2">
                                {chat.unreadCount && chat.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {chat.unreadCount}
                                  </span>
                                )}
                                {chat.lastMessage && (
                                  <div className="text-xs text-gray-500">
                                    {formatTime(chat.lastMessage.timestamp)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className={`text-xs ${status.color} mb-1`}>{status.text}</p>
                            {chat.lastMessage ? (
                              <p className="text-sm text-gray-600 truncate">
                                {chat.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No messages yet</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Matches;