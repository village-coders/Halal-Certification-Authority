import { useState, useEffect, useRef } from "react";
import "./css/Message.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "sonner";
import { FaPaperPlane, FaCheckDouble, FaCheck, FaPaperclip, FaSmile, FaTimes, FaUserCircle } from "react-icons/fa";
import { MdOutlineAttachFile } from "react-icons/md";
import { format } from "date-fns";
import { useSocket } from "../contexts/SocketContext";

function Message() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatModalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { socket, isConnected, sendTyping } = useSocket();
  const user = JSON.parse(localStorage.getItem('user'));

  // Enhanced socket setup with better reconnection
  useEffect(() => {
    if (!socket) {
      console.log('Socket not available, attempting to reconnect...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        setupSocketListeners();
      }, 2000);
      return;
    }

    setupSocketListeners();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      cleanupSocketListeners();
    };
  }, [socket, user?.id]);

  const setupSocketListeners = () => {
    if (!socket) return;

    console.log('Setting up Socket.IO listeners for user:', user?.id);

    // Enhanced connection events
    socket.on('connect', () => {
      console.log('✅ User Socket.IO connected:', socket.id);
      setIsAdminOnline(true);
      
      // Join user's personal room
      if (user?.id) {
        socket.emit('join-conversation', user.id);
        console.log(`User ${user.id} joined their room`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ User Socket.IO disconnected:', reason);
      setIsAdminOnline(false);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Server disconnected, try to reconnect
        setTimeout(() => {
          if (socket && !socket.connected) {
            socket.connect();
          }
        }, 1000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('User Socket connection error:', error);
      setIsAdminOnline(false);
    });

    // Listen for new messages
    socket.on('new-message', (message) => {
      console.log('📨 New message received via Socket.IO:', {
        id: message._id,
        content: message.content?.substring(0, 50),
        sender: message.sender?._id,
        receiver: message.receiver,
        isForCurrentUser: message.receiver === user?.id
      });
      
      // Check if this message is for the current user or from admin
      if (message.receiver === user?.id || (message.sender && message.sender.role === 'admin')) {
        handleIncomingMessage(message);
      }
    });

    // Listen for message read events
    socket.on('message-read', ({ messageId }) => {
      console.log('✅ Message read event:', messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true, readAt: new Date() } : msg
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    // Listen for typing indicators
    socket.on('user-typing', ({ userId, isTyping }) => {
      console.log('⌨️ Typing event:', userId, isTyping);
      // Admin is typing (admin's userId will be different from user's id)
      if (userId && userId !== user?.id) {
        setIsTyping(isTyping);
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Auto-clear typing after 3 seconds
        if (isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    });

    // Listen for admin online status
    socket.on('admin-online', ({ adminId, isOnline }) => {
      console.log('👨‍💼 Admin online status:', adminId, isOnline);
      setIsAdminOnline(isOnline);
    });

    // Test connection
    socket.on('connected', (data) => {
      console.log('Socket connected event:', data);
    });

    // Handle reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected on attempt ${attemptNumber}`);
      setIsAdminOnline(true);
      // Refresh messages after reconnection
      if (selectedConversation) {
        fetchMessages();
      }
    });
  };

  const cleanupSocketListeners = () => {
    if (!socket) return;
    
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('new-message');
    socket.off('message-read');
    socket.off('user-typing');
    socket.off('admin-online');
    socket.off('connected');
    socket.off('reconnect');
  };

  // Handle incoming message with deduplication
  const handleIncomingMessage = (message) => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(msg => msg._id === message._id);
      if (exists) return prev;
      
      // Add new message at the end (chronological order)
      return [...prev, {
        ...message,
        isMine: message.sender?._id === user?.id
      }];
    });
    
    // Update unread count if message is not from user and not read
    if (message.sender?._id !== user?.id && !message.read) {
      setUnreadCount(prev => prev + 1);
      
      // Show notification if not in chat modal
      if (!showChatModal) {
        toast.info(`New message from ${message.sender?.fullName || 'Admin'}`, {
          description: message.content?.substring(0, 100) || 'Attachment sent',
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => openChatModal(conversations[0])
          }
        });
      }
    }
    
    // Update conversation
    updateConversationWithNewMessage(message);
    
    // Scroll to bottom
    setTimeout(() => scrollToBottom(), 100);
  };

  // Update conversation with new message
  const updateConversationWithNewMessage = (message) => {
    setConversations(prev => {
      if (prev.length === 0) {
        return [{
          _id: "admin-conversation",
          subject: "Admin Support",
          lastMessage: message,
          unreadCount: message.sender?._id !== user?.id && !message.read ? 1 : 0,
          updatedAt: new Date().toISOString()
        }];
      }
      
      const updatedConversations = [...prev];
      updatedConversations[0] = {
        ...updatedConversations[0],
        lastMessage: message,
        unreadCount: message.sender?._id !== user?.id && !message.read 
          ? updatedConversations[0].unreadCount + 1 
          : updatedConversations[0].unreadCount,
        updatedAt: new Date().toISOString()
      };
      return updatedConversations;
    });
  };

  // Fetch messages when chat modal opens
  useEffect(() => {
    if (showChatModal && selectedConversation) {
      fetchMessages();
      markAsRead();
      
      // Join conversation room for real-time updates
      if (socket && isConnected && user?.id) {
        socket.emit('join-conversation', user.id);
      }
    }
  }, [showChatModal, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (showChatModal) {
      scrollToBottom();
    }
  }, [messages, showChatModal]);

  // Handle typing events
  const handleTyping = (isTyping) => {
    if (!socket || !isConnected) {
      console.log('Socket not connected, cannot send typing event');
      return;
    }

    // Send typing event to admin
    sendTyping(user?.id || 'user', isTyping);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(user?.id || 'user', false);
      }, 2000);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatModalRef.current && !chatModalRef.current.contains(event.target)) {
        setShowChatModal(false);
        setIsTyping(false);
        // Stop typing indicator when closing modal
        handleTyping(false);
      }
    };

    if (showChatModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatModal]);

  // Initial data fetch - USING YOUR ORIGINAL API ROUTES
  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    
    // Setup periodic refresh for messages
    const refreshInterval = setInterval(() => {
      if (showChatModal && selectedConversation) {
        fetchMessages();
      }
      fetchUnreadCount();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  // USING YOUR ORIGINAL API ROUTES
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      // Using your original API route: /messages/admin/conversation
      const response = await axios.get(`${baseUrl}/messages/admin/conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        const messagesData = response.data.messages || [];
        
        // Create conversation from messages
        const conversation = {
          _id: "admin-conversation",
          subject: "Admin Support",
          lastMessage: messagesData[messagesData.length - 1],
          unreadCount: messagesData.filter(msg => 
            !msg.read && msg.senderType === 'admin'
          ).length,
          updatedAt: messagesData[messagesData.length - 1]?.createdAt || new Date()
        };

        setConversations([conversation]);
        
        // If no conversation is selected, select this one
        if (!selectedConversation) {
          setSelectedConversation(conversation);
        }
        
        // Set messages for the chat
        if (messagesData.length > 0) {
          const formattedMessages = messagesData.map(msg => ({
            ...msg,
            isMine: msg.sender?._id === user?.id,
            // Ensure senderType is set correctly
            senderType: msg.senderType || (msg.sender?._id === user?.id ? 'user' : 'admin')
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (error.response?.status !== 401) {
        toast.error("Failed to load conversations");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // USING YOUR ORIGINAL API ROUTES
  const fetchMessages = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${baseUrl}/messages/admin/conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        const messagesData = response.data.messages || [];
        const formattedMessages = messagesData.map(msg => ({
          ...msg,
          isMine: msg.sender?._id === user?.id,
          senderType: msg.senderType || (msg.sender?._id === user?.id ? 'user' : 'admin')
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status !== 401 && showChatModal) {
        toast.error("Failed to load messages");
      }
    }
  };

  // USING YOUR ORIGINAL API ROUTES
  const fetchUnreadCount = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${baseUrl}/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // USING YOUR ORIGINAL API ROUTES
  const markAsRead = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const unreadMessages = messages.filter(msg => 
        !msg.read && msg.senderType === 'admin'
      );
      
      if (unreadMessages.length > 0) {
        // Mark each unread message individually - using your original route
        for (const msg of unreadMessages) {
          await axios.put(`${baseUrl}/messages/${msg._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        // Update local state
        setMessages(prev => prev.map(msg => 
          ({ ...msg, read: true })
        ));
        
        // Update conversations
        setConversations(prev => {
          if (prev.length > 0) {
            return [{
              ...prev[0],
              unreadCount: 0
            }];
          }
          return prev;
        });
        
        // Reset unread count
        setUnreadCount(0);
        
        // Emit read event via socket
        if (socket && isConnected) {
          unreadMessages.forEach(msg => {
            socket.emit('message-read', { messageId: msg._id });
          });
        }
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // USING YOUR ORIGINAL API ROUTES
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error("Message cannot be empty");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect to send messages");
      return;
    }

    setIsSending(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const formData = new FormData();
      
      formData.append("content", newMessage);
      // No need to append receiver since your backend defaults to 'admin'
      
      attachments.forEach((file, index) => {
        formData.append("files", file);
      });

      // Stop typing indicator
      handleTyping(false);
      
      // Using your original API route: /messages/send
      const response = await axios.post(`${baseUrl}/messages/send`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === "success") {
        // Add the new message to the list immediately
        const newMsg = {
          ...response.data.data,
          isMine: true,
          senderType: 'user',
          read: false
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage("");
        setAttachments([]);
        
        // Update conversation
        updateConversationWithNewMessage(newMsg);
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
        
        // Emit socket event for real-time update
        if (socket && isConnected) {
          socket.emit('new-message', newMsg);
        }
        
        toast.success("Message sent!");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'hh:mm a');
    } catch (error) {
      return '';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const today = new Date();
      const messageDate = new Date(date);
      
      if (today.toDateString() === messageDate.toDateString()) {
        return "Today";
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (yesterday.toDateString() === messageDate.toDateString()) {
        return "Yesterday";
      }
      
      return format(messageDate, 'MMM dd, yyyy');
    } catch (error) {
      return '';
    }
  };

  const openChatModal = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatModal(true);
    markAsRead();
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setIsTyping(false);
    // Stop typing indicator when closing modal
    handleTyping(false);
  };

  const handleReconnect = () => {
    if (socket) {
      socket.connect();
      toast.info("Attempting to reconnect...");
    }
  };

  const statsData = [
    { 
      title: "TOTAL MESSAGES", 
      count: messages.length, 
      icon: "fa-comments", 
      color: "#4caf50" 
    },
    { 
      title: "UNREAD MESSAGES", 
      count: unreadCount, 
      icon: "fa-envelope", 
      color: "#2196f3" 
    },
    { 
      title: "SUPPORT STATUS", 
      count: isAdminOnline && isConnected ? "Online" : "Offline", 
      icon: "fa-headset", 
      color: isAdminOnline && isConnected ? "#4caf50" : "#ff9800" 
    }
  ];

  return (
    <div className="dash">       
      <Sidebar activeMess="active" /> 
      <main className="content">
        <div className="messages-container">
          <DashboardHeader title="Messages" />
          
          {/* Enhanced Connection Status Indicator */}
          <div className="connection-status" style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isConnected && isAdminOnline ? '#e8f5e9' : '#ffebee',
            border: `1px solid ${isConnected && isAdminOnline ? '#4caf50' : '#f44336'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isConnected && isAdminOnline ? '#4caf50' : '#f44336',
                animation: isConnected && isAdminOnline ? 'pulse 2s infinite' : 'none'
              }}></div>
              <div>
                <span style={{
                  color: isConnected && isAdminOnline ? '#2e7d32' : '#c62828',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {isConnected && isAdminOnline ? 'Real-time messaging connected' : 'Real-time messaging disconnected'}
                </span>
                {isConnected && !isAdminOnline && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                    Support team is currently offline
                  </p>
                )}
              </div>
            </div>
            {(!isConnected || !isAdminOnline) && (
              <button 
                onClick={handleReconnect}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {!isConnected ? 'Reconnect' : 'Check Status'}
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>  
            <div className="actions-grid">
              <div 
                className="action-card" 
                style={{ borderLeft: "4px solid #4caf50", cursor: "pointer" }}
                onClick={() => openChatModal(conversations[0] || {
                  _id: "admin-conversation",
                  subject: "Admin Support",
                  lastMessage: null,
                  unreadCount: 0
                })}
              >
                <div className="action-icon">
                  <i className="fas fa-comment-dots" style={{ color: "#4caf50" }}></i>
                </div>
                <div className="action-content">
                  <h3>CONTACT SUPPORT</h3>
                  <button className="action-btn">Chat Now</button>
                </div>
              </div>
              
              <div className="action-card" style={{ borderLeft: "4px solid #2196f3" }}>
                <div className="action-icon">
                  <i className="fas fa-history" style={{ color: "#2196f3" }}></i>
                </div>
                <div className="action-content">
                  <h3>MESSAGE HISTORY</h3>
                  <button 
                    className="action-btn"
                    onClick={() => openChatModal(conversations[0])}
                  >
                    View
                  </button>
                </div>
              </div>
              
              <div className="action-card" style={{ borderLeft: "4px solid #9c27b0" }}>
                <div className="action-icon">
                  <i className="fas fa-file-alt" style={{ color: "#9c27b0" }}></i>
                </div>
                <div className="action-content">
                  <h3>SUPPORT TICKETS</h3>
                  <button className="action-btn">Create</button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="stats-overview">
            {statsData.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  <i className={`fas ${stat.icon}`} style={{ color: stat.color }}></i>
                </div>
                <div className="stat-content">
                  <h3>{stat.title}</h3>
                  <p className="stat-count">{stat.count}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Messages */}
          <div className="recent-messages-section">
            <div className="section-header">
              <h2>Recent Messages</h2>
              <button 
                className="view-all-btn"
                onClick={() => openChatModal(conversations[0])}
              >
                View All
              </button>
            </div>
            
            <div className="recent-messages-list">
              {isLoading ? (
                <div className="loading-messages">
                  <div className="spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-messages">
                  <div className="empty-icon">
                    <i className="fas fa-comments"></i>
                  </div>
                  <h3>No messages yet</h3>
                  <p>Start a conversation with our support team</p>
                  <button 
                    className="start-conversation-btn"
                    onClick={() => openChatModal(conversations[0] || {
                      _id: "admin-conversation",
                      subject: "Admin Support",
                      lastMessage: null,
                      unreadCount: 0
                    })}
                  >
                    Start Conversation
                  </button>
                </div>
              ) : (
                <div className="messages-preview">
                  {[...messages].reverse().slice(0, 3).map((message) => (
                    <div 
                      key={message._id}
                      className="message-preview-item"
                      onClick={() => openChatModal(conversations[0])}
                    >
                      <div className="preview-avatar">
                        {message.isMine ? (
                          <FaUserCircle />
                        ) : (
                          <i className="fas fa-user-tie"></i>
                        )}
                      </div>
                      <div className="preview-content">
                        <div className="preview-header">
                          <span className="preview-sender">
                            {message.isMine ? 'You' : 'Support Team'}
                          </span>
                          <span className="preview-time">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="preview-text">
                          {message.content?.substring(0, 60) || 'Attachment sent...'}
                          {message.content && message.content.length > 60 && '...'}
                        </p>
                        {!message.read && message.receiver === "admin" && (
                          <span className="unread-indicator"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Chat Modal */}
      {showChatModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal" ref={chatModalRef}>
            {/* Modal Header */}
            <div className="chat-modal-header">
              <div className="modal-header-left">
                <div className="modal-avatar">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="modal-user-info">
                  <h3>Admin Support</h3>
                  <p className="modal-status">
                    <span className="status-indicator" style={{ 
                      backgroundColor: isAdminOnline && isConnected ? '#22c55e' : '#ef4444'
                    }}></span>
                    {isAdminOnline && isConnected ? 'Online • Usually replies within minutes' : 'Offline • Messages will be delivered when online'}
                    {isTyping && isAdminOnline && (
                      <span className="typing-indicator" style={{
                        marginLeft: '10px',
                        color: '#2196f3',
                        fontStyle: 'italic',
                        animation: 'pulse 1.5s infinite'
                      }}>
                        typing...
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="modal-header-right">
                {unreadCount > 0 && !showChatModal && (
                  <span className="unread-badge" style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    marginRight: '10px'
                  }}>
                    {unreadCount}
                  </span>
                )}
                <button className="close-modal-btn" onClick={closeChatModal}>
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="chat-modal-body">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-chat-icon">
                    <i className="fas fa-comments"></i>
                  </div>
                  <h3>Start a conversation</h3>
                  <p>Send a message to our support team</p>
                  {!isConnected && (
                    <p className="connection-warning" style={{ color: '#ef4444', marginTop: '8px' }}>
                      <i className="fas fa-exclamation-circle"></i> Connect to enable real-time chat
                    </p>
                  )}
                </div>
              ) : (
                <div className="modal-messages-list">
                  {messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(messages[index-1].createdAt) !== formatDate(message.createdAt);
                    
                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="modal-date-divider">
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                        )}
                        
                        <div className={`modal-message-wrapper ${message.receiver === "admin"? 'sent' : 'received'}`}>
                          <div className="modal-message-content">
                            {!message.isMine && message.sender?.fullName && (
                              <div className="modal-sender-name">
                                {message.sender.fullName}
                              </div>
                            )}
                            {message.content && (
                              <p>{message.content}</p>
                            )}
                            
                            {message.attachments?.length > 0 && (
                              <div className="modal-attachments">
                                {message.attachments.map((attachment, idx) => (
                                  <div key={idx} className="modal-attachment-item">
                                    {attachment.fileType?.startsWith('image/') || attachment.url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                      <div className="modal-image-attachment">
                                        <img 
                                          src={attachment.url} 
                                          alt="Attachment" 
                                          className="modal-attachment-image"
                                          onClick={() => window.open(attachment.url, '_blank')}
                                        />
                                        <span className="attachment-name">{attachment.filename}</span>
                                      </div>
                                    ) : (
                                      <div className="modal-file-attachment">
                                        <i className="fas fa-file"></i>
                                        <div className="file-info">
                                          <span className="file-name">{attachment.filename}</span>
                                          <span className="file-size">
                                            {(attachment.size / 1024).toFixed(1)} KB
                                          </span>
                                        </div>
                                        <a 
                                          href={attachment.url} 
                                          download
                                          className="modal-download-btn"
                                        >
                                          <i className="fas fa-download"></i>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="modal-message-footer">
                              <span className="modal-message-time">
                                {formatTime(message.createdAt)}
                              </span>
                              {message.isMine && (
                                <span className="modal-message-status">
                                  {message.read ? (
                                    <>
                                      <FaCheckDouble color="#4caf50" />
                                      <span style={{ fontSize: '10px', marginLeft: '4px' }}>Read</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaCheck color="#999" />
                                      <span style={{ fontSize: '10px', marginLeft: '4px' }}>Sent</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form className="chat-modal-input" onSubmit={handleSendMessage}>
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="modal-attachments-preview">
                  {attachments.map((file, index) => (
                    <div key={index} className="modal-attachment-preview">
                      <div className="modal-preview-info">
                        <i className="fas fa-paperclip"></i>
                        <span className="modal-preview-name">{file.name}</span>
                        <span className="modal-preview-size">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="modal-remove-attachment"
                        onClick={() => removeAttachment(index)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-input-container">
                <button 
                  type="button" 
                  className="modal-attach-btn"
                  onClick={() => fileInputRef.current.click()}
                  title="Attach file"
                  disabled={!isConnected}
                >
                  <FaPaperclip />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    style={{ display: 'none' }}
                  />
                </button>
                
                <input
                  type="text"
                  className="modal-text-input"
                  placeholder={isConnected ? "Type your message here..." : "Connect to send messages..."}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    // Send typing event
                    if (e.target.value.trim() && isConnected) {
                      handleTyping(true);
                    } else {
                      handleTyping(false);
                    }
                  }}
                  onBlur={() => handleTyping(false)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && isConnected) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={isSending || !isConnected}
                />
                
                <button 
                  type="submit" 
                  className="modal-send-btn"
                  disabled={(!newMessage.trim() && attachments.length === 0) || isSending || !isConnected}
                  title={!isConnected ? "Connect to send messages" : "Send message"}
                >
                  {isSending ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <FaPaperPlane />
                  )}
                </button>
              </div>
              
              <div className="modal-input-footer">
                <p className="file-hint">
                  <i className="fas fa-info-circle"></i>
                  Maximum file size: 10MB • Supported: Images, PDF, Documents
                </p>
                {!isConnected && (
                  <p className="connection-hint" style={{ color: '#f44336', marginTop: '5px' }}>
                    <i className="fas fa-exclamation-circle"></i>
                    Connect to enable real-time messaging
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add CSS for spinner */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .loading-messages .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #00853b;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modal-sender-name {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #666;
        }
        
        .modal-header-right {
          display: flex;
          align-items: center;
        }
        
        .connection-warning {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

export default Message;