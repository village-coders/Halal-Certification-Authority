import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import TableActions from "../components/TableActions";
import axios from "axios";
import { toast } from "sonner";
import { MdCheck, MdClose, MdInfoOutline, MdEmail, MdPhone, MdFileDownload } from "react-icons/md";
import { View, FileText } from "lucide-react";
import "./css/Audit.css";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Audit = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [showAuditDetails, setShowAuditDetails] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [uploading, setUploading] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

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

    const handleResponse = async (auditId, status) => {
        if (status === 'Rejected' && !rejectReason) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setActionLoading(`${auditId}-${status.toLowerCase()}`);
        try {
            const token = JSON.parse(localStorage.getItem("accessToken"));
            await axios.put(`${API_BASE_URL}/audits/${auditId}/respond`, {
                status,
                rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success(`Audit ${status.toLowerCase()} successfully`);
            setShowRespondModal(false);
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
            'Rejected': '#ef4444',
            'Correction Needed': '#f59e0b',
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
                                                            <span className="auditor-name">{audit.staffName}</span>
                                                            <div className="auditor-contacts">
                                                                {audit.auditorEmail && <MdEmail title={audit.auditorEmail} />}
                                                                {audit.auditorPhone && <MdPhone title={audit.auditorPhone} />}
                                                            </div>
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
                                                                ...(audit.status === 'Scheduled' ? [
                                                                    { 
                                                                        label: actionLoading === `${audit._id}-accepted` ? 'Accepting...' : 'Accept', 
                                                                        icon: actionLoading === `${audit._id}-accepted` ? <i className="fas fa-spinner fa-spin" style={{fontSize: '16px'}}></i> : <MdCheck size={16} />, 
                                                                        onClick: () => { setSelectedAudit(audit); handleResponse(audit._id, 'Accepted'); },
                                                                        disabled: actionLoading === `${audit._id}-accepted` || actionLoading === `${audit._id}-rejected`
                                                                    },
                                                                    { 
                                                                        label: 'Reject', 
                                                                        icon: <MdClose size={16} />, 
                                                                        onClick: () => { setSelectedAudit(audit); setShowRespondModal(true); },
                                                                        disabled: actionLoading === `${audit._id}-accepted` || actionLoading === `${audit._id}-rejected`
                                                                    }
                                                                ] : []),
                                                                ...(audit.ncReport ? [
                                                                    { 
                                                                        label: 'View NC Report', 
                                                                        icon: <FileText size={16} />, 
                                                                        onClick: () => window.open(audit.ncReport.startsWith('http') ? audit.ncReport : `${API_BASE_URL}${audit.ncReport}`, '_blank')
                                                                    }
                                                                ] : []),
                                                                ...(audit.auditReport ? [
                                                                    { 
                                                                        label: 'View Audit Report', 
                                                                        icon: <FileText size={16} />, 
                                                                        onClick: () => window.open(audit.auditReport.startsWith('http') ? audit.auditReport : `${API_BASE_URL}${audit.auditReport}`, '_blank')
                                                                    }
                                                                ] : []),
                                                                ...(audit.status === 'Correction Needed' ? [
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
                                                    {selectedAudit.meetingLink && (
                                                    <div className="detail-item">
                                                        <span className="detail-label">Meeting Link:</span>
                                                        <span className="detail-value">
                                                            <a href={selectedAudit.meetingLink} target="_blank" rel="noopener noreferrer" style={{color: '#00853b', textDecoration: 'underline'}}>Join Meeting</a>
                                                        </span>
                                                    </div>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedAudit.status === 'Correction Needed' && selectedAudit.corrections?.length > 0 && (
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
        </div>
    );
};

export default Audit;
