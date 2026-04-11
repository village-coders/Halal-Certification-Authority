import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import TableActions from "../components/TableActions";
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
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, activeTab]);

  const [formData, setFormData] = useState({
    products: [{ name: "", document1: null, document2: null, document3: null }],
    applicationId: "",
    note: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

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
    let filtered = products;
    if (activeTab === 'requested') {
      filtered = requestedProducts;
    } else if (activeTab === 'approved') {
      filtered = approvedProducts;
    }
    
    if (searchName) {
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(searchName.toLowerCase()));
    }
    return filtered;
  };

  const toggleProductForm = () => setShowProductForm(prev => !prev);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleProductChange = (index, value) => {
    const newProducts = [...formData.products];
    newProducts[index].name = value;
    setFormData(prev => ({ ...prev, products: newProducts }));
  };

  const addProductField = () => {
    setFormData(prev => ({ 
      ...prev, 
      products: [...prev.products, { name: "", document1: null, document2: null, document3: null }] 
    }));
  };

  const removeProductField = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, products: newProducts }));
  };

  const handleProductFileChange = (index, documentKey, e) => {
    if (e.target.files && e.target.files[0]) {
      const newProducts = [...formData.products];
      newProducts[index][documentKey] = e.target.files[0];
      setFormData(prev => ({ ...prev, products: newProducts }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.applicationId) {
      toast.error("Please select an application");
      return;
    }

    const emptyProducts = formData.products.filter(p => !p.name.trim());
    if (emptyProducts.length > 0) {
      toast.error("Please fill in all product names");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const uploadData = new FormData();
      
      uploadData.append("products", JSON.stringify(formData.products.map(p => ({ name: p.name }))));
      uploadData.append("applicationId", formData.applicationId);
      uploadData.append("note", formData.note);
      
      formData.products.forEach((p, index) => {
        if (p.document1) uploadData.append(`document1_${index}`, p.document1);
        if (p.document2) uploadData.append(`document2_${index}`, p.document2);
        if (p.document3) uploadData.append(`document3_${index}`, p.document3);
      });

      const res = await axios.post(`${baseUrl}/products`, uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });

      if (res.data.status === "success") {
        toast.success(res.data.message);
        setShowProductForm(false);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add products");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      products: [{ name: "", document1: null, document2: null, document3: null }],
      applicationId: "",
      note: ""
    });
    setErrors({});
  };

  const deleteProductFromList = async (id, status) => {
    if (status === 'approved') {
      toast.error("Approved products cannot be deleted");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    setIsDeletingId(id);
    try {
      await deleteProduct(id);
      fetchProducts();
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setIsDeletingId(null);
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

          {/* Tabs & Search Filter Combined into search-box */}
          <div className="search-box">
            <div className="field">
              <label>Product Name</label>
              <input
                type="text"
                placeholder="Search products..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="field">
              <label>Status Filters</label>
              <select 
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                disabled={isLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#374151', 
                  background: 'white', 
                  outline: 'none' 
                }}
              >
                <option value="all">All Products</option>
                <option value="requested">Requested Only</option>
                <option value="approved">Approved Only</option>
              </select>
            </div>
            <button 
              className="search-btn"
              onClick={() => { setSearchName(""); setActiveTab("all"); setCurrentPage(1); }}
              disabled={isLoading}
            >
              <i className="fas fa-times"></i> Clear
            </button>
          </div>

          <div className="table-wrapper">
            {(() => {
              const filteredData = getFilteredProducts();
              const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
              const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
              
              return (
                <>
                  <div className="table-header">
                    <h3>
                      {activeTab === 'all' && `All Products (${filteredData.length})`}
                      {activeTab === 'requested' && `Requested Products (${filteredData.length})`}
                      {activeTab === 'approved' && `Approved Products (${filteredData.length})`}
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
                  ) : filteredData.length === 0 ? (
                    <div className="no-data-message" style={{ textAlign: 'center', padding: '40px' }}>
                      <i className="fas fa-box" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}></i>
                      <h3>No Products Found</h3>
                      <p>
                        {searchName ? "No products matched your search." :
                         activeTab === 'all' ? "No products found. Add your first product!" :
                         activeTab === 'requested' ? "No requested products found." : "No approved products found."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'all' ? (
                        <table className="applications-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              {/* <th>Application Number</th> */}
                              <th>Note</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedData.map((p, index) => (
                              <tr key={p._id}>
                                <td>{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                                <td style={{ fontWeight: 500 }}>{p.name}</td>
                                {/* <td><span className="app-number">{p?.applicationId?.applicationNumber}</span></td> */}
                                <td>{p.note}</td>
                                <td>
                                  <TableActions 
                                    actions={[
                                      {
                                        label: 'View Details',
                                        icon: <i className="fas fa-eye"></i>,
                                        onClick: () => viewProductDetails(p)
                                      },
                                      {
                                        label: 'Delete Product',
                                        icon: isDeletingId === p._id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>,
                                        onClick: () => deleteProductFromList(p._id, p.status),
                                        variant: 'danger',
                                        disabled: p.status === 'approved' || isDeletingId === p._id
                                      }
                                    ].filter(Boolean)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : activeTab === 'requested' ? (
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
                            {paginatedData.map((p, index) => (
                              <tr key={p._id}>
                                <td>{((currentPage - 1) * itemsPerPage) + index + 1}</td>
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
                                  <TableActions 
                                    actions={[
                                      {
                                        label: 'View Details',
                                        icon: <i className="fas fa-eye"></i>,
                                        onClick: () => viewProductDetails(p)
                                      },
                                      {
                                        label: 'Delete Product',
                                        icon: <i className="fas fa-trash-alt"></i>,
                                        onClick: () => deleteProductFromList(p._id, p.status),
                                        variant: 'danger'
                                      }
                                    ].filter(Boolean)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
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
                            {paginatedData.map((p, index) => (
                              <tr key={p._id}>
                                <td>{((currentPage - 1) * itemsPerPage) + index + 1}</td>
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
                                  <TableActions 
                                    actions={[
                                      {
                                        label: 'View Details',
                                        icon: <i className="fas fa-eye"></i>,
                                        onClick: () => viewProductDetails(p)
                                      },
                                      {
                                        label: 'Delete Product',
                                        icon: <i className="fas fa-trash-alt"></i>,
                                        onClick: () => {},
                                        variant: 'danger',
                                        disabled: true
                                      }
                                    ].filter(Boolean)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '15px', borderTop: '1px solid #e5e7eb' }}>
                          <button 
                            onClick={() => setCurrentPage(p => p - 1)} 
                            disabled={currentPage === 1}
                            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: currentPage === 1 ? '#f9fafb' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}
                          >
                            Prev
                          </button>
                          <span style={{ fontSize: '14px', color: '#4b5563' }}>Page {currentPage} of {totalPages}</span>
                          <button 
                            onClick={() => setCurrentPage(p => p + 1)} 
                            disabled={currentPage === totalPages}
                            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: currentPage === totalPages ? '#f9fafb' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
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
                  Product Names *
                  <div style={{ marginTop: '10px' }}>
                    {formData.products.map((p, index) => (
                      <div key={index} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                          <input 
                            value={p.name} 
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            placeholder={`Product ${index + 1} name`}
                            required
                            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                          {formData.products.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeProductField(index)} 
                              style={{ padding: '0 15px', color: 'red', border: '1px solid red', borderRadius: '4px', background: 'white', cursor: 'pointer' }}
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                        
                        {/* Documents for this product */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Document 1</label>
                            <input 
                              type="file" 
                              onChange={(e) => handleProductFileChange(index, "document1", e)} 
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', fontSize: '12px', background: 'white' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Document 2 (Opt)</label>
                            <input 
                              type="file" 
                              onChange={(e) => handleProductFileChange(index, "document2", e)} 
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', fontSize: '12px', background: 'white' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Document 3 (Opt)</label>
                            <input 
                              type="file" 
                              onChange={(e) => handleProductFileChange(index, "document3", e)} 
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px', fontSize: '12px', background: 'white' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    onClick={addProductField} 
                    style={{ background: 'none', color: '#00853b', border: 'none', cursor: 'pointer', marginTop: '5px', fontWeight: 'bold' }}
                  >
                    + Add Another Product
                  </button>
                </label>
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
                <button type="button" className="cancel-btn" onClick={toggleProductForm} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? (
                    <><i className="fas fa-spinner fa-spin"></i> Adding...</>
                  ) : "Add Product"}
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
                  {/* <div className="detail-item">
                    <span className="detail-label">Application Number:</span>
                    <span className="detail-value">{selectedProduct.applicationId.applicationNumber}</span>
                  </div> */}
                  <div className="detail-item">
                    <span className="detail-label">Note :</span>
                    <span className="detail-value">{selectedProduct.note}</span>
                  </div>
                  
                </div>
              </div>

              <div className="details-section">
                <h3 className="details-title">Documents</h3>
                <div className="details-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  {selectedProduct.document1 && (
                    <div className="detail-item">
                      <a href={selectedProduct.document1.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00853b', textDecoration: 'underline' }}>View Document 1</a>
                    </div>
                  )}
                  {selectedProduct.document2 && (
                    <div className="detail-item">
                      <a href={selectedProduct.document2.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00853b', textDecoration: 'underline' }}>View Document 2</a>
                    </div>
                  )}
                  {selectedProduct.document3 && (
                    <div className="detail-item">
                      <a href={selectedProduct.document3.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00853b', textDecoration: 'underline' }}>View Document 3</a>
                    </div>
                  )}
                  {(!selectedProduct.document1 && !selectedProduct.document2 && !selectedProduct.document3) && (
                    <span className="detail-value text-gray-500">No documents attached</span>
                  )}
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