import { useState, useEffect, useRef } from "react";
import './css/DashboardHeader.css'
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Bell, X } from 'lucide-react';

const DashboardHeader = ({title}) => {
  const [openMenu, setOpenMenu] = useState(false);
  const toggleMenu = () => setOpenMenu((prev) => !prev);
  const menuRef = useRef(null);
  const {user, userLoading, logout} = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const fetchNotifications = async () => {
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);
      
      const res = await axios.get(`${baseUrl}/notifications/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (unreadCount > 0 && !showDropdown) {
      try {
        const tokenString = localStorage.getItem("accessToken");
        if (!tokenString) return;
        const token = JSON.parse(tokenString);
        
        await axios.put(`${baseUrl}/notifications/user/mark-read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(0);
        fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  const handleClearAll = async () => {
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);

      await axios.delete(`${baseUrl}/notifications/user/clear-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const handleClearOne = async (id, e) => {
    e.stopPropagation();
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);

      await axios.delete(`${baseUrl}/notifications/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  };

  return (
    <div className="dashboard-header">
      <h1>{title}</h1>
      <div className="header-actions">
        
        <div id="tour-dashboard-notification" className="notification-container" ref={dropdownRef}>
          <button className="notification-btn cursor-pointer" onClick={handleBellClick}>
            <Bell />
            {unreadCount > 0 && (
              <span className="notification-badge-custom">{unreadCount}</span>
            )}
          </button>
          
          {showDropdown && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h3 className="notification-dropdown-title">Notifications</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="notification-clear-all"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">No notifications</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif._id} className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}>
                      <button 
                        onClick={(e) => handleClearOne(notif._id, e)}
                        className="notification-clear-one"
                      >
                        <X className="notification-clear-icon-svg" />
                      </button>
                      <p className="notification-item-title">{notif.title}</p>
                      <p className="notification-item-message">{notif.message}</p>
                      <p className="notification-item-time">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu button */}
        <div className="user-menu-container" ref={menuRef}>
          <button className="user-menu" onClick={toggleMenu}>
            <i className="fas fa-user-circle"></i>
            <i className={`dropdown-arrow fas ${openMenu ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
          </button>

          {/* Dropdown */}
          {openMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <h3>{userLoading ?  "loading.." : user?.companyName}</h3>
                <span className="status">Online</span>
                <button onClick={() => {logout(); toggleMenu();}} className="logout-btn">Logout</button>
              </div>
              <hr />
              <div className="user-options">
                <p>PROFILE</p>
                <button onClick={() => {navigate('/profile'); toggleMenu();}} className="profile-menu">Company Profile</button>
                <button onClick={() => {navigate('/profile'); toggleMenu();}} className="profile-menu">Change Organization Name</button>
                <button onClick={() => {navigate('/profile'); toggleMenu();}} className="profile-menu">Contact Details</button>
              </div>
              <hr />
              <button onClick={() => {navigate('/message'); toggleMenu();}} className="messages-btn">Messages</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
