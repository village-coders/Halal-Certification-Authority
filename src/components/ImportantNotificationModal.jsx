import React, { useState, useEffect } from 'react';
import { BellRing, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import './css/ImportantNotificationModal.css';

const ImportantNotificationModal = ({ notifications, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setIsVisible(true);
    }
  }, [notifications]);

  if (!isVisible || !notifications || notifications.length === 0) return null;

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const tokenString = localStorage.getItem('accessToken');
      if (!tokenString) {
        setIsVisible(false);
        if (onDismiss) onDismiss();
        return;
      }
      const token = JSON.parse(tokenString);
      const response = await fetch(`${baseUrl}/notifications/user/dismiss-modal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      } else {
        toast.error('Failed to dismiss notifications');
      }
    } catch (error) {
      console.error('Error dismissing notifications:', error);
      toast.error('An error occurred');
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="important-modal-overlay">
      <div className="important-modal-content">
        {/* Header */}
        <div className="important-modal-header">
          <div className="important-modal-header-left">
            <div className="important-modal-icon-container">
              <BellRing className="important-modal-icon" />
            </div>
            <h2 className="important-modal-title">Important Updates</h2>
          </div>
          <button 
            onClick={handleDismiss}
            disabled={isDismissing}
            className="important-modal-close-btn"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="important-modal-body">
          <p className="important-modal-subtitle">
            You have {notifications.length} new important update{notifications.length > 1 ? 's' : ''} regarding your application.
          </p>

          <div className="important-modal-list">
            {notifications.map((notif, idx) => (
              <div 
                key={notif._id || idx} 
                className="important-modal-item"
              >
                <div className="important-modal-dot" />
                <div className="important-modal-item-content">
                  <h3 className="important-modal-item-title">{notif.title}</h3>
                  <p className="important-modal-item-message">{notif.message}</p>
                  <div className="important-modal-item-date">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="important-modal-footer">
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="important-modal-action-btn"
          >
            {isDismissing ? 'Dismissing...' : 'Acknowledge & Continue'}
            {!isDismissing && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportantNotificationModal;
