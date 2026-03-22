import { useState, useEffect } from "react";
import "./css/Sidebar.css";
import logo from '../assets/hcaLogo.webp';
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineDashboard, MdOutlineAssignment, MdOutlineBadge, MdOutlineShoppingBag, MdOutlinePerson, MdOutlineMessage, MdOutlineLogout, MdOutlineReceipt, MdOutlineEventNote } from "react-icons/md";
import { TbUsersGroup } from "react-icons/tb";
import axios from 'axios';
import { useAuth } from "../hooks/useAuth";

const Sidebar = ({activeD, activeApp, activeCert, activeP, activeMess, activeI, activeAu, activePro, activeUse})=> {
  const [openMenu, setOpenMenu] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const {logout} = useAuth();

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
    if(isMobile){
      setIsCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    const fetchUnreadMsgCount = async () => {
      try {
        const tokenString = localStorage.getItem("accessToken");
        if (!tokenString) return;
        const token = JSON.parse(tokenString);

        const res = await axios.get(`${baseUrl}/messages/unread/count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === 'success') {
          setUnreadMsgCount(res.data.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread messages count", error);
      }
    };

    fetchUnreadMsgCount();
    const interval = setInterval(fetchUnreadMsgCount, 60000); // Check every minute
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


  return (
    <>
      {/* Mobile overlay when sidebar is expanded on mobile */}
      {isMobile && !isCollapsed && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>
        <div className="sidebar-header">
          <div className="side-logo">
            {(!isCollapsed || isMobile) && <a target="blank" href="https://halalcert.vercel.app/"><img src={logo} alt="HCA Logo" /></a>}
            {(!isCollapsed || isMobile) && <h2>HCA Portal</h2>}
          </div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <i className={`fas ${isCollapsed ? "fa-bars" : "fa-times"}`}></i>
          </button>
        </div>

        <nav className={`sidebar-nav ${isMobile && !isCollapsed ? "mobile-expanded" : ""}`}>
          <ul>
            <li>
              <button onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);} navigate('/dashboard')}} className={`dropdown-btn ${activeD}`} title="Dashboard">
                <MdOutlineDashboard />
                {!isCollapsed && <span>Dashboard</span>}
              </button>
            </li>

            <li className="has-submenu">
              <button
                onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);} navigate('/applications')}} className={`dropdown-btn ${openMenu === "applications" ? "active" : ""} ${activeApp}`} title="Applications">
                <MdOutlineAssignment />
                {!isCollapsed &&  <span>Applications</span>}
              </button>
              {/* {!isCollapsed && openMenu === "applications" && (
                <ul onClick={isMobile ? toggleSidebar : undefined} className="submenu">
                  <li><a href="#"><i className="fas fa-plus-circle"></i> <span>New Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-sync-alt"></i> <span>Renewal Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-exclamation-triangle"></i> <span>Rejected / On-Hold</span></a></li>
                </ul>
              )} */}
            </li>

            <li className="has-submenu">
              <button onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);} navigate('/certificates')}} className={`dropdown-btn ${openMenu === "certificate" ? "active" : ""} ${activeCert}`} title="Certificate">
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
              <button onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);} navigate('/products')}} className={`dropdown-btn ${openMenu === "products" ? "active" : ""} ${activeP}`} title="Products">
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
              <button onClick={()=> {if (isMobile)  {toggleSidebar(); setIsCollapsed(true)} navigate('/message')}} className={`dropdown-btn ${openMenu === "message" ? "active" : ""} ${activeMess}`} title="Messages">
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
              <button onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);}  navigate('/invoices')}} className={`dropdown-btn ${openMenu === "invoices" ? "active" : ""} ${activeI}`} title="Invoice">
                <MdOutlineReceipt />
                {!isCollapsed && <span>Invoices</span>}
              </button>
            </li>
            <li>
              <button onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);}  navigate('/audits')}} className={`dropdown-btn ${openMenu === "audits" ? "active" : ""} ${activeAu}`} title="Audit">
                <MdOutlineEventNote />
                {!isCollapsed && <span>Audits</span>}
              </button>
            </li>
            <li>
              <button onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);}  navigate('/profile')}} className={`dropdown-btn ${openMenu === "profile" ? "active" : ""} ${activePro}`} title="Manage Users">
                <MdOutlinePerson />
                {!isCollapsed && <span>Profile</span>}
              </button>
            </li>
            <li>
              <button onClick={() =>{ if (isMobile) {toggleSidebar(); setIsCollapsed(true);}  navigate('/manage-users')}} className={`dropdown-btn ${openMenu === "manage-users" ? "active" : ""} ${activeUse}`} title="Manage Users">
                <TbUsersGroup />
                {!isCollapsed && <span>Manage Users</span>}
              </button>
            </li>
            {/* <li>
              <button onClick={() =>{ if (isMobile) toggleSidebar();  navigate('/manage-site')}} className="dropdown-btn" title="Manage Sites">
                <i className="fas fa-building"></i>
                {!isCollapsed && <span>Manage Sites</span>}
              </button>
            </li> */}
          </ul>
        </nav>
        
        {/* {!isMobile && ( */}
          <div className="sidebar-footer">
            {/* {!isCollapsed && ( */}
              <button
                onClick={() =>{ if (isMobile) {toggleSidebar();}  logout()}}
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