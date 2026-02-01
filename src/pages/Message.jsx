import { useState, useEffect, useRef } from "react";
import "./css/Message.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "sonner";
import { FaPaperPlane, FaCheckDouble, FaCheck, FaPaperclip, FaSmile, FaTimes, FaUserCircle } from "react-icons/fa";
import { MdOutlineAttachFile } from "react-icons/md";
import { format } from "date-fns";

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
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatModalRef = useRef(null);
  
  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Fetch conversations and unread count on component mount
  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages();
      }
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation && showChatModal) {
      fetchMessages();
      markAsRead();
    }
  }, [selectedConversation, showChatModal]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatModalRef.current && !chatModalRef.current.contains(event.target)) {
        setShowChatModal(false);
      }
    };

    if (showChatModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatModal]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"))
      const response = await axios.get(`${baseUrl}/messages/admin/conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });


      

      if (response.data.status === "success") {
        // Transform messages into conversation format
        const conversation = {
          _id: "admin-conversation",
          subject: "Admin Support",
          lastMessage: response.data.messages[response.data.messages.length - 1],
          unreadCount: response.data.messages.filter(msg => !msg.read && msg.senderType === 'admin').length,
          updatedAt: response.data.messages[response.data.messages.length - 1]?.createdAt || new Date()
        };

        
        setConversations([conversation]);
        
        // If no conversation is selected, select this one
        if (!selectedConversation) {
          setSelectedConversation(conversation);
        }
        
        // Set messages for the chat
        if (response.data.messages.length > 0) {
          setMessages(response.data.messages);
        }
      }
    } catch (error) {
      toast.error("Failed to load conversations");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"))
      const response = await axios.get(`${baseUrl}/messages/admin/conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        setMessages(response.data.messages);
              console.log(messages);
      }
    } catch (error) {
      toast.error("Failed to load messages");
      console.error(error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"))
      const response = await axios.get(`${baseUrl}/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"))
      // Mark all unread messages as read
      const unreadMessages = messages.filter(msg => !msg.read && msg.senderType === 'admin');
      for (const msg of unreadMessages) {
        await axios.put(`${baseUrl}/messages/${msg._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Update unread count
      fetchUnreadCount();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error("Message cannot be empty");
      return;
    }

    setIsSending(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"))
      const formData = new FormData();
      
      formData.append("content", newMessage);
      
      attachments.forEach((file, index) => {
        formData.append("attachments", file);
      });

      const response = await axios.post(`${baseUrl}/messages/send`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === "success") {
        // Add the new message to the list
        const newMsg = {
          ...response.data.data,
          isMine: true,
          senderType: 'user'
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage("");
        setAttachments([]);
        
        // Update conversations
        fetchConversations();
        fetchUnreadCount();
        
        toast.success("Message sent!");
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
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
    return format(new Date(date), 'hh:mm a');
  };

  const formatDate = (date) => {
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
  };

  const openChatModal = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatModal(true);
    markAsRead();
  };

  const closeChatModal = () => {
    setShowChatModal(false);
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
      count: "Online", 
      icon: "fa-headset", 
      color: "#ff9800" 
    }
  ];

  return (
    <div className="dash">       
      <Sidebar activeMess="active" /> 
      <main className="content">
        <div className="messages-container">
          <DashboardHeader title="Messages" />
          
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
                  <button className="action-btn">View</button>
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
                  {messages.slice(-3).reverse().map((message) => (
                    <div 
                      key={message._id}
                      className="message-preview-item"
                      onClick={() => openChatModal(conversations[0])}
                    >
                      <div className="preview-avatar">
                        {message.receiver === 'admin' ? (
                          <FaUserCircle />
                        ) : (
                          <i className="fas fa-user-tie"></i>
                        )}
                      </div>
                      <div className="preview-content">
                        <div className="preview-header">
                          <span className="preview-sender">
                            {message.receiver === 'admin' ? 'You' : 'Support Team'}
                          </span>
                          <span className="preview-time">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="preview-text">
                          {message.content?.substring(0, 60) || 'Attachment sent...'}
                          {message.content && message.content.length > 60 && '...'}
                        </p>
                        {!message.read && message.receiver !== 'admin' && (
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

      {/* Chat Modal */}
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
                    <span className="status-indicator online"></span>
                    Online • Usually replies within minutes
                  </p>
                </div>
              </div>
              <button className="close-modal-btn" onClick={closeChatModal}>
                <FaTimes />
              </button>
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
                        
                        <div className={`modal-message-wrapper ${message.receiver !== 'admin' ? 'sent' : 'received'}`}>
                          <div className="modal-message-content">
                            <p>{message.content}</p>
                            
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
                              {message.receiver !== 'admin' && (
                                <span className="modal-message-status">
                                  {message.read ? <FaCheckDouble color="#4caf50" /> : <FaCheck color="#999" />}
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
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={isSending}
                />
                
                <button 
                  type="submit" 
                  className="modal-send-btn"
                  disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Message;