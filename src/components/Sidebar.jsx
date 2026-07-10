import { useState, useEffect, useCallback } from "react";
import "./css/Sidebar.css";
import logo from '../assets/hdiLogo1.png';
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineDashboard, MdOutlineAssignment, MdOutlineBadge, MdOutlineShoppingBag, MdOutlinePerson, MdOutlineMessage, MdOutlineLogout, MdOutlineReceipt, MdOutlineEventNote, MdOutlineHelp } from "react-icons/md";
import { TbUsersGroup } from "react-icons/tb";
import { FaBuilding } from "react-icons/fa";
import axios from 'axios';
import { useAuth } from "../hooks/useAuth";

/**
 * NavBtn - A sidebar button with an optional red-dot notification badge in the top-right corner of the icon.
 */
const NavBtn = ({ onClick, className, title, icon: Icon, label, isCollapsed, badge = 0 }) => (
  <button onClick={onClick} className={`dropdown-btn ${className || ''}`} title={title}>
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon />
      {badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '8px',
          height: '8px',
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          boxShadow: '0 0 0 1.5px white',
          display: 'block',
          flexShrink: 0,
        }} />
      )}
    </span>
    {!isCollapsed && (
      <>
        <span>{label}</span>
        {badge > 0 && (
          <span className="badge" style={{ backgroundColor: '#ef4444', marginLeft: 'auto' }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </>
    )}
  </button>
);

const Sidebar = ({ activeD, activeApp, activeCert, activeP, activeMess, activeI, activeAu, activePro, activeUse, activeGuide, activeBranches }) => {
  const [openMenu, setOpenMenu] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  // Per-page unread counts
  const [badgeCounts, setBadgeCounts] = useState({
    application: 0,
    invoice: 0,
    certificate: 0,
    audit: 0,
    product: 0,
    message: 0,
  });

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { logout } = useAuth();

  // Fetch and compute per-type unread counts
  const fetchCounts = useCallback(async () => {
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);

      const notifRes = await axios
        .get(`${baseUrl}/notifications/user`, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => null);

      if (notifRes?.data?.notifications) {
        const unread = notifRes.data.notifications.filter(n => !n.isRead);
        const counts = {
          application: 0,
          invoice: 0,
          certificate: 0,
          audit: 0,
          product: 0,
          message: 0,
        };
        unread.forEach(n => {
          const t = n.type || 'general';
          if (counts[t] !== undefined) counts[t]++;
        });
        setBadgeCounts(counts);
      }
    } catch (error) {
      console.error("Failed to fetch notification counts", error);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setIsCollapsed(true);
  }, [isMobile]);

  // Mark all notifications of a given type as read on the server and clear locally
  const markTypeRead = useCallback(async (type) => {
    try {
      const tokenString = localStorage.getItem("accessToken");
      if (!tokenString) return;
      const token = JSON.parse(tokenString);
      await axios.put(
        `${baseUrl}/notifications/user/mark-read-by-type`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBadgeCounts(prev => ({ ...prev, [type]: 0 }));
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  }, [baseUrl]);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? "" : menu);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) setOpenMenu("");
  };

  // Navigate and optionally clear a badge type
  const nav = (path, notifType = null) => {
    if (isMobile) setIsCollapsed(true);
    if (notifType && badgeCounts[notifType] > 0) {
      markTypeRead(notifType);
    }
    navigate(path);
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
            <li>
              <NavBtn
                onClick={() => nav('/dashboard')}
                className={activeD}
                title="Dashboard"
                icon={MdOutlineDashboard}
                label="Dashboard"
                isCollapsed={isCollapsed}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/applications', 'application')}
                className={`${openMenu === "applications" ? "active" : ""} ${activeApp}`}
                title="Applications"
                icon={MdOutlineAssignment}
                label="Applications"
                isCollapsed={isCollapsed}
                badge={badgeCounts.application}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/submit-documents')}
                className=""
                title="Submit Relevant Document"
                icon={MdOutlineAssignment}
                label="Submit Relevant Document"
                isCollapsed={isCollapsed}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/invoices', 'invoice')}
                className={`${openMenu === "invoices" ? "active" : ""} ${activeI}`}
                title="Invoice"
                icon={MdOutlineReceipt}
                label="Invoices"
                isCollapsed={isCollapsed}
                badge={badgeCounts.invoice}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/certificates', 'certificate')}
                className={`${openMenu === "certificate" ? "active" : ""} ${activeCert}`}
                title="Certificate"
                icon={MdOutlineBadge}
                label="Certificate"
                isCollapsed={isCollapsed}
                badge={badgeCounts.certificate}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/products')}
                className={`${openMenu === "products" ? "active" : ""} ${activeP}`}
                title="Products"
                icon={MdOutlineShoppingBag}
                label="Products"
                isCollapsed={isCollapsed}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/message', 'message')}
                className={`${openMenu === "message" ? "active" : ""} ${activeMess}`}
                title="Messages"
                icon={MdOutlineMessage}
                label="Messages"
                isCollapsed={isCollapsed}
                badge={badgeCounts.message}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/audits', 'audit')}
                className={`${openMenu === "audits" ? "active" : ""} ${activeAu}`}
                title="Audit"
                icon={MdOutlineEventNote}
                label="Audits"
                isCollapsed={isCollapsed}
                badge={badgeCounts.audit}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/profile')}
                className={`${openMenu === "profile" ? "active" : ""} ${activePro}`}
                title="Profile"
                icon={MdOutlinePerson}
                label="Profile"
                isCollapsed={isCollapsed}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/branches')}
                className={activeBranches}
                title="Branches"
                icon={FaBuilding}
                label="Branches"
                isCollapsed={isCollapsed}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/user-guide')}
                className={activeGuide}
                title="User Guide"
                icon={MdOutlineHelp}
                label="User Guide"
                isCollapsed={isCollapsed}
              />
            </li>

            <li>
              <NavBtn
                onClick={() => nav('/manage-users')}
                className={`${openMenu === "manage-users" ? "active" : ""} ${activeUse}`}
                title="Manage Users"
                icon={TbUsersGroup}
                label="Manage Users"
                isCollapsed={isCollapsed}
              />
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => { if (isMobile) { toggleSidebar(); } logout(); }}
            className="logout-btn dropdown-btn"
            title="Logout"
          >
            <MdOutlineLogout />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;