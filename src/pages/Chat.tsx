import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  content: string;
  timestamp: string;
  read?: boolean;
  readAt?: string;
}

interface ChatData {
  _id: string;
  participants: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: string;
  }[];
  messages: Message[];
}

function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [chat, setChat] = useState<ChatData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (chatId) {
      fetchChat();
    }
  }, [chatId]);

  useEffect(() => {
    if (socket && chatId) {
      socket.emit('join_chat', chatId);

      socket.on('receive_message', (data) => {
        if (data.chatId === chatId) {
          const newMessage: Message = {
            _id: Date.now().toString(),
            sender: {
              _id: data.sender,
              firstName: 'User',
              lastName: ''
            },
            content: data.message,
            timestamp: data.timestamp
          };
          
          setChat(prev => prev ? {
            ...prev,
            messages: [...prev.messages, newMessage]
          } : null);
        }
      });

      socket.on('user_typing', (data) => {
        if (data.chatId === chatId && data.userId !== user?.id) {
          setOtherUserTyping(true);
        }
      });

      socket.on('user_stop_typing', (data) => {
        if (data.chatId === chatId && data.userId !== user?.id) {
          setOtherUserTyping(false);
        }
      });

      return () => {
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_stop_typing');
      };
    }
  }, [socket, chatId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, otherUserTyping]);

  const fetchChat = async () => {
    try {
      const response = await axios.get(`/chat/${chatId}/messages`);
      setChat(response.data);
    } catch (error) {
      console.error('Error fetching chat:', error);
      toast.error('Failed to load chat');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (!typing && socket && chatId) {
      setTyping(true);
      socket.emit('typing_start', { chatId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (typing && socket && chatId) {
        setTyping(false);
        socket.emit('typing_stop', { chatId });
      }
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !chatId) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Stop typing indicator
    if (typing && socket) {
      setTyping(false);
      socket.emit('typing_stop', { chatId });
    }

    try {
      // Send via API
      const response = await axios.post(`/chat/${chatId}/messages`, {
        content: messageContent
      });

      // Add message to local state
      setChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, response.data]
      } : null);

      // Send via socket for real-time delivery
      if (socket) {
        socket.emit('send_message', {
          chatId,
          message: messageContent
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!chat || !user) return null;
    return chat.participants.find(p => p._id !== user.id);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  const getOnlineStatus = (user: { isOnline?: boolean; lastSeen?: string }) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chat not found</h2>
          <button
            onClick={() => navigate('/matches')}
            className="text-pink-500 hover:text-pink-600"
          >
            Go back to matches
          </button>
        </div>
      </div>
    );
  }

  const otherUser = getOtherParticipant();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-pink-100 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/matches')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          {otherUser && (
            <>
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  {otherUser.profilePicture ? (
                    <img
                      src={otherUser.profilePicture}
                      alt={`${otherUser.firstName} ${otherUser.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-pink-300" />
                  )}
                </div>
                {/* Online indicator */}
                {otherUser.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div>
                <h2 className="font-semibold text-gray-800">
                  {otherUser.firstName} {otherUser.lastName}
                </h2>
                <p className={`text-sm ${otherUser.isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                  {getOnlineStatus(otherUser)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <User className="h-16 w-16 mx-auto mb-2 text-pink-300" />
              <p>Start your conversation with {otherUser?.firstName}!</p>
            </div>
          </div>
        ) : (
          chat.messages.map((message, index) => {
            const isOwnMessage = message.sender._id === user?.id;
            const showDateSeparator = shouldShowDateSeparator(message, chat.messages[index - 1]);
            
            return (
              <div key={message._id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">
                      {formatDateSeparator(message.timestamp)}
                    </span>
                  </div>
                )}
                
                {/* Message */}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-xs ${
                          isOwnMessage ? 'text-pink-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                      {isOwnMessage && message.read && (
                        <span className="text-xs text-pink-100 ml-2">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm px-4 py-2 rounded-2xl max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-pink-100 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;