import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./css/Product.css";
import axios from "axios";
import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import { MdOutlineDeleteForever } from "react-icons/md";

const Product = () => {
  const [showProductForm, setShowProductForm] = useState(false);
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

  const toggleProductForm = () => setShowProductForm(prev => !prev);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleRadioChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user selects an option
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
    // Clear error when user selects at least one market
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

  const deleteProductFromList = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await deleteProduct(id);
    fetchProducts();
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

          <div className="product-content">
            <h3 className="product-count">All Products ({products.length})</h3>

            <div className="product-table-container">
              {isLoading ? (
                <div className="loading-state">
                  <p>Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <p>No products found. Add your first product!</p>
                </div>
              ) : (
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
                    {products.map((p, index) => (
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
                          <button 
                            className="delete-btn"
                            onClick={() => deleteProductFromList(p._id)}
                            title="Delete product"
                          >
                            <MdOutlineDeleteForever />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL */}
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
    </div>
  );
};

export default Product;