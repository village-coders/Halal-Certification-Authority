import { useState, useEffect, useRef } from "react";
import "./css/Message.css";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import axios from "axios";
import { toast } from "sonner";
import { useSocket } from "../contexts/SocketContext";
import {
  FaPaperPlane, FaPaperclip, FaTimes, FaPlus, FaTicketAlt,
  FaCheckCircle, FaClock, FaExclamationCircle, FaLock
} from "react-icons/fa";
import { format } from "date-fns";

const CATEGORIES = ["General", "Application", "Certificate", "Payment", "Audit", "Product", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const STATUS_CONFIG = {
  open:        { label: "Open",        color: "#3b82f6", bg: "#eff6ff", icon: <FaExclamationCircle /> },
  "in-progress": { label: "In Progress", color: "#f59e0b", bg: "#fffbeb", icon: <FaClock /> },
  resolved:    { label: "Resolved",    color: "#10b981", bg: "#ecfdf5", icon: <FaCheckCircle /> },
  closed:      { label: "Closed",      color: "#6b7280", bg: "#f9fafb", icon: <FaLock /> }
};

const PRIORITY_CONFIG = {
  Low:    { color: "#10b981", bg: "#ecfdf5" },
  Medium: { color: "#f59e0b", bg: "#fffbeb" },
  High:   { color: "#ef4444", bg: "#fef2f2" },
  Urgent: { color: "#7c3aed", bg: "#f5f3ff" }
};

function Message() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "Medium"
  });
  const [isCreating, setIsCreating] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { socket } = useSocket();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket._id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket listener for real-time replies
  useEffect(() => {
    if (!socket) return;

    const handleTicketReply = ({ ticketId, message, status }) => {
      if (selectedTicket?._id === ticketId) {
        setMessages(prev => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
        setSelectedTicket(prev => prev ? { ...prev, status } : prev);
      }
      setTickets(prev =>
        prev.map(t => t._id === ticketId ? { ...t, lastRepliedAt: new Date().toISOString(), status } : t)
      );
    };

    const handleStatusUpdate = ({ ticketId, status }) => {
      setSelectedTicket(prev => prev?._id === ticketId ? { ...prev, status } : prev);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status } : t));
      toast.info(`Ticket status updated to ${status}`);
    };

    socket.on("ticket-reply", handleTicketReply);
    socket.on("ticket-status-updated", handleStatusUpdate);

    return () => {
      socket.off("ticket-reply", handleTicketReply);
      socket.off("ticket-status-updated", handleStatusUpdate);
    };
  }, [socket, selectedTicket]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const res = await axios.get(`${baseUrl}/tickets/my`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (res.data.status === "success") {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId) => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const res = await axios.get(`${baseUrl}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch ticket messages:", err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setIsCreating(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const formData = new FormData();
      formData.append("title", newTicket.title);
      formData.append("description", newTicket.description);
      formData.append("category", newTicket.category);
      formData.append("priority", newTicket.priority);
      attachments.forEach(f => formData.append("attachments", f));

      const res = await axios.post(`${baseUrl}/tickets`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      if (res.data.status === "success") {
        toast.success("Ticket created successfully!");
        setShowCreateModal(false);
        setNewTicket({ title: "", description: "", category: "General", priority: "Medium" });
        setAttachments([]);
        fetchTickets();
        setSelectedTicket(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error("Please type a message");
      return;
    }
    if (!selectedTicket) return;

    setIsSending(true);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const formData = new FormData();
      formData.append("content", newMessage);
      attachments.forEach(f => formData.append("attachments", f));

      const res = await axios.post(`${baseUrl}/tickets/${selectedTicket._id}/reply`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      if (res.data.status === "success") {
        const sentMsg = { ...res.data.data, sender: { fullName: user?.fullName, role: "user" } };
        setMessages(prev => [...prev, sentMsg]);
        setSelectedTicket(prev => ({ ...prev, status: res.data.ticketStatus || prev.status }));
        setNewMessage("");
        setAttachments([]);
        scrollToBottom();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} exceeds 10MB`); return false; }
      return true;
    });
    setAttachments(prev => [...prev, ...valid]);
  };

  const formatDate = (d) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) return "Today";
      return format(date, "MMM dd, yyyy");
    } catch { return ""; }
  };

  const formatTime = (d) => {
    if (!d) return "";
    try { return format(new Date(d), "hh:mm a"); } catch { return ""; }
  };

  const filteredTickets = statusFilter === "all" ? tickets : tickets.filter(t => t.status === statusFilter);
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in-progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  return (
    <div className="dash">
      <Sidebar activeMess="active" />
      <main className="content">
        <DashboardHeader title="Support Tickets" />

        <div style={{ padding: "20px 24px" }}>
          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Tickets", value: tickets.length, color: "#6366f1", bg: "#eef2ff" },
              { label: "Open", value: openCount, color: "#3b82f6", bg: "#eff6ff" },
              { label: "In Progress", value: inProgressCount, color: "#f59e0b", bg: "#fffbeb" },
              { label: "Resolved", value: resolvedCount, color: "#10b981", bg: "#ecfdf5" }
            ].map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaTicketAlt style={{ color: s.color, fontSize: "20px" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#1e293b" }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Panel */}
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", height: "calc(100vh - 280px)", minHeight: "500px" }}>
            {/* Left: Ticket List */}
            <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* List Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>My Tickets</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#00853b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                  >
                    <FaPlus size={11} /> New Ticket
                  </button>
                </div>
                {/* Filter tabs */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["all", "open", "in-progress", "resolved", "closed"].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{
                      padding: "4px 10px", borderRadius: "20px", border: "none", cursor: "pointer",
                      background: statusFilter === s ? "#00853b" : "#f1f5f9",
                      color: statusFilter === s ? "white" : "#64748b",
                      fontSize: "12px", fontWeight: 600, textTransform: "capitalize"
                    }}>
                      {s === "all" ? "All" : s.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticket Items */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {isLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                    <div style={{ width: "28px", height: "28px", border: "3px solid #f1f5f9", borderTop: "3px solid #00853b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                    <FaTicketAlt style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No tickets yet</p>
                    <p style={{ margin: "6px 0 0", fontSize: "13px" }}>Create your first support ticket</p>
                  </div>
                ) : (
                  filteredTickets.map(ticket => {
                    const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                    const pc = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.Medium;
                    const isSelected = selectedTicket?._id === ticket._id;
                    return (
                      <div
                        key={ticket._id}
                        onClick={() => setSelectedTicket(ticket)}
                        style={{
                          padding: "14px 20px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          background: isSelected ? "#f0fdf4" : "transparent",
                          borderLeft: isSelected ? "3px solid #00853b" : "3px solid transparent",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#00853b", fontFamily: "monospace" }}>{ticket.ticketNumber}</span>
                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.title}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "10px", background: pc.bg, color: pc.color, fontWeight: 600 }}>{ticket.priority}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{formatDate(ticket.lastRepliedAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Ticket Detail / Messages */}
            <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {!selectedTicket ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", textAlign: "center", padding: "40px" }}>
                  <FaTicketAlt style={{ fontSize: "56px", marginBottom: "16px", opacity: 0.25 }} />
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#64748b" }}>Select a ticket to view</h3>
                  <p style={{ margin: "0 0 24px", fontSize: "14px" }}>Or create a new support ticket to get help</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#00853b", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}
                  >
                    <FaPlus /> Create New Ticket
                  </button>
                </div>
              ) : (
                <>
                  {/* Ticket Header */}
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#00853b", fontFamily: "monospace" }}>{selectedTicket.ticketNumber}</span>
                          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }}></span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{selectedTicket.category}</span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>{selectedTicket.title}</h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {(() => {
                          const sc = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
                          const pc = PRIORITY_CONFIG[selectedTicket.priority] || PRIORITY_CONFIG.Medium;
                          return (
                            <>
                              <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "16px", background: pc.bg, color: pc.color }}>{selectedTicket.priority}</span>
                              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "16px", background: sc.bg, color: sc.color }}>
                                {sc.icon} {sc.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#f8fafc" }}>
                    {messages.map((msg, i) => {
                      const isMe = msg.senderType === "user";
                      const showDate = i === 0 || formatDate(messages[i - 1].createdAt) !== formatDate(msg.createdAt);
                      return (
                        <div key={msg._id || i}>
                          {showDate && (
                            <div style={{ textAlign: "center", margin: "16px 0" }}>
                              <span style={{ fontSize: "11px", background: "white", padding: "4px 14px", borderRadius: "20px", color: "#94a3b8", border: "1px solid #e2e8f0" }}>{formatDate(msg.createdAt)}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "12px" }}>
                            <div style={{ maxWidth: "70%" }}>
                              {!isMe && (
                                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                                  HDI Support
                                </div>
                              )}
                              <div style={{
                                padding: "10px 16px",
                                borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: isMe ? "#00853b" : "white",
                                color: isMe ? "white" : "#1e293b",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                border: isMe ? "none" : "1px solid #e2e8f0"
                              }}>
                                <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>{msg.content}</p>
                                {msg.attachments?.length > 0 && (
                                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                    {msg.attachments.map((att, ai) => (
                                      <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: isMe ? "rgba(255,255,255,0.9)" : "#3b82f6", textDecoration: "underline" }}>
                                        <FaPaperclip size={11} /> {att.filename}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: isMe ? "right" : "left", marginTop: "3px" }}>
                                <span style={{ fontSize: "10px", color: "#94a3b8" }}>{formatTime(msg.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Input */}
                  {selectedTicket.status === "closed" ? (
                    <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", textAlign: "center", background: "#f8fafc" }}>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                        <FaLock style={{ marginRight: "6px" }} />
                        This ticket is closed. Create a new ticket if you need further assistance.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendReply} style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "white" }}>
                      {attachments.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                          {attachments.map((f, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", borderRadius: "6px", padding: "4px 8px", fontSize: "12px" }}>
                              <FaPaperclip size={10} color="#64748b" />
                              <span style={{ color: "#334155", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                              <button type="button" onClick={() => setAttachments(prev => prev.filter((_, pi) => pi !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><FaTimes size={10} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                        <button type="button" onClick={() => fileInputRef.current.click()}
                          style={{ padding: "10px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", color: "#64748b", flexShrink: 0 }}>
                          <FaPaperclip />
                          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
                        </button>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(e); } }}
                          placeholder="Type your reply..."
                          style={{ flex: 1, padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none" }}
                        />
                        <button type="submit" disabled={isSending}
                          style={{ padding: "10px 18px", background: "#00853b", color: "white", border: "none", borderRadius: "10px", cursor: isSending ? "not-allowed" : "pointer", opacity: isSending ? 0.7 : 1, flexShrink: 0 }}>
                          <FaPaperPlane />
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Create Support Ticket</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>Describe your issue and our team will get back to you</p>
                </div>
                <button onClick={() => setShowCreateModal(false)}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#64748b" }}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleCreateTicket}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Title - full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Subject / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief description of your issue"
                      value={newTicket.title}
                      onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Category</label>
                    <select value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", background: "white" }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Priority</label>
                    <select value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", background: "white" }}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Description - full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Description *</label>
                    <textarea
                      required
                      placeholder="Provide a detailed description of your issue..."
                      value={newTicket.description}
                      onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                      rows={5}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Attachments - full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Attachments (optional)</label>
                    <div
                      onClick={() => fileInputRef.current.click()}
                      style={{ border: "2px dashed #e2e8f0", borderRadius: "10px", padding: "20px", textAlign: "center", cursor: "pointer", color: "#94a3b8", fontSize: "13px" }}>
                      <FaPaperclip style={{ marginBottom: "6px", fontSize: "20px" }} />
                      <p style={{ margin: 0 }}>Click to attach files (max 10MB each)</p>
                      <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
                    </div>
                    {attachments.length > 0 && (
                      <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {attachments.map((f, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", borderRadius: "6px", padding: "4px 8px", fontSize: "12px" }}>
                            <FaPaperclip size={10} />
                            <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                            <button type="button" onClick={() => setAttachments(prev => prev.filter((_, pi) => pi !== i))}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0 }}><FaTimes size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    style={{ padding: "10px 20px", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreating}
                    style={{ padding: "10px 24px", background: "#00853b", color: "white", border: "none", borderRadius: "10px", cursor: isCreating ? "not-allowed" : "pointer", fontWeight: 600, opacity: isCreating ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
                    {isCreating ? "Creating..." : <><FaPlus /> Create Ticket</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </main>
    </div>
  );
}

export default Message;