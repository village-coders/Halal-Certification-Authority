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

  const resolveUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/api') ? path.replace('/api', '') : path;
    return `${API_BASE_URL}${cleanPath}`;
  };

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
    { id: 1, label: application?.category === 'Renewal Application' ? 'Renewal Application Submitted' : 'Application Submitted' },
    { id: 2, label: 'Application Accepted' },
    { id: 4, label: 'Invoice Received' },
    { id: 5, label: 'Payment Received' },
    // Row 2
    { id: 6, label: 'Audit Date Finalized' },
    { id: 7, label: 'Audited' },
    { id: 8, label: 'NC Reports' },
    { id: 9, label: 'NC Reports Closed' },
    { id: 10, label: 'Audit Report Submitted' },
    // Row 3
    { id: 11, label: "Application Sent to Shari'a Board" },
    { id: 12, label: 'Application Successful for Certification' },
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
      case 1: return 'completed';
      case 2: return isAccepted ? 'completed' : 'active';
      case 4: return (hasInvoice || hasPaidInvoice || hasAuditDate) ? 'completed' : isAccepted ? 'active' : 'pending';
      case 5: return (hasPaidInvoice || hasAuditDate) ? 'completed' : hasInvoice ? 'active' : 'pending';
      case 6: return (hasAuditDate || hasAudited || hasNcReport || hasAuditReport || hasNcClosed) ? 'completed' : hasPaidInvoice ? 'active' : 'pending';
      case 7: return (hasAudited || hasNcReport || hasNcClosed || hasAuditReport) ? 'completed' : (hasAuditDate || pd.audit?.subStep > 0) ? 'active' : 'pending';
      case 8: return (hasNcReport || hasNcClosed || hasAuditReport) ? 'completed' : hasAudited ? 'active' : 'pending';
      case 9: return (hasNcClosed || hasAuditReport) ? 'completed' : hasNcReport ? 'active' : 'pending';
      case 10: return (hasAuditReport && (pd.audit?.subStep >= 6 || hasCertApproval)) ? 'completed' : (hasAuditReport || hasNcClosed || (hasAudited && !hasNcReport)) ? 'active' : 'pending';
      case 11: return (hasShariaSent || hasCertApproval || hasProcessing || isIssued) ? 'completed' : (hasAuditReport && pd.audit?.subStep >= 6) ? 'active' : 'pending';
      case 12: return (hasCertApproval || hasProcessing || isIssued) ? 'completed' : hasShariaSent ? 'active' : 'pending';
      case 13: return (hasProcessing || isIssued) ? 'completed' : hasCertApproval ? 'active' : 'pending';
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
                <span>Branch: <strong>{application?.branchId?.branchName || 'N/A'}</strong></span>
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

          {application?.processData?.audit?.prepDocuments?.length > 0 && (
            <div className="table-wrapper" style={{ padding: '30px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>Audit Preparation Documents</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>These are the documents needed to prepare for the audits.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {application.processData.audit.prepDocuments.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{doc.name}</span>
                    <a href={resolveUrl(doc.url)} target="_blank" rel="noreferrer" style={{ background: '#00853b', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>Download</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="table-wrapper" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Recent Activities</h3>
            <div className="activity-list">
              <div className="activity-item completed">
                <span className="activity-date">{new Date(application?.createdAt).toLocaleDateString()}</span>
                <span className="activity-desc">
                  {application?.category === 'Renewal Application' ? 'Renewal application submitted successfully.' : 'Application submitted successfully.'}
                </span>
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
              {application?.processData?.shariaBoardSentAt && application?.status !== 'Issued' && (
                <div className="activity-item completed">
                  <span className="activity-date">{new Date(application.processData.shariaBoardSentAt).toLocaleDateString()}</span>
                  <span className="activity-desc">Application has been sent to Shari'a Board for review.</span>
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
    "Successful": "#10b981",
    "Issued": "#10b981",
    "Rejected": "#ef4444",
    "With Shari'a Board": "#f59e0b",
    "Renewal": "#f59e0b"
  };
  return colors[status] || "#6b7280";
};

export default TrackApplication;
