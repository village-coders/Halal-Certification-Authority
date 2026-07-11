import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import TableActions from "../components/TableActions";
import axios from "axios";
import { toast } from "sonner";
import { MdCheck, MdClose, MdInfoOutline, MdEmail, MdPhone, MdFileDownload } from "react-icons/md";
import { View, FileText, Upload } from "lucide-react";
import "./css/Audit.css";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const getFileUrl = (path) => {
  if (!path) return '';
  if (Array.isArray(path)) {
      if (path.length === 0) return '';
      path = path[0]; // If an array is passed accidentally, use the first element
  }
  if (typeof path !== 'string') {
      return '';
  }
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace(/\/api$/, '');
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath.startsWith('/files/')) {
    normalizedPath = `/api${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
};

const Audit = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [showAuditDetails, setShowAuditDetails] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [uploading, setUploading] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [showNegotiateModal, setShowNegotiateModal] = useState(false);
    const [negotiateOptions, setNegotiateOptions] = useState([]);
    const [negotiateCheckboxes, setNegotiateCheckboxes] = useState([false, false, false]);
    const [showNcCorrectionModal, setShowNcCorrectionModal] = useState(false);
    const [ncCorrectionFiles, setNcCorrectionFiles] = useState([]);

    const handleFileUpload = async (applicationId, file) => {
        if (!file) return;
        
        try {
            setUploading(applicationId);
            const token = JSON.parse(localStorage.getItem("accessToken"));
            const formData = new FormData();
            formData.append('step', 6);
            formData.append('subStep', 5);
            formData.append('file', file);

            await axios.patch(`${API_BASE_URL}/applications/${applicationId}/process`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Audit report uploaded successfully");
            fetchAudits();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to upload audit report");
        } finally {
            setUploading(null);
        }
    };

    const handleUploadNcCorrection = async () => {
        if (!selectedAudit || ncCorrectionFiles.length === 0) {
            toast.error("Please select at least one file to upload");
            return;
        }

        try {
            setUploading(selectedAudit._id);
            const token = JSON.parse(localStorage.getItem("accessToken"));
            const formData = new FormData();
            ncCorrectionFiles.filter(f => f !== null).forEach(file => {
                formData.append('correctionFile', file);
            });

            await axios.post(`${API_BASE_URL}/audits/${selectedAudit._id}/nc-correction`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            

            toast.success("NC Correction uploaded successfully");
            setShowNcCorrectionModal(false);
            setNcCorrectionFiles([]);
            fetchAudits();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to upload NC correction");
        } finally {
            setUploading(null);
        }
    };

    const fetchAudits = async () => {
        try {
            const token = JSON.parse(localStorage.getItem("accessToken"));
            const response = await axios.get(`${API_BASE_URL}/audits`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAudits(response.data);
        } catch (err) {
            toast.error("Failed to load audits");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudits();
    }, []);

    const handleResponse = async (auditId, status, additionalData = {}) => {
        if (status === 'Rejected' && !rejectReason) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setActionLoading(`${auditId}-${status.toLowerCase()}`);
        try {
            const token = JSON.parse(localStorage.getItem("accessToken"));
            await axios.put(`${API_BASE_URL}/audits/${auditId}/respond`, {
                status,
                rejectReason,
                ...additionalData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success(`Response submitted successfully`);
            setShowRespondModal(false);
            setShowNegotiateModal(false);
            if (!showAuditDetails) setSelectedAudit(null);
            setRejectReason("");
            await fetchAudits();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to respond to audit");
        } finally {
            setActionLoading(null);
        }
    };

    const resolveCorrection = async (auditId, correctionId) => {
        setActionLoading(`${correctionId}-resolve`);
        try {
            const token = JSON.parse(localStorage.getItem("accessToken"));
            await axios.put(`${API_BASE_URL}/audits/${auditId}/correction/${correctionId}/resolve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Correction marked as resolved");
            await fetchAudits();
        } catch (err) {
            toast.error("Failed to resolve correction");
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Scheduled': '#3b82f6',
            'Accepted': '#10b981',
            'Audited': '#8b5cf6',
            'Rejected': '#ef4444',
            'Correction Needed': '#f59e0b',
            'NC Flagged': '#f59e0b',
            'Completed': '#059669'
        };
        return colors[status] || '#6b7280';
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDaysRemaining = (dateString) => {
        if (!dateString) return null;
        const diff = new Date(dateString) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="dash">
            <Sidebar activeAu="active" />
            <main className="content">
                <div className="audit-container">
                    <header className="audit-header">
                        <h2>My Audits</h2>
                        <p>Track your certification audits and corrections</p>
                    </header>

                    {loading ? (
                        <div className="loading">Loading audits...</div>
                    ) : audits.length === 0 ? (
                        <div className="empty">No audits scheduled yet.</div>
                    ) : (
                        <>
                            <div className="table-wrapper">
                                <table className="applications-table">
                                    <thead>
                                        <tr>
                                            <th>Application</th>
                                            <th>Manufacturing Facility</th>
                                            <th>Category</th>
                                            <th>Audit Date</th>
                                            <th>Status</th>
                                            <th>Auditor</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {audits.map(audit => {
                                            const daysRemaining = calculateDaysRemaining(audit.scheduledDate);
                                            return (
                                                <tr key={audit._id}>
                                                    <td>
                                                        <span className="app-number">{audit.applicationId?.applicationNumber || "N/A"}</span>
                                                    </td>
                                                    <td>{audit.branchId?.branchName || "N/A"}</td>
                                                    <td>{audit.applicationId?.category || "N/A"}</td>
                                                    <td>
                                                        <div className="date-cell">
                                                            <span className="primary-date">{formatDate(audit.scheduledDate)}</span>
                                                            <span className="secondary-time">{audit.scheduledTime}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span 
                                                            className="status-badge"
                                                            style={{ 
                                                                backgroundColor: getStatusColor(audit.status) + '20',
                                                                color: getStatusColor(audit.status),
                                                                border: `1px solid ${getStatusColor(audit.status)}`
                                                            }}
                                                        >
                                                            {audit.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="auditor-info">
                                                            {audit.auditors && audit.auditors.length > 0 ? (
                                                                audit.auditors.map((auditor, aIdx) => (
                                                                    <div key={aIdx} style={{ marginBottom: aIdx < audit.auditors.length - 1 ? '6px' : 0 }}>
                                                                        <span className="auditor-name" style={{ fontWeight: 600, display: 'block' }}>{auditor.name}</span>
                                                                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>{auditor.role}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <>
                                                                    <span className="auditor-name">{audit.staffName}</span>
                                                                    <div className="auditor-contacts">
                                                                        {audit.auditorEmail && <MdEmail title={audit.auditorEmail} />}
                                                                        {audit.auditorPhone && <MdPhone title={audit.auditorPhone} />}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <TableActions 
                                                            actions={[
                                                                { 
                                                                    label: 'View Details', 
                                                                    icon: <View size={16} />, 
                                                                    onClick: () => { setSelectedAudit(audit); setShowAuditDetails(true); }
                                                                },
                                                                ...((audit.status === 'Proposed' || audit.status === 'Counter Proposed') ? [
                                                                    { 
                                                                        label: 'Respond to Schedule', 
                                                                        icon: <MdInfoOutline size={16} />, 
                                                                        onClick: () => { 
                                                                            setSelectedAudit(audit); 
                                                                            setNegotiateOptions((audit.proposedDates || []).map(pd => ({
                                                                                date: pd.date ? new Date(pd.date).toISOString().split('T')[0] : '',
                                                                                time: pd.fromTime || pd.time || '',
                                                                                fromTime: pd.fromTime || pd.time || '',
                                                                                toTime: pd.toTime || '',
                                                                                isCounter: pd.isCounter || false
                                                                            })));
                                                                            setNegotiateCheckboxes([false, false, false]);
                                                                            setShowNegotiateModal(true); 
                                                                        }
                                                                    }
                                                                ] : []),

                                                                 ...(audit.ncReport ? [
                                                                     { 
                                                                         label: 'View NC Report', 
                                                                         icon: <FileText size={16} />, 
                                                                         onClick: () => window.open(getFileUrl(audit.ncReport), '_blank')
                                                                     },
                                                                     ...((audit.status === 'NC Flagged' || audit.status === 'Correction Needed') ? [{
                                                                         label: audit.ncRejectReason ? '⚠ Re-upload Corrections (Rejected)' : audit.ncCorrectionFile && audit.ncCorrectionFile.length > 0 ? 'Re-upload NC Correction' : 'Upload NC Correction',
                                                                         icon: <Upload size={16} />,
                                                                         style: audit.ncRejectReason ? { color: '#dc2626', fontWeight: 700 } : {},
                                                                         onClick: () => { setSelectedAudit(audit); setNcCorrectionFiles([null]); setShowNcCorrectionModal(true); }
                                                                     }] : [])
                                                                 ] : []),
                                                                ...(audit.auditReport ? [
                                                                    { 
                                                                        label: 'View Audit Report', 
                                                                        icon: <FileText size={16} />, 
                                                                        onClick: () => window.open(getFileUrl(audit.auditReport), '_blank')
                                                                    }
                                                                ] : []),
                                                                ...((audit.status === 'Correction Needed' || audit.status === 'NC Flagged') ? [
                                                                    { 
                                                                        label: 'View Corrections', 
                                                                        icon: <MdInfoOutline size={16} />, 
                                                                        onClick: () => { setSelectedAudit(audit); setShowAuditDetails(true); }
                                                                    }
                                                                ] : [])
                                                            ]}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {showAuditDetails && selectedAudit && (
                                <div className="modal-overlay modal" onClick={() => setShowAuditDetails(false)}>
                                    <div className="modal-content product-details-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px', width: '90%'}}>
                                        <div className="modal-header">
                                            <h2>Audit Details</h2>
                                            <button className="close-modal" onClick={() => setShowAuditDetails(false)}>×</button>
                                        </div>
                                        <div className="product-details-content" style={{padding: '20px', maxHeight: '70vh', overflowY: 'auto'}}>
                                            <div className="details-section">
                                                <h3 className="details-title">Basic Information</h3>
                                                <div className="details-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Application:</span>
                                                        <span className="detail-value">{selectedAudit.applicationId?.applicationNumber || "N/A"}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Manufacturing Facility:</span>
                                                        <span className="detail-value">{selectedAudit.branchId?.branchName || "N/A"}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Status:</span>
                                                        <span className="detail-value">{selectedAudit.status}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Audit Date & Time:</span>
                                                        <span className="detail-value">{formatDate(selectedAudit.scheduledDate)} at {selectedAudit.scheduledTime || "TBD"}</span>
                                                    </div>
                                                    {selectedAudit.status === 'Rejected' && selectedAudit.rejectReason && (
                                                    <div className="detail-item" style={{ gridColumn: '1 / -1', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', marginTop: '4px' }}>
                                                        <span className="detail-label" style={{ color: '#991b1b', marginBottom: '4px', display: 'block' }}>Rejection Reason:</span>
                                                        <span className="detail-value" style={{ color: '#991b1b', fontSize: '13px' }}>{selectedAudit.rejectReason}</span>
                                                    </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="details-section" style={{marginTop: '20px'}}>
                                                <h3 className="details-title">Auditor Information</h3>
                                                {selectedAudit.auditors && selectedAudit.auditors.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {selectedAudit.auditors.map((auditor, aIdx) => (
                                                            <div key={aIdx} style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                    <span style={{ fontWeight: 600, color: '#334155' }}>{auditor.name}</span>
                                                                    <span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600, color: '#475569' }}>{auditor.role}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                                                                    {auditor.email && <span>Email: {auditor.email}</span>}
                                                                    {auditor.phone && <span>Phone: {auditor.phone}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="details-grid">
                                                        <div className="detail-item">
                                                            <span className="detail-label">Name:</span>
                                                            <span className="detail-value">{selectedAudit.staffName || "Not Assigned"}</span>
                                                        </div>
                                                        {selectedAudit.auditorEmail && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">Email:</span>
                                                            <span className="detail-value">{selectedAudit.auditorEmail}</span>
                                                        </div>
                                                        )}
                                                        {selectedAudit.auditorPhone && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">Phone:</span>
                                                            <span className="detail-value">{selectedAudit.auditorPhone}</span>
                                                        </div>
                                                        )}
                                                    </div>
                                                )}
                                                {selectedAudit.meetingLink && (
                                                    <div className="detail-item" style={{ marginTop: '10px' }}>
                                                        <span className="detail-label">Meeting Link:</span>
                                                        <span className="detail-value">
                                                            <a href={selectedAudit.meetingLink} target="_blank" rel="noopener noreferrer" style={{color: '#00853b', textDecoration: 'underline'}}>Join Meeting</a>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {(selectedAudit.status === 'Correction Needed' || selectedAudit.status === 'NC Flagged') && selectedAudit.corrections?.length > 0 && (
                                                <div className="details-section" style={{marginTop: '20px'}}>
                                                    <h3 className="details-title">Corrections Needed</h3>
                                                    <ul className="corrections-list" style={{listStyle: 'none', padding: 0}}>
                                                        {selectedAudit.corrections.map(correction => (
                                                            <li key={correction._id} style={{padding: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                                <span className="issue-text" style={{ flex: 1, marginRight: '10px' }}>{correction.issue}</span>
                                                                {correction.status === 'Pending' ? (
                                                                    <button style={{backgroundColor: '#059669', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: actionLoading === `${correction._id}-resolve` ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: actionLoading === `${correction._id}-resolve` ? 0.7 : 1}} onClick={() => resolveCorrection(selectedAudit._id, correction._id)} disabled={actionLoading === `${correction._id}-resolve`}>
                                                                        {actionLoading === `${correction._id}-resolve` ? 'Resolving...' : 'Mark Resolved'}
                                                                    </button>
                                                                ) : (
                                                                    <span style={{color: '#059669', fontSize: '12px', fontWeight: 'bold'}}>Resolved</span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="modal-actions" style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end'}}>
                                                <button 
                                                    onClick={() => setShowAuditDetails(false)}
                                                    style={{backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500}}
                                                >
                                                    Close Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {showRespondModal && selectedAudit && (
                <div className="modal-overlay" onClick={() => { setShowRespondModal(false); if(!showAuditDetails) setSelectedAudit(null); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px', width: '90%'}}>
                        <div className="modal-header">
                            <h2>Reject Audit Schedule</h2>
                            <button className="close-modal" onClick={() => { setShowRespondModal(false); if(!showAuditDetails) setSelectedAudit(null); }}>×</button>
                        </div>
                        <div style={{padding: '20px'}}>
                            <p style={{marginBottom: '10px', color: '#4b5563'}}>Please provide a reason for rejecting this audit date/time.</p>
                            <textarea 
                                value={rejectReason} 
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                style={{width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '20px', resize: 'vertical', outline: 'none'}}
                            />
                            <div className="modal-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                                <button onClick={() => { setShowRespondModal(false); if(!showAuditDetails) setSelectedAudit(null); }} style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500}} disabled={actionLoading === `${selectedAudit._id}-rejected`}>Cancel</button>
                                <button className="confirm-reject" onClick={() => handleResponse(selectedAudit._id, 'Rejected')} disabled={actionLoading === `${selectedAudit._id}-rejected`} style={{padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: actionLoading === `${selectedAudit._id}-rejected` ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: actionLoading === `${selectedAudit._id}-rejected` ? 0.7 : 1}}>
                                    {actionLoading === `${selectedAudit._id}-rejected` ? 'Submitting...' : 'Submit Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNegotiateModal && selectedAudit && (
                <div className="modal-overlay modal" onClick={() => setShowNegotiateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '600px', width: '95%'}}>
                        <div className="modal-header">
                            <h2>Respond to Audit Schedule</h2>
                            <button className="close-modal" onClick={() => setShowNegotiateModal(false)}>×</button>
                        </div>
                        <div style={{padding: '20px', maxHeight: '75vh', overflowY: 'auto'}}>
                            <p style={{marginBottom: '15px', color: '#4b5563', fontSize: '13px', lineHeight: 1.5}}>
                                The admin has proposed three dates for your audit. You can:
                                <br />
                                1. **Accept** one of the options to finalize the date.
                                <br />
                                2. **Propose alternatives** for up to two dates if the options are not suitable.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                {negotiateOptions.map((opt, idx) => (
                                    <div key={idx} style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                            <div>
                                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>Option #{idx + 1}</span>
                                                {!negotiateCheckboxes[idx] && (
                                                    <span style={{ fontSize: '13px', display: 'block', marginTop: '4px', color: '#475569' }}>
                                                        {formatDate(opt.date)}
                                                        {opt.toDate && opt.date !== opt.toDate
                                                            ? ` to ${formatDate(opt.toDate)}`
                                                            : ''}
                                                        {opt.fromTime ? ` at ${opt.fromTime}` : opt.time ? ` at ${opt.time}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                            {!negotiateCheckboxes[idx] && (
                                                <button
                                                    type="button"
                                                    style={{ background: '#00853b', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure you want to accept and finalize this audit schedule? Once accepted, it cannot be changed.")) {
                                                            handleResponse(selectedAudit._id, 'Accepted', { chosenDate: opt.date, chosenTime: opt.fromTime || opt.time, chosenToDate: opt.toDate || opt.date });
                                                        }
                                                    }}
                                                    disabled={actionLoading}
                                                >
                                                    Accept & Finalize
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: negotiateCheckboxes[idx] ? '12px' : 0 }}>
                                            <input
                                                type="checkbox"
                                                id={`counter-check-${idx}`}
                                                checked={negotiateCheckboxes[idx]}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const checkedCount = negotiateCheckboxes.filter(Boolean).length;
                                                    if (checked && checkedCount >= 2) {
                                                        toast.error("You can propose alternatives for at most 2 dates.");
                                                        return;
                                                    }
                                                    setNegotiateCheckboxes(prev => {
                                                        const updated = [...prev];
                                                        updated[idx] = checked;
                                                        return updated;
                                                    });
                                                }}
                                            />
                                            <label htmlFor={`counter-check-${idx}`} style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>Propose alternative for Option #{idx + 1}</label>
                                        </div>

                                        {negotiateCheckboxes[idx] && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: '#64748b' }}>New Date *</label>
                                                    <input
                                                        type="date"
                                                        value={opt.date}
                                                        onChange={(e) => {
                                                            setNegotiateOptions(prev => {
                                                                const updated = [...prev];
                                                                updated[idx] = { ...updated[idx], date: e.target.value, toDate: e.target.value };
                                                                return updated;
                                                            });
                                                        }}
                                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: '#64748b' }}>New Time *</label>
                                                    <input
                                                        type="time"
                                                        value={opt.fromTime || opt.time}
                                                        onChange={(e) => {
                                                            setNegotiateOptions(prev => {
                                                                const updated = [...prev];
                                                                updated[idx] = { ...updated[idx], fromTime: e.target.value, time: e.target.value };
                                                                return updated;
                                                            });
                                                        }}
                                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px'}}>
                                <button 
                                    onClick={() => setShowNegotiateModal(false)} 
                                    style={{padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500}}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                {negotiateCheckboxes.some(Boolean) && (
                                    <button 
                                        onClick={() => {
                                            const anyEmpty = negotiateOptions.some((opt, i) => negotiateCheckboxes[i] && (!opt.date || !opt.time));
                                            if (anyEmpty) {
                                                toast.error("Please fill in date and time for proposed alternatives.");
                                                return;
                                            }
                                            handleResponse(selectedAudit._id, 'CounterProposed', { proposedDates: negotiateOptions });
                                        }}
                                        style={{padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: 600}}
                                        disabled={actionLoading}
                                    >
                                        Submit Counter Proposals
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NC Correction Modal */}
            {showNcCorrectionModal && selectedAudit && (
                <div className="modal-overlay" onClick={() => setShowNcCorrectionModal(false)} style={{ padding: '16px', boxSizing: 'border-box' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
                                Upload NC Correction
                            </h3>
                            <button className="close-btn" onClick={() => setShowNcCorrectionModal(false)}>
                                <MdClose size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
                                Please upload your correction for the Non-Conformance (NC) report. You can upload a PDF or an image file.
                            </p>
                            
                            {/* NC Rejection Reason Alert */}
                            {selectedAudit.ncRejectReason && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '14px 16px', borderRadius: '10px', marginBottom: '16px' }}>
                                    <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MdClose size={16} color="#dc2626" /> Your previous corrections were rejected
                                    </p>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c', lineHeight: '1.5' }}>
                                        <strong>Reason:</strong> {selectedAudit.ncRejectReason}
                                    </p>
                                    {selectedAudit.ncRejectFiles && selectedAudit.ncRejectFiles.length > 0 && (
                                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>Attached Documents:</p>
                                            {selectedAudit.ncRejectFiles.map((file, idx) => (
                                                <a key={idx} href={getFileUrl(file)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#b91c1c', textDecoration: 'underline', fontWeight: 500 }}>
                                                    <FileText size={14} /> View Attached Doc #{idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#b91c1c' }}>
                                        Please review the feedback and re-upload corrected documents below.
                                    </p>
                                </div>
                            )}
                            
                             {selectedAudit.ncCorrectionFile && !selectedAudit.ncRejectReason && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#166534', fontWeight: 600 }}>Correction already submitted.</p>
                                    {Array.isArray(selectedAudit.ncCorrectionFile) ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {selectedAudit.ncCorrectionFile.map((fileUrl, idx) => (
                                                <a key={idx} href={getFileUrl(fileUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#15803d', textDecoration: 'underline' }}>
                                                    View correction doc #{idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <a href={getFileUrl(selectedAudit.ncCorrectionFile)} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#15803d', textDecoration: 'underline' }}>
                                            View submitted correction
                                        </a>
                                    )}
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Correction Files</label>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {ncCorrectionFiles.map((file, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                {file ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#059669', background: '#f0fdf4', padding: '8px 10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                                        <button 
                                                            onClick={() => {
                                                                setNcCorrectionFiles(prev => {
                                                                    const newFiles = [...prev];
                                                                    newFiles[i] = null;
                                                                    return newFiles;
                                                                });
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '16px', flexShrink: 0 }}
                                                            title="Remove file"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <input 
                                                        type="file" 
                                                        accept=".pdf,image/*"
                                                        onChange={(e) => {
                                                            const selectedFile = e.target.files[0];
                                                            if (!selectedFile) return;
                                                            
                                                            if (selectedFile.size > 5 * 1024 * 1024) {
                                                                toast.error(`File "${selectedFile.name}" exceeds the 5MB size limit.`);
                                                                e.target.value = "";
                                                                return;
                                                            }
                                                            setNcCorrectionFiles(prev => {
                                                                const newFiles = [...prev];
                                                                newFiles[i] = selectedFile;
                                                                return newFiles;
                                                            });
                                                        }}
                                                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                                    />
                                                )}
                                            </div>
                                            {ncCorrectionFiles.length > 1 && (
                                                <button 
                                                    onClick={() => {
                                                        setNcCorrectionFiles(prev => prev.filter((_, idx) => idx !== i));
                                                    }}
                                                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove field"
                                                >
                                                    <MdClose size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => setNcCorrectionFiles(prev => [...prev, null])}
                                    style={{ marginTop: '12px', background: 'none', border: '1px dashed #cbd5e1', color: '#00853b', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                                >
                                    + Add another document
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button 
                                    onClick={() => setShowNcCorrectionModal(false)}
                                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 500 }}
                                    disabled={uploading === selectedAudit._id}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleUploadNcCorrection}
                                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#00853b', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                                    disabled={!ncCorrectionFiles.some(f => f !== null) || uploading === selectedAudit._id}
                                >
                                    {uploading === selectedAudit._id ? <i className="fas fa-spinner fa-spin"></i> : <Upload size={16} />}
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Audit;
