import { useState, useEffect, useCallback } from "react";
import "./css/Applications.css";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { useProducts } from "../hooks/useProducts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

function Applications() {
  const [applications, setApplications] = useState([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showFilters, setShowFilters] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    product: "",
    productId: "",
    description: "",
    requestedDate: new Date().toISOString().split("T")[0],
    // Halal certification history
    hasAppliedBefore: "", // "yes" or "no"
    previousHalalAgency: "",
    hasBeenSupervisedBefore: "", // "yes" or "no"
    supervisingHalalAgency: "",
    // Food safety programs
    foodSafetyPrograms: [], // Array of selected programs
    otherFoodSafetyProgram: "",
    // Market type
    marketType: "",
    marketTypeOther: "",
    // Brand information
    brandType: "",
    brandTypeOther: "",
    // Product composition questions
    usesPorkOrDerivatives: "",
    usesAnimalMeatOrDerivatives: "",
    usesGelatinOrCapsule: "",
    containsAlcohol: "",
    additivesOrFlavourContainAlcohol: "",
    usesGlycerineOrDerivatives: "",
    // Geographic markets
    geographicMarkets: [],
    geographicMarketsOther: "",
    // Manufacturing facility (if different)
    manufacturingFacilitySame: true,
    manufacturingFacility: {
      companyName: "",
      address: "",
      localGovtArea: "",
      city: "",
      state: "",
      country: "",
      plantContact: "",
      positionTitle: "",
      telephoneNo: "",
      emailAddress: "",
      webAddress: "",
      governmentPlantCode: ""
    },
    // Additional facilities
    additionalFacilities: [],
    // Packaging plant
    hasSeparatePackagingPlant: false,
    packagingPlant: {
      companyName: "",
      address: "",
      localGovtArea: "",
      city: "",
      state: "",
      country: "",
      plantContact: "",
      positionTitle: "",
      telephoneNo: "",
      emailAddress: ""
    },
    // Authorized by
    authorizedBy: {
      name: "",
      dateAuthorized: new Date().toISOString().split("T")[0],
      positionTitle: ""
    }
  });

  const [renewalData, setRenewalData] = useState({
    existingApplication: "",
    renewalDate: new Date().toISOString().split("T")[0],
    reason: "",
    attachments: []
  });

  const applicationCategories = [
    "Initial Certification",
    "Renewal Application"
  ];

  const foodSafetyProgramOptions = [
    "HACCP",
    "ISO-22000", 
    "GMP",
    "QMS",
    "Other"
  ];

  const marketTypeOptions = [
    "Food Service (Bulk)",
    "Retail",
    "Direct Marketing",
    "Industry",
    "Other"
  ];

  const brandTypeOptions = [
    "Owned",
    "Private Label",
    "Other"
  ];

  const geographicMarketOptions = [
    "Within Nigeria",
    "North Africa",
    "West Africa",
    "Europe",
    "Gulf Countries",
    "Asia",
    "United States",
    "Worldwide",
    "Other"
  ];

  const { user, fetchUser } = useAuth();
  const { products, fetchProducts, isLoading: productsLoading } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const handleNewApplication = () => {
    if (applications.length > 0) {
      toast.error("You already have an existing application.");
      return;
    }
    setFormData(prev => ({ ...prev, category: "Initial Certification" }));
    setShowApplicationForm(true);
    setShowRenewalForm(false);
    setShowViewModal(false);
    setShowEditModal(false);
  };

  const handleRenewApplication = () => {
    const eligibleApps = applications.filter(app => 
      ["Accepted", "Certified", "Expired", "Issued", "Renewal", "Renewal Application", "renewal", "expired"].includes(app.status)
    );

    if (eligibleApps.length === 0) {
      toast.error("No eligible applications found for renewal");
      return;
    }
    
    setShowRenewalForm(true);
    setShowApplicationForm(false);
    setShowViewModal(false);
    setShowEditModal(false);
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(
        `${API_BASE_URL}/applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        setApplications(response.data);        
      } else {
        console.error("Unexpected response format:", response.data);
        toast.error("Failed to load applications. Invalid data format.");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch applications";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
      if (window.innerWidth >= 900) {
        setShowFilters(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchProducts();
    
    // Process query params
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    if (action === 'new') {
      setTimeout(() => {
        setFormData(prev => ({ ...prev, category: "Initial Certification" }));
        setShowApplicationForm(true);
      }, 500);
    } else if (action === 'renew') {
      setTimeout(() => setShowRenewalForm(true), 500);
    }
  }, []);

  // View Application Details
  const handleViewApplication = async (appId) => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(
        `${API_BASE_URL}/applications/${appId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        setSelectedApplication(response.data);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error("Error fetching application details:", err);
      toast.error("Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  // Edit Application
  const handleEditApplication = async (appId) => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(
        `${API_BASE_URL}/applications/${appId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        const app = response.data;
        
        // Format the data for the form
        setFormData({
          category: app.category || "",
          product: app.product || "",
          productId: app.productId || "",
          description: app.description || "",
          requestedDate: app.requestedDate ? app.requestedDate.split('T')[0] : new Date().toISOString().split("T")[0],
          hasAppliedBefore: app.hasAppliedBefore || "",
          previousHalalAgency: app.previousHalalAgency || "",
          hasBeenSupervisedBefore: app.hasBeenSupervisedBefore || "",
          supervisingHalalAgency: app.supervisingHalalAgency || "",
          foodSafetyPrograms: app.foodSafetyPrograms || [],
          otherFoodSafetyProgram: app.otherFoodSafetyProgram || "",
          marketType: app.marketType || "",
          marketTypeOther: app.marketTypeOther || "",
          brandType: app.brandType || "",
          brandTypeOther: app.brandTypeOther || "",
          usesPorkOrDerivatives: app.usesPorkOrDerivatives || "",
          usesAnimalMeatOrDerivatives: app.usesAnimalMeatOrDerivatives || "",
          usesGelatinOrCapsule: app.usesGelatinOrCapsule || "",
          containsAlcohol: app.containsAlcohol || "",
          additivesOrFlavourContainAlcohol: app.additivesOrFlavourContainAlcohol || "",
          usesGlycerineOrDerivatives: app.usesGlycerineOrDerivatives || "",
          geographicMarkets: app.geographicMarkets || [],
          geographicMarketsOther: app.geographicMarketsOther || "",
          manufacturingFacilitySame: !app.manufacturingFacility || Object.keys(app.manufacturingFacility).length === 0,
          manufacturingFacility: app.manufacturingFacility || {
            companyName: "",
            address: "",
            localGovtArea: "",
            city: "",
            state: "",
            country: "",
            plantContact: "",
            positionTitle: "",
            telephoneNo: "",
            emailAddress: "",
            webAddress: "",
            governmentPlantCode: ""
          },
          additionalFacilities: app.additionalFacilities || [],
          hasSeparatePackagingPlant: app.packagingPlant && Object.keys(app.packagingPlant).length > 0,
          packagingPlant: app.packagingPlant || {
            companyName: "",
            address: "",
            localGovtArea: "",
            city: "",
            state: "",
            country: "",
            plantContact: "",
            positionTitle: "",
            telephoneNo: "",
            emailAddress: ""
          },
          authorizedBy: app.authorizedBy || {
            name: "",
            dateAuthorized: new Date().toISOString().split("T")[0],
            positionTitle: ""
          }
        });
        
        setSelectedApplication(app);
        setShowEditModal(true);
      }
    } catch (err) {
      console.error("Error fetching application for edit:", err);
      toast.error("Failed to load application for editing");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.registrationNo) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    // Validate food safety programs
    if (formData.foodSafetyPrograms.length === 0) {
      toast.error("Please select at least one food safety program");
      return;
    }

    if (formData.foodSafetyPrograms.includes("Other") && !formData.otherFoodSafetyProgram.trim()) {
      toast.error("Please specify the 'Other' food safety program");
      return;
    }

    if (!formData.marketType) {
      toast.error("Please select market type");
      return;
    }

    if (formData.marketType === "Other" && !formData.marketTypeOther.trim()) {
      toast.error("Please specify the 'Other' market type");
      return;
    }

    if (!formData.brandType) {
      toast.error("Please select brand type");
      return;
    }

    if (formData.brandType === "Other" && !formData.brandTypeOther.trim()) {
      toast.error("Please specify the 'Other' brand type");
      return;
    }

    if (!formData.usesPorkOrDerivatives) {
      toast.error("Please answer: Do you produce product using pork or pork derivative?");
      return;
    }

    if (!formData.usesAnimalMeatOrDerivatives) {
      toast.error("Please answer: Do you produce product using animal meat or derivatives?");
      return;
    }

    if (!formData.usesGelatinOrCapsule) {
      toast.error("Please answer: Do you use gelatin or capsule in your product?");
      return;
    }

    if (!formData.containsAlcohol) {
      toast.error("Please answer: Does the product contain alcohol?");
      return;
    }

    if (!formData.additivesOrFlavourContainAlcohol) {
      toast.error("Please answer: Do the additives or flavour contain alcohol?");
      return;
    }

    if (!formData.usesGlycerineOrDerivatives) {
      toast.error("Please answer: Do you produce product using glycerine or its derivatives?");
      return;
    }

    if (formData.geographicMarkets.length === 0) {
      toast.error("Please select at least one geographic market");
      return;
    }

    if (formData.geographicMarkets.includes("Other") && !formData.geographicMarketsOther.trim()) {
      toast.error("Please specify the 'Other' geographic market");
      return;
    }

    if (!formData.authorizedBy.name) {
      toast.error("Please enter the name of the authorized person");
      return;
    }

    if (!formData.authorizedBy.positionTitle) {
      toast.error("Please enter the position/title of the authorized person");
      return;
    }

    try {
      setEditLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      const applicationData = {
        ...formData,
        foodSafetyPrograms: formData.foodSafetyPrograms,
        geographicMarkets: formData.geographicMarkets,
        companyId: user.registrationNo,
      };

      const response = await axios.put(
        `${API_BASE_URL}/applications/${selectedApplication._id}`,
        applicationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        toast.success("Application updated successfully!");
        fetchApplications();
        setShowEditModal(false);
        setSelectedApplication(null);
        resetForm();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update application";
      toast.error(errorMessage);
      console.error("Error updating application:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const filteredApplications = applications.filter(app =>
    app.applicationNumber?.toLowerCase().includes(searchNumber.toLowerCase()) &&
    (searchDate ? app.createdAt?.includes(searchDate) : true)
  );

  const handleCloseForm = () => {
    setShowApplicationForm(false);
    setShowRenewalForm(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedApplication(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      category: "",
      product: "",
      productId: "",
      description: "",
      requestedDate: new Date().toISOString().split("T")[0],
      hasAppliedBefore: "",
      previousHalalAgency: "",
      hasBeenSupervisedBefore: "",
      supervisingHalalAgency: "",
      foodSafetyPrograms: [],
      otherFoodSafetyProgram: "",
      marketType: "",
      marketTypeOther: "",
      brandType: "",
      brandTypeOther: "",
      usesPorkOrDerivatives: "",
      usesAnimalMeatOrDerivatives: "",
      usesGelatinOrCapsule: "",
      containsAlcohol: "",
      additivesOrFlavourContainAlcohol: "",
      usesGlycerineOrDerivatives: "",
      geographicMarkets: [],
      geographicMarketsOther: "",
      manufacturingFacilitySame: true,
      manufacturingFacility: {
        companyName: "",
        address: "",
        localGovtArea: "",
        city: "",
        state: "",
        country: "",
        plantContact: "",
        positionTitle: "",
        telephoneNo: "",
        emailAddress: "",
        webAddress: "",
        governmentPlantCode: ""
      },
      additionalFacilities: [],
      hasSeparatePackagingPlant: false,
      packagingPlant: {
        companyName: "",
        address: "",
        localGovtArea: "",
        city: "",
        state: "",
        country: "",
        plantContact: "",
        positionTitle: "",
        telephoneNo: "",
        emailAddress: ""
      },
      authorizedBy: {
        name: "",
        dateAuthorized: new Date().toISOString().split("T")[0],
        positionTitle: ""
      }
    });
    
    setRenewalData({
      existingApplication: "",
      renewalDate: new Date().toISOString().split("T")[0],
      reason: "",
      attachments: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRadioChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleFoodSafetyProgramChange = (program) => {
    setFormData(prev => {
      const isSelected = prev.foodSafetyPrograms.includes(program);
      let updatedPrograms;
      
      if (isSelected) {
        updatedPrograms = prev.foodSafetyPrograms.filter(p => p !== program);
        if (program === "Other") {
          return {
            ...prev,
            foodSafetyPrograms: updatedPrograms,
            otherFoodSafetyProgram: ""
          };
        }
      } else {
        updatedPrograms = [...prev.foodSafetyPrograms, program];
      }
      
      return {
        ...prev,
        foodSafetyPrograms: updatedPrograms
      };
    });
  };

  const handleGeographicMarketChange = (market) => {
    setFormData(prev => {
      const isSelected = prev.geographicMarkets.includes(market);
      let updatedMarkets;
      
      if (isSelected) {
        updatedMarkets = prev.geographicMarkets.filter(m => m !== market);
        if (market === "Other") {
          return {
            ...prev,
            geographicMarkets: updatedMarkets,
            geographicMarketsOther: ""
          };
        }
      } else {
        updatedMarkets = [...prev.geographicMarkets, market];
      }
      
      return {
        ...prev,
        geographicMarkets: updatedMarkets
      };
    });
  };

  const addAdditionalFacility = () => {
    setFormData(prev => ({
      ...prev,
      additionalFacilities: [
        ...prev.additionalFacilities,
        {
          companyName: "",
          address: "",
          localGovtArea: "",
          city: "",
          state: "",
          country: "",
          plantContact: "",
          positionTitle: "",
          telephoneNo: "",
          emailAddress: ""
        }
      ]
    }));
  };

  const updateAdditionalFacility = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.additionalFacilities];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, additionalFacilities: updated };
    });
  };

  const removeAdditionalFacility = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalFacilities: prev.additionalFacilities.filter((_, i) => i !== index)
    }));
  };

  const handleRenewalInputChange = (e) => {
    const { name, value } = e.target;
    setRenewalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setRenewalData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setRenewalData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.registrationNo) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    // Validation (same as before)
    if (formData.foodSafetyPrograms.length === 0) {
      toast.error("Please select at least one food safety program");
      return;
    }

    if (formData.foodSafetyPrograms.includes("Other") && !formData.otherFoodSafetyProgram.trim()) {
      toast.error("Please specify the 'Other' food safety program");
      return;
    }

    if (!formData.marketType) {
      toast.error("Please select market type");
      return;
    }

    if (formData.marketType === "Other" && !formData.marketTypeOther.trim()) {
      toast.error("Please specify the 'Other' market type");
      return;
    }

    if (!formData.brandType) {
      toast.error("Please select brand type");
      return;
    }

    if (formData.brandType === "Other" && !formData.brandTypeOther.trim()) {
      toast.error("Please specify the 'Other' brand type");
      return;
    }

    if (!formData.usesPorkOrDerivatives) {
      toast.error("Please answer: Do you produce product using pork or pork derivative?");
      return;
    }

    if (!formData.usesAnimalMeatOrDerivatives) {
      toast.error("Please answer: Do you produce product using animal meat or derivatives?");
      return;
    }

    if (!formData.usesGelatinOrCapsule) {
      toast.error("Please answer: Do you use gelatin or capsule in your product?");
      return;
    }

    if (!formData.containsAlcohol) {
      toast.error("Please answer: Does the product contain alcohol?");
      return;
    }

    if (!formData.additivesOrFlavourContainAlcohol) {
      toast.error("Please answer: Do the additives or flavour contain alcohol?");
      return;
    }

    if (!formData.usesGlycerineOrDerivatives) {
      toast.error("Please answer: Do you produce product using glycerine or its derivatives?");
      return;
    }

    if (formData.geographicMarkets.length === 0) {
      toast.error("Please select at least one geographic market");
      return;
    }

    if (formData.geographicMarkets.includes("Other") && !formData.geographicMarketsOther.trim()) {
      toast.error("Please specify the 'Other' geographic market");
      return;
    }

    if (!formData.authorizedBy.name) {
      toast.error("Please enter the name of the authorized person");
      return;
    }

    if (!formData.authorizedBy.positionTitle) {
      toast.error("Please enter the position/title of the authorized person");
      return;
    }

    try {
      setLoading(true);

      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      const applicationData = {
        ...formData,
        foodSafetyPrograms: formData.foodSafetyPrograms,
        geographicMarkets: formData.geographicMarkets,
        companyId: user.registrationNo,
        status: "Submitted",
      };

      const response = await axios.post(
        `${API_BASE_URL}/applications`,
        applicationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data._id) {
        toast.success("Application submitted successfully!");
        fetchApplications();
        
        setTimeout(() => {
          handleCloseForm();
        }, 2000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit application";
      toast.error(errorMessage);
      console.error("Error submitting application:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.registrationNo) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    if (!renewalData.existingApplication) {
      toast.error("Please select an application to renew");
      return;
    }

    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      const response = await axios.put(
        `${API_BASE_URL}/applications/renew/${renewalData.existingApplication}`,
        { reason: renewalData.reason }, // Optional: pass reason if backend needs it
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.status === "success") {
        toast.success("Renewal application created successfully!");
        fetchApplications();
        
        setTimeout(() => {
          handleCloseForm();
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to renew application");
      }
    } catch (err) {
      console.error("Error submitting renewal:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit renewal application";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this renewal application? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      
      const response = await axios.delete(
        `${API_BASE_URL}/applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        toast.success("Application cancelled and deleted successfully!");
        fetchApplications();
      }
    } catch (err) {
      console.error("Error deleting application:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to cancel application";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'submitted') return "#0077cc";
    if (statusLower === 'issued' || statusLower === 'certified' || statusLower === 'approved') return "#28a745";
    if (statusLower === 'renewal' || statusLower === 'renewal application' || statusLower === 'pending') return "#ff9900";
    if (statusLower === 'expired' || statusLower === 'rejected' || statusLower === 'revoked') return "#d93025";
    if (statusLower === 'pending review' || statusLower === "with shari'a board") return "#ffc107";
    return "#6c757d";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? "Invalid Date" 
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid Date";
    }
  };

  const handleClearFilters = () => {
    setSearchNumber("");
    setSearchDate("");
  };

  // View Modal Component
  const ViewApplicationModal = () => {
    if (!selectedApplication) return null;

    const getYesNoBadge = (value) => {
      return value === 'yes' 
        ? <span className="badge badge-success">Yes</span>
        : value === 'no' 
        ? <span className="badge badge-danger">No</span>
        : <span className="badge badge-secondary">Not specified</span>;
    };

    return (
      <div className="modal modal-large">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Application Details</h3>
            <button className="close-btn" onClick={handleCloseForm}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="modal-body">
            <div className="application-details">
              {/* Header with Status */}
              <div className="details-header">
                <div>
                  <h4>Application #{selectedApplication.applicationNumber}</h4>
                  <p className="text-muted">Submitted on {formatDate(selectedApplication.createdAt)}</p>
                </div>
                <span className="status-badge" style={{ 
                  backgroundColor: getStatusColor(selectedApplication.status) + '20',
                  color: getStatusColor(selectedApplication.status)
                }}>
                  {selectedApplication.status}
                </span>
              </div>

              {/* Basic Information */}
              <div className="details-section">
                <h5>Basic Information</h5>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Category</label>
                    <p>{selectedApplication.category || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Product</label>
                    <p>{selectedApplication.product || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Requested Date</label>
                    <p>{formatDate(selectedApplication.requestedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Halal Certification History */}
              <div className="details-section">
                <h5>Halal Certification History</h5>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Previously Applied?</label>
                    {getYesNoBadge(selectedApplication.hasAppliedBefore)}
                    {selectedApplication.hasAppliedBefore === 'yes' && (
                      <p className="mt-2"><strong>Agency:</strong> {selectedApplication.previousHalalAgency}</p>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Previously Supervised?</label>
                    {getYesNoBadge(selectedApplication.hasBeenSupervisedBefore)}
                    {selectedApplication.hasBeenSupervisedBefore === 'yes' && (
                      <p className="mt-2"><strong>Agency:</strong> {selectedApplication.supervisingHalalAgency}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Food Safety Programs */}
              <div className="details-section">
                <h5>Food Safety Programs</h5>
                <div className="tags-container">
                  {selectedApplication.foodSafetyPrograms?.map((program, index) => (
                    <span key={index} className="tag">{program}</span>
                  ))}
                  {selectedApplication.foodSafetyPrograms?.includes('Other') && selectedApplication.otherFoodSafetyProgram && (
                    <span className="tag tag-other">Other: {selectedApplication.otherFoodSafetyProgram}</span>
                  )}
                </div>
              </div>

              {/* Market & Brand */}
              <div className="details-section">
                <h5>Market & Brand</h5>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Market Type</label>
                    <p>{selectedApplication.marketType}{selectedApplication.marketType === 'Other' && selectedApplication.marketTypeOther ? `: ${selectedApplication.marketTypeOther}` : ''}</p>
                  </div>
                  <div className="detail-item">
                    <label>Brand Type</label>
                    <p>{selectedApplication.brandType}{selectedApplication.brandType === 'Other' && selectedApplication.brandTypeOther ? `: ${selectedApplication.brandTypeOther}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Product Composition */}
              <div className="details-section">
                <h5>Product Composition</h5>
                <div className="composition-grid">
                  <div className="composition-item">
                    <span className="label">Pork/Derivatives:</span>
                    {getYesNoBadge(selectedApplication.usesPorkOrDerivatives)}
                  </div>
                  <div className="composition-item">
                    <span className="label">Animal Meat/Derivatives:</span>
                    {getYesNoBadge(selectedApplication.usesAnimalMeatOrDerivatives)}
                  </div>
                  <div className="composition-item">
                    <span className="label">Gelatin/Capsule:</span>
                    {getYesNoBadge(selectedApplication.usesGelatinOrCapsule)}
                  </div>
                  <div className="composition-item">
                    <span className="label">Contains Alcohol:</span>
                    {getYesNoBadge(selectedApplication.containsAlcohol)}
                  </div>
                  <div className="composition-item">
                    <span className="label">Additives/Flavour contain Alcohol:</span>
                    {getYesNoBadge(selectedApplication.additivesOrFlavourContainAlcohol)}
                  </div>
                  <div className="composition-item">
                    <span className="label">Glycerine/Derivatives:</span>
                    {getYesNoBadge(selectedApplication.usesGlycerineOrDerivatives)}
                  </div>
                </div>
              </div>

              {/* Geographic Markets */}
              <div className="details-section">
                <h5>Geographic Markets</h5>
                <div className="tags-container">
                  {selectedApplication.geographicMarkets?.map((market, index) => (
                    <span key={index} className="tag">{market}</span>
                  ))}
                  {selectedApplication.geographicMarkets?.includes('Other') && selectedApplication.geographicMarketsOther && (
                    <span className="tag tag-other">Other: {selectedApplication.geographicMarketsOther}</span>
                  )}
                </div>
              </div>

              {/* Manufacturing Facility */}
              {selectedApplication.manufacturingFacility && Object.keys(selectedApplication.manufacturingFacility).length > 0 && (
                <div className="details-section">
                  <h5>Manufacturing Facility</h5>
                  <div className="facility-details">
                    <p><strong>Name:</strong> {selectedApplication.manufacturingFacility.companyName || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedApplication.manufacturingFacility.address || 'N/A'}</p>
                    <p><strong>Location:</strong> {[
                      selectedApplication.manufacturingFacility.localGovtArea,
                      selectedApplication.manufacturingFacility.city,
                      selectedApplication.manufacturingFacility.state,
                      selectedApplication.manufacturingFacility.country
                    ].filter(Boolean).join(', ') || 'N/A'}</p>
                    <p><strong>Contact:</strong> {selectedApplication.manufacturingFacility.plantContact || 'N/A'}</p>
                    <p><strong>Position:</strong> {selectedApplication.manufacturingFacility.positionTitle || 'N/A'}</p>
                    <p><strong>Telephone:</strong> {selectedApplication.manufacturingFacility.telephoneNo || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedApplication.manufacturingFacility.emailAddress || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Additional Facilities */}
              {selectedApplication.additionalFacilities?.length > 0 && (
                <div className="details-section">
                  <h5>Additional Facilities ({selectedApplication.additionalFacilities.length})</h5>
                  {selectedApplication.additionalFacilities.map((facility, index) => (
                    <div key={index} className="facility-item">
                      <h6>Facility #{index + 1}</h6>
                      <p><strong>Name:</strong> {facility.companyName || 'N/A'}</p>
                      <p><strong>Address:</strong> {facility.address || 'N/A'}</p>
                      <p><strong>Contact:</strong> {facility.plantContact || 'N/A'}</p>
                      <p><strong>Telephone:</strong> {facility.telephoneNo || 'N/A'}</p>
                      <p><strong>Email:</strong> {facility.emailAddress || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Packaging Plant */}
              {selectedApplication.packagingPlant && Object.keys(selectedApplication.packagingPlant).length > 0 && (
                <div className="details-section">
                  <h5>Packaging Plant</h5>
                  <div className="facility-details">
                    <p><strong>Name:</strong> {selectedApplication.packagingPlant.companyName || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedApplication.packagingPlant.address || 'N/A'}</p>
                    <p><strong>Contact:</strong> {selectedApplication.packagingPlant.plantContact || 'N/A'}</p>
                    <p><strong>Telephone:</strong> {selectedApplication.packagingPlant.telephoneNo || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedApplication.packagingPlant.emailAddress || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Authorized By */}
              {selectedApplication.authorizedBy && (
                <div className="details-section">
                  <h5>Authorized By</h5>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Name</label>
                      <p>{selectedApplication.authorizedBy.name || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Position/Title</label>
                      <p>{selectedApplication.authorizedBy.positionTitle || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Date Authorized</label>
                      <p>{formatDate(selectedApplication.authorizedBy.dateAuthorized)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedApplication.description && (
                <div className="details-section">
                  <h5>Additional Notes</h5>
                  <p className="description-text">{selectedApplication.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="btn btn-primary"
              onClick={() => {
                handleCloseForm();
                handleEditApplication(selectedApplication._id);
              }}
            >
              <i className="fas fa-edit"></i> Edit Application
            </button>
            <button className="btn btn-secondary" onClick={handleCloseForm}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dash">
      <Sidebar activeApp="active" />
      <main className="content cert">
        <div className="manage-applications">
          <div className="header">
            <h2>Manage Applications</h2>
            <div className="header-actions">
              <button 
                className="renew-btn" 
                onClick={handleRenewApplication}
                disabled={applications.filter(app => ["approved", "certified", "issued", "expired"].includes(app.status.toLowerCase())).length === 0 || productsLoading}
                title={applications.filter(app => ["approved", "certified", "issued", "expired"].includes(app.status)).length === 0 ? "No eligible applications found for renewal" : ""}
              >
                <i className="fas fa-sync-alt"></i> Renew
              </button>
              
              <div className="tooltip-wrapper">
                <button 
                  className="new-btn" 
                  onClick={handleNewApplication}
                >
                  <i className="fas fa-plus"></i> New Application
                </button>
              </div>
            </div>
          </div>

          <div className="search-box">
            <div className="field">
              <label>Application Number</label>
              <input
                type="text"
                placeholder="Search..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Application Date</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                
              />
            </div>
            <button 
              className="search-btn"
              onClick={handleClearFilters}
            >
              <i className="fas fa-times"></i> Clear
            </button>
          </div>

          <div className="table-wrapper">
            <div className="table-header">
              <h3>Applications ({filteredApplications.length})</h3>
              <div className="table-actions">
                <button 
                  className="action-btn" 
                  onClick={fetchApplications}
                  disabled={loading}
                >
                  <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> Loading applications...
              </div>
            ) : (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>App Number</th>
                    <th>Category</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <span className="app-number">{app.applicationNumber || "N/A"}</span>
                      </td>
                      <td>{app.category || "N/A"}</td>
                      <td>{app.product || "N/A"}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getStatusColor(app.status) + '20',
                            color: getStatusColor(app.status)
                          }}
                        >
                          {app.status || "Unknown"}
                        </span>
                      </td>
                      <td>{formatDate(app.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="view-btn" 
                            title="View Details"
                            onClick={() => handleViewApplication(app._id)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {(app.status === "Submitted" || app.status === "Pending Review") && (
                            <button 
                              className="edit-btn" 
                              title="Edit Application"
                              onClick={() => handleEditApplication(app._id)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                          {(app.status.toLowerCase() === "renewal" || app.status.toLowerCase() === "renewal application") && (
                            <button 
                              className="delete-btn" 
                              title="Cancel Renewal"
                              onClick={() => handleDeleteApplication(app._id)}
                              style={{ color: '#d93025' }}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {applications.length === 0 ? "No applications found" : "No matching applications"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* New Application Modal */}
        {showApplicationForm && (
          <div className="modal modal-large">
            <div className="modal-content">
              <div className="modal-header">
                <h3>New Halal Certification Application</h3>
                <button 
                  className="close-btn" 
                  onClick={handleCloseForm}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="application-form">
                <div className="form-sections">
                  {/* Basic Information */}
                  <div className="form-section">
                    <h4>Basic Information</h4>
                    
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        disabled
                      >
                        <option value="">Select Category</option>
                        {applicationCategories.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* <div className="form-group">
                      <label>Product *</label>
                      <select
                        name="product"
                        value={formData.product}
                        onChange={handleInputChange}
                        // required
                        disabled={loading || productsLoading}
                      >
                        <option value="">Select Product</option>
                        {productsLoading ? (
                          <option value="" disabled>Loading products...</option>
                        ) : products.length > 0 ? (
                          products.map((prod) => (
                            <option key={prod._id} value={prod.name}>{prod.name}</option>
                          ))
                        ) : (
                          <option value="" disabled>No products found</option>
                        )}
                      </select>
                    </div> */}

                    <div className="form-group">
                      <label>Requested Date *</label>
                      <input
                        type="date"
                        name="requestedDate"
                        value={formData.requestedDate}
                        onChange={handleInputChange}
                        required
                        disabled
                      />
                    </div>
                  </div>

                  {/* Halal Certification History */}
                  <div className="form-section">
                    <h4>Halal Certification History</h4>
                    
                    <div className="form-group">
                      <label>
                        (1) Has the company ever applied for Halal certification previously? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasAppliedBefore"
                            value="yes"
                            checked={formData.hasAppliedBefore === "yes"}
                            onChange={() => handleRadioChange("hasAppliedBefore", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasAppliedBefore"
                            value="no"
                            checked={formData.hasAppliedBefore === "no"}
                            onChange={() => handleRadioChange("hasAppliedBefore", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                      
                      {formData.hasAppliedBefore === "yes" && (
                        <div className="conditional-field">
                          <label>If yes, please state the Halal agency that was previously applied to *</label>
                          <input
                            type="text"
                            name="previousHalalAgency"
                            value={formData.previousHalalAgency}
                            onChange={handleInputChange}
                            placeholder="Enter Halal agency name"
                            disabled={loading}
                            required={formData.hasAppliedBefore === "yes"}
                          />
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        (2) Has the factory ever been supervised before, either on a yearly basis or for a specific batch production for another buyer? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasBeenSupervisedBefore"
                            value="yes"
                            checked={formData.hasBeenSupervisedBefore === "yes"}
                            onChange={() => handleRadioChange("hasBeenSupervisedBefore", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasBeenSupervisedBefore"
                            value="no"
                            checked={formData.hasBeenSupervisedBefore === "no"}
                            onChange={() => handleRadioChange("hasBeenSupervisedBefore", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                      
                      {formData.hasBeenSupervisedBefore === "yes" && (
                        <div className="conditional-field">
                          <label>If yes, please state the Halal agency that was certifying *</label>
                          <input
                            type="text"
                            name="supervisingHalalAgency"
                            value={formData.supervisingHalalAgency}
                            onChange={handleInputChange}
                            placeholder="Enter Halal agency name"
                            disabled={loading}
                            required={formData.hasBeenSupervisedBefore === "yes"}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Food Safety Programs */}
                  <div className="form-section">
                    <h4>Food Safety Programs</h4>
                    
                    <div className="form-group">
                      <label>
                        Please state all food safety programs implemented at the factory *
                      </label>
                      
                      <div className="checkbox-group">
                        {foodSafetyProgramOptions.map((program) => (
                          <label key={program} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={formData.foodSafetyPrograms.includes(program)}
                              onChange={() => handleFoodSafetyProgramChange(program)}
                              disabled={loading}
                            />
                            <span>{program}</span>
                          </label>
                        ))}
                      </div>
                      
                      {formData.foodSafetyPrograms.includes("Other") && (
                        <div className="conditional-field">
                          <label>Please specify other food safety program *</label>
                          <input
                            type="text"
                            name="otherFoodSafetyProgram"
                            value={formData.otherFoodSafetyProgram}
                            onChange={handleInputChange}
                            placeholder="Specify other food safety program"
                            disabled={loading}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Market Type */}
                  <div className="form-section">
                    <h4>Market Type</h4>
                    
                    <div className="form-group">
                      <label>Market Type *</label>
                      <select
                        name="marketType"
                        value={formData.marketType}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Market Type</option>
                        {marketTypeOptions.map((type, i) => (
                          <option key={i} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {formData.marketType === "Other" && (
                      <div className="form-group">
                        <label>Please specify market type *</label>
                        <input
                          type="text"
                          name="marketTypeOther"
                          value={formData.marketTypeOther}
                          onChange={handleInputChange}
                          placeholder="Specify market type"
                          disabled={loading}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Brand Information */}
                  <div className="form-section">
                    <h4>Brand Information</h4>
                    
                    <div className="form-group">
                      <label>Brand Type *</label>
                      <select
                        name="brandType"
                        value={formData.brandType}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Brand Type</option>
                        {brandTypeOptions.map((type, i) => (
                          <option key={i} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {formData.brandType === "Other" && (
                      <div className="form-group">
                        <label>Please specify brand type *</label>
                        <input
                          type="text"
                          name="brandTypeOther"
                          value={formData.brandTypeOther}
                          onChange={handleInputChange}
                          placeholder="Specify brand type"
                          disabled={loading}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Composition */}
                  <div className="form-section">
                    <h4>Product Composition</h4>
                    
                    <div className="form-group">
                      <label>
                        (7) Do you produce product using pork or pork derivative in your factory? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesPorkOrDerivatives"
                            value="yes"
                            checked={formData.usesPorkOrDerivatives === "yes"}
                            onChange={() => handleRadioChange("usesPorkOrDerivatives", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesPorkOrDerivatives"
                            value="no"
                            checked={formData.usesPorkOrDerivatives === "no"}
                            onChange={() => handleRadioChange("usesPorkOrDerivatives", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (8) Do you produce product using animal meat or animal derivatives such as beef, chicken, deer or mutton? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesAnimalMeatOrDerivatives"
                            value="yes"
                            checked={formData.usesAnimalMeatOrDerivatives === "yes"}
                            onChange={() => handleRadioChange("usesAnimalMeatOrDerivatives", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesAnimalMeatOrDerivatives"
                            value="no"
                            checked={formData.usesAnimalMeatOrDerivatives === "no"}
                            onChange={() => handleRadioChange("usesAnimalMeatOrDerivatives", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (9) Do you use gelatin or capsule in your product? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGelatinOrCapsule"
                            value="yes"
                            checked={formData.usesGelatinOrCapsule === "yes"}
                            onChange={() => handleRadioChange("usesGelatinOrCapsule", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGelatinOrCapsule"
                            value="no"
                            checked={formData.usesGelatinOrCapsule === "no"}
                            onChange={() => handleRadioChange("usesGelatinOrCapsule", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (10) Does the product contain alcohol? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="containsAlcohol"
                            value="yes"
                            checked={formData.containsAlcohol === "yes"}
                            onChange={() => handleRadioChange("containsAlcohol", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="containsAlcohol"
                            value="no"
                            checked={formData.containsAlcohol === "no"}
                            onChange={() => handleRadioChange("containsAlcohol", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (11) Does the additives or flavour in the product contain alcohol? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="additivesOrFlavourContainAlcohol"
                            value="yes"
                            checked={formData.additivesOrFlavourContainAlcohol === "yes"}
                            onChange={() => handleRadioChange("additivesOrFlavourContainAlcohol", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="additivesOrFlavourContainAlcohol"
                            value="no"
                            checked={formData.additivesOrFlavourContainAlcohol === "no"}
                            onChange={() => handleRadioChange("additivesOrFlavourContainAlcohol", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (12) Do you produce product using glycerine or its derivatives? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGlycerineOrDerivatives"
                            value="yes"
                            checked={formData.usesGlycerineOrDerivatives === "yes"}
                            onChange={() => handleRadioChange("usesGlycerineOrDerivatives", "yes")}
                            disabled={loading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGlycerineOrDerivatives"
                            value="no"
                            checked={formData.usesGlycerineOrDerivatives === "no"}
                            onChange={() => handleRadioChange("usesGlycerineOrDerivatives", "no")}
                            disabled={loading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Geographic Markets */}
                  <div className="form-section">
                    <h4>Geographic Markets</h4>
                    
                    <div className="form-group">
                      <label>
                        Please list all geographic areas where the product is or will be marketed *
                      </label>
                      
                      <div className="checkbox-group">
                        {geographicMarketOptions.map((market) => (
                          <label key={market} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={formData.geographicMarkets.includes(market)}
                              onChange={() => handleGeographicMarketChange(market)}
                              disabled={loading}
                            />
                            <span>{market}</span>
                          </label>
                        ))}
                      </div>
                      
                      {formData.geographicMarkets.includes("Other") && (
                        <div className="conditional-field">
                          <label>Please specify other geographic market *</label>
                          <input
                            type="text"
                            name="geographicMarketsOther"
                            value={formData.geographicMarketsOther}
                            onChange={handleInputChange}
                            placeholder="Specify geographic market"
                            disabled={loading}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manufacturing Facility */}
                  <div className="form-section">
                    <h4>Manufacturing Facility Information</h4>
                    
                    <div className="form-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={formData.manufacturingFacilitySame}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            manufacturingFacilitySame: e.target.checked 
                          }))}
                          disabled={loading}
                        />
                        <span>Same as company address</span>
                      </label>
                    </div>

                    {!formData.manufacturingFacilitySame && (
                      <div className="facility-fields">
                        <div className="form-group">
                          <label>Company / Plant Name</label>
                          <input
                            type="text"
                            name="manufacturingFacility.companyName"
                            value={formData.manufacturingFacility.companyName}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                        </div>

                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            name="manufacturingFacility.address"
                            value={formData.manufacturingFacility.address}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Local Govt. Area</label>
                            <input
                              type="text"
                              name="manufacturingFacility.localGovtArea"
                              value={formData.manufacturingFacility.localGovtArea}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              name="manufacturingFacility.city"
                              value={formData.manufacturingFacility.city}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              name="manufacturingFacility.state"
                              value={formData.manufacturingFacility.state}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Country</label>
                            <input
                              type="text"
                              name="manufacturingFacility.country"
                              value={formData.manufacturingFacility.country}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Plant Contact</label>
                            <input
                              type="text"
                              name="manufacturingFacility.plantContact"
                              value={formData.manufacturingFacility.plantContact}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Position/Title</label>
                            <input
                              type="text"
                              name="manufacturingFacility.positionTitle"
                              value={formData.manufacturingFacility.positionTitle}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Telephone No.</label>
                            <input
                              type="tel"
                              name="manufacturingFacility.telephoneNo"
                              value={formData.manufacturingFacility.telephoneNo}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              name="manufacturingFacility.emailAddress"
                              value={formData.manufacturingFacility.emailAddress}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Web Address</label>
                            <input
                              type="url"
                              name="manufacturingFacility.webAddress"
                              value={formData.manufacturingFacility.webAddress}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Government Plant Code</label>
                            <input
                              type="text"
                              name="manufacturingFacility.governmentPlantCode"
                              value={formData.manufacturingFacility.governmentPlantCode}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Facilities */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4>Additional Manufacturing Locations</h4>
                      <button
                        type="button"
                        className="btn-add"
                        onClick={addAdditionalFacility}
                        disabled={loading}
                      >
                        <i className="fas fa-plus"></i> Add Facility
                      </button>
                    </div>

                    {formData.additionalFacilities.map((facility, index) => (
                      <div key={index} className="facility-item">
                        <div className="facility-header">
                          <h5>Facility #{index + 1}</h5>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeAdditionalFacility(index)}
                            disabled={loading}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>

                        <div className="form-group">
                          <label>Company / Plant Name</label>
                          <input
                            type="text"
                            value={facility.companyName}
                            onChange={(e) => updateAdditionalFacility(index, 'companyName', e.target.value)}
                            disabled={loading}
                          />
                        </div>

                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            value={facility.address}
                            onChange={(e) => updateAdditionalFacility(index, 'address', e.target.value)}
                            disabled={loading}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Local Govt. Area</label>
                            <input
                              type="text"
                              value={facility.localGovtArea}
                              onChange={(e) => updateAdditionalFacility(index, 'localGovtArea', e.target.value)}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              value={facility.city}
                              onChange={(e) => updateAdditionalFacility(index, 'city', e.target.value)}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              value={facility.state}
                              onChange={(e) => updateAdditionalFacility(index, 'state', e.target.value)}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Country</label>
                            <input
                              type="text"
                              value={facility.country}
                              onChange={(e) => updateAdditionalFacility(index, 'country', e.target.value)}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Plant Contact</label>
                            <input
                              type="text"
                              value={facility.plantContact}
                              onChange={(e) => updateAdditionalFacility(index, 'plantContact', e.target.value)}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Position/Title</label>
                            <input
                              type="text"
                              value={facility.positionTitle}
                              onChange={(e) => updateAdditionalFacility(index, 'positionTitle', e.target.value)}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Telephone No.</label>
                            <input
                              type="tel"
                              value={facility.telephoneNo}
                              onChange={(e) => updateAdditionalFacility(index, 'telephoneNo', e.target.value)}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              value={facility.emailAddress}
                              onChange={(e) => updateAdditionalFacility(index, 'emailAddress', e.target.value)}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Packaging Plant */}
                  <div className="form-section">
                    <h4>Packaging Plant</h4>
                    
                    <div className="form-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={formData.hasSeparatePackagingPlant}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            hasSeparatePackagingPlant: e.target.checked 
                          }))}
                          disabled={loading}
                        />
                        <span>Has separate packaging plant</span>
                      </label>
                    </div>

                    {formData.hasSeparatePackagingPlant && (
                      <div className="facility-fields">
                        <div className="form-group">
                          <label>Company / Plant Name</label>
                          <input
                            type="text"
                            name="packagingPlant.companyName"
                            value={formData.packagingPlant.companyName}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                        </div>

                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            name="packagingPlant.address"
                            value={formData.packagingPlant.address}
                            onChange={handleInputChange}
                            disabled={loading}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Local Govt. Area</label>
                            <input
                              type="text"
                              name="packagingPlant.localGovtArea"
                              value={formData.packagingPlant.localGovtArea}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              name="packagingPlant.city"
                              value={formData.packagingPlant.city}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              name="packagingPlant.state"
                              value={formData.packagingPlant.state}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Country</label>
                            <input
                              type="text"
                              name="packagingPlant.country"
                              value={formData.packagingPlant.country}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Plant Contact</label>
                            <input
                              type="text"
                              name="packagingPlant.plantContact"
                              value={formData.packagingPlant.plantContact}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Position/Title</label>
                            <input
                              type="text"
                              name="packagingPlant.positionTitle"
                              value={formData.packagingPlant.positionTitle}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Telephone No.</label>
                            <input
                              type="tel"
                              name="packagingPlant.telephoneNo"
                              value={formData.packagingPlant.telephoneNo}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              name="packagingPlant.emailAddress"
                              value={formData.packagingPlant.emailAddress}
                              onChange={handleInputChange}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Authorized By */}
                  <div className="form-section">
                    <h4>Application Authorized By</h4>
                    
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        name="authorizedBy.name"
                        value={formData.authorizedBy.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date Authorized *</label>
                      <input
                        type="date"
                        name="authorizedBy.dateAuthorized"
                        value={formData.authorizedBy.dateAuthorized}
                        onChange={handleInputChange}
                        disabled
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Position/Title *</label>
                      <input
                        type="text"
                        name="authorizedBy.positionTitle"
                        value={formData.authorizedBy.positionTitle}
                        onChange={handleInputChange}
                        placeholder="Enter position/title"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Additional details..."
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={handleCloseForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-submit" 
                    disabled={loading || !formData.category || !formData.hasAppliedBefore || !formData.hasBeenSupervisedBefore || formData.foodSafetyPrograms.length === 0 || !formData.marketType || !formData.brandType || !formData.usesPorkOrDerivatives || !formData.usesAnimalMeatOrDerivatives || !formData.usesGelatinOrCapsule || !formData.containsAlcohol || !formData.additivesOrFlavourContainAlcohol || !formData.usesGlycerineOrDerivatives || formData.geographicMarkets.length === 0 || !formData.authorizedBy.name || !formData.authorizedBy.positionTitle}
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Application Modal */}
        {showEditModal && (
          <div className="modal modal-large">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Application</h3>
                <button 
                  className="close-btn" 
                  onClick={handleCloseForm}
                  disabled={editLoading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="application-form">
                <div className="form-sections">
                  {/* Same form fields as New Application Modal */}
                  {/* Basic Information */}
                  <div className="form-section">
                    <h4>Basic Information</h4>
                    
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        disabled
                      >
                        <option value="">Select Category</option>
                        {applicationCategories.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Product *</label>
                      <select
                        name="product"
                        value={formData.product}
                        onChange={handleInputChange}
                        // required
                        disabled={editLoading || productsLoading}
                      >
                        <option value="">Select Product</option>
                        {productsLoading ? (
                          <option value="" disabled>Loading products...</option>
                        ) : products.length > 0 ? (
                          products.map((prod) => (
                            <option key={prod._id} value={prod.name}>{prod.name}</option>
                          ))
                        ) : (
                          <option value="" disabled>No products found</option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Requested Date *</label>
                      <input
                        type="date"
                        name="requestedDate"
                        value={formData.requestedDate}
                        onChange={handleInputChange}
                        required
                        disabled
                      />
                    </div>
                  </div>

                  {/* Halal Certification History */}
                  <div className="form-section">
                    <h4>Halal Certification History</h4>
                    
                    <div className="form-group">
                      <label>
                        (1) Has the company ever applied for Halal certification previously? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasAppliedBefore"
                            value="yes"
                            checked={formData.hasAppliedBefore === "yes"}
                            onChange={() => handleRadioChange("hasAppliedBefore", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasAppliedBefore"
                            value="no"
                            checked={formData.hasAppliedBefore === "no"}
                            onChange={() => handleRadioChange("hasAppliedBefore", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                      
                      {formData.hasAppliedBefore === "yes" && (
                        <div className="conditional-field">
                          <label>If yes, please state the Halal agency that was previously applied to *</label>
                          <input
                            type="text"
                            name="previousHalalAgency"
                            value={formData.previousHalalAgency}
                            onChange={handleInputChange}
                            placeholder="Enter Halal agency name"
                            disabled={editLoading}
                            required={formData.hasAppliedBefore === "yes"}
                          />
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        (2) Has the factory ever been supervised before, either on a yearly basis or for a specific batch production for another buyer? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasBeenSupervisedBefore"
                            value="yes"
                            checked={formData.hasBeenSupervisedBefore === "yes"}
                            onChange={() => handleRadioChange("hasBeenSupervisedBefore", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="hasBeenSupervisedBefore"
                            value="no"
                            checked={formData.hasBeenSupervisedBefore === "no"}
                            onChange={() => handleRadioChange("hasBeenSupervisedBefore", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                      
                      {formData.hasBeenSupervisedBefore === "yes" && (
                        <div className="conditional-field">
                          <label>If yes, please state the Halal agency that was certifying *</label>
                          <input
                            type="text"
                            name="supervisingHalalAgency"
                            value={formData.supervisingHalalAgency}
                            onChange={handleInputChange}
                            placeholder="Enter Halal agency name"
                            disabled={editLoading}
                            required={formData.hasBeenSupervisedBefore === "yes"}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Food Safety Programs */}
                  <div className="form-section">
                    <h4>Food Safety Programs</h4>
                    
                    <div className="form-group">
                      <label>
                        Please state all food safety programs implemented at the factory *
                      </label>
                      
                      <div className="checkbox-group">
                        {foodSafetyProgramOptions.map((program) => (
                          <label key={program} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={formData.foodSafetyPrograms.includes(program)}
                              onChange={() => handleFoodSafetyProgramChange(program)}
                              disabled={editLoading}
                            />
                            <span>{program}</span>
                          </label>
                        ))}
                      </div>
                      
                      {formData.foodSafetyPrograms.includes("Other") && (
                        <div className="conditional-field">
                          <label>Please specify other food safety program *</label>
                          <input
                            type="text"
                            name="otherFoodSafetyProgram"
                            value={formData.otherFoodSafetyProgram}
                            onChange={handleInputChange}
                            placeholder="Specify other food safety program"
                            disabled={editLoading}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Market Type */}
                  <div className="form-section">
                    <h4>Market Type</h4>
                    
                    <div className="form-group">
                      <label>Market Type *</label>
                      <select
                        name="marketType"
                        value={formData.marketType}
                        onChange={handleInputChange}
                        required
                        disabled={editLoading}
                      >
                        <option value="">Select Market Type</option>
                        {marketTypeOptions.map((type, i) => (
                          <option key={i} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {formData.marketType === "Other" && (
                      <div className="form-group">
                        <label>Please specify market type *</label>
                        <input
                          type="text"
                          name="marketTypeOther"
                          value={formData.marketTypeOther}
                          onChange={handleInputChange}
                          placeholder="Specify market type"
                          disabled={editLoading}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Brand Information */}
                  <div className="form-section">
                    <h4>Brand Information</h4>
                    
                    <div className="form-group">
                      <label>Brand Type *</label>
                      <select
                        name="brandType"
                        value={formData.brandType}
                        onChange={handleInputChange}
                        required
                        disabled={editLoading}
                      >
                        <option value="">Select Brand Type</option>
                        {brandTypeOptions.map((type, i) => (
                          <option key={i} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {formData.brandType === "Other" && (
                      <div className="form-group">
                        <label>Please specify brand type *</label>
                        <input
                          type="text"
                          name="brandTypeOther"
                          value={formData.brandTypeOther}
                          onChange={handleInputChange}
                          placeholder="Specify brand type"
                          disabled={editLoading}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Composition */}
                  <div className="form-section">
                    <h4>Product Composition</h4>
                    
                    <div className="form-group">
                      <label>
                        (7) Do you produce product using pork or pork derivative in your factory? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesPorkOrDerivatives"
                            value="yes"
                            checked={formData.usesPorkOrDerivatives === "yes"}
                            onChange={() => handleRadioChange("usesPorkOrDerivatives", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesPorkOrDerivatives"
                            value="no"
                            checked={formData.usesPorkOrDerivatives === "no"}
                            onChange={() => handleRadioChange("usesPorkOrDerivatives", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (8) Do you produce product using animal meat or animal derivatives such as beef, chicken, deer or mutton? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesAnimalMeatOrDerivatives"
                            value="yes"
                            checked={formData.usesAnimalMeatOrDerivatives === "yes"}
                            onChange={() => handleRadioChange("usesAnimalMeatOrDerivatives", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesAnimalMeatOrDerivatives"
                            value="no"
                            checked={formData.usesAnimalMeatOrDerivatives === "no"}
                            onChange={() => handleRadioChange("usesAnimalMeatOrDerivatives", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (9) Do you use gelatin or capsule in your product? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGelatinOrCapsule"
                            value="yes"
                            checked={formData.usesGelatinOrCapsule === "yes"}
                            onChange={() => handleRadioChange("usesGelatinOrCapsule", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGelatinOrCapsule"
                            value="no"
                            checked={formData.usesGelatinOrCapsule === "no"}
                            onChange={() => handleRadioChange("usesGelatinOrCapsule", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (10) Does the product contain alcohol? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="containsAlcohol"
                            value="yes"
                            checked={formData.containsAlcohol === "yes"}
                            onChange={() => handleRadioChange("containsAlcohol", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="containsAlcohol"
                            value="no"
                            checked={formData.containsAlcohol === "no"}
                            onChange={() => handleRadioChange("containsAlcohol", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (11) Does the additives or flavour in the product contain alcohol? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="additivesOrFlavourContainAlcohol"
                            value="yes"
                            checked={formData.additivesOrFlavourContainAlcohol === "yes"}
                            onChange={() => handleRadioChange("additivesOrFlavourContainAlcohol", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="additivesOrFlavourContainAlcohol"
                            value="no"
                            checked={formData.additivesOrFlavourContainAlcohol === "no"}
                            onChange={() => handleRadioChange("additivesOrFlavourContainAlcohol", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        (12) Do you produce product using glycerine or its derivatives? *
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGlycerineOrDerivatives"
                            value="yes"
                            checked={formData.usesGlycerineOrDerivatives === "yes"}
                            onChange={() => handleRadioChange("usesGlycerineOrDerivatives", "yes")}
                            disabled={editLoading}
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="usesGlycerineOrDerivatives"
                            value="no"
                            checked={formData.usesGlycerineOrDerivatives === "no"}
                            onChange={() => handleRadioChange("usesGlycerineOrDerivatives", "no")}
                            disabled={editLoading}
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Geographic Markets */}
                  <div className="form-section">
                    <h4>Geographic Markets</h4>
                    
                    <div className="form-group">
                      <label>
                        Please list all geographic areas where the product is or will be marketed *
                      </label>
                      
                      <div className="checkbox-group">
                        {geographicMarketOptions.map((market) => (
                          <label key={market} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={formData.geographicMarkets.includes(market)}
                              onChange={() => handleGeographicMarketChange(market)}
                              disabled={editLoading}
                            />
                            <span>{market}</span>
                          </label>
                        ))}
                      </div>
                      
                      {formData.geographicMarkets.includes("Other") && (
                        <div className="conditional-field">
                          <label>Please specify other geographic market *</label>
                          <input
                            type="text"
                            name="geographicMarketsOther"
                            value={formData.geographicMarketsOther}
                            onChange={handleInputChange}
                            placeholder="Specify geographic market"
                            disabled={editLoading}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manufacturing Facility */}
                  <div className="form-section">
                    <h4>Manufacturing Facility Information</h4>
                    
                    <div className="form-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={formData.manufacturingFacilitySame}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            manufacturingFacilitySame: e.target.checked 
                          }))}
                          disabled={editLoading}
                        />
                        <span>Same as company address</span>
                      </label>
                    </div>

                    {!formData.manufacturingFacilitySame && (
                      <div className="facility-fields">
                        <div className="form-group">
                          <label>Company / Plant Name</label>
                          <input
                            type="text"
                            name="manufacturingFacility.companyName"
                            value={formData.manufacturingFacility.companyName}
                            onChange={handleInputChange}
                            disabled={editLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            name="manufacturingFacility.address"
                            value={formData.manufacturingFacility.address}
                            onChange={handleInputChange}
                            disabled={editLoading}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Local Govt. Area</label>
                            <input
                              type="text"
                              name="manufacturingFacility.localGovtArea"
                              value={formData.manufacturingFacility.localGovtArea}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              name="manufacturingFacility.city"
                              value={formData.manufacturingFacility.city}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              name="manufacturingFacility.state"
                              value={formData.manufacturingFacility.state}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Country</label>
                            <input
                              type="text"
                              name="manufacturingFacility.country"
                              value={formData.manufacturingFacility.country}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Plant Contact</label>
                            <input
                              type="text"
                              name="manufacturingFacility.plantContact"
                              value={formData.manufacturingFacility.plantContact}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Position/Title</label>
                            <input
                              type="text"
                              name="manufacturingFacility.positionTitle"
                              value={formData.manufacturingFacility.positionTitle}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Telephone No.</label>
                            <input
                              type="tel"
                              name="manufacturingFacility.telephoneNo"
                              value={formData.manufacturingFacility.telephoneNo}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              name="manufacturingFacility.emailAddress"
                              value={formData.manufacturingFacility.emailAddress}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Web Address</label>
                            <input
                              type="url"
                              name="manufacturingFacility.webAddress"
                              value={formData.manufacturingFacility.webAddress}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Government Plant Code</label>
                            <input
                              type="text"
                              name="manufacturingFacility.governmentPlantCode"
                              value={formData.manufacturingFacility.governmentPlantCode}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Facilities */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4>Additional Manufacturing Locations</h4>
                      <button
                        type="button"
                        className="btn-add"
                        onClick={addAdditionalFacility}
                        disabled={editLoading}
                      >
                        <i className="fas fa-plus"></i> Add Facility
                      </button>
                    </div>

                    {formData.additionalFacilities.map((facility, index) => (
                      <div key={index} className="facility-item">
                        <div className="facility-header">
                          <h5>Facility #{index + 1}</h5>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeAdditionalFacility(index)}
                            disabled={editLoading}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>

                        <div className="form-group">
                          <label>Company / Plant Name</label>
                          <input
                            type="text"
                            value={facility.companyName}
                            onChange={(e) => updateAdditionalFacility(index, 'companyName', e.target.value)}
                            disabled={editLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            value={facility.address}
                            onChange={(e) => updateAdditionalFacility(index, 'address', e.target.value)}
                            disabled={editLoading}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Local Govt. Area</label>
                            <input
                              type="text"
                              value={facility.localGovtArea}
                              onChange={(e) => updateAdditionalFacility(index, 'localGovtArea', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              value={facility.city}
                              onChange={(e) => updateAdditionalFacility(index, 'city', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              value={facility.state}
                              onChange={(e) => updateAdditionalFacility(index, 'state', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Country</label>
                            <input
                              type="text"
                              value={facility.country}
                              onChange={(e) => updateAdditionalFacility(index, 'country', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Plant Contact</label>
                            <input
                              type="text"
                              value={facility.plantContact}
                              onChange={(e) => updateAdditionalFacility(index, 'plantContact', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Position/Title</label>
                            <input
                              type="text"
                              value={facility.positionTitle}
                              onChange={(e) => updateAdditionalFacility(index, 'positionTitle', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Telephone No.</label>
                            <input
                              type="tel"
                              value={facility.telephoneNo}
                              onChange={(e) => updateAdditionalFacility(index, 'telephoneNo', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              value={facility.emailAddress}
                              onChange={(e) => updateAdditionalFacility(index, 'emailAddress', e.target.value)}
                              disabled={editLoading}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Packaging Plant */}
                  <div className="form-section">
                    <h4>Packaging Plant</h4>
                    
                    <div className="form-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={formData.hasSeparatePackagingPlant}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            hasSeparatePackagingPlant: e.target.checked 
                          }))}
                          disabled={editLoading}
                        />
                        <span>Has separate packaging plant</span>
                      </label>
                    </div>

                    {formData.hasSeparatePackagingPlant && (
                      <div className="facility-fields">
                        <div className="form-group">
                          <label>Company / Plant Name</label>
                          <input
                            type="text"
                            name="packagingPlant.companyName"
                            value={formData.packagingPlant.companyName}
                            onChange={handleInputChange}
                            disabled={editLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            name="packagingPlant.address"
                            value={formData.packagingPlant.address}
                            onChange={handleInputChange}
                            disabled={editLoading}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Local Govt. Area</label>
                            <input
                              type="text"
                              name="packagingPlant.localGovtArea"
                              value={formData.packagingPlant.localGovtArea}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              name="packagingPlant.city"
                              value={formData.packagingPlant.city}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              name="packagingPlant.state"
                              value={formData.packagingPlant.state}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Country</label>
                            <input
                              type="text"
                              name="packagingPlant.country"
                              value={formData.packagingPlant.country}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Plant Contact</label>
                            <input
                              type="text"
                              name="packagingPlant.plantContact"
                              value={formData.packagingPlant.plantContact}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Position/Title</label>
                            <input
                              type="text"
                              name="packagingPlant.positionTitle"
                              value={formData.packagingPlant.positionTitle}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Telephone No.</label>
                            <input
                              type="tel"
                              name="packagingPlant.telephoneNo"
                              value={formData.packagingPlant.telephoneNo}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>

                          <div className="form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              name="packagingPlant.emailAddress"
                              value={formData.packagingPlant.emailAddress}
                              onChange={handleInputChange}
                              disabled={editLoading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Authorized By */}
                  <div className="form-section">
                    <h4>Application Authorized By</h4>
                    
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        name="authorizedBy.name"
                        value={formData.authorizedBy.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        disabled={editLoading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date Authorized *</label>
                      <input
                        type="date"
                        name="authorizedBy.dateAuthorized"
                        value={formData.authorizedBy.dateAuthorized}
                        onChange={handleInputChange}
                        disabled
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Position/Title *</label>
                      <input
                        type="text"
                        name="authorizedBy.positionTitle"
                        value={formData.authorizedBy.positionTitle}
                        onChange={handleInputChange}
                        placeholder="Enter position/title"
                        disabled={editLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Additional details..."
                      disabled={editLoading}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={handleCloseForm}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-submit" 
                    disabled={editLoading || !formData.category || !formData.hasAppliedBefore || !formData.hasBeenSupervisedBefore || formData.foodSafetyPrograms.length === 0 || !formData.marketType || !formData.brandType || !formData.usesPorkOrDerivatives || !formData.usesAnimalMeatOrDerivatives || !formData.usesGelatinOrCapsule || !formData.containsAlcohol || !formData.additivesOrFlavourContainAlcohol || !formData.usesGlycerineOrDerivatives || formData.geographicMarkets.length === 0 || !formData.authorizedBy.name || !formData.authorizedBy.positionTitle}
                  >
                    {editLoading ? 'Updating...' : 'Update Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Application Modal */}
        {showViewModal && <ViewApplicationModal />}

        {/* Renewal Application Modal */}
        {showRenewalForm && (
          <div className="modal modal-large">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Renew Application</h3>
                <button 
                  className="close-btn" 
                  onClick={handleCloseForm}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleRenewalSubmit}>
                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value="Renewal Application"
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Select Application *</label>
                  <select
                    name="existingApplication"
                    value={renewalData.existingApplication}
                    onChange={handleRenewalInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Choose application</option>
                    {applications
                      .filter(app => ["accepted", "certified", "expired", "renewal", "renewal application"].includes(app.status.toLowerCase()))
                      .map((app) => (
                        <option key={app._id} value={app._id}>
                          {app.applicationNumber} - {app.product}
                        </option>
                      ))
                    }
                    {applications.filter(app => ["accepted", "certified", "expired", "renewal", "renewal application"].includes(app.status.toLowerCase())).length === 0 && (
                      <option value="" disabled>No eligible applications found</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Renewal Date *</label>
                  <input
                    type="date"
                    name="renewalDate"
                    value={renewalData.renewalDate}
                    onChange={handleRenewalInputChange}
                    required
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Reason *</label>
                  <select
                    name="reason"
                    value={renewalData.reason}
                    onChange={handleRenewalInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select reason</option>
                    <option value="continuing_operations">Continuing Operations</option>
                    <option value="contract_requirement">Contract Requirement</option>
                    <option value="regulatory_compliance">Regulatory Compliance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Supporting Documents</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={loading}
                    />
                    <button type="button" className="btn btn-upload" disabled={loading}>
                      <i className="fas fa-upload"></i> Upload Files
                    </button>
                  </div>
                  {renewalData.attachments.length > 0 && (
                    <div className="file-list">
                      {renewalData.attachments.map((file, i) => (
                        <div key={i} className="file-item">
                          <span>{file.name}</span>
                          <button 
                            type="button" 
                            className="remove-file"
                            onClick={() => removeAttachment(i)}
                            disabled={loading}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={handleCloseForm}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-submit" 
                    disabled={loading || !renewalData.existingApplication || !renewalData.reason}
                  >
                    {loading ? 'Processing...' : 'Submit Renewal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Applications;