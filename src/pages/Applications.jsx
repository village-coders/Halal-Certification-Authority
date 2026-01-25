import { useState, useEffect } from "react";
import "./css/Applications.css";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// Sample data for initial display
const initialApplications = [
  {
    _id: "1",
    applicationNumber: "APP-04291234",
    category: "Annual Certification",
    product: "Food Processing Equipment",
    description: "Annual certification renewal",
    status: "Submitted",
    requestedDate: "2024-01-15",
    createdAt: "2024-01-10"
  },
  {
    _id: "2",
    applicationNumber: "REN-12098765",
    category: "Renewal Application",
    product: "Medical Devices",
    description: "Renewal of certification",
    status: "Approved",
    requestedDate: "2024-01-20",
    createdAt: "2024-01-05"
  },
  {
    _id: "3",
    applicationNumber: "APP-01152345",
    category: "Initial Certification",
    product: "Electrical Components",
    description: "New product certification",
    status: "In-Progress",
    requestedDate: "2024-01-25",
    createdAt: "2024-01-01"
  }
];

function Applications() {
  const [applications, setApplications] = useState(initialApplications);
  const [searchNumber, setSearchNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showFilters, setShowFilters] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [products, setProducts] = useState([])

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

  // const products = [
  //   "Food Processing Equipment",
  //   "Medical Devices",
  //   "Electrical Components",
  //   "Construction Materials",
  //   "Automotive Parts",
  //   "Consumer Electronics"
  // ];

  const {user} = useAuth()


  const fetchProducts = async () => {
    try {
      const companyId = user.registrationNo;
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${API_BASE_URL}/products?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(response.data.products);
      // console.log(response.data.products);
      
      setError("");
    } catch (err) {
      console.log(err);
    }
  };


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
      if (window.innerWidth >= 900) {
        setShowFilters(false);
      }
    };

    window.addEventListener("resize", handleResize);
    
    fetchApplications();
    fetchProducts();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/applications?companyId=${user.registrationNo}`);
      setApplications(response.data);
      
      setError("");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app =>
    app.applicationNumber.toLowerCase().includes(searchNumber.toLowerCase()) &&
    (searchDate ? app.createdAt.includes(searchDate) : true)
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
    try {
      setLoading(true);
      
      // For demo - generate new application from form data
      // const newApp = {
      //   _id: Date.now().toString(),
      //   applicationNumber: `APP-${Date.now().toString().slice(-8)}`,
      //   category: formData.category,
      //   product: formData.product,
      //   description: formData.description,
      //   status: "Submitted",
      //   requestedDate: formData.requestedDate,
      //   createdAt: new Date().toISOString()
      // };
      
      // In real app, use:
      const response = await axios.post(`${API_BASE_URL}/applications`, formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("accessToken"))}`
        }
      });

      fetchApplications()
      
      // setApplications(prev => [newApp, ...prev]);
      setSuccess("Application submitted successfully!");
      
      setTimeout(() => {
        handleCloseForm();
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.log(err);
      
      setError("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const selectedApp = applications.find(app => app._id === renewalData.existingApplication);
      
      const newApp = {
        // _id: Date.now().toString(),
        applicationNumber: `REN-${Date.now().toString().slice(-8)}`,
        category: "Renewal Application",
        product: selectedApp.product,
        description: `Renewal of ${selectedApp.applicationNumber}. Reason: ${renewalData.reason}`,
        status: "Submitted",
        requestedDate: renewalData.renewalDate,
        createdAt: new Date().toISOString()
      };

      const response = axios.post(`${API_BASE_URL}/eligible/renewal`, newApp);

      if (response.status !== 200) {
        throw new Error("Failed to submit renewal application.");
      }else{
        fetchApplications();
        // setApplications(prev => [newApp, ...prev]);
        setSuccess("Renewal application submitted successfully!");
      }

      
      setTimeout(() => {
        handleCloseForm();
        setSuccess("");
      }, 1000);
    } catch (err) {
      setError("Failed to submit renewal application. Please try again.");
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dash">
      <Sidebar activeApp="active" />
      <main className="content cert">
        <div className="manage-applications">
          <div className="header">
            <h2>Manage Applications</h2>
            <div className="header-actions">
              <button className="renew-btn" onClick={handleRenewApplication}>
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
            <button className="search-btn">
              <i className="fas fa-search"></i> Search
            </button>
          </div>

          {/* Applications Table */}
          <div className="table-wrapper">
            <div className="table-header">
              <h3>Applications ({filteredApplications.length})</h3>
              <div className="table-actions">
                <button className="action-btn" onClick={fetchApplications}>
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading...
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
                        <span className="app-number">{app.applicationNumber}</span>
                      </td>
                      <td>{app.category}</td>
                      <td>{app.product}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(app.status) + '20',
                            color: getStatusColor(app.status)
                          }}
                        >
                          {app.status}
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
                        No applications found
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
                <button className="close-btn" onClick={handleCloseForm}>
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
                  >
                    <option value="">Select Product</option>
                    {products.map((prod, i) => (
                      <option key={prod._id} value={prod.name}>{prod.name}</option>
                    ))}
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
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-cancel" onClick={handleCloseForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
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
                <button className="close-btn" onClick={handleCloseForm}>
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
                  />
                </div>

                <div className="form-group">
                  <label>Reason *</label>
                  <select
                    name="reason"
                    value={renewalData.reason}
                    onChange={handleRenewalInputChange}
                    required
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
                    />
                    <button type="button" className="btn btn-upload">
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
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-cancel" onClick={handleCloseForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-submit" disabled={loading}>
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