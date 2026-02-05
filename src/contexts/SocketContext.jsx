import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const initializeSocket = () => {
      const token = JSON.parse(localStorage.getItem('accessToken'))
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!token) {
        console.log('No token found, skipping socket connection');
        return;
      }

      console.log('Initializing Socket.IO connection...');

      const socketInstance = io("http://localhost:333", {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        path: '/socket.io/',
      });

      // Connection events
      socketInstance.on('connect', () => {
        console.log('✅ Socket.IO connected:', socketInstance.id);
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Join user room if user data exists
        if (userData?.id) {
          socketInstance.emit('join-conversation', userData.id);
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ Socket.IO disconnected:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('error');
      });

      socketInstance.on('new-message', (message) => {
        console.log('📨 New message received:', message);
        
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('socket:new-message', { detail: message }));
      });

      socketInstance.on('message-read', ({ messageId }) => {
        console.log('✅ Message read event:', messageId);
        window.dispatchEvent(new CustomEvent('socket:message-read', { detail: { messageId } }));
      });

      socketInstance.on('user-typing', ({ userId, isTyping }) => {
        console.log('⌨️ Typing event:', userId, isTyping);
        window.dispatchEvent(new CustomEvent('socket:user-typing', { detail: { userId, isTyping } }));
      });

      setSocket(socketInstance);
    };

    initializeSocket();

    return () => {
      if (socket) {
        console.log('Cleaning up Socket.IO connection');
        socket.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    sendTyping: (conversationId, isTyping) => {
      if (socket && isConnected) {
        socket.emit('typing', { conversationId, isTyping });
      }
    },
    joinConversation: (conversationId) => {
      if (socket && isConnected) {
        socket.emit('join-conversation', conversationId);
      }
    },
    leaveConversation: (conversationId) => {
      if (socket && isConnected) {
        socket.emit('leave-conversation', conversationId);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};