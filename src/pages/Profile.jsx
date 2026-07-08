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

  // Change Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      await axios.put(
        `${API_BASE_URL}/auth/update-password/${user.id}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change password.";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
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
      <Sidebar activePro="active" />
      <main className="content">
        <div className="manage-applications">
          <div style={{padding: "0px 45px"}} className="header">
            <h2>Company Profile</h2>
            <div className="header-actions">
              {!isEditing ? (
                <button 
                  className="btn-edit action-btn"
                  onClick={handleEdit}
                  style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#374151' }}
                >
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              ) : (
                <div className="edit-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-cancel action-btn"
                    onClick={handleCancel}
                    disabled={saving}
                    style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-save action-btn"
                    onClick={handleSubmit}
                    disabled={saving}
                    style={{ background: 'var(--primary-color)', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}
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

                  {
                    user.isUnderCompany && (
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
                    )
                  }
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

            {/* ── Change Password Section ── */}
            <div className="change-password-section">
              <button
                id="toggle-change-password"
                className="change-password-toggle"
                onClick={() => setShowPasswordSection((v) => !v)}
              >
                <span>
                  <i className="fas fa-lock"></i> Change Password
                </span>
                <i className={`fas fa-chevron-${showPasswordSection ? "up" : "down"}`}></i>
              </button>

              {showPasswordSection && (
                <form
                  id="change-password-form"
                  className="change-password-form"
                  onSubmit={handleChangePassword}
                >
                  <div className="cp-field-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="cp-input-wrap">
                      <input
                        id="currentPassword"
                        type={showCurrentPwd ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="cp-eye-btn"
                        onClick={() => setShowCurrentPwd((v) => !v)}
                        aria-label="Toggle current password visibility"
                      >
                        <i className={`fas fa-eye${showCurrentPwd ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="cp-field-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="cp-input-wrap">
                      <input
                        id="newPassword"
                        type={showNewPwd ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="cp-eye-btn"
                        onClick={() => setShowNewPwd((v) => !v)}
                        aria-label="Toggle new password visibility"
                      >
                        <i className={`fas fa-eye${showNewPwd ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    {passwordData.newPassword && passwordData.newPassword.length < 8 && (
                      <small className="cp-hint error">Must be at least 8 characters</small>
                    )}
                  </div>

                  <div className="cp-field-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="cp-input-wrap">
                      <input
                        id="confirmPassword"
                        type={showConfirmPwd ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="cp-eye-btn"
                        onClick={() => setShowConfirmPwd((v) => !v)}
                        aria-label="Toggle confirm password visibility"
                      >
                        <i className={`fas fa-eye${showConfirmPwd ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    {passwordData.confirmPassword &&
                      passwordData.newPassword !== passwordData.confirmPassword && (
                        <small className="cp-hint error">Passwords do not match</small>
                      )}
                    {passwordData.confirmPassword &&
                      passwordData.newPassword === passwordData.confirmPassword &&
                      passwordData.newPassword.length >= 8 && (
                        <small className="cp-hint success">Passwords match ✓</small>
                      )}
                  </div>

                  <div className="cp-actions">
                    <button
                      type="button"
                      className="cp-btn-cancel"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                      disabled={changingPassword}
                    >
                      Cancel
                    </button>
                    <button
                      id="submit-change-password"
                      type="submit"
                      className="cp-btn-save"
                      disabled={changingPassword}
                    >
                      {changingPassword ? (
                        <><i className="fas fa-spinner fa-spin"></i> Updating...</>
                      ) : (
                        <><i className="fas fa-shield-alt"></i> Update Password</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;