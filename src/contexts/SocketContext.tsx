import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', async () => {
        console.log('Connected to server');
        
        // Update online status
        try {
          await axios.put('/users/online-status', { isOnline: true });
        } catch (error) {
          console.error('Failed to update online status:', error);
        }
      });

      newSocket.on('disconnect', async () => {
        console.log('Disconnected from server');
        
        // Update offline status
        try {
          await axios.put('/users/online-status', { isOnline: false });
        } catch (error) {
          console.error('Failed to update offline status:', error);
        }
      });

      newSocket.on('user_online', (userId) => {
        setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
      });

      newSocket.on('user_offline', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Update offline status when component unmounts
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        try {
          await axios.put('/users/online-status', { isOnline: false });
        } catch (error) {
          console.error('Failed to update offline status:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const value = {
    socket,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}