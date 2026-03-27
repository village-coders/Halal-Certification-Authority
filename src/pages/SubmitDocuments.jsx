import { useState, useEffect } from "react";
import "./css/Dashboard.css"; // Reuse dashboard layouts
import "./css/SubmitDocuments.css"; // Supplementary form styles
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

function SubmitDocuments() {
  const { user, fetchUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    document: null
  });
  const [isDeletingId, setIsDeletingId] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${API_BASE_URL}/documents/my-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.status === "success") {
        setDocuments(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load your documents");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, document: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return toast.error("Please provide a title");
    }
    if (!formData.document) {
      return toast.error("Please select a document to upload");
    }

    try {
      setUploading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("document", formData.document);

      const response = await axios.post(`${API_BASE_URL}/documents`, uploadData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.data.status === "success") {
        toast.success("Document uploaded successfully!");
        setFormData({ title: "", document: null });
        document.getElementById("documentFile").value = "";
        fetchDocuments();
      }
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    setIsDeletingId(id);
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.delete(`${API_BASE_URL}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        toast.success("Document deleted successfully");
        setDocuments(documents.filter(doc => doc._id !== id));
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("Failed to delete document");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="dash">       
      <Sidebar activeI="documents" /> 
      <main className="content">
        <div className="manage-applications dashboard-container">
          <div className="header">
            <h2>Submit Relevant Documents</h2>
          </div>

          <div className="table-wrapper applications-section mb-[30px]" style={{ marginBottom: "30px", padding: '24px' }}>
            <div className="table-header section-header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Upload New Document</h3>
            </div>
            
            <div className="section-content">
              <form onSubmit={handleSubmit} className="docs-form">
                <div className="docs-form-group">
                  <label>Document Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. CAC Registration Certificate"
                    className="docs-form-input"
                    required
                  />
                </div>

                <div className="docs-form-group">
                  <label>Upload File (PDF, Image, Doc)</label>
                  <input
                    type="file"
                    id="documentFile"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="docs-form-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="docs-submit-btn"
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload"></i> Submit Document
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="table-wrapper applications-section" style={{ padding: '24px' }}>
            <div className="table-header section-header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Previously Uploaded Documents</h3>
            </div>
            
            <div className="section-content">
              <div className="table-container">
                {loading ? (
                  <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Loading documents...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-folder-open"></i>
                    <p>No documents found. Upload your first document above.</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Document Title</th>
                        <th>Date Uploaded</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc._id}>
                          <td>
                            <div className="doc-title-cell">
                              <i className="fas fa-file-alt"></i>
                              <span>{doc.title}</span>
                            </div>
                          </td>
                          <td>
                            {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }).replace(/ /g, '-')}
                          </td>
                          <td>
                            <div className="actions-flex" style={{ display: "flex", gap: "10px" }}>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-menu-btn"
                                title="View Document"
                              >
                                <i className="fas fa-external-link-alt"></i>
                              </a>
                              <button
                                onClick={() => handleDelete(doc._id)}
                                className="action-menu-btn delete-action-btn"
                                title="Delete Document"
                                disabled={isDeletingId === doc._id}
                                style={{ opacity: isDeletingId === doc._id ? 0.5 : 1 }}
                              >
                                {isDeletingId === doc._id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                              </button>
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
          
        </div>
      </main>
    </div>
  );
}

export default SubmitDocuments;
