import { useState, useEffect } from "react";
import "./css/Dashboard.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

function Dashboard() {
  const [activeTab, setActiveTab] = useState("inProgress");
  const [stats, setStats] = useState({
    certificates: 0,
    products: 0,
    applications: 0
  });
  const [inProgressApps, setInProgressApps] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    applications: true,
    certificates: true
  });
  const [error, setError] = useState("");

  const { user } = useAuth();

  const quickActions = [
    { title: "NEW APPLICATION", icon: "fa-plus-circle", color: "#4caf50", link: "applications" },
    { title: "RENEWAL APPLICATION", icon: "fa-sync-alt", color: "#2196f3", link: "applications" },
    { title: "REQUEST PRODUCT", icon: "fa-cubes", color: "#9c27b0", link: "products" }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Check token expiration

  

  const fetchDashboardData = async () => {
    try {
      setLoading({ stats: true, applications: true, certificates: true });
      setError("");

      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      // Fetch stats
      await fetchStats(token);
      
      // Fetch in-progress applications
      await fetchInProgressApplications(token);
      
      // Fetch certificates
      await fetchCertificates(token);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
    }
  };

  const fetchStats = async (token) => {
    try {
    //   const companyId = user.registrationNo;
      
      // Fetch applications count
      const appsResponse = await axios.get(
        `${API_BASE_URL}/applications`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Fetch certificates count
      // const certsResponse = await axios.get(
      //   `${API_BASE_URL}/certificates`,
      //   {
      //     headers: { Authorization: `Bearer ${token}` }
      //   }
      // );
      
      // Fetch products count (assuming this endpoint exists)
      const productsResponse = await axios.get(
        `${API_BASE_URL}/products`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log(appsResponse.data);
      

      setStats({
        // certificates: certsResponse.headers['x-total-count'] || certsResponse.data.length || 0,
        products: productsResponse.headers['x-total-count'] || productsResponse.data.products.length || 0,
        applications: appsResponse.headers['x-total-count'] || appsResponse.data.length || 0
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Set default counts
      setStats({
        certificates: 0,
        products: 0,
        applications: 0
      });
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchInProgressApplications = async (token) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/applications?status=Approved`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        // Format applications for display
        const formattedApps = response.data.slice(0, 5).map(app => ({
          id: app._id,
          date: app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace(/ /g, '-') : 'N/A',
          number: app.applicationNumber || 'N/A',
          category: app.category || 'N/A',
          site: app.product || 'N/A'
        }));
        
        setInProgressApps(formattedApps);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setInProgressApps([]);
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  };

  const fetchCertificates = async (token) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/certificates?status=Active`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        // Format certificates for display
        const formattedCerts = response.data.slice(0, 5).map(cert => ({
          id: cert._id,
          siteName: cert.product || 'N/A',
          certRef: cert.certificateNumber || 'N/A',
          certType: cert.certificateType || 'N/A',
          status: cert.status || 'Active'
        }));
        
        setCertificates(formattedCerts);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setCertificates([]);
    } finally {
      setLoading(prev => ({ ...prev, certificates: false }));
    }
  };

  const handleStartAction = (action) => {
    if (action.title === "NEW APPLICATION") {
      // Navigate to applications page and trigger new application
      window.location.href = "/applications?action=new";
    } else if (action.title === "RENEWAL APPLICATION") {
      // Navigate to applications page and trigger renewal
      window.location.href = "/applications?action=renew";
    }
    // For "REQUEST PRODUCT", the Link component will handle navigation
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? "N/A" 
        : date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).replace(/ /g, '-');
    } catch (err) {
      return "N/A";
    }
  };

  const statsData = [
    { 
      title: "CERTIFICATE", 
      count: loading.stats ? "..." : stats.certificates, 
      icon: "fa-certificate", 
      color: "#4caf50" 
    },
    { 
      title: "PRODUCTS", 
      count: loading.stats ? "..." : stats.products, 
      icon: "fa-cube", 
      color: "#2196f3" 
    },
    { 
      title: "APPLICATION", 
      count: loading.stats ? "..." : stats.applications, 
      icon: "fa-file-alt", 
      color: "#ff9800" 
    }
  ];

  return (
    <div className="dash">       
      <Sidebar activeD='active' /> 
      <main className="content">
        <div className="dashboard-container">
          <DashboardHeader title='Dashboard' /> 

          {error && (
            <div className="dashboard-error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>  
            <div className="actions-grid">
              {quickActions.map((action, index) => (
                <div key={index} className="action-card" style={{ borderLeft: `4px solid ${action.color}` }}>
                  <div className="action-icon">
                    <i className={`fas ${action.icon}`} style={{ color: action.color }}></i>
                  </div>
                  <div className="action-content">
                    <h3>{action.title}</h3>
                    {action.link ? (
                      <Link 
                        to={`/${action.link}`} 
                        className="action-btn"
                        onClick={() => handleStartAction(action)}
                      >
                        Start
                      </Link>
                    ) : (
                      <button 
                        className="action-btn" 
                        onClick={() => handleStartAction(action)}
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
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

          {/* Applications Section */}
          <div className="applications-section">
            <div className="section-header">
              <h2>Applications</h2>
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === "inProgress" ? "active" : ""}`}
                  onClick={() => setActiveTab("inProgress")}
                  disabled={loading.applications}
                >
                  {loading.applications ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> LOADING...
                    </>
                  ) : (
                    "IN-PROGRESS APPLICATIONS"
                  )}
                </button>
                <button 
                  className={`tab ${activeTab === "certificates" ? "active" : ""}`}
                  onClick={() => setActiveTab("certificates")}
                  disabled={loading.certificates}
                >
                  {loading.certificates ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> LOADING...
                    </>
                  ) : (
                    "CERTIFICATE LIST"
                  )}
                </button>
              </div>
            </div>

            <div className="section-content">
              {activeTab === "inProgress" ? (
                <div className="table-container">
                  {loading.applications ? (
                    <div className="loading-state">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Loading applications...</span>
                    </div>
                  ) : inProgressApps.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-file-alt"></i>
                      <p>No in-progress applications found</p>
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Number</th>
                          <th>Category</th>
                          <th>Site</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inProgressApps.map((app, index) => (
                          <tr key={index}>
                            <td>{app.date}</td>
                            <td>{app.number}</td>
                            <td>{app.category}</td>
                            <td>{app.site}</td>
                            <td>
                              <Link to={`/applications?view=${app.id}`} className="action-menu-btn" title="View Details">
                                <i className="fas fa-eye"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="table-container">
                  {loading.certificates ? (
                    <div className="loading-state">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Loading certificates...</span>
                    </div>
                  ) : certificates.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-file-certificate"></i>
                      <p>No active certificates found</p>
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Site Name</th>
                          <th>Certificate Ref No</th>
                          <th>Certificate Type</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificates.map((cert, index) => (
                          <tr key={index}>
                            <td>{cert.siteName}</td>
                            <td>{cert.certRef}</td>
                            <td>{cert.certType}</td>
                            <td>
                              <span className={`status-badge ${cert.status.toLowerCase().replace(' ', '-')}`}>
                                {cert.status}
                              </span>
                            </td>
                            <td>
                              <Link to={`/certificates?view=${cert.id}`} className="action-menu-btn" title="View Details">
                                <i className="fas fa-eye"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="refresh-section">
            <button 
              className="refresh-btn"
              onClick={fetchDashboardData}
              disabled={loading.stats || loading.applications || loading.certificates}
            >
              <i className={`fas fa-sync-alt ${loading.stats || loading.applications || loading.certificates ? 'fa-spin' : ''}`}></i>
              Refresh Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;