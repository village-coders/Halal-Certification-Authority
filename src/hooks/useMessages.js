import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'sonner';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { socket, isConnected } = useSocket();

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/messages/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/messages/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content, receiver = 'admin', files = []) => {
    try {
      setSending(true);
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('content', content);
      formData.append('receiver', receiver);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, read: true, readAt: new Date() } : msg
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (event) => {
      const message = event.detail;
      
      // Check if message is for current user
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && message.receiver === user.id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          
          return [message, ...prev];
        });

        if (!message.read) {
          setUnreadCount(prev => prev + 1);
          toast.info(`New message from ${message.sender?.fullName || 'Admin'}`);
        }
      }
    };

    const handleMessageRead = (event) => {
      const { messageId } = event.detail;
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    };

    window.addEventListener('socket:new-message', handleNewMessage);
    window.addEventListener('socket:message-read', handleMessageRead);

    return () => {
      window.removeEventListener('socket:new-message', handleNewMessage);
      window.removeEventListener('socket:message-read', handleMessageRead);
    };
  }, [socket]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [fetchMessages, fetchUnreadCount]);

  return {
    messages,
    unreadCount,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refreshMessages: fetchMessages,
    refreshUnreadCount: fetchUnreadCount,
    isConnected
  };
};