import { useState, useEffect } from "react";
import "./css/Certificate.css";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

function Certificate() {
  const [certificates, setCertificates] = useState([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const certificateCategories = [
    "Food Safety Certification",
    "Quality Management System",
    "Environmental Management",
    "Occupational Health & Safety",
    "Halal Certification",
    "Organic Certification"
  ];

  const standards = [
    "ISO 22000:2018",
    "ISO 9001:2015",
    "ISO 14001:2015",
    "ISO 45001:2018",
    "HACCP",
    "GLOBALG.A.P.",
    "BRCGS",
    "FSSC 22000"
  ];

  // const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };

    window.addEventListener("resize", handleResize);
    fetchCertificates();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError("");
      
      // If user is authenticated, fetch their certificates

        const token = JSON.parse(localStorage.getItem("accessToken"));
        const response = await axios.get(
          `${API_BASE_URL}/certificates`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response.data && Array.isArray(response.data)) {
          setCertificates(response.data);
          
        } else {
          setCertificates([]);
        }
    } catch (err) {
      console.error("Error fetching certificates:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load certificates";
      setError(errorMessage);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.certificateNumber?.toLowerCase().includes(searchNumber.toLowerCase()) &&
    (searchDate ? cert.issueDate?.includes(searchDate) : true)
  );

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateModal(true);
  };

  const handleDownloadCertificate = async (certificate) => {
    try {
      setDownloading(true);
      setError("");
      setSuccess("");
      
      // In real implementation, this would download the PDF
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(
        `${API_BASE_URL}/certificates/${certificate._id}/download`,
        { 
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificate.certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess("Certificate downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error downloading certificate:", err);
      setError("Failed to download certificate. The file may not be available yet.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDownloading(false);
    }
  };

  const handleRenewCertificate = (certificate) => {
    // Navigate to applications page with certificate ID for renewal
    window.location.href = `/applications?renewCertificate=${certificate._id}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      "Active": "#10b981",
      "Expiring Soon": "#f59e0b",
      "Expired": "#ef4444",
      "Suspended": "#6b7280",
      "Revoked": "#dc2626",
      "Pending": "#6366f1"
    };
    return colors[status] || "#6b7280";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? "Invalid Date" 
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid Date";
    }
  };

  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    
    try {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (err) {
      console.error("Error calculating days remaining:", err);
      return null;
    }
  };

  const handleClearFilters = () => {
    setSearchNumber("");
    setSearchDate("");
  };

  return (
    <div className="dash">
      <Sidebar activeCert='active' />
      <main className="content cert">
        <div className="manage-applications">
          <div className="header">
            <h2>Manage Certificates</h2>
            <div className="header-actions">
              <button 
                className="renew-btn" 
                onClick={() => alert('Export feature coming soon')}
                disabled={loading}
              >
                <i className="fas fa-file-export"></i> Export
              </button>
              <button 
                className="new-btn" 
                onClick={() => alert('Generate certificate feature coming soon')}
                disabled={loading}
              >
                <i className="fas fa-file-certificate"></i> Generate
              </button>
            </div>
          </div>

          {success && (
            <div className="alert success">
              <i className="fas fa-check-circle"></i> {success}
            </div>
          )}

          {error && (
            <div className="alert error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Search & Filters */}
          <div className="search-box">
            <div className="field">
              <label>Certificate Number</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="field">
              <label>Issue Date</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              className="search-btn"
              onClick={handleClearFilters}
              disabled={loading}
            >
              <i className="fas fa-times"></i> Clear
            </button>
          </div>

          {/* Certificates Table */}
          <div className="table-wrapper">
            <div className="table-header">
              <h3>Certificates ({filteredCertificates.length})</h3>
              <div className="table-actions">
                <button 
                  className="action-btn" 
                  onClick={fetchCertificates}
                  disabled={loading}
                >
                  <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading certificates...
              </div>
            ) : certificates.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-file-certificate" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}></i>
                <h3>No Certificates Found</h3>
                <p>You don't have any certificates yet. Submit an application to get certified.</p>
              </div>
            ) : (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Certificate Number</th>
                    <th>Type</th>
                    <th>Standard</th>
                    <th>Status</th>
                    <th>Product</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody style={{overflowY: "auto"}}>
                  {filteredCertificates.map((cert) => {
                    const daysRemaining = calculateDaysRemaining(cert.expiryDate);
                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;
                    
                    return (
                      <tr key={cert._id}>
                        <td>
                          <span className="app-number">{cert.certificateNumber || "N/A"}</span>
                        </td>
                        <td>{cert.certificateType || "N/A"}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              fontSize: "12px",
                              textWrap: "nowrap"
                            }}
                          >
                            {cert.standard || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: getStatusColor(cert.status) + '20',
                              color: getStatusColor(cert.status),
                              border: `1px solid ${getStatusColor(cert.status)}`,
                              fontSize: "12px",
                              textWrap: "nowrap"
                            }}
                          >
                            {cert.status || "Unknown"}
                            {isExpiringSoon && ` (${daysRemaining}d)`}
                          </span>
                        </td>
                        <td>{cert.product.name || "N/A"}</td>
                        <td>{formatDate(cert.expiryDate)}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="view-btn" 
                              title="View Details"
                              onClick={() => handleViewCertificate(cert)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="view-btn" 
                              title="Download"
                              onClick={() => handleDownloadCertificate(cert)}
                              disabled={downloading}
                            >
                              <i className="fas fa-download"></i>
                            </button>
                            {(cert.status === 'Active' || cert.status === 'Expiring Soon') && (
                              <button 
                                className="view-btn" 
                                title="Renew"
                                onClick={() => handleRenewCertificate(cert)}
                              >
                                <i className="fas fa-sync-alt"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCertificates.length === 0 && certificates.length > 0 && (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No matching certificates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Certificate Detail Modal */}
        {showCertificateModal && selectedCertificate && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>
                  <i className="fas fa-file-certificate"></i> Certificate Details
                </h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowCertificateModal(false)}
                  disabled={downloading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div className="info-grid" style={{ marginBottom: '24px' }}>
                  <div className="info-item">
                    <span className="info-label">Certificate Number:</span>
                    <span className="info-value">{selectedCertificate.certificateNumber || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Certificate Type:</span>
                    <span className="info-value">{selectedCertificate.certificateType || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Standard:</span>
                    <span className="info-value">{selectedCertificate.standard || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(selectedCertificate.status) + '20',
                          color: getStatusColor(selectedCertificate.status)
                        }}
                      >
                        {selectedCertificate.status || "Unknown"}
                      </span>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Product:</span>
                    <span className="info-value">{selectedCertificate.product || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Issue Date:</span>
                    <span className="info-value">{formatDate(selectedCertificate.issueDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Expiry Date:</span>
                    <span className="info-value">{formatDate(selectedCertificate.expiryDate)}</span>
                  </div>
                </div>

                {/* Expiry Warning */}
                {selectedCertificate.status === 'Expiring Soon' && (
                  <div className="renewal-notice" style={{ marginBottom: '24px' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>
                      <strong>Important:</strong> This certificate expires in {calculateDaysRemaining(selectedCertificate.expiryDate)} days. 
                      Please initiate renewal process to avoid certification lapse.
                    </p>
                  </div>
                )}

                {/* Certificate Preview (Mock) */}
                <div className="certificate-preview" style={{ 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px',
                  background: '#f9fafb'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h4 style={{ color: '#111827', marginBottom: '10px' }}>Certificate Preview</h4>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                      This is a preview of your certificate
                    </p>
                  </div>
                  <div style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '30px',
                    background: 'white',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ color: '#111827', marginBottom: '10px' }}>CERTIFICATE OF COMPLIANCE</h3>
                    <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                      This certifies that {selectedCertificate.product || "the product"} complies with {selectedCertificate.standard || "the standard"}
                    </p>
                    <div style={{ 
                      borderTop: '1px solid #e5e7eb', 
                      paddingTop: '20px',
                      marginTop: '20px'
                    }}>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Certificate Number: {selectedCertificate.certificateNumber || "N/A"}<br />
                        Valid until: {formatDate(selectedCertificate.expiryDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={() => setShowCertificateModal(false)}
                    disabled={downloading}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-submit"
                    onClick={() => handleDownloadCertificate(selectedCertificate)}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Downloading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-download"></i> Download Certificate
                      </>
                    )}
                  </button>
                  {(selectedCertificate.status === 'Active' || selectedCertificate.status === 'Expiring Soon') && (
                    <button 
                      type="button" 
                      className="btn renew-btn"
                      onClick={() => handleRenewCertificate(selectedCertificate)}
                      disabled={downloading}
                    >
                      <i className="fas fa-sync-alt"></i> Renew Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Certificate;