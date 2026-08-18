import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import "./css/Certificate.css";
import axios from "axios";
import { toast } from "sonner";
import TableActions from "../components/TableActions";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const getFileUrl = (path) => {
  if (!path) return '';
  if (Array.isArray(path)) {
      if (path.length === 0) return '';
      path = path[0];
  }
  if (typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace(/\/api$/, '');
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath.startsWith('/files/')) {
    normalizedPath = `/api${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
};

const Invoice = () => {
  // --- State Management ---
  const [invoices, setInvoices] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showUploadReceipt, setShowUploadReceipt] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Search & Filters
  const [searchNumber, setSearchNumber] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchNumber, activeTab]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);

  // --- Helpers ---
  const getAuthHeader = () => {
    const token = JSON.parse(localStorage.getItem("accessToken"));
    return { Authorization: `Bearer ${token}` };
  };


  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      "Paid": "#10b981",
      "Issued": "#f59e0b",
      "Overdue": "#ef4444",
      "Requested": "#6366f1",
      "Processing": "#8b5cf6",
      "Proof Rejected": "#ef4444"
    };
    return colors[status] || "#6b7280";
  };

  const resetForm = () => {
    setUploadFile(null);
    setUploadProgress(0);
  };

  // --- Data Fetching ---
  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/invoices`, {
        headers: getAuthHeader()
      });
      setInvoices(response.data);
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications`, {
        headers: getAuthHeader()
      });
      // Filter for applications that are in a state where an invoice can be requested
      const validApps = response.data.filter(app => 
        ['Submitted', 'Under Review', 'Approved'].includes(app.status)
      );
      setApplications(validApps);
    } catch (err) {
      console.error("Failed to fetch applications");
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchApplications();
  }, [fetchInvoices, fetchApplications]);

  useEffect(() => {
    if (invoices.length > 0 && location.search) {
      const searchParams = new URLSearchParams(location.search);
      const highlightId = searchParams.get('highlight');
      if (highlightId) {
        setTimeout(() => {
          const el = document.getElementById(`invoice-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'background-color 1s ease';
            el.style.backgroundColor = '#fef3c7';
            setTimeout(() => { el.style.backgroundColor = ''; }, 3000);
          }
        }, 100);
        navigate('/invoices', { replace: true });
      }
    }
  }, [invoices, location.search, navigate]);

  // --- Filter Logic ---
  const getFilteredInvoices = () => {
    let filtered = invoices;
    
    // Status Filter
    switch (activeTab) {
      case "pending":
        filtered = filtered.filter(inv => ["Requested", "Issued", "Processing", "Proof Rejected"].includes(inv.status));
        break;
      case "paid":
        filtered = filtered.filter(inv => inv.status === "Paid");
        break;
      case "overdue":
        filtered = filtered.filter(inv => inv.status === "Issued" && new Date(inv.dueDate) < new Date());
        break;
      default:
        break;
    }
    
    // Number Filter
    if (searchNumber) {
      filtered = filtered.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(searchNumber.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleClearFilters = () => {
    setSearchNumber("");
    setActiveTab("all");
  };

  // --- Event Handlers ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB Limit
      toast.error("File is too large. Max limit is 5MB.");
      return;
    }
    setUploadFile(file);
  };

  const handleUploadReceipt = async () => {
    if (!uploadFile) {
      toast.error("Please select a receipt file");
      return;
    }

    try {
      setIsLoading(true);
      const data = new FormData();
      data.append("proof", uploadFile);

      const response = await axios.post(`${API_BASE_URL}/invoices/${selectedInvoice._id}/upload-proof`, data, {
        headers: { 
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data" 
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (response.data) {
        toast.success("Receipt uploaded successfully");
        setShowUploadReceipt(false);
        resetForm();
        fetchInvoices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload receipt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectInvoice = async () => {
    if (!selectedInvoice) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting the invoice");
      return;
    }

    try {
      setIsRejecting(true);
      const response = await axios.put(`${API_BASE_URL}/invoices/${selectedInvoice._id}/reject`, {
        reason: rejectReason
      }, {
        headers: getAuthHeader()
      });

      if (response.data) {
        toast.success("Invoice rejected successfully");
        setShowRejectModal(false);
        setRejectReason("");
        setSelectedInvoice(null);
        fetchInvoices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject invoice");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDownloadInvoice = (invoice) => {
    if (invoice.invoiceFile) {
      const url = getFileUrl(invoice.invoiceFile);
      window.open(url, '_blank');
    } else {
      toast.error("Invoice document is not available for this record");
    }
  };

  const openUploadModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowUploadReceipt(true);
  };

  const openDetailsModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  const filteredData = getFilteredInvoices();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="dash">
      <Sidebar activeI="active" />
      <main className="content cert">
        <div className="manage-applications">
          <div className="header">
            <h2>Invoices</h2>
            <div className="header-actions">
              <button 
                className="renew-btn" 
                onClick={() => alert('Export feature coming soon')}
                disabled={isLoading}
              >
                <i className="fas fa-file-export"></i> Export
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="search-box">
            <div className="field">
              <label>Invoice Number</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="field">
              <label>Status</label>
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
                <option value="all">All Invoices</option>
                <option value="pending">Pending Filter</option>
                <option value="paid">Paid Only</option>
                <option value="overdue">Overdue Only</option>
              </select>
            </div>
            <button 
              className="search-btn"
              onClick={handleClearFilters}
              disabled={isLoading}
            >
              <i className="fas fa-times"></i> Clear
            </button>
          </div>

          {/* Invoices Table */}
          <div className="table-wrapper">
            <div className="table-header">
              <h3>Invoices ({filteredData.length})</h3>
              <div className="table-actions">
                <button 
                  className="action-btn" 
                  onClick={fetchInvoices}
                  disabled={isLoading}
                >
                  <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-file-invoice" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }}></i>
                <h3>No Invoices Found</h3>
                <p>You don't have any invoices yet. Generated invoices will appear here.</p>
              </div>
            ) : (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Manufacturing Facility</th>
                    <th>Description</th>
                    <th>Issued Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody style={{overflowY: "auto"}}>
                  {paginatedData.map((invoice) => {
                    return (
                      <tr key={invoice._id} id={`invoice-${invoice._id}`}>
                        <td>
                          <span className="app-number">{invoice.invoiceNumber || "N/A"}</span>
                        </td>
                        <td>{invoice.branchId?.branchName || "N/A"}</td>
                        <td>{invoice.description || "N/A"}</td>
                        <td>{formatDate(invoice.issuedAt || invoice.createdAt)}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: getStatusColor(invoice.status) + '20',
                              color: getStatusColor(invoice.status),
                              border: `1px solid ${getStatusColor(invoice.status)}`,
                              fontSize: "12px",
                              textWrap: "nowrap"
                            }}
                          >
                            {invoice.status || "Unknown"}
                          </span>
                          {invoice.proofRejectionReason && invoice.status === 'Proof Rejected' && (
                            <div style={{ marginTop: '4px', fontSize: '11px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="fas fa-exclamation-triangle"></i>
                              <span>Proof Rejected: {invoice.proofRejectionReason}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <TableActions 
                            actions={[
                              {
                                label: 'View Details',
                                icon: <i className="fas fa-eye"></i>,
                                onClick: () => openDetailsModal(invoice)
                              },
                              {
                                label: 'View Invoice',
                                icon: <i className="fas fa-file-invoice"></i>,
                                onClick: () => handleDownloadInvoice(invoice)
                              },
                              (invoice.status === 'Issued' || invoice.status === 'Invoice Sent' || invoice.status === 'Proof Rejected') && {
                                label: invoice.status === 'Proof Rejected' ? 'Re-upload Proof of Payment' : 'Upload Proof of Payment',
                                icon: <i className="fas fa-upload" style={{ color: 'var(--primary-color)' }}></i>,
                                onClick: () => openUploadModal(invoice)
                              },
                              (invoice.status === 'Issued' || invoice.status === 'Invoice Sent') && {
                                label: 'Reject Invoice',
                                icon: <i className="fas fa-times-circle" style={{ color: '#ef4444' }}></i>,
                                onClick: () => {
                                  setSelectedInvoice(invoice);
                                  setShowRejectModal(true);
                                }
                              }
                            ].filter(Boolean)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredData.length === 0 && invoices.length > 0 && (
                    <tr>
                      <td colSpan="6" className="no-data" style={{ textAlign: "center", padding: "24px" }}>
                        No matching invoices found based on your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            
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
          </div>
        </div>

        {/* Invoice Detail Modal Clone */}
        {showInvoiceDetails && selectedInvoice && (
          <div className="modal modal-large">
            <div className="modal-content">
              <div className="modal-header">
                <h3>
                  <i className="fas fa-file-invoice"></i> Invoice Details
                </h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowInvoiceDetails(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div className="info-grid" style={{ marginBottom: '24px' }}>
                  <div className="info-item">
                    <span className="info-label">Invoice Number:</span>
                    <span className="info-value">{selectedInvoice.invoiceNumber || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Manufacturing Facility:</span>
                    <span className="info-value">{selectedInvoice.branchId?.branchName || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created Date:</span>
                    <span className="info-value">{formatDate(selectedInvoice.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Paid Date:</span>
                    <span className="info-value">{selectedInvoice.paidAt ? formatDate(selectedInvoice.paidAt) : "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(selectedInvoice.status) + '20',
                          color: getStatusColor(selectedInvoice.status),
                          border: `1px solid ${getStatusColor(selectedInvoice.status)}`
                        }}
                      >
                        {selectedInvoice.status || "Unknown"}
                      </span>
                    </span>
                  </div>
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="info-label">Description:</span>
                    <span className="info-value">{selectedInvoice.description || "N/A"}</span>
                  </div>
                  {selectedInvoice.rejectionReason && (
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="info-label" style={{ color: '#ef4444' }}>Rejection Reason:</span>
                      <span className="info-value" style={{ color: '#b91c1c' }}>{selectedInvoice.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Proof of Payment Summary */}
                <div className="certificate-preview" style={{ 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px',
                  background: '#f9fafb'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h4 style={{ color: '#111827', marginBottom: '10px' }}>Proof of Payment</h4>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                      Attached payment records and details for this invoice
                    </p>
                  </div>

                  {/* Rejection Alert Banner */}
                  {selectedInvoice.proofRejectionReason && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      textAlign: 'left'
                    }}>
                      <i className="fas fa-exclamation-circle" style={{ color: '#dc2626', fontSize: '20px', marginTop: '2px' }}></i>
                      <div>
                        <strong style={{ color: '#991b1b', fontSize: '14px' }}>Proof of Payment Rejected</strong>
                        <p style={{ margin: '4px 0 0 0', color: '#b91c1c', fontSize: '13px' }}>
                          <strong>Reason:</strong> {selectedInvoice.proofRejectionReason}
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: '#7f1d1d', fontSize: '12px' }}>
                          Please re-upload a valid proof of payment document to enable us to verify and approve your payment.
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '30px',
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}>
                    {selectedInvoice.proofOfPayment ? (
                      <>
                        <i className={`fas ${selectedInvoice.status === 'Proof Rejected' ? 'fa-file-invoice-dollar' : 'fa-file-invoice-dollar'}`} style={{ fontSize: '48px', color: selectedInvoice.status === 'Proof Rejected' ? '#ef4444' : '#10b981', marginBottom: '16px' }}></i>
                        <h3 style={{ color: '#111827', marginBottom: '10px' }}>
                          {selectedInvoice.status === 'Proof Rejected' ? 'Proof of Payment (Rejected)' : 'Proof of Payment Submitted'}
                        </h3>
                        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                          {selectedInvoice.status === 'Proof Rejected' 
                            ? 'The previously uploaded document was rejected. A new document is required.' 
                            : 'A documentation has been uploaded for verification.'}
                        </p>
                        <a 
                          href={getFileUrl(selectedInvoice.proofOfPayment)}
                          target="_blank"
                          rel="noreferrer"
                          className="renew-btn" 
                          style={{
                            background: 'white', border: '1px solid #d1d5db', color: '#374151', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', textDecoration: 'none'
                          }}
                        >
                          <i className="fas fa-external-link-alt"></i> View Uploaded Proof
                        </a>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-invoice" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }}></i>
                        <h3 style={{ color: '#111827', marginBottom: '10px' }}>Awaiting Payment</h3>
                        <p style={{ color: '#6b7280' }}>
                          No proof of payment has been uploaded for this invoice yet.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={() => setShowInvoiceDetails(false)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-submit"
                    onClick={() => handleDownloadInvoice(selectedInvoice)}
                  >
                     <i className="fas fa-file-invoice"></i> View Invoice
                  </button>
                  {(selectedInvoice.status === 'Issued' || selectedInvoice.status === 'Invoice Sent' || selectedInvoice.status === 'Proof Rejected') && (
                    <>
                      <button 
                        type="button" 
                        className="btn renew-btn"
                        onClick={() => {
                          setShowInvoiceDetails(false);
                          openUploadModal(selectedInvoice);
                        }}
                        style={{ background: 'var(--primary-color)', color: 'white' }}
                      >
                        <i className="fas fa-upload"></i> {selectedInvoice.status === 'Proof Rejected' ? 'Re-upload Proof of Payment' : 'Upload Proof of Payment'}
                      </button>
                      {(selectedInvoice.status === 'Issued' || selectedInvoice.status === 'Invoice Sent') && (
                        <button 
                          type="button" 
                          className="btn btn-cancel"
                          onClick={() => {
                            setShowInvoiceDetails(false);
                            setShowRejectModal(true);
                          }}
                          style={{ background: '#ef4444', color: 'white', border: 'none' }}
                        >
                          <i className="fas fa-times-circle"></i> Reject Invoice
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadReceipt && selectedInvoice && (
          <div className="modal modal-large">
            <div className="modal-content">
              <div className="modal-header">
                <h3>
                  <i className="fas fa-upload"></i> {selectedInvoice.status === 'Proof Rejected' ? 'Re-upload Proof of Payment' : 'Upload Proof of Payment'}
                </h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowUploadReceipt(false)}
                  disabled={isLoading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {/* Rejection Notice in Upload Modal */}
                {selectedInvoice.proofRejectionReason && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', marginTop: '2px' }}></i>
                    <div>
                      <strong style={{ color: '#991b1b', fontSize: '13px' }}>Previous Rejection Reason:</strong>
                      <p style={{ margin: '2px 0 0 0', color: '#b91c1c', fontSize: '12.5px' }}>
                        {selectedInvoice.proofRejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                <div className="renewal-notice" style={{ marginBottom: '24px' }}>
                  <i className="fas fa-receipt"></i>
                  <p>
                    <strong>Invoice #{selectedInvoice.invoiceNumber}</strong><br/>
                    Please upload a clear proof of payment document (bank receipt / deposit slip) for verification.
                  </p>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <input type="file" id="receipt-upload" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} disabled={isLoading} />
                  <label htmlFor="receipt-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', border: '2px dashed #d1d5db', borderRadius: '8px', cursor: 'pointer', background: '#f9fafb', transition: 'all 0.2s' }}>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }}></i>
                    <span style={{ color: '#111827', fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>{uploadFile ? uploadFile.name : "Click to select file"}</span>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>PDF, JPG, PNG (Max 5MB)</span>
                  </label>
                </div>
                
                {uploadProgress > 0 && (
                  <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ height: '100%', background: 'var(--primary-color)', width: `${uploadProgress}%`, transition: 'width 0.3s' }}></div>
                  </div>
                )}
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={() => setShowUploadReceipt(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-submit"
                    onClick={handleUploadReceipt}
                    disabled={!uploadFile || isLoading}
                  >
                    {isLoading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-check-circle"></i> Submit Proof</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Invoice Modal */}
        {showRejectModal && selectedInvoice && (
          <div className="modal modal-large">
            <div className="modal-content">
              <div className="modal-header">
                <h3>
                  <i className="fas fa-times-circle" style={{ color: '#ef4444' }}></i> Reject Invoice #{selectedInvoice.invoiceNumber}
                </h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowRejectModal(false)}
                  disabled={isRejecting}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <p style={{ color: '#374151', marginBottom: '16px' }}>
                  Please state your reason for rejecting this invoice. Administrators will be notified to review and address your concerns.
                </p>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
                    Rejection Reason <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea 
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejecting this invoice..."
                    disabled={isRejecting}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={() => setShowRejectModal(false)}
                    disabled={isRejecting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    onClick={handleRejectInvoice}
                    disabled={isRejecting || !rejectReason.trim()}
                    style={{ background: '#ef4444', color: 'white', border: 'none' }}
                  >
                    {isRejecting ? (
                      <><i className="fas fa-spinner fa-spin"></i> Rejecting...</>
                    ) : (
                      <><i className="fas fa-times-circle"></i> Confirm Rejection</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Invoice;