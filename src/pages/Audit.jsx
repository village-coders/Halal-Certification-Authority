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
    const [rejectReason, setRejectReason] = useState("");
    const [uploading, setUploading] = useState(null);

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

    const handleResponse = async (status) => {
        if (status === 'Rejected' && !rejectReason) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        try {
            const token = JSON.parse(localStorage.getItem("accessToken"));
            await axios.put(`${API_BASE_URL}/audits/${selectedAudit._id}/respond`, {
                status,
                rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success(`Audit ${status.toLowerCase()} successfully`);
            setShowRespondModal(false);
            setRejectReason("");
            fetchAudits();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to respond to audit");
        }
    };

    const resolveCorrection = async (auditId, correctionId) => {
        try {
            const token = JSON.parse(localStorage.getItem("accessToken"));
            await axios.put(`${API_BASE_URL}/audits/${auditId}/correction/${correctionId}/resolve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Correction marked as resolved");
            fetchAudits();
        } catch (err) {
            toast.error("Failed to resolve correction");
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
                                                                    onClick: () => setSelectedAudit(audit === selectedAudit ? null : audit)
                                                                },
                                                                ...(audit.status === 'Scheduled' ? [
                                                                    { 
                                                                        label: 'Accept', 
                                                                        icon: <MdCheck size={16} />, 
                                                                        onClick: () => { setSelectedAudit(audit); handleResponse('Accepted'); }
                                                                    },
                                                                    { 
                                                                        label: 'Reject', 
                                                                        icon: <MdClose size={16} />, 
                                                                        onClick: () => { setSelectedAudit(audit); setShowRespondModal(true); }
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
                                                                        onClick: () => setSelectedAudit(audit === selectedAudit ? null : audit)
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

                            {selectedAudit && selectedAudit.status === 'Correction Needed' && (
                                <div className="corrections-panel">
                                    <div className="panel-header">
                                        <h4>Corrections Needed for {selectedAudit.applicationId?.applicationNumber}</h4>
                                        <button className="close-panel" onClick={() => setSelectedAudit(null)}><MdClose /></button>
                                    </div>
                                    <ul className="corrections-list">
                                        {selectedAudit.corrections.map(correction => (
                                            <li key={correction._id} className={`correction-item ${correction.status.toLowerCase()}`}>
                                                <span className="issue-text">{correction.issue}</span>
                                                {correction.status === 'Pending' ? (
                                                    <button className="resolve-btn" onClick={() => resolveCorrection(selectedAudit._id, correction._id)}>Mark Resolved</button>
                                                ) : (
                                                    <span className="resolved-tag">Resolved</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {showRespondModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Audit Schedule</h3>
                        <p>Please provide a reason for rejecting this audit date/time.</p>
                        <textarea 
                            value={rejectReason} 
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowRespondModal(false)}>Cancel</button>
                            <button className="confirm-reject" onClick={() => handleResponse('Rejected')}>Submit Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Audit;
