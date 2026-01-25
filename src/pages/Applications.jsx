import { useState, useEffect, useCallback } from "react";
import "./css/Applications.css";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { useProducts } from "../hooks/useProducts";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

function Applications() {
  const [applications, setApplications] = useState([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showFilters, setShowFilters] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    category: "",
    product: "",
    description: "",
    requestedDate: new Date().toISOString().split("T")[0]
  });

  const [renewalData, setRenewalData] = useState({
    existingApplication: "",
    renewalDate: new Date().toISOString().split("T")[0],
    reason: "",
    attachments: []
  });

  const applicationCategories = [
    "Initial Certification",
    "Annual Certification",
    "Surveillance Audit",
    "Recertification",
    "Extension of Scope",
    "Renewal Application"
  ];

  const { user, fetchUser } = useAuth();
  const { products, fetchProducts, isLoading: productsLoading } = useProducts();

  useEffect(() => {
    fetchUser();
  }, []);

  // Memoized fetchApplications to prevent unnecessary recreations
  const fetchApplications = useCallback(async () => {
    // if (!user?.registrationNo) {
    //   setError("User registration number not found");
    //   return;
    // }

    try {
      setLoading(true);
      setError("");

      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(
        `${API_BASE_URL}/applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        setApplications(response.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Failed to load applications. Invalid data format.");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch applications";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
      if (window.innerWidth >= 900) {
        setShowFilters(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // if (user?.registrationNo) {
      fetchApplications();
      fetchProducts();
    // }
  }, []);

  const filteredApplications = applications.filter(app =>
    app.applicationNumber?.toLowerCase().includes(searchNumber.toLowerCase()) &&
    (searchDate ? app.createdAt?.includes(searchDate) : true)
  );

  const handleNewApplication = () => {
    setShowApplicationForm(true);
    setShowRenewalForm(false);
  };

  const handleRenewApplication = () => {
    setShowRenewalForm(true);
    setShowApplicationForm(false);
  };

  const handleCloseForm = () => {
    setShowApplicationForm(false);
    setShowRenewalForm(false);
    setFormData({
      category: "",
      product: "",
      description: "",
      requestedDate: new Date().toISOString().split("T")[0]
    });
    setRenewalData({
      existingApplication: "",
      renewalDate: new Date().toISOString().split("T")[0],
      reason: "",
      attachments: []
    });
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRenewalInputChange = (e) => {
    const { name, value } = e.target;
    setRenewalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setRenewalData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setRenewalData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.registrationNo) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      // Prepare the application data
      const applicationData = {
        ...formData,
        companyId: user.registrationNo,
        status: "Submitted",
        // applicationNumber: `APP-${Date.now().toString().slice(-8)}`
      };

      const response = await axios.post(
        `${API_BASE_URL}/applications`,
        applicationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data._id) {
        setSuccess("Application submitted successfully!");
        fetchApplications(); // Refresh the applications list
        
        setTimeout(() => {
          handleCloseForm();
        }, 2000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      handleCloseForm();
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit application";
      setError(errorMessage);
      console.error("Error submitting application:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.registrationNo) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const selectedApp = applications.find(app => app._id === renewalData.existingApplication);
      
      if (!selectedApp) {
        throw new Error("Selected application not found");
      }

      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      // Prepare renewal data
      const renewalApplicationData = {
        category: "Renewal Application",
        product: selectedApp.product,
        description: `Renewal of ${selectedApp.applicationNumber}. Reason: ${renewalData.reason}`,
        requestedDate: renewalData.renewalDate,
        companyId: user.registrationNo,
        status: "Submitted",
        applicationNumber: `REN-${Date.now().toString().slice(-8)}`,
        originalApplicationId: selectedApp._id
      };

      const response = await axios.post(
        `${API_BASE_URL}/applications`,
        renewalApplicationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data._id) {
        setSuccess("Renewal application submitted successfully!");
        fetchApplications(); // Refresh the applications list
        
        setTimeout(() => {
          handleCloseForm();
        }, 2000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error submitting renewal:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit renewal application";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "Submitted": "#0077cc",
      "In-Progress": "#ff9900",
      "Approved": "#28a745",
      "Certified": "#28a745",
      "Rejected": "#d93025",
      "Pending Review": "#6c757d"
    };
    return colors[status] || "#6c757d";
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

  // Fix for clear button
  const handleClearFilters = () => {
    setSearchNumber("");
    setSearchDate("");
  };

  return (
    <div className="dash">
      <Sidebar activeApp="active" />
      <main className="content cert">
        <div className="manage-applications">
          <div className="header">
            <h2>Manage Applications</h2>
            <div className="header-actions">
              <button 
                className="renew-btn" 
                onClick={handleRenewApplication}
                disabled={applications.filter(app => app.status === "Approved" || app.status === "Certified").length === 0}
              >
                <i className="fas fa-sync-alt"></i> Renew
              </button>
              <button className="new-btn" onClick={handleNewApplication}>
                <i className="fas fa-plus"></i> New Application
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
              <label>Application Number</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Application Date</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <button 
              className="search-btn"
              onClick={handleClearFilters}
            >
              <i className="fas fa-times"></i> Clear
            </button>
          </div>

          {/* Applications Table */}
          <div className="table-wrapper">
            <div className="table-header">
              <h3>Applications ({filteredApplications.length})</h3>
              <div className="table-actions">
                <button 
                  className="action-btn" 
                  onClick={fetchApplications}
                  disabled={loading}
                >
                  <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading applications...
              </div>
            ) : (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>App Number</th>
                    <th>Category</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <span className="app-number">{app.applicationNumber || "N/A"}</span>
                      </td>
                      <td>{app.category || "N/A"}</td>
                      <td>{app.product || "N/A"}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(app.status) + '20',
                            color: getStatusColor(app.status)
                          }}
                        >
                          {app.status || "Unknown"}
                        </span>
                      </td>
                      <td>{formatDate(app.createdAt)}</td>
                      <td>
                        <button className="view-btn" title="View">
                          <i className="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {applications.length === 0 ? "No applications found" : "No matching applications"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* New Application Modal */}
        {showApplicationForm && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>New Application</h3>
                <button 
                  className="close-btn" 
                  onClick={handleCloseForm}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Category</option>
                    {applicationCategories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Product *</label>
                  <select
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    required
                    disabled={loading || productsLoading}
                  >
                    <option value="">Select Product</option>
                    {productsLoading ? (
                      <option value="" disabled>Loading products...</option>
                    ) : products.length > 0 ? (
                      products.map((prod) => (
                        <option key={prod._id} value={prod.name }>{prod.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No products found</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Requested Date *</label>
                  <input
                    type="date"
                    name="requestedDate"
                    value={formData.requestedDate}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional details..."
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={handleCloseForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-submit" 
                    disabled={loading || !formData.category || !formData.product}
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Renewal Application Modal */}
        {showRenewalForm && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Renew Application</h3>
                <button 
                  className="close-btn" 
                  onClick={handleCloseForm}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleRenewalSubmit}>
                <div className="form-group">
                  <label>Select Application *</label>
                  <select
                    name="existingApplication"
                    value={renewalData.existingApplication}
                    onChange={handleRenewalInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Choose application</option>
                    {applications
                      .filter(app => app.status === "Approved" || app.status === "Certified")
                      .map((app) => (
                        <option key={app._id} value={app._id}>
                          {app.applicationNumber} - {app.product}
                        </option>
                      ))
                    }
                    {applications.filter(app => app.status === "Approved" || app.status === "Certified").length === 0 && (
                      <option value="" disabled>No eligible applications found</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Renewal Date *</label>
                  <input
                    type="date"
                    name="renewalDate"
                    value={renewalData.renewalDate}
                    onChange={handleRenewalInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Reason *</label>
                  <select
                    name="reason"
                    value={renewalData.reason}
                    onChange={handleRenewalInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select reason</option>
                    <option value="continuing_operations">Continuing Operations</option>
                    <option value="contract_requirement">Contract Requirement</option>
                    <option value="regulatory_compliance">Regulatory Compliance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Supporting Documents</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={loading}
                    />
                    <button type="button" className="btn btn-upload" disabled={loading}>
                      <i className="fas fa-upload"></i> Upload Files
                    </button>
                  </div>
                  {renewalData.attachments.length > 0 && (
                    <div className="file-list">
                      {renewalData.attachments.map((file, i) => (
                        <div key={i} className="file-item">
                          <span>{file.name}</span>
                          <button 
                            type="button" 
                            className="remove-file"
                            onClick={() => removeAttachment(i)}
                            disabled={loading}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={handleCloseForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-submit" 
                    disabled={loading || !renewalData.existingApplication || !renewalData.reason}
                  >
                    {loading ? 'Processing...' : 'Submit Renewal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Applications;