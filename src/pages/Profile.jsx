import { useState, useEffect } from "react";
import "./css/Profile.css";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, fetchUser } = useAuth();

  const [formData, setFormData] = useState({
    companyName: "",
    fullName: "",
    email: "",
    companyContact: "",
    contact: "",
    country: "",
    registrationNo: "",
    address: "",
    lga: "",
    city: "",
    state: "",
    website: "",
    department: "",
    position: "",
    authImage: ""
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName || "",
        fullName: user.fullName || "",
        email: user.email || "",
        companyContact: user.companyContact || "",
        contact: user.contact || "",
        country: user.country || "",
        registrationNo: user.registrationNo || "",
        address: user.address || "",
        lga: user.lga || "",
        city: user.city || "",
        state: user.state || "",
        website: user.website || "",
        department: user.department || "",
        position: user.position || "company",
        authImage: user.authImage || ""
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original user data
    if (user) {
      setFormData({
        companyName: user.companyName || "",
        fullName: user.fullName || "",
        email: user.email || "",
        companyContact: user.companyContact || "",
        contact: user.contact || "",
        country: user.country || "",
        registrationNo: user.registrationNo || "",
        address: user.address || "",
        lga: user.lga || "",
        city: user.city || "",
        state: user.state || "",
        website: user.website || "",
        department: user.department || "",
        position: user.position || "company",
        authImage: user.authImage || ""
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    try {
      setSaving(true);

      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      // Remove fields that should not be updated
      const updateData = { ...formData };
      delete updateData.registrationNo; // Cannot edit registration number
      delete updateData.email; // Cannot edit email
      delete updateData.position; // Cannot edit position
      delete updateData.authImage; // Handle file uploads separately if needed
      
      const response = await axios.put(
        `${API_BASE_URL}/users/${user.id}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        toast.success("Profile updated successfully!");
        fetchUser(); // Refresh user data
        setIsEditing(false);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update profile";
      toast.error(errorMessage);
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const departments = [
    "Administration",
    "Finance",
    "Human Resources",
    "Operations",
    "Production",
    "Quality Assurance",
    "Research & Development",
    "Sales & Marketing",
    "Supply Chain",
    "Technical",
    "Other"
  ];

  const positions = [
    "CEO/Director",
    "Manager",
    "Supervisor",
    "Officer",
    "Executive",
    "Technician",
    "Other"
  ];

  if (loading) {
    return (
      <div className="dash">
        <Sidebar />
        <main className="content">
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Loading profile...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash">
      <Sidebar activeProfile="active" />
      <main className="content">
        <div className="profile-container">
          <div className="profile-header">
            <h2>Company Profile</h2>
            <div className="profile-actions">
              {!isEditing ? (
                <button 
                  className="btn-edit"
                  onClick={handleEdit}
                >
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="btn-cancel"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-save"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-content">
            <form onSubmit={handleSubmit}>
              {/* Company Information Section */}
              <div className="profile-section">
                <h3>Company Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Registration Number *</label>
                    <input
                      type="text"
                      name="registrationNo"
                      value={formData.registrationNo}
                      onChange={handleInputChange}
                      disabled={true} // Always disabled - cannot edit
                      readOnly
                      className="read-only-field"
                    />
                    <small className="field-note">This field cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={true} // Always disabled - cannot edit
                      readOnly
                      className="read-only-field"
                    />
                    <small className="field-note">This field cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label>Company Contact</label>
                    <input
                      type="tel"
                      name="companyContact"
                      value={formData.companyContact}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Company phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person Information */}
              <div className="profile-section">
                <h3>Contact Person Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      placeholder="Contact person full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Person Phone</label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Contact person phone"
                    />
                  </div>

                  <div className="form-group">
                    <label>Position *</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      disabled={true} // Cannot edit position
                      readOnly
                      className="read-only-field"
                    />
                    <small className="field-note">Default: Company</small>
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, i) => (
                        <option key={i} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="profile-section">
                <h3>Address Information</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Full company address"
                    />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="City"
                    />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="State/Province"
                    />
                  </div>

                  <div className="form-group">
                    <label>LGA (Local Government Area)</label>
                    <input
                      type="text"
                      name="lga"
                      value={formData.lga}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Local Government Area"
                    />
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Authentication Image (Read-only) */}
              {formData.authImage && (
                <div className="profile-section">
                  <h3>Authentication Document</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Uploaded Document</label>
                      <div className="file-preview">
                        {formData.authImage.toLowerCase().endsWith('.pdf') ? (
                          <div className="pdf-preview">
                            <i className="fas fa-file-pdf"></i>
                            <span>Authorization Document.pdf</span>
                          </div>
                        ) : (
                          <div className="image-preview">
                            <img 
                              src={`${API_BASE_URL}/${formData.authImage}`} 
                              alt="Authorization document" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<i className="fas fa-file-image"></i><span>Authorization Document</span>';
                              }}
                            />
                          </div>
                        )}
                        <small className="field-note">Uploaded during registration</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;