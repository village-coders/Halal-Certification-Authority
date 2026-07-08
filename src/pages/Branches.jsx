import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Branches.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "sonner";
import { MdAdd } from "react-icons/md";
import { FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

function Branches() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContinuePopup, setShowContinuePopup] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    branchName: "",
    address: "",
    lga: "",
    city: "",
    state: "",
    country: "Nigeria",
    contactName: "",
    contactNumber: "",
    positionTitle: "",
    webAddress: "",
    governmentPlantCode: ""
  });

  const [errors, setErrors] = useState({});
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (user) {
      fetchBranches();
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${baseUrl}/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success") {
        setBranches(response.data.branches);
      }
    } catch (error) {
      toast.error("Failed to fetch branches");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ["branchName", "address", "lga", "city", "state", "country", "contactName", "contactNumber"];
    
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = "This field is required";
      }
    });


    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const endpoint = `${baseUrl}/branches`;
      
      const response = await axios.post(endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        toast.success("Branch added successfully");
        resetForm();
        fetchBranches();
        setShowContinuePopup(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      branchName: "",
      address: "",
      lga: "",
      city: "",
      state: "",
      country: "Nigeria",
      contactName: "",
      contactNumber: "",
      positionTitle: "",
      webAddress: "",
      governmentPlantCode: ""
    });
    setErrors({});
    setShowModal(false);
  };



  return (
    <div className="dash branches-page">       
      <Sidebar activeBranches="active" /> 
      <main className="content">
        <div className="branches-container">
          <DashboardHeader title="Branch Management" />
          
          <div className="branches-header-actions">
            <div className="stats-mini">
              <div className="stat-item">
                <span className="stat-label">Total Branches:</span>
                <span className="stat-value">{branches.length}</span>
              </div>
            </div>
            <button className="add-branch-btn" onClick={() => setShowModal(true)}>
              <MdAdd /> Add New Branch
            </button>
          </div>

          <div className="branches-grid">
            {isLoading ? (
              <div className="loading-state">Loading branches...</div>
            ) : branches.length === 0 ? (
              <div className="empty-state">
                <FaBuilding size={48} />
                <p>No branches found. You must add at least one branch before you can apply for certification.</p>
                <button className="create-first-btn" onClick={() => setShowModal(true)}>Create Your First Branch</button>
              </div>
            ) : (
              branches.map((branch) => (
                <div key={branch._id} className="branch-card">
                  <div className="branch-card-header">
                    <h3>{branch.branchName}</h3>
                  </div>
                  <div className="branch-card-body">
                    <div className="info-row">
                      <FaMapMarkerAlt />
                      <span>{branch.address}, {branch.city}, {branch.state}</span>
                    </div>

                    <div className="info-row">
                      <FaPhone />
                      <span>{branch.contactNumber} ({branch.contactName})</span>
                    </div>
                  </div>
                  <div className="branch-card-footer">
                    <span className="branch-id">ID: {branch._id.slice(-6)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Branch</h2>
              <button className="close-modal" onClick={resetForm}>×</button>
            </div>

            <form className="branch-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-group">
                  <label>Branch Name *</label>
                  <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} className={errors.branchName ? 'error' : ''} placeholder="e.g. Lagos Factory" />
                  {errors.branchName && <p className="error-text">{errors.branchName}</p>}
                </div>

              </div>

              <div className="form-section">
                <h3>Location Details</h3>
                <div className="form-group">
                  <label>Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={errors.address ? 'error' : ''} />
                  {errors.address && <p className="error-text">{errors.address}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>LGA *</label>
                    <input type="text" name="lga" value={formData.lga} onChange={handleChange} className={errors.lga ? 'error' : ''} />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={errors.city ? 'error' : ''} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>State *</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} className={errors.state ? 'error' : ''} />
                  </div>
                  <div className="form-group">
                    <label>Country *</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} className={errors.country ? 'error' : ''} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Person</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className={errors.contactName ? 'error' : ''} />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className={errors.contactNumber ? 'error' : ''} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Position / Title</label>
                  <input type="text" name="positionTitle" value={formData.positionTitle} onChange={handleChange} />
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Info</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Web Address</label>
                    <input type="text" name="webAddress" value={formData.webAddress} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>Govt Plant Code</label>
                    <input type="text" name="governmentPlantCode" value={formData.governmentPlantCode} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                <button type="submit" className="submit-btn">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContinuePopup && (
        <div className="modal-overlay" onClick={() => setShowContinuePopup(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '24px', borderRadius: '12px' }}>
            <div style={{ fontSize: '48px', color: '#00853b', marginBottom: '16px' }}>✓</div>
            <h2 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>Branch Added!</h2>
            <p style={{ color: '#475569', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
              Would you like to continue to create a new application for this branch?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={() => setShowContinuePopup(false)} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1', 
                  background: 'white', 
                  color: '#475569', 
                  cursor: 'pointer', 
                  fontWeight: 500 
                }}
              >
                No, Stay Here
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowContinuePopup(false);
                  navigate('/applications');
                }} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: '#00853b', 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontWeight: 600 
                }}
              >
                Yes, Create Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Branches;
