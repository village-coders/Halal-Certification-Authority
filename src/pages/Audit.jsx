import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { toast } from "sonner";
import { MdCheck, MdClose, MdInfoOutline } from "react-icons/md";
import "./css/Audit.css";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Audit = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

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
                        <div className="audit-list">
                            {audits.map(audit => (
                                <div key={audit._id} className={`audit-card ${audit.status.toLowerCase().replace(' ', '-')}`}>
                                    <div className="audit-info">
                                        <h3>{audit.applicationId?.applicationNumber} - {audit.applicationId?.category}</h3>
                                        <div className="audit-meta">
                                            <span><strong>Date:</strong> {new Date(audit.scheduledDate).toLocaleDateString()}</span>
                                            <span><strong>Time:</strong> {audit.scheduledTime}</span>
                                            <span><strong>Staff:</strong> {audit.staffName}</span>
                                            <span className={`status-tag ${audit.status.toLowerCase().replace(' ', '-')}`}>{audit.status}</span>
                                        </div>
                                    </div>

                                    {audit.status === 'Scheduled' && (
                                        <div className="audit-actions">
                                            <button className="accept-btn" onClick={() => { setSelectedAudit(audit); handleResponse('Accepted'); }}>
                                                <MdCheck /> Accept
                                            </button>
                                            <button className="reject-btn" onClick={() => { setSelectedAudit(audit); setShowRespondModal(true); }}>
                                                <MdClose /> Reject
                                            </button>
                                        </div>
                                    )}

                                    {audit.status === 'Correction Needed' && (
                                        <div className="corrections-section">
                                            <h4>Corrections Needed</h4>
                                            <ul>
                                                {audit.corrections.map(correction => (
                                                    <li key={correction._id} className={correction.status.toLowerCase()}>
                                                        <span>{correction.issue}</span>
                                                        {correction.status === 'Pending' ? (
                                                            <button onClick={() => resolveCorrection(audit._id, correction._id)}>Mark Resolved</button>
                                                        ) : (
                                                            <span className="resolved-tag">Resolved</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
