import { useState, useEffect } from "react";
import "./css/Sidebar.css";
import logo from '../assets/hdiLogo1.png';
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineDashboard, MdOutlineAssignment, MdOutlineBadge, MdOutlineShoppingBag, MdOutlinePerson, MdOutlineMessage, MdOutlineLogout, MdOutlineReceipt, MdOutlineEventNote, MdOutlineHelp, MdNotifications } from "react-icons/md";
import { TbUsersGroup } from "react-icons/tb";
import { FaBuilding } from "react-icons/fa";
import axios from 'axios';
import { useAuth } from "../hooks/useAuth";

const Sidebar = ({ activeD, activeApp, activeCert, activeP, activeMess, activeI, activeAu, activePro, activeUse, activeGuide, activeBranches }) => {
  const [openMenu, setOpenMenu] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const { logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      // Auto-collapse sidebar when switching to mobile
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const tokenString = localStorage.getItem("accessToken");
        if (!tokenString) return;
        const token = JSON.parse(tokenString);

        const [msgRes, notifRes] = await Promise.all([
          axios.get(`${baseUrl}/messages/unread/count`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          axios.get(`${baseUrl}/notifications/user`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
        ]);
        
        if (msgRes?.data?.status === 'success') {
          setUnreadMsgCount(msgRes.data.count || 0);
        }
        if (notifRes?.data?.status === 'success') {
          setUnreadNotifCount(notifRes.data.unreadCount || 0);
          setNotifications(notifRes.data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch counts", error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [baseUrl]);


  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? "" : menu);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setOpenMenu("");
    }
  };


  const markNotificationsAsRead = async () => {
    if (unreadNotifCount === 0) return;
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      await axios.put(`${baseUrl}/notifications/user/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifCount(0);
      setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  return (
    <>
      {/* Mobile overlay when sidebar is expanded on mobile */}
      {isMobile && !isCollapsed && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>
        <div className="sidebar-header">
          <div className="side-logo">
            {(!isCollapsed || isMobile) && <a target="blank" href="https://halalcert.com.ng/"><img src={logo} alt="HDI Logo" /></a>}
            {(!isCollapsed || isMobile) && <h2>HDI Portal</h2>}
          </div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <i className={`fas ${isCollapsed ? "fa-bars" : "fa-times"}`}></i>
          </button>
        </div>

        <nav className={`sidebar-nav ${isMobile && !isCollapsed ? "mobile-expanded" : ""}`}>
          <ul>
            <li className="has-submenu">
              <button 
                onClick={() => { 
                  setShowNotifications(!showNotifications); 
                  if (!showNotifications && unreadNotifCount > 0) markNotificationsAsRead();
                }} 
                className={`dropdown-btn ${showNotifications ? "active" : ""}`} 
                title="Notifications"
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MdNotifications />
                  {unreadNotifCount > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
                </div>
                {!isCollapsed && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginLeft: '10px' }}>
                    <span>Notifications</span>
                    {unreadNotifCount > 0 && <span className="badge" style={{ backgroundColor: '#ef4444' }}>{unreadNotifCount}</span>}
                  </div>
                )}
              </button>
              
              {!isCollapsed && showNotifications && (
                <div className="notifications-dropdown" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', margin: '0 10px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '10px 0' }}>No notifications yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map(notif => (
                        <div key={notif._id} style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', position: 'relative' }}>
                          <strong style={{ display: 'block', color: '#1e293b', marginBottom: '4px' }}>{notif.title}</strong>
                          <p style={{ color: '#475569', margin: 0, lineHeight: '1.4' }}>{notif.message}</p>
                          <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                          {!notif.isRead && <span style={{ position: 'absolute', top: '12px', right: '8px', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>

            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/dashboard') }} className={`dropdown-btn ${activeD}`} title="Dashboard">
                <MdOutlineDashboard />
                {!isCollapsed && <span>Dashboard</span>}
              </button>
            </li>

            <li className="has-submenu">
              <button
                onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/applications') }} className={`dropdown-btn ${openMenu === "applications" ? "active" : ""} ${activeApp}`} title="Applications" id="tour-sidebar-applications">
                <MdOutlineAssignment />
                {!isCollapsed && <span>Applications</span>}
              </button>
              {/* {!isCollapsed && openMenu === "applications" && (
                <ul onClick={isMobile ? toggleSidebar : undefined} className="submenu">
                  <li><a href="#"><i className="fas fa-plus-circle"></i> <span>New Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-sync-alt"></i> <span>Renewal Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-exclamation-triangle"></i> <span>Rejected / On-Hold</span></a></li>
                </ul>
              )} */}
            </li>

            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/submit-documents') }} className={`dropdown-btn`} title="Submit Relevant Document" id="tour-sidebar-submit-documents">
                <MdOutlineAssignment />
                {!isCollapsed && <span>Submit Relevant Document</span>}
              </button>
            </li>

            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/invoices') }} className={`dropdown-btn ${openMenu === "invoices" ? "active" : ""} ${activeI}`} title="Invoice" id="tour-sidebar-invoices">
                <MdOutlineReceipt />
                {!isCollapsed && <span>Invoices</span>}
              </button>
            </li>

            <li className="has-submenu">
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/certificates') }} className={`dropdown-btn ${openMenu === "certificate" ? "active" : ""} ${activeCert}`} title="Certificate" id="tour-sidebar-certificates">
                <MdOutlineBadge />
                {!isCollapsed && <span>Certificate</span>}
              </button>
              {/* {!isCollapsed && openMenu === "certificate" && (
                <ul onClick={isMobile ? toggleSidebar : undefined} className="submenu">
                  <li><a href="#"><i className="fas fa-search"></i> <span>View Certificates</span></a></li>
                  <li><a href="#"><i className="fas fa-download"></i> <span>Download</span></a></li>
                </ul>
              )} */}
            </li>

            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/products') }} className={`dropdown-btn ${openMenu === "products" ? "active" : ""} ${activeP}`} title="Products" id="tour-sidebar-products">
                <MdOutlineShoppingBag />
                {!isCollapsed && <span>Products</span>}
              </button>
            </li>
            {/* <li>
              <button onClick={() =>{ if (isMobile) toggleSidebar();  navigate('/export')}} className="dropdown-btn" title="Export">
                <i className="fas fa-globe"></i>
                {!isCollapsed && <span>Export</span>}
              </button>
            </li> */}
            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true) } navigate('/message') }} className={`dropdown-btn ${openMenu === "message" ? "active" : ""} ${activeMess}`} title="Messages">
                <MdOutlineMessage />
                {!isCollapsed && (
                  <>
                    <span>Messages</span>
                    {unreadMsgCount > 0 && <span className="badge">{unreadMsgCount}</span>}
                  </>
                )}
              </button>
            </li>
            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/audits') }} className={`dropdown-btn ${openMenu === "audits" ? "active" : ""} ${activeAu}`} title="Audit" id="tour-sidebar-audits">
                <MdOutlineEventNote />
                {!isCollapsed && <span>Audits</span>}
              </button>
            </li>
            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/profile') }} className={`dropdown-btn ${openMenu === "profile" ? "active" : ""} ${activePro}`} title="Profile" id="tour-sidebar-profile">
                <MdOutlinePerson />
                {!isCollapsed && <span>Profile</span>}
              </button>
            </li>
            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/branches') }} className={`dropdown-btn ${activeBranches}`} title="Branches">
                <FaBuilding />
                {!isCollapsed && <span>Branches</span>}
              </button>
            </li>
            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/user-guide') }} className={`dropdown-btn ${activeGuide}`} title="User Guide">
                <MdOutlineHelp />
                {!isCollapsed && <span>User Guide</span>}
              </button>
            </li>
            <li>
              <button onClick={() => { if (isMobile) { toggleSidebar(); setIsCollapsed(true); } navigate('/manage-users') }} className={`dropdown-btn ${openMenu === "manage-users" ? "active" : ""} ${activeUse}`} title="Manage Users">
                <TbUsersGroup />
                {!isCollapsed && <span>Manage Users</span>}
              </button>
            </li>
          </ul>
        </nav>

        {/* {!isMobile && ( */}
        <div className="sidebar-footer">
          {/* {!isCollapsed && ( */}
          <button
            onClick={() => { if (isMobile) { toggleSidebar(); } logout() }}
            className="logout-btn dropdown-btn"
            title="Logout"
          >
            <MdOutlineLogout />
            {!isCollapsed && <span>Logout</span>}
          </button>
          {/* )} */}
        </div>
        {/* )} */}
      </aside>
    </>
  );
}

export default Sidebar;