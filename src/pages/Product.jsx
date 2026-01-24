import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./css/Product.css";
import axios from "axios";
import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import { MdOutlineDeleteForever, MdOutlineRemoveRedEye } from "react-icons/md";

const Product = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'requested', 'approved'
  const [formData, setFormData] = useState({
    name: "",
    marketType: "",
    industry: "",
    brandOwnership: "",
    porkDerivative: null,
    animalDerivative: null,
    gelatin: null,
    alcohol: null,
    alcoholInAdditives: null,
    glycerine: null,
    markets: []
  });

  const [errors, setErrors] = useState({});
  const { products, isLoading, fetchProducts, deleteProduct } = useProducts();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Filter products based on status
  const requestedProducts = products.filter(product => product.status === "pending" || product.status === "requested");
  const approvedProducts = products.filter(product => product.status === "approved");
  
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

  const handleRadioChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (value) => {
    setFormData(prev => ({
      ...prev,
      markets: prev.markets.includes(value)
        ? prev.markets.filter(v => v !== value)
        : [...prev.markets, value]
    }));
    if (errors.markets && formData.markets.length >= 0) {
      setErrors(prev => ({ ...prev, markets: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.marketType) newErrors.marketType = "Market type is required";
    if (!formData.brandOwnership) newErrors.brandOwnership = "Brand ownership is required";
    if (formData.porkDerivative === null) newErrors.porkDerivative = "Pork derivative is required";
    if (formData.animalDerivative === null) newErrors.animalDerivative = "Animal derivative is required";
    if (formData.gelatin === null) newErrors.gelatin = "Gelatin is required";
    if (formData.alcohol === null) newErrors.alcohol = "Alcohol is required";
    if (formData.alcoholInAdditives === null) newErrors.alcoholInAdditives = "Alcohol in additives is required";
    if (formData.glycerine === null) newErrors.glycerine = "Glycerine is required";
    if (formData.markets.length === 0) newErrors.markets = "At least one market is required";
    
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
      marketType: "",
      industry: "",
      brandOwnership: "",
      porkDerivative: null,
      animalDerivative: null,
      gelatin: null,
      alcohol: null,
      alcoholInAdditives: null,
      glycerine: null,
      markets: []
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

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="dash">
      <Sidebar activeP="active" />
      <main className="content">
        <div className="product-container">
          <div className="product-header">
            <h2>Products</h2>
            <button className="add-product-btn" onClick={toggleProductForm}>
              Request Product
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="product-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Products ({products.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'requested' ? 'active' : ''}`}
              onClick={() => setActiveTab('requested')}
            >
              Requested ({requestedProducts.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved ({approvedProducts.length})
            </button>
          </div>

          <div className="product-content">
            <h3 className="product-count">
              {activeTab === 'all' && `All Products (${products.length})`}
              {activeTab === 'requested' && `Requested Products (${requestedProducts.length})`}
              {activeTab === 'approved' && `Approved Products (${approvedProducts.length})`}
            </h3>

            <div className="product-table-container">
              {isLoading ? (
                <div className="loading-state">
                  <p>Loading products...</p>
                </div>
              ) : getFilteredProducts().length === 0 ? (
                <div className="empty-state">
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
                    <table className="product-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Market Type</th>
                          <th>Brand</th>
                          <th>Status</th>
                          <th>Pork</th>
                          <th>Alcohol</th>
                          <th>Markets</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, index) => (
                          <tr key={p._id}>
                            <td className="index-cell">{index + 1}</td>
                            <td className="name-cell">{p.name}</td>
                            <td>{p.marketType}</td>
                            <td>{p.brandOwnership}</td>
                            <td>
                              <span className={`status-badge ${p.status === 'approved' ? 'approved' : 'pending'}`}>
                                {p.status === 'approved' ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${p.porkDerivative ? 'yes' : 'no'}`}>
                                {p.porkDerivative ? "Yes" : "No"}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${p.alcohol ? 'yes' : 'no'}`}>
                                {p.alcohol ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="markets-cell">
                              {p.markets?.slice(0, 2).join(", ")}
                              {p.markets?.length > 2 && "..."}
                            </td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                <button 
                                  className="view-btn"
                                  onClick={() => viewProductDetails(p)}
                                  title="View product details"
                                >
                                  <MdOutlineRemoveRedEye />
                                </button>
                                <button 
                                  className={`delete-btn ${p.status === 'approved' ? 'disabled' : ''}`}
                                  onClick={() => deleteProductFromList(p._id, p.status)}
                                  title={p.status === 'approved' ? 'Approved products cannot be deleted' : 'Delete product'}
                                  disabled={p.status === 'approved'}
                                >
                                  <MdOutlineDeleteForever />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    // Show separate tables for requested and approved
                    <div className="products-section">
                      {/* Requested Products Table */}
                      {activeTab === 'requested' && requestedProducts.length > 0 && (
                        <div className="table-section">
                          <table className="product-table">
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
                                  <td className="index-cell">{index + 1}</td>
                                  <td className="name-cell">{p.name}</td>
                                  <td>{p.marketType}</td>
                                  <td>{p.brandOwnership}</td>
                                  <td>
                                    <span className={`status-badge ${p.porkDerivative ? 'yes' : 'no'}`}>
                                      {p.porkDerivative ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`status-badge ${p.alcohol ? 'yes' : 'no'}`}>
                                      {p.alcohol ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="markets-cell">
                                    {p.markets?.slice(0, 2).join(", ")}
                                    {p.markets?.length > 2 && "..."}
                                  </td>
                                  <td className="actions-cell">
                                    <div className="action-buttons">
                                      <button 
                                        className="view-btn"
                                        onClick={() => viewProductDetails(p)}
                                        title="View product details"
                                      >
                                        <MdOutlineRemoveRedEye />
                                      </button>
                                      <button 
                                        className="delete-btn"
                                        onClick={() => deleteProductFromList(p._id, p.status)}
                                        title="Delete product"
                                      >
                                        <MdOutlineDeleteForever />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Approved Products Table */}
                      {activeTab === 'approved' && approvedProducts.length > 0 && (
                        <div className="table-section">
                          <table className="product-table">
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
                                  <td className="index-cell">{index + 1}</td>
                                  <td className="name-cell">{p.name}</td>
                                  <td>{p.marketType}</td>
                                  <td>{p.brandOwnership}</td>
                                  <td>
                                    <span className={`status-badge ${p.porkDerivative ? 'yes' : 'no'}`}>
                                      {p.porkDerivative ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`status-badge ${p.alcohol ? 'yes' : 'no'}`}>
                                      {p.alcohol ? "Yes" : "No"}
                                    </span>
                                  </td>
                                  <td className="markets-cell">
                                    {p.markets?.slice(0, 2).join(", ")}
                                    {p.markets?.length > 2 && "..."}
                                  </td>
                                  <td className="actions-cell">
                                    <div className="action-buttons">
                                      <button 
                                        className="view-btn"
                                        onClick={() => viewProductDetails(p)}
                                        title="View product details"
                                      >
                                        <MdOutlineRemoveRedEye />
                                      </button>
                                      <button 
                                        className="delete-btn disabled"
                                        title="Approved products cannot be deleted"
                                        disabled
                                      >
                                        <MdOutlineDeleteForever />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showProductForm && (
        <div className="modal-overlay" onClick={toggleProductForm}>
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
                  Market Type *
                  <select 
                    name="marketType" 
                    value={formData.marketType} 
                    onChange={handleChange}
                    className={errors.marketType ? 'error' : ''}
                  >
                    <option value="">Select market type</option>
                    <option value="Food Service (Bulk)">Food Service (Bulk)</option>
                    <option value="Retail">Retail</option>
                    <option value="Direct Marketing">Direct Marketing</option>
                  </select>
                </label>
                {errors.marketType && <p className="error-message">{errors.marketType}</p>}
              </div>

              <div className="form-group-geo">
                <label className="form-label">Brand Ownership *</label>
                <div className="radio-group">
                  {["Owned", "Private Label"].map(v => (
                    <label key={v} className="radio-option">
                      <input
                        type="radio"
                        name="brandOwnership"
                        checked={formData.brandOwnership === v}
                        onChange={() => handleRadioChange("brandOwnership", v)}
                      />
                      <span className="radio-label">{v}</span>
                    </label>
                  ))}
                </div>
                {errors.brandOwnership && <p className="error-message">{errors.brandOwnership}</p>}
              </div>

              {[
                ["porkDerivative", "Uses pork or derivatives? *"],
                ["animalDerivative", "Uses animal derivatives? *"],
                ["gelatin", "Uses gelatin or capsules? *"],
                ["alcohol", "Contains alcohol? *"],
                ["alcoholInAdditives", "Additives contain alcohol? *"],
                ["glycerine", "Uses glycerine or derivatives? *"]
              ].map(([key, label]) => (
                <div className="form-group-geo" key={key}>
                  <label className="form-label">{label}</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        checked={formData[key] === true}
                        onChange={() => handleRadioChange(key, true)}
                      />
                      <span className="radio-label">Yes</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        checked={formData[key] === false}
                        onChange={() => handleRadioChange(key, false)}
                      />
                      <span className="radio-label">No</span>
                    </label>
                  </div>
                  {errors[key] && <p className="error-message">{errors[key]}</p>}
                </div>
              ))}

              <div className="form-group-geo">
                <label className="form-label">Geographic Markets *</label>
                <div className="checkbox-grid">
                  {[
                    "Within Nigeria",
                    "North Africa",
                    "West Africa",
                    "Europe",
                    "Gulf Countries",
                    "Asia",
                    "United States",
                    "Worldwide",
                    "Other"
                  ].map(area => (
                    <label key={area} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={formData.markets.includes(area)}
                        onChange={() => handleCheckboxChange(area)}
                      />
                      <span className="checkbox-label">{area}</span>
                    </label>
                  ))}
                </div>
                {errors.markets && <p className="error-message">{errors.markets}</p>}
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
        <div className="modal-overlay" onClick={() => setShowProductDetails(false)}>
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
                    <span className="detail-label">Market Type:</span>
                    <span className="detail-value">{selectedProduct.marketType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Brand Ownership:</span>
                    <span className="detail-value">{selectedProduct.brandOwnership}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-badge ${selectedProduct.status === 'approved' ? 'approved' : 'pending'}`}>
                      {selectedProduct.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3 className="details-title">Product Composition</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Pork or Derivatives:</span>
                    <span className={`detail-value ${selectedProduct.porkDerivative ? 'yes' : 'no'}`}>
                      {selectedProduct.porkDerivative ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Animal Derivatives:</span>
                    <span className={`detail-value ${selectedProduct.animalDerivative ? 'yes' : 'no'}`}>
                      {selectedProduct.animalDerivative ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gelatin or Capsules:</span>
                    <span className={`detail-value ${selectedProduct.gelatin ? 'yes' : 'no'}`}>
                      {selectedProduct.gelatin ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contains Alcohol:</span>
                    <span className={`detail-value ${selectedProduct.alcohol ? 'yes' : 'no'}`}>
                      {selectedProduct.alcohol ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Alcohol in Additives:</span>
                    <span className={`detail-value ${selectedProduct.alcoholInAdditives ? 'yes' : 'no'}`}>
                      {selectedProduct.alcoholInAdditives ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Glycerine or Derivatives:</span>
                    <span className={`detail-value ${selectedProduct.glycerine ? 'yes' : 'no'}`}>
                      {selectedProduct.glycerine ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3 className="details-title">Geographic Markets</h3>
                <div className="markets-list">
                  {selectedProduct.markets && selectedProduct.markets.length > 0 ? (
                    <div className="markets-tags">
                      {selectedProduct.markets.map((market, index) => (
                        <span key={index} className="market-tag">{market}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-markets">No markets specified</p>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h3 className="details-title">Additional Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Created At:</span>
                    <span className="detail-value">
                      {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Updated At:</span>
                    <span className="detail-value">
                      {selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
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