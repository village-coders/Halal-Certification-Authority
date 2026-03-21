import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import "./css/Product.css";
import axios from "axios";
import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import { MdOutlineDeleteForever, MdOutlineRemoveRedEye } from "react-icons/md";


const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Product = () => {
  const [applications, setApplications] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'requested', 'approved'
  const [formData, setFormData] = useState({
    name: "",
    applicationId: "",
    note: "",
  });

  const [errors, setErrors] = useState({});
  const { products, isLoading, fetchProducts, deleteProduct, setIsLoading } = useProducts();
  const baseUrl = import.meta.env.VITE_BASE_URL;
  useEffect(() => {
    fetchProducts();
    fetchApplications();
  }, []);
  // Filter products based on status
  const requestedProducts = products.filter(product => product.status === "pending" || product.status === "requested");
  const approvedProducts = products.filter(product => product.status === "approved");


  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);

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
      setIsLoading(false);
    }
  }, []);
  
  // Get products for current tab
  const getFilteredProducts = () => {
    switch(activeTab) {
      case "requested": return requestedProducts;
      case "approved": return approvedProducts;
      default: return products;
    }
  };

  const toggleProductForm = () => setShowProductForm(prev => !prev);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };


  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.applicationId) newErrors.applicationId = "Application ID is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const res = await axios.post(`${baseUrl}/products`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "success") {
        toast.success(res.data.message);
        setShowProductForm(false);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      applicationId: "",
    });
    setErrors({});
  };

  const deleteProductFromList = async (id, status) => {
    if (status === 'approved') {
      toast.error("Approved products cannot be deleted");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await deleteProduct(id);
      fetchProducts();
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const viewProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };



  return (
    <div className="dash">
      <Sidebar activeP="active" />
      <main className="content cert">
        <div className="manage-applications">
          <div className="header">
            <h2>Products</h2>
            <div className="header-actions">
              <button className="new-btn" onClick={toggleProductForm}>
                <i className="fas fa-plus-circle"></i> Request Product
              </button>
            </div>
          </div>

          {/* Tab Navigation as Search Box */}
          <div className="search-box" style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="search-btn"
              onClick={() => setActiveTab('all')}
              style={{ background: activeTab === 'all' ? 'var(--primary-dark)' : 'var(--primary)' }}
            >
              All Products ({products.length})
            </button>
            <button 
              className="search-btn"
              onClick={() => setActiveTab('requested')}
              style={{ background: activeTab === 'requested' ? 'var(--primary-dark)' : 'var(--primary)' }}
            >
              Requested ({requestedProducts.length})
            </button>
            <button 
              className="search-btn"
              onClick={() => setActiveTab('approved')}
              style={{ background: activeTab === 'approved' ? 'var(--primary-dark)' : 'var(--primary)' }}
            >
              Approved ({approvedProducts.length})
            </button>
          </div>

          <div className="table-wrapper">
            <div className="table-header">
              <h3>
                {activeTab === 'all' && `All Products (${products.length})`}
                {activeTab === 'requested' && `Requested Products (${requestedProducts.length})`}
                {activeTab === 'approved' && `Approved Products (${approvedProducts.length})`}
              </h3>
              <div className="table-actions">
                <button 
                  className="action-btn" 
                  onClick={fetchProducts}
                  disabled={isLoading}
                >
                  <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading products...
              </div>
            ) : getFilteredProducts().length === 0 ? (
              <div className="no-data-message" style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-box" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}></i>
                <h3>No Products Found</h3>
                <p>
                  {activeTab === 'all' && "No products found. Add your first product!"}
                  {activeTab === 'requested' && "No requested products found."}
                  {activeTab === 'approved' && "No approved products found."}
                </p>
              </div>
            ) : (
              <>
                {/* Show all products when 'all' tab is active */}
                {activeTab === 'all' ? (
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Application Number</th>
                        <th>Note</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, index) => (
                        <tr key={p._id}>
                          <td>{index + 1}</td>
                          <td style={{ fontWeight: 500 }}>{p.name}</td>
                          <td><span className="app-number">{p?.applicationId?.applicationNumber}</span></td>
                          <td>{p.note}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="view-btn"
                                onClick={() => viewProductDetails(p)}
                                title="View product details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button 
                                className="view-btn"
                                style={{ color: p.status === 'approved' ? 'var(--gray)' : 'var(--danger)', borderColor: p.status === 'approved' ? 'var(--gray-border)' : 'var(--danger)' }}
                                onClick={() => deleteProductFromList(p._id, p.status)}
                                title={p.status === 'approved' ? 'Approved products cannot be deleted' : 'Delete product'}
                                disabled={p.status === 'approved'}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // Show separate tables for requested and approved
                  <>
                    {/* Requested Products Table */}
                    {activeTab === 'requested' && requestedProducts.length > 0 && (
                      <table className="applications-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Market Type</th>
                            <th>Brand</th>
                            <th>Pork</th>
                            <th>Alcohol</th>
                            <th>Markets</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestedProducts.map((p, index) => (
                            <tr key={p._id}>
                              <td>{index + 1}</td>
                              <td style={{ fontWeight: 500 }}>{p.name}</td>
                              <td>{p.marketType}</td>
                              <td>{p.brandOwnership}</td>
                              <td>
                                <span className={`status-badge`} style={{ backgroundColor: p.porkDerivative ? '#fee2e2' : '#d1fae5', color: p.porkDerivative ? '#991b1b' : '#065f46' }}>
                                  {p.porkDerivative ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge`} style={{ backgroundColor: p.alcohol ? '#fee2e2' : '#d1fae5', color: p.alcohol ? '#991b1b' : '#065f46' }}>
                                  {p.alcohol ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>
                                {p.markets?.slice(0, 2).join(", ")}
                                {p.markets?.length > 2 && "..."}
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    className="view-btn"
                                    onClick={() => viewProductDetails(p)}
                                    title="View product details"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  <button 
                                    className="view-btn"
                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                    onClick={() => deleteProductFromList(p._id, p.status)}
                                    title="Delete product"
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Approved Products Table */}
                    {activeTab === 'approved' && approvedProducts.length > 0 && (
                      <table className="applications-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Market Type</th>
                            <th>Brand</th>
                            <th>Pork</th>
                            <th>Alcohol</th>
                            <th>Markets</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedProducts.map((p, index) => (
                            <tr key={p._id}>
                              <td>{index + 1}</td>
                              <td style={{ fontWeight: 500 }}>{p.name}</td>
                              <td>{p.marketType}</td>
                              <td>{p.brandOwnership}</td>
                              <td>
                                <span className={`status-badge`} style={{ backgroundColor: p.porkDerivative ? '#fee2e2' : '#d1fae5', color: p.porkDerivative ? '#991b1b' : '#065f46' }}>
                                  {p.porkDerivative ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge`} style={{ backgroundColor: p.alcohol ? '#fee2e2' : '#d1fae5', color: p.alcohol ? '#991b1b' : '#065f46' }}>
                                  {p.alcohol ? "Yes" : "No"}
                                </span>
                              </td>
                              <td>
                                {p.markets?.slice(0, 2).join(", ")}
                                {p.markets?.length > 2 && "..."}
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    className="view-btn"
                                    onClick={() => viewProductDetails(p)}
                                    title="View product details"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  <button 
                                    className="view-btn"
                                    style={{ color: 'var(--gray)', borderColor: 'var(--gray-border)' }}
                                    title="Approved products cannot be deleted"
                                    disabled
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showProductForm && (
        <div className="modal modal-large" onClick={toggleProductForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request New Product</h2>
              <button className="close-modal" onClick={toggleProductForm}>×</button>
            </div>

            <form className="product-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Product Name *
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Enter product name"
                  />
                </label>
                {errors.name && <p className="error-message">{errors.name}</p>}
              </div>

              <div className="form-group-geo">
                <label>
                  Application *
                  <select 
                    name="applicationId"
                    value={formData.applicationId}
                    onChange={handleChange}
                    className={errors.applicationId ? 'error' : ''}
                  >
                    {applications.length > 0 ?  <option value="">Select Application</option> : <option value="">No Application Found</option>}

                    {applications.map(app => (
                      <option key={app._id} value={app._id}>
                        {app.applicationNumber}
                      </option>
                    ))}
                  </select>
                </label>

                {errors.applicationId && (
                  <p className="error-message">{errors.applicationId}</p>
                )}
              </div>

              <div className="form-group-geo">
                <label>
                  Note
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    className={errors.note ? 'error' : ''}
                  ></textarea>
                </label>

                {errors.note && (
                  <p className="error-message">{errors.note}</p>
                )}
              </div>



              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={toggleProductForm}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="modal modal-large" onClick={() => setShowProductDetails(false)}>
          <div className="modal-content product-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="close-modal" onClick={() => setShowProductDetails(false)}>×</button>
            </div>

            <div className="product-details-content">
              <div className="details-section">
                <h3 className="details-title">Basic Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Product Name:</span>
                    <span className="detail-value">{selectedProduct.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Product Name:</span>
                    <span className="detail-value">{selectedProduct.applicationId.applicationNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Note :</span>
                    <span className="detail-value">{selectedProduct.note}</span>
                  </div>
                  
                </div>
              </div>


              <div className="modal-actions">
                <button 
                  className="close-details-btn" 
                  onClick={() => setShowProductDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;