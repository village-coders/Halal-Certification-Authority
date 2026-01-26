import { useState, useEffect, useCallback } from "react";
import "./css/Applications.css";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { useProducts } from "../hooks/useProducts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

  const [formData, setFormData] = useState({
    category: "",
    product: "",
    description: "",
    requestedDate: new Date().toISOString().split("T")[0],
    // New fields for Halal certification history
    hasAppliedBefore: "", // "yes" or "no"
    previousHalalAgency: "",
    hasBeenSupervisedBefore: "", // "yes" or "no"
    supervisingHalalAgency: "",
    // New fields for food safety programs
    foodSafetyPrograms: [], // Array of selected programs
    otherFoodSafetyProgram: ""
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

  const foodSafetyProgramOptions = [
    "HACCP",
    "ISO-22000", 
    "GMP",
    "QMS",
    "Other"
  ];

  const { user, fetchUser } = useAuth();
  const { products, fetchProducts, isLoading: productsLoading } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  // Filter approved products only
  const approvedProducts = products.filter(product => 
    product.status === "approved" || product.status === "Approved"
  );

  // Check if user has approved products before creating application
  const handleNewApplication = () => {
    if (!productsLoading) {
      if (approvedProducts.length === 0) {
        toast.error("You need to have an approved product before submitting an application");
        navigate("/products");
        return;
      }
    }
    setShowApplicationForm(true);
    setShowRenewalForm(false);
  };

  const handleRenewApplication = () => {
    if (!productsLoading) {
      if (approvedProducts.length === 0) {
        toast.error("You need to have an approved product before renewing an application");
        navigate("/products");
        return;
      }
    }
    
    if (applications.filter(app => app.status === "Approved" || app.status === "Certified").length === 0) {
      toast.error("No eligible applications found for renewal");
      return;
    }
    
    setShowRenewalForm(true);
    setShowApplicationForm(false);
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

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
        toast.error("Failed to load applications. Invalid data format.");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch applications";
      toast.error(errorMessage);
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
    fetchApplications();
    fetchProducts();
  }, []);

  const filteredApplications = applications.filter(app =>
    app.applicationNumber?.toLowerCase().includes(searchNumber.toLowerCase()) &&
    (searchDate ? app.createdAt?.includes(searchDate) : true)
  );

  const handleCloseForm = () => {
    setShowApplicationForm(false);
    setShowRenewalForm(false);
    setFormData({
      category: "",
      product: "",
      description: "",
      requestedDate: new Date().toISOString().split("T")[0],
      hasAppliedBefore: "",
      previousHalalAgency: "",
      hasBeenSupervisedBefore: "",
      supervisingHalalAgency: "",
      foodSafetyPrograms: [],
      otherFoodSafetyProgram: ""
    });
    setRenewalData({
      existingApplication: "",
      renewalDate: new Date().toISOString().split("T")[0],
      reason: "",
      attachments: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Special handler for radio buttons
  const handleRadioChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handler for checkbox selection (food safety programs)
  const handleFoodSafetyProgramChange = (program) => {
    setFormData(prev => {
      const isSelected = prev.foodSafetyPrograms.includes(program);
      let updatedPrograms;
      
      if (isSelected) {
        updatedPrograms = prev.foodSafetyPrograms.filter(p => p !== program);
        // If "Other" is deselected, clear the other field
        if (program === "Other") {
          return {
            ...prev,
            foodSafetyPrograms: updatedPrograms,
            otherFoodSafetyProgram: ""
          };
        }
      } else {
        updatedPrograms = [...prev.foodSafetyPrograms, program];
      }
      
      return {
        ...prev,
        foodSafetyPrograms: updatedPrograms
      };
    });
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
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    if (approvedProducts.length === 0) {
      toast.error("You need to have an approved product before submitting an application");
      navigate("/products");
      handleCloseForm();
      return;
    }

    // Validate food safety programs
    if (formData.foodSafetyPrograms.length === 0) {
      toast.error("Please select at least one food safety program");
      return;
    }

    // Validate "Other" field if selected
    if (formData.foodSafetyPrograms.includes("Other") && !formData.otherFoodSafetyProgram.trim()) {
      toast.error("Please specify the 'Other' food safety program");
      return;
    }

    // Check if selected product is approved
    const selectedProduct = approvedProducts.find(p => p.name === formData.product);
    if (!selectedProduct) {
      toast.error("Selected product must be approved");
      return;
    }

    try {
      setLoading(true);

      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      // Prepare application data - regular JSON, not FormData
      const applicationData = {
        ...formData,
        foodSafetyPrograms: formData.foodSafetyPrograms.join(','), // Convert array to string
        companyId: user.registrationNo,
        status: "Submitted",
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
        toast.success("Application submitted successfully!");
        fetchApplications();
        
        setTimeout(() => {
          handleCloseForm();
        }, 2000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit application";
      toast.error(errorMessage);
      console.error("Error submitting application:", err);
      handleCloseForm();
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.registrationNo) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    if (approvedProducts.length === 0) {
      toast.error("You need to have an approved product before renewing an application");
      navigate("/products");
      handleCloseForm();
      return;
    }

    try {
      setLoading(true);

      const selectedApp = applications.find(app => app._id === renewalData.existingApplication);
      
      if (!selectedApp) {
        throw new Error("Selected application not found");
      }

      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      // For renewal, we can keep the original food safety programs
      const renewalApplicationData = {
        category: "Renewal Application",
        product: selectedApp.product,
        description: `Renewal of ${selectedApp.applicationNumber}. Reason: ${renewalData.reason}`,
        requestedDate: renewalData.renewalDate,
        companyId: user.registrationNo,
        status: "Submitted",
        applicationNumber: `REN-${Date.now().toString().slice(-8)}`,
        originalApplicationId: selectedApp._id,
        // Include the Halal certification history from the original application
        hasAppliedBefore: selectedApp.hasAppliedBefore || "",
        previousHalalAgency: selectedApp.previousHalalAgency || "",
        hasBeenSupervisedBefore: selectedApp.hasBeenSupervisedBefore || "",
        supervisingHalalAgency: selectedApp.supervisingHalalAgency || "",
        // Include food safety programs from original application
        foodSafetyPrograms: selectedApp.foodSafetyPrograms || "",
        otherFoodSafetyProgram: selectedApp.otherFoodSafetyProgram || ""
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
        toast.success("Renewal application submitted successfully!");
        fetchApplications();
        
        setTimeout(() => {
          handleCloseForm();
        }, 2000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error submitting renewal:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit renewal application";
      toast.error(errorMessage);
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
                disabled={applications.filter(app => app.status === "Approved" || app.status === "Certified").length === 0 || productsLoading}
                title={applications.filter(app => app.status === "Approved" || app.status === "Certified").length === 0 ? "No eligible applications found for renewal" : ""}
              >
                <i className="fas fa-sync-alt"></i> Renew
              </button>
              
              {/* New Application Button with Tooltip */}
              <div className="tooltip-wrapper">
                <button 
                  className="new-btn" 
                  onClick={handleNewApplication}
                  disabled={productsLoading || approvedProducts.length === 0}
                >
                  <i className="fas fa-plus"></i> New Application
                </button>
                
                {/* Tooltip for disabled state */}
                {!productsLoading && approvedProducts.length === 0 && (
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <p>No approved products found.</p>
                      <p>Please get your products approved first.</p>
                      <button 
                        className="tooltip-link"
                        onClick={() => navigate("/products")}
                      >
                        Go to Products Page
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Loading tooltip */}
                {productsLoading && (
                  <div className="tooltip">
                    <div className="tooltip-content">
                      <p>Loading products...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

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
                    ) : approvedProducts.length > 0 ? (
                      approvedProducts.map((prod) => (
                        <option key={prod._id} value={prod.name}>{prod.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No approved products found. Please get your products approved first.</option>
                    )}
                  </select>
                  {approvedProducts.length === 0 && !productsLoading && (
                    <div className="error-message">
                      <p>You need to have an approved product before submitting an application.</p>
                      <button 
                        type="button" 
                        className="btn btn-link"
                        onClick={() => navigate("/products")}
                      >
                        Go to Products Page
                      </button>
                    </div>
                  )}
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

                {/* New Halal Certification History Section */}
                <div className="form-section">
                  <h4>Halal Certification History</h4>
                  
                  {/* Question 1 */}
                  <div className="form-group">
                    <label>
                      (1) Has the company ever applied for Halal certification previously? *
                    </label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="hasAppliedBefore"
                          value="yes"
                          checked={formData.hasAppliedBefore === "yes"}
                          onChange={() => handleRadioChange("hasAppliedBefore", "yes")}
                          disabled={loading}
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="hasAppliedBefore"
                          value="no"
                          checked={formData.hasAppliedBefore === "no"}
                          onChange={() => handleRadioChange("hasAppliedBefore", "no")}
                          disabled={loading}
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                    
                    {/* Conditional field for Question 1 */}
                    {formData.hasAppliedBefore === "yes" && (
                      <div className="conditional-field">
                        <label>If yes, please state the Halal agency that was previously applied to *</label>
                        <input
                          type="text"
                          name="previousHalalAgency"
                          value={formData.previousHalalAgency}
                          onChange={handleInputChange}
                          placeholder="Enter Halal agency name"
                          disabled={loading}
                          required={formData.hasAppliedBefore === "yes"}
                        />
                      </div>
                    )}
                  </div>

                  {/* Question 2 */}
                  <div className="form-group">
                    <label>
                      (2) Has the factory ever been supervised before, either on a yearly basis or for a specific batch production for another buyer? *
                    </label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="hasBeenSupervisedBefore"
                          value="yes"
                          checked={formData.hasBeenSupervisedBefore === "yes"}
                          onChange={() => handleRadioChange("hasBeenSupervisedBefore", "yes")}
                          disabled={loading}
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="hasBeenSupervisedBefore"
                          value="no"
                          checked={formData.hasBeenSupervisedBefore === "no"}
                          onChange={() => handleRadioChange("hasBeenSupervisedBefore", "no")}
                          disabled={loading}
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                    
                    {/* Conditional field for Question 2 */}
                    {formData.hasBeenSupervisedBefore === "yes" && (
                      <div className="conditional-field">
                        <label>If yes, please state the Halal agency that was certifying *</label>
                        <input
                          type="text"
                          name="supervisingHalalAgency"
                          value={formData.supervisingHalalAgency}
                          onChange={handleInputChange}
                          placeholder="Enter Halal agency name"
                          disabled={loading}
                          required={formData.hasBeenSupervisedBefore === "yes"}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* New Food Safety Programs Section */}
                <div className="form-section">
                  <h4>Food Safety Programs</h4>
                  
                  <div className="form-group">
                    <label>
                      Please state all food safety programs implemented at the factory *
                    </label>
                    
                    <div className="checkbox-group">
                      {foodSafetyProgramOptions.map((program) => (
                        <label key={program} className="checkbox-option">
                          <input
                            type="checkbox"
                            checked={formData.foodSafetyPrograms.includes(program)}
                            onChange={() => handleFoodSafetyProgramChange(program)}
                            disabled={loading}
                          />
                          <span>{program}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Conditional field for "Other" */}
                    {formData.foodSafetyPrograms.includes("Other") && (
                      <div className="conditional-field">
                        <label>Please specify other food safety program *</label>
                        <input
                          type="text"
                          name="otherFoodSafetyProgram"
                          value={formData.otherFoodSafetyProgram}
                          onChange={handleInputChange}
                          placeholder="Specify other food safety program"
                          disabled={loading}
                          required={formData.foodSafetyPrograms.includes("Other")}
                        />
                      </div>
                    )}
                  </div>
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
                    disabled={loading || !formData.category || !formData.product || approvedProducts.length === 0 || !formData.hasAppliedBefore || !formData.hasBeenSupervisedBefore || formData.foodSafetyPrograms.length === 0}
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