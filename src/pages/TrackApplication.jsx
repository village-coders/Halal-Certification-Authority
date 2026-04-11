import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import './css/TrackApplication.css';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const TrackApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [audits, setAudits] = useState([]);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      const [appRes, invRes, auditRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/applications/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/audits`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setApplication(appRes.data);
      // Filter invoices and audits for this specific application
      setInvoices(invRes.data.filter(inv => inv.applicationId === id));
      setAudits(auditRes.data.filter(audit => audit.applicationId === id));
    } catch (err) {
      console.error("Error fetching tracking details:", err);
      toast.error("Failed to load tracking information");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const steps = [
    // Row 1
    { id: 1,  label: 'Application Submitted' },
    { id: 2,  label: 'Application Accepted' },
    { id: 3,  label: 'Invoice Received' },
    { id: 4,  label: 'Payment Received' },
    { id: 5,  label: 'Product Submitted' },
    // Row 2
    { id: 6,  label: 'Audit Date Finalized' },
    { id: 7,  label: 'Audited' },
    { id: 8,  label: 'NC Reports' },
    { id: 9,  label: 'NC Reports Closed' },
    { id: 10, label: 'Audit Report Submitted' },
    // Row 3
    { id: 11, label: 'Application Successful for Certification' },
    { id: 12, label: "Application Sent to Al-Aqaba Shari'a Board" },
    { id: 13, label: 'Certificate Processing' },
    { id: 14, label: 'Certificate Issued' },
  ];

  const getStepStatus = (stepId) => {
    if (!application) return 'pending';

    const status = application.status.toLowerCase();
    const pd = application.processData || {};
    const hasInvoice = !!pd.invoiceSentAt;
    const hasPaidInvoice = !!pd.paymentConfirmedAt;
    const hasProductForms = !!pd.productFormsReceivedAt;
    const hasAuditDate = !!pd.audit?.scheduledDate;
    const hasAudited = !!pd.audit?.auditedAt;
    const hasNcReport = !!pd.audit?.ncReport;
    const hasNcClosed = !!pd.audit?.ncClosedAt;
    const hasAuditReport = !!pd.audit?.auditReportSubmittedAt;
    const hasCertApproval = !!pd.certificationApprovedAt;
    const hasShariaSent = !!pd.shariaBoardSentAt;
    const hasProcessing = !!pd.processingStartedAt;
    const isIssued = status === 'issued';
    const isAccepted = status === 'accepted' || status === 'issued' || status === "with shari'a board" || status === 'renewal';

    switch (stepId) {
      case 1:  return 'completed';
      case 2:  return isAccepted ? 'completed' : 'active';
      case 3:  return (hasInvoice || hasPaidInvoice || hasProductForms || hasAuditDate) ? 'completed' : isAccepted ? 'active' : 'pending';
      case 4:  return (hasPaidInvoice || hasProductForms || hasAuditDate) ? 'completed' : hasInvoice ? 'active' : 'pending';
      case 5:  return (hasProductForms || hasAuditDate) ? 'completed' : hasPaidInvoice ? 'active' : 'pending';
      case 6:  return (hasAuditDate || hasAudited) ? 'completed' : hasProductForms ? 'active' : 'pending';
      case 7:  return (hasAudited || hasNcReport || hasAuditReport) ? 'completed' : hasAuditDate ? 'active' : 'pending';
      case 8:  return (hasNcReport || hasNcClosed || hasAuditReport) ? 'completed' : hasAudited ? 'active' : 'pending';
      case 9:  return (hasNcClosed || hasAuditReport) ? 'completed' : hasNcReport ? 'active' : 'pending';
      case 10: return (hasAuditReport && (pd.audit?.subStep >= 6 || hasCertApproval)) ? 'completed' : (hasNcClosed || (hasAudited && !hasNcReport)) ? 'active' : 'pending';
      case 11: return (hasCertApproval || hasShariaSent || hasProcessing || isIssued) ? 'completed' : (hasAuditReport && pd.audit?.subStep >= 6) ? 'active' : 'pending';
      case 12: return (hasShariaSent || hasProcessing || isIssued) ? 'completed' : hasCertApproval ? 'active' : 'pending';
      case 13: return (hasProcessing || isIssued) ? 'completed' : hasShariaSent ? 'active' : 'pending';
      case 14: return isIssued ? 'completed' : hasProcessing ? 'active' : 'pending';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="dash">
        <Sidebar />
        <div className="content">
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i> Loading tracking details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <Sidebar />
      <main className="content">
        <div className="manage-applications">
          <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => navigate('/applications')} 
                className="action-btn"
                title="Back to Applications"
                style={{ height: '40px', width: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h2 style={{ margin: 0 }}>Track Application Progress</h2>
            </div>
            <div className="header-actions">
              <div className="app-info-summary">
                <span>App Number: <strong>{application?.applicationNumber}</strong></span>
                <span>Status: <span className="status-tag" style={{ 
                  backgroundColor: getStatusColor(application?.status) + '20',
                  color: getStatusColor(application?.status),
                  border: `1px solid ${getStatusColor(application?.status)}`,
                  marginLeft: '10px'
                }}>{application?.status}</span></span>
              </div>
            </div>
          </div>

          <div className="stepper-container">
            <div className="stepper-title">STEP PROCESSING</div>
            <div className="stepper-grid">
              {/* Split steps into rows: 5, 5, 3 */}
              {[0, 5, 10].map((startIndex) => (
                <div key={startIndex} className="stepper-row">
                  {steps.slice(startIndex, startIndex + 5).map((step) => {
                    const status = getStepStatus(step.id);
                    return (
                      <div key={step.id} className={`step-item ${status}`}>
                        <div className="step-label">{step.label}</div>
                        <div className="step-visual">
                          <div className="step-line"></div>
                          <div className="step-circle">
                            {status === 'completed' && <i className="fas fa-check"></i>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="table-wrapper" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Recent Activities</h3>
            <div className="activity-list">
              <div className="activity-item completed">
                <span className="activity-date">{new Date(application?.createdAt).toLocaleDateString()}</span>
                <span className="activity-desc">Application submitted successfully.</span>
              </div>
              {(application?.status === 'Accepted' || application?.status === 'Issued' || application?.status === "With Shari'a Board") && (
                <div className="activity-item completed">
                  <span className="activity-date">Recently</span>
                  <span className="activity-desc">Application has been accepted by the admin.</span>
                </div>
              )}
              {invoices.length > 0 && (
                <div className="activity-item completed">
                  <span className="activity-date">Recently</span>
                  <span className="activity-desc">Invoice generated for the application.</span>
                </div>
              )}
              {application?.status === 'Issued' && (
                <div className="activity-item completed">
                  <span className="activity-date">{new Date(application?.updatedAt || Date.now()).toLocaleDateString()}</span>
                  <span className="activity-desc">Certificate has been issued.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const getStatusColor = (status) => {
  if (!status) return "#6b7280";
  const colors = {
    "Submitted": "#4361ee",
    "Accepted": "#10b981",
    "Issued": "#10b981",
    "Rejected": "#ef4444",
    "With Shari'a Board": "#f59e0b",
    "Renewal": "#f59e0b"
  };
  return colors[status] || "#6b7280";
};

export default TrackApplication;
