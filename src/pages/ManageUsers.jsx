import { useState, useEffect, useMemo } from "react";
import "./css/ManageUsers.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "sonner";
import { MdOutlineDeleteForever, MdOutlineEdit } from "react-icons/md";
import { FaEye, FaCheck, FaTimes } from "react-icons/fa";
import * as XLSX from "xlsx"; // For Excel export

function ManageUsers() {
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "company", // Default role
    department: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  
  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Fetch current user and all users on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch users when currentUser is available
  useEffect(() => {
    if (currentUser?.registrationNo) {
      fetchUsers();
    }
  }, [currentUser]);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.department?.toLowerCase().includes(term) ||
        user._id?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // Decode token to get user ID
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.id; // Adjust based on your token structure

      const response = await axios.get(`${baseUrl}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      toast.error("Failed to load user data");
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const companyId = currentUser?.registrationNo; // Get company ID from current user
      
      if (!companyId) {
        toast.error("Company ID not found");
        return;
      }

      const response = await axios.get(`${baseUrl}/users?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === "success") {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users); // Initialize filtered users
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if(editingUser){
        if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
    }else{
        if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
        if (!formData.password?.trim()) newErrors.password = "Password is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.department?.trim()) newErrors.department = "Department is required";
    
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
      const endpoint = editingUser
        ? `${baseUrl}/users/${editingUser._id}`
        : `${baseUrl}/users`;
      
      const method = editingUser ? 'put' : 'post';
      
      // Add company ID to form data for new users
      const userData = {
        ...formData,
        companyId: currentUser?.registrationNo, // Add company ID
        role: "company" // Always set role to "company"
      };

      const response = await axios[method](endpoint, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        toast.success(editingUser ? "User updated successfully" : "User added successfully");
        resetForm();
        fetchUsers(); // Refresh the users list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      role: "company", // Reset to default
      department: "",
      password: ""
    });
    setErrors({});
    setEditingUser(null);
    setShowAddUserForm(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role || "company", // Use existing role or default
      department: user.department,
    });
    setShowAddUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.delete(`${baseUrl}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
      console.error(error);
    }
  };

  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const dataToExport = filteredUsers.map(user => ({
        "Full Name": user.fullName || "",
        "Email": user.email || "",
        "Role": user.role || "company",
        "Department": user.department || "",
        "User ID": user._id || "",
        "Created Date": user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
        "Last Updated": user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : ""
      }));

      // Create CSV content
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${dataToExport.length} users exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = () => {
    setExportLoading(true);
    try {
      const dataToExport = filteredUsers.map(user => ({
        "Full Name": user.fullName || "",
        "Email": user.email || "",
        "Role": user.role || "company",
        "Department": user.department || "",
        "User ID": user._id || "",
        "Created Date": user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
        "Last Updated": user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : ""
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Full Name
        { wch: 30 }, // Email
        { wch: 15 }, // Role
        { wch: 20 }, // Department
        { wch: 25 }, // User ID
        { wch: 15 }, // Created Date
        { wch: 15 }  // Last Updated
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      // Generate and download file
      XLSX.writeFile(workbook, `users_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`${dataToExport.length} users exported successfully`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export users');
    } finally {
      setExportLoading(false);
    }
  };

  const statsData = [
    { 
      title: "TOTAL USERS", 
      count: users.length, 
      icon: "fa-users", 
      color: "#4caf50" 
    },
    { 
      title: "ACTIVE NOW", 
      count: filteredUsers.length, 
      icon: "fa-user-check", 
      color: "#2196f3" 
    },
  ];

  return (
    <div className="dash manage-users-class">       
      <Sidebar activeUse="active" /> 
      <main className="content">
        <div className="manage-users-container">
          <DashboardHeader title="User Management" />
          
          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>  
            <div className="actions-grid">
              <div 
                className="action-card" 
                style={{ borderLeft: "4px solid #4caf50", cursor: "pointer" }}
                onClick={() => setShowAddUserForm(true)}
              >
                <div className="action-icon">
                  <i className="fas fa-user-plus" style={{ color: "#4caf50" }}></i>
                </div>
                <div className="action-content">
                  <h3>ADD NEW USER</h3>
                  <button className="action-btn">Add</button>
                </div>
              </div>
              
              <div 
                className="action-card" 
                style={{ borderLeft: "4px solid #2196f3", cursor: "pointer" }}
                onClick={exportToExcel}
              >
                <div className="action-icon">
                  <i className="fas fa-file-export" style={{ color: "#2196f3" }}></i>
                </div>
                <div className="action-content">
                  <h3>EXPORT USERS</h3>
                  <button className="action-btn" disabled={exportLoading}>
                    {exportLoading ? "Exporting..." : "Export"}
                  </button>
                </div>
              </div>

              <div 
                className="action-card" 
                style={{ borderLeft: "4px solid #ff9800", cursor: "pointer" }}
                onClick={exportToCSV}
              >
                <div className="action-icon">
                  <i className="fas fa-file-csv" style={{ color: "#ff9800" }}></i>
                </div>
                <div className="action-content">
                  <h3>EXPORT AS CSV</h3>
                  <button className="action-btn" disabled={exportLoading}>
                    {exportLoading ? "Exporting..." : "CSV"}
                  </button>
                </div>
              </div>
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

          {/* Users Table Section */}
          <div className="users-section">
            <div className="section-header">
              <h2>All Users ({users.length}) 
                {searchTerm && <span className="search-result"> - Found {filteredUsers.length} result(s)</span>}
              </h2>
              <div className="table-actions">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input 
                    type="text" 
                    placeholder="Search by name, email, department, or ID..." 
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchTerm("")}
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                <button className="filter-btn">
                  <i className="fas fa-filter"></i> Filter
                </button>
              </div>
            </div>

            <div className="section-content">
              <div className="table-container">
                {isLoading ? (
                  <div className="loading-state">
                    <p>Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>
                      {searchTerm 
                        ? `No users found for "${searchTerm}". Try a different search term.`
                        : "No users found. Add your first user!"}
                    </p>
                    {searchTerm && (
                      <button 
                        className="clear-search-btn"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Joined Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="user-name">
                            <div className="user-avatar">
                              {user.fullName?.[0] || "U"}
                            </div>
                            <div className="user-info">
                              <span className="full-name">
                                {user.fullName}
                                {searchTerm && user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) && (
                                  <span className="highlight-match"> (match)</span>
                                )}
                              </span>
                              <span className="user-id">ID: {user._id?.slice(-6)}</span>
                            </div>
                          </td>
                          <td>
                            {user.email}
                            {searchTerm && user.email?.toLowerCase().includes(searchTerm.toLowerCase()) && (
                              <span className="highlight-match"> ✓</span>
                            )}
                          </td>
                          <td>
                            <span className="role-badge company">
                              Company User
                            </span>
                          </td>
                          <td>
                            {user.department || "-"}
                            {searchTerm && user.department?.toLowerCase().includes(searchTerm.toLowerCase()) && (
                              <span className="highlight-match"> ✓</span>
                            )}
                          </td>

                          <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="action-btn view-btn"
                                title="View Details"
                                onClick={() => handleEditUser(user)}
                              >
                                <FaEye />
                              </button>
                              <button 
                                className="action-btn edit-btn"
                                title="Edit User"
                                onClick={() => handleEditUser(user)}
                              >
                                <MdOutlineEdit />
                              </button>

                              <button 
                                className="action-btn delete-btn"
                                title="Delete User"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                <MdOutlineDeleteForever />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit User Modal */}
      {showAddUserForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
              <button className="close-modal" onClick={resetForm}>×</button>
            </div>

            <form className="user-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Full Name *
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange}
                    className={errors.fullName ? 'error' : ''}
                    placeholder="Enter full name"
                  />
                </label>
                {errors.fullName && <p className="error-message">{errors.fullName}</p>}
              </div>

              <div className="form-group">
                <label>
                  Email *
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="Enter email address"
                    disabled={!!editingUser}
                  />
                </label>
                {errors.email && <p className="error-message">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label>
                  Password
                  <input 
                    type="text"
                    name="password"
                    value={formData.password}
                    className={errors.password ? 'error' : ''}
                    onChange={handleChange}
                    placeholder="Enter password"
                    disabled={editingUser}
                  />
                </label>
                {errors.password && <p className="error-message">{errors.password}</p>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Department *
                    <input 
                      type="text" 
                      name="department" 
                      value={formData.department} 
                      onChange={handleChange}
                      className={errors.department ? 'error' : ''}
                      placeholder="Enter department"
                    />
                  </label>
                  {errors.department && <p className="error-message">{errors.department}</p>}
                </div>

              </div>

              {!editingUser && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Send welcome email with login instructions</span>
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingUser ? "Update User" : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;