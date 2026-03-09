import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import "./css/Invoice.css";
import axios from "axios";
import { toast } from "sonner";
import { 
  MdOutlineRemoveRedEye, 
  MdOutlineCloudUpload, 
  MdOutlineDownload,
  MdClose
} from "react-icons/md";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Invoice = () => {
  // --- State Management ---
  const [invoices, setInvoices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showUploadReceipt, setShowUploadReceipt] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  
  const [formData, setFormData] = useState({
    applicationId: "",
    description: "",
    notes: "",
  });

  // --- Helpers ---
  const getAuthHeader = () => {
    const token = JSON.parse(localStorage.getItem("accessToken"));
    return { Authorization: `Bearer ${token}` };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetForm = () => {
    setFormData({ applicationId: "", description: "", notes: "" });
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

  // --- Filter Logic ---
  const getFilteredInvoices = () => {
    switch (activeTab) {
      case "pending":
        return invoices.filter(inv => ["Requested", "Issued"].includes(inv.status));
      case "paid":
        return invoices.filter(inv => inv.status === "Paid");
      case "overdue":
        // Example logic: Issued and date has passed
        return invoices.filter(inv => inv.status === "Issued" && new Date(inv.dueDate) < new Date());
      default:
        return invoices;
    }
  };

  // --- Event Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB Limit
      toast.error("File is too large. Max limit is 5MB.");
      return;
    }
    setUploadFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/invoices/request`, {
          applicationId: formData.applicationId,
          description: formData.description,
          notes: formData.notes
      }, { headers: getAuthHeader() });

      if (response.data) {
        toast.success("Invoice requested successfully");
        setShowInvoiceForm(false);
        resetForm();
        fetchInvoices();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to request invoice");
    }
  };

  const handleUploadReceipt = async () => {
    if (!uploadFile) {
      toast.error("Please select a receipt file");
      return;
    }

    try {
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
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    toast.info("Download functionality coming soon");
    // Implementation for PDF download
  };

  const toggleInvoiceForm = () => {
    setShowInvoiceForm(!showInvoiceForm);
    if (showInvoiceForm) resetForm();
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

  return (
    <div className="dash">
      <Sidebar activeI="active" />
      <main className="content">
        <div className="invoice-container">
          <div className="invoice-header">
            <h2>Invoices</h2>
            <button className="request-invoice-btn" onClick={toggleInvoiceForm}>
              Request Invoice
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="invoice-tabs">
            {['all', 'pending', 'paid', 'overdue'].map((tab) => (
              <button 
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="invoice-content">
            <div className="invoice-table-container">
              {isLoading ? (
                <div className="loading-state"><p>Loading invoices...</p></div>
              ) : filteredData.length === 0 ? (
                <div className="empty-state"><p>No invoices found for this category.</p></div>
              ) : (
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Invoice #</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Created At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((invoice, index) => (
                      <tr key={invoice._id}>
                        <td>{index + 1}</td>
                        <td className="fw-bold">{invoice.invoiceNumber}</td>
                        <td>{invoice.description || '-'}</td>
                        <td className="amount-cell">{formatCurrency(invoice.amount)}</td>
                        <td>{formatDate(invoice.createdAt)}</td>
                        <td>
                          <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => openDetailsModal(invoice)} className="view-btn" title="View"><MdOutlineRemoveRedEye /></button>
                            {invoice.status !== 'Paid' && invoice.status !== 'Requested' && (
                              <button className="paid-btn" onClick={() => openUploadModal(invoice)} title="Upload Receipt"><MdOutlineCloudUpload /></button>
                            )}
                            <button onClick={() => handleDownloadInvoice(invoice)} className="download-btn" title="Download"><MdOutlineDownload /></button>
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
      </main>

      {/* --- Modals --- */}

      {/* Request Modal */}
      {showInvoiceForm && (
        <div className="modal-overlay" onClick={toggleInvoiceForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request New Invoice</h2>
              <button className="close-modal" onClick={toggleInvoiceForm}><MdClose /></button>
            </div>
            <form className="invoice-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Application *</label>
                <select name="applicationId" value={formData.applicationId} onChange={handleChange} required>
                  <option value="">Choose an application</option>
                  {applications.map(app => (
                    <option key={app._id} value={app._id}>{app.applicationNumber} - {app.category}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="e.g. Processing Fee"></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={toggleInvoiceForm}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={!formData.applicationId}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showInvoiceDetails && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoiceDetails(false)}>
          <div className="modal-content invoice-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invoice #{selectedInvoice.invoiceNumber}</h2>
              <button className="close-modal" onClick={() => setShowInvoiceDetails(false)}><MdClose /></button>
            </div>
            <div className="invoice-details-content">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge ${selectedInvoice.status.toLowerCase()}`}>{selectedInvoice.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value amount">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created Date</span>
                  <span className="detail-value">{formatDate(selectedInvoice.createdAt)}</span>
                </div>
                {selectedInvoice.paidAt && (
                   <div className="detail-item">
                    <span className="detail-label">Paid Date</span>
                    <span className="detail-value">{formatDate(selectedInvoice.paidAt)}</span>
                  </div>
                )}
                <div className="detail-item full-width">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selectedInvoice.description || 'N/A'}</span>
                </div>
              </div>
              
              {selectedInvoice.proofOfPayment && (
                <div className="receipt-section">
                   <h4>Proof of Payment</h4>
                   <div className="receipt-info">
                      <span className="receipt-filename">Transaction Proof Uploaded</span>
                      <button className="download-receipt-btn" onClick={() => window.open(selectedInvoice.proofOfPayment, '_blank')}>
                         <MdOutlineDownload /> View Receipt
                      </button>
                   </div>
                </div>
              )}

              <div className="modal-actions">
                 <button className="close-details-btn" onClick={() => setShowInvoiceDetails(false)}>Close</button>
                 <button className="submit-btn" onClick={() => handleDownloadInvoice(selectedInvoice)}>Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadReceipt && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowUploadReceipt(false)}>
          <div className="modal-content upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Proof of Payment</h2>
              <button className="close-modal" onClick={() => setShowUploadReceipt(false)}><MdClose /></button>
            </div>
            <div className="upload-content">
              <div className="upload-info">
                <p>Invoice <strong>#{selectedInvoice.invoiceNumber}</strong></p>
                <p>Amount: <strong>{formatCurrency(selectedInvoice.amount)}</strong></p>
              </div>
              <div className="upload-area">
                <input type="file" id="receipt-upload" className="file-input" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                <label htmlFor="receipt-upload" className="file-label">
                  <MdOutlineCloudUpload className="upload-icon" />
                  <span className="upload-text">{uploadFile ? uploadFile.name : "Click to select file"}</span>
                  <span className="upload-hint">PDF, JPG, PNG (Max 5MB)</span>
                </label>
              </div>
              {uploadProgress > 0 && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>{uploadProgress}%</div>
                </div>
              )}
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowUploadReceipt(false)}>Cancel</button>
                <button className="submit-btn" onClick={handleUploadReceipt} disabled={!uploadFile || isLoading}>
                  {isLoading ? "Uploading..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;