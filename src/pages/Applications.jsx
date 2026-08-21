import { useState, useEffect, useCallback } from "react";
import "./css/Applications.css";
import Sidebar from "../components/Sidebar";
import TableActions from "../components/TableActions";
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
  const [showRenewalSelectModal, setShowRenewalSelectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedClientProducts, setSelectedClientProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);

  const [formData, setFormData] = useState({
    category: "",
    branchId: "",
    renewedCertificateId: "",
    renewedApplicationId: "",
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
    geopoliticalRegion: "",
    nigerianState: "",
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
    primaryContact: {
      name: "",
      email: "",
      positionTitle: "",
      telephoneNo: ""
    },
    // Authorized by
    authorizedBy: {
      name: "",
      dateAuthorized: new Date().toISOString().split("T")[0],
      positionTitle: ""
    },
    // Documents
    mancapDocument: null,
    nafdacDocument: null,
    cacDocument: null,
    companyProfileDocument: null,
    rawMaterialsDocument: null
  });



  const applicationCategories = [
    "Initial Certification",
    "Renewal Application",
    "Ad-On Application"
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

  const nigerianGeopoliticalData = {
    "North Central": ["Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "FCT (Abuja)"],
    "North East": ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
    "North West": ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"],
    "South East": ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
    "South South": ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"],
    "South West": ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"]
  };

  const { user, fetchUser } = useAuth();
  const { products, fetchProducts, isLoading: productsLoading } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const handleNewApplication = () => {
    if (branches.length === 0) {
      toast.error("You must add at least one branch before you can create an application.");
      navigate('/branches');
      return;
    }
    setFormData(prev => ({
      ...prev,
      category: "Initial Certification",
      primaryContact: {
        name: user?.fullName || user?.companyName || prev.primaryContact?.name || "",
        email: user?.email || prev.primaryContact?.email || "",
        positionTitle: user?.positionTitle || prev.primaryContact?.positionTitle || "",
        telephoneNo: user?.phone || prev.primaryContact?.telephoneNo || ""
      }
    }));
    setShowApplicationForm(true);
    setShowRenewalForm(false);
    setShowViewModal(false);
    setShowEditModal(false);
  };

  const prefillFormFromApp = async (app, cert = null) => {
    let productNames = [];
    if (cert && cert.product && Array.isArray(cert.product) && cert.product.length > 0) {
      productNames = cert.product;
    } else if (app) {
      try {
        const token = JSON.parse(localStorage.getItem("accessToken"));
        const prodRes = await axios.get(`${API_BASE_URL}/products?applicationId=${app._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (prodRes.data && Array.isArray(prodRes.data.products)) {
          productNames = prodRes.data.products.map(p => p.name);
        }
      } catch (err) {
        console.error("Error prefilling products:", err);
      }
      if (productNames.length === 0 && app.productList && Array.isArray(app.productList)) {
        productNames = app.productList;
      }
    }

    const appObj = app || {};
    setFormData({
      category: "Renewal Application",
      renewedCertificateId: cert?._id || "",
      renewedApplicationId: appObj._id || cert?.applicationId?._id || cert?.applicationId || "",
      branchId: appObj.branchId?._id || appObj.branchId || cert?.branchId?._id || cert?.branchId || "",
      product: appObj.product || "",
      productId: appObj.productId || "",
      productList: productNames,
      description: `Renewal for Certificate ${cert?.certificateNumber || appObj.applicationNumber || ''}`,
      requestedDate: new Date().toISOString().split("T")[0],
      hasAppliedBefore: appObj.hasAppliedBefore || "yes",
      previousHalalAgency: appObj.previousHalalAgency || "Halal Certification Authority",
      hasBeenSupervisedBefore: appObj.hasBeenSupervisedBefore || "",
      supervisingHalalAgency: appObj.supervisingHalalAgency || "",
      foodSafetyPrograms: appObj.foodSafetyPrograms || [],
      otherFoodSafetyProgram: appObj.otherFoodSafetyProgram || "",
      marketType: appObj.marketType || "",
      marketTypeOther: appObj.marketTypeOther || "",
      brandType: appObj.brandType || "",
      brandTypeOther: appObj.brandTypeOther || "",
      usesPorkOrDerivatives: appObj.usesPorkOrDerivatives || "",
      usesAnimalMeatOrDerivatives: appObj.usesAnimalMeatOrDerivatives || "",
      usesGelatinOrCapsule: appObj.usesGelatinOrCapsule || "",
      containsAlcohol: appObj.containsAlcohol || "",
      additivesOrFlavourContainAlcohol: appObj.additivesOrFlavourContainAlcohol || "",
      usesGlycerineOrDerivatives: appObj.usesGlycerineOrDerivatives || "",
      geographicMarkets: appObj.geographicMarkets || [],
      geographicMarketsOther: appObj.geographicMarketsOther || "",
      geopoliticalRegion: appObj.geopoliticalRegion || "",
      nigerianState: appObj.nigerianState || "",
      manufacturingFacilitySame: appObj.manufacturingFacilitySame ?? true,
      manufacturingFacility: appObj.manufacturingFacility || {
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
      additionalFacilities: appObj.additionalFacilities || [],
      hasSeparatePackagingPlant: appObj.packagingPlant?.exists ?? false,
      packagingPlant: appObj.packagingPlant || {
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
      primaryContact: {
        name: appObj.primaryContact?.name || "",
        email: appObj.primaryContact?.email || "",
        positionTitle: appObj.primaryContact?.positionTitle || "",
        telephoneNo: appObj.primaryContact?.telephoneNo || ""
      },
      authorizedBy: {
        name: appObj.authorizedBy?.name || "",
        dateAuthorized: new Date().toISOString().split("T")[0],
        positionTitle: appObj.authorizedBy?.positionTitle || ""
      },
      mancapDocument: null,
      nafdacDocument: null,
      cacDocument: null,
      companyProfileDocument: null,
      rawMaterialsDocument: null
    });
  };

  const handleRenewApplication = async () => {
    // Active renewal applications
    const activeRenewalApps = applications.filter(app => 
      app.category === "Renewal Application" && 
      !["issued", "rejected", "expired"].includes(app.status?.toLowerCase())
    );

    // Find eligible certificates that are not already in active renewal
    const eligibleCerts = certificates.filter(cert => {
      const certId = (cert._id?.toString() || cert._id);
      const certAppId = (cert.applicationId?._id || cert.applicationId)?.toString();
      const isUnderRenewal = activeRenewalApps.some(app => {
        const appRenewedCertId = (app.renewedCertificateId?._id || app.renewedCertificateId)?.toString();
        const appRenewedAppId = (app.renewedApplicationId?._id || app.renewedApplicationId)?.toString();
        return (appRenewedCertId && appRenewedCertId === certId) || (appRenewedAppId && certAppId && appRenewedAppId === certAppId);
      });
      return !isUnderRenewal;
    });

    if (eligibleCerts.length > 1) {
      setShowRenewalSelectModal(true);
      return;
    }

    if (eligibleCerts.length === 1) {
      const cert = eligibleCerts[0];
      const targetApp = applications.find(a => (a._id === (cert.applicationId?._id || cert.applicationId)));
      await prefillFormFromApp(targetApp, cert);
      setShowApplicationForm(true);
      setShowRenewalForm(false);
      setShowViewModal(false);
      setShowEditModal(false);
      return;
    }

    const eligibleApps = applications.filter(app =>
      ["Accepted", "Certified", "Expired", "Issued", "Renewal", "Renewal Application", "renewal", "expired"].includes(app.status)
    );

    if (eligibleApps.length === 0) {
      toast.error("No eligible certificates or applications found for renewal");
      return;
    }

    await prefillFormFromApp(eligibleApps[0]);
    setShowApplicationForm(true);
    setShowRenewalForm(false);
    setShowViewModal(false);
    setShowEditModal(false);
  };

  const handleAdOnApplication = () => {
    // Check if any branch has a certified application
    const certifiedBranchIds = applications
      .filter(app => ["issued", "certified", "approved"].includes(app.status?.toLowerCase()))
      .map(app => app.branchId?._id || app.branchId);

    if (certifiedBranchIds.length === 0) {
      toast.error("No certified sites found. Only sites with a certified initial application can apply for an Additional Certificate.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      category: "Ad-On Application",
      branchId: ""
    }));
    setShowApplicationForm(true);
    setShowRenewalForm(false);
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
        return response.data;
      } else {
        console.error("Unexpected response format:", response.data);
        toast.error("Failed to load applications. Invalid data format.");
        return [];
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch applications";
      toast.error(errorMessage);
      return [];
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

  const fetchBranches = useCallback(async () => {
    try {
      setBranchesLoading(true);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${API_BASE_URL}/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === "success") {
        setBranches(response.data.branches);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  const fetchCertificates = useCallback(async () => {
    try {
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const response = await axios.get(`${API_BASE_URL}/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Array.isArray(response.data)) {
        setCertificates(response.data);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchBranches();
    fetchCertificates();
    fetchApplications().then((apps) => {
      if (apps && Array.isArray(apps)) {
        // Process query params
        const searchParams = new URLSearchParams(window.location.search);
        const action = searchParams.get('action');
        if (action === 'new') {
          setTimeout(() => {
            setFormData(prev => ({ ...prev, category: "Initial Certification" }));
            setShowApplicationForm(true);
          }, 500);
        } else if (action === 'renew') {
          const certId = searchParams.get('certId');
          setTimeout(async () => {
            let targetCert = null;
            let targetApp = null;
            if (certId && certificates && certificates.length > 0) {
              targetCert = certificates.find(c => (c._id?.toString() === certId || c._id === certId));
            }
            if (targetCert) {
              const targetAppId = (targetCert.applicationId?._id || targetCert.applicationId)?.toString();
              targetApp = apps.find(a => a._id?.toString() === targetAppId);
              await prefillFormFromApp(targetApp, targetCert);
              setShowApplicationForm(true);
            } else {
              const eligibleCerts = (certificates || []).filter(c => ['active', 'expiring soon', 'expired'].includes(c.status?.toLowerCase()));
              if (eligibleCerts.length > 1) {
                setShowRenewalSelectModal(true);
              } else if (eligibleCerts.length === 1) {
                const cert = eligibleCerts[0];
                const tApp = apps.find(a => (a._id === (cert.applicationId?._id || cert.applicationId)));
                await prefillFormFromApp(tApp, cert);
                setShowApplicationForm(true);
              } else {
                const eligibleApps = apps.filter(app =>
                  ["Accepted", "Certified", "Expired", "Issued", "Renewal", "Renewal Application", "renewal", "expired"].includes(app.status)
                );
                if (eligibleApps.length > 0) {
                  await prefillFormFromApp(eligibleApps[0]);
                } else {
                  setFormData(prev => ({ ...prev, category: "Renewal Application" }));
                }
                setShowApplicationForm(true);
              }
            }
          }, 500);
        } else if (action === 'addon') {
          setTimeout(() => {
            setFormData(prev => ({ ...prev, category: "Ad-On Application", branchId: "" }));
            setShowApplicationForm(true);
          }, 500);
        }
      }
    });
  }, []);

  // View Application Details
  const handleViewApplication = async (appId) => {
    try {
      setLoading(true);
      setSelectedClientProducts([]);
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const [appRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/applications/${appId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/products?applicationId=${appId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { products: [] } }))
      ]);

      if (appRes.data) {
        setSelectedApplication(appRes.data);
        setSelectedClientProducts(prodRes.data.products || []);
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
          productList: app.productList || [],
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
          geopoliticalRegion: app.geopoliticalRegion || "",
          nigerianState: app.nigerianState || "",
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

    if (!formData.productList || formData.productList.length === 0) {
      toast.error("Please add at least one product to certify");
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

    if (formData.geographicMarkets.includes("Within Nigeria") && !formData.geopoliticalRegion) {
      toast.error("Please select a Geopolitical Region for 'Within Nigeria'");
      return;
    }

    if (formData.geographicMarkets.includes("Within Nigeria") && !formData.nigerianState) {
      toast.error("Please select a State for 'Within Nigeria'");
      return;
    }

    if (!formData.primaryContact?.name?.trim()) {
      toast.error("Please enter Primary Contact name");
      return;
    }

    if (!formData.primaryContact?.email?.trim()) {
      toast.error("Please enter Primary Contact email");
      return;
    }

    if (!formData.primaryContact?.positionTitle?.trim()) {
      toast.error("Please enter Primary Contact position/title");
      return;
    }

    if (!formData.primaryContact?.telephoneNo?.trim()) {
      toast.error("Please enter Primary Contact phone number");
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
    setShowRenewalSelectModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedApplication(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      category: "",
      branchId: "",
      renewedCertificateId: "",
      renewedApplicationId: "",
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
      geopoliticalRegion: "",
      nigerianState: "",
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
      primaryContact: {
        name: "",
        email: "",
        positionTitle: "",
        telephoneNo: ""
      },
      authorizedBy: {
        name: "",
        dateAuthorized: new Date().toISOString().split("T")[0],
        positionTitle: ""
      },
      mancapDocument: null,
      nafdacDocument: null,
      cacDocument: null,
      companyProfileDocument: null,
      rawMaterialsDocument: null
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

  const handleDocumentChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 5MB size limit.`);
        e.target.value = "";
        return;
      }
      setFormData(prev => ({
        ...prev,
        [name]: file
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
        if (market === "Within Nigeria") {
          return {
            ...prev,
            geographicMarkets: updatedMarkets,
            geopoliticalRegion: "",
            nigerianState: ""
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



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.registrationNo) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    if (!formData.productList || formData.productList.length === 0) {
      toast.error("Please add at least one product to certify");
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

    if (formData.geographicMarkets.includes("Within Nigeria") && !formData.geopoliticalRegion) {
      toast.error("Please select a Geopolitical Region for 'Within Nigeria'");
      return;
    }

    if (formData.geographicMarkets.includes("Within Nigeria") && !formData.nigerianState) {
      toast.error("Please select a State for 'Within Nigeria'");
      return;
    }

    if (!formData.primaryContact?.name?.trim()) {
      toast.error("Please enter Primary Contact name");
      return;
    }

    if (!formData.primaryContact?.email?.trim()) {
      toast.error("Please enter Primary Contact email");
      return;
    }

    if (!formData.primaryContact?.positionTitle?.trim()) {
      toast.error("Please enter Primary Contact position/title");
      return;
    }

    if (!formData.primaryContact?.telephoneNo?.trim()) {
      toast.error("Please enter Primary Contact phone number");
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

    if (!formData.rawMaterialsDocument) {
      toast.error("Please upload the List of raw materials document (Compulsory)");
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

      const formDataToSend = new FormData();
      Object.keys(applicationData).forEach(key => {
        if (['mancapDocument', 'nafdacDocument', 'cacDocument', 'companyProfileDocument', 'rawMaterialsDocument'].includes(key)) {
          if (applicationData[key]) {
            formDataToSend.append(key, applicationData[key]);
          }
        } else if (Array.isArray(applicationData[key])) {
          formDataToSend.append(key, applicationData[key].join(','));
        } else if (typeof applicationData[key] === 'object' && applicationData[key] !== null) {
          formDataToSend.append(key, JSON.stringify(applicationData[key]));
        } else {
          formDataToSend.append(key, applicationData[key]);
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}/applications`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
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

    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api';
    const getDocumentUrl = (path) => {
      if (!path) return '#';
      if (typeof path !== 'string') return '#';
      if (path.startsWith('http')) return path;
      
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      
      let relativePath = path;
      if (relativePath.startsWith('/api/')) {
        relativePath = relativePath.slice(4);
      }
      
      if (!relativePath.startsWith('/')) {
        relativePath = '/' + relativePath;
      }
      
      if (!relativePath.startsWith('/files/')) {
        relativePath = '/files' + relativePath;
      }
      
      return `${cleanBase}${relativePath}`;
    };

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
                    <label>Requested Date</label>
                    <p>{formatDate(selectedApplication.requestedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Primary Contact */}
              <div className="details-section">
                <h5>Primary Contact Information</h5>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <p>{selectedApplication.primaryContact?.name || selectedApplication.authorizedBy?.name || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{selectedApplication.primaryContact?.email || selectedApplication.company?.email || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Position/Title</label>
                    <p>{selectedApplication.primaryContact?.positionTitle || selectedApplication.authorizedBy?.positionTitle || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Phone Number</label>
                    <p>{selectedApplication.primaryContact?.telephoneNo || selectedApplication.company?.phone || 'N/A'}</p>
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

              {/* Products Section */}
              <div className="details-section" style={{ marginTop: '8px' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Products Under This Application *
                  {selectedClientProducts.length > 0 && (
                    <span style={{ background: '#00853b', color: '#fff', borderRadius: '20px', fontSize: '11px', padding: '2px 8px', fontWeight: 700 }}>
                      {selectedClientProducts.length}
                    </span>
                  )}
                </h5>
                {selectedClientProducts.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Product Name</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Category</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClientProducts.map((product, i) => (
                          <tr key={product._id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 500 }}>{product.name}</td>
                            <td style={{ padding: '10px 14px', color: '#6b7280' }}>{product.category || product.productCategory || '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                background: product.status === 'acknowledged' ? '#dcfce7' : product.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                                color: product.status === 'acknowledged' ? '#15803d' : product.status === 'rejected' ? '#dc2626' : '#92400e'
                              }}>
                                {product.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>No products have been submitted for this application yet.</p>
                )}
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

              {/* Manufacturing, facilities and packaging plant removed */}

              {/* Prepared By */}
              {selectedApplication.authorizedBy && (
                <div className="detail-group highlight-group">
                  <h5>Prepared By</h5>
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

              {/* Supporting Documents */}
              <div className="details-section">
                <h5>Supporting Documents</h5>
                <div className="details-grid">
                  {[
                    { label: 'MANCAP Certificate', field: 'mancapDocument' },
                    { label: 'NAFDAC Certificate', field: 'nafdacDocument' },
                    { label: 'CAC Document', field: 'cacDocument' },
                    { label: 'Company Profile', field: 'companyProfileDocument' },
                    { label: 'Raw Materials List', field: 'rawMaterialsDocument' }
                  ].map((doc, idx) => (
                    <div key={idx} className="detail-item">
                      <label>{doc.label}</label>
                      {selectedApplication[doc.field] ? (
                        <a
                          href={getDocumentUrl(selectedApplication[doc.field])}
                          target="_blank"
                          rel="noreferrer"
                          className="view-link"
                          style={{ color: '#00853b', textDecoration: 'underline' }}
                        >
                          View Document
                        </a>
                      ) : (
                        <p>Not provided</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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
            {/* <button 
              className="btn btn-primary"
              onClick={() => {
                handleCloseForm();
                handleEditApplication(selectedApplication._id);
              }}
            >
              <i className="fas fa-edit"></i> Edit Application
            </button> */}
            <button className="btn btn-secondary" onClick={handleCloseForm}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const activeRenewalApps = applications.filter(app => 
    app.category === "Renewal Application" && 
    !["rejected", "issued", "certified", "cancelled", "expired"].includes(app.status?.toLowerCase())
  );

  const hasExpiredOrExpiringCert = certificates.some(cert => {
    const status = cert.status?.toLowerCase().trim();
    const certId = (cert._id?.toString() || cert._id);
    const certAppId = (cert.applicationId?._id || cert.applicationId)?.toString();

    const isUnderRenewal = activeRenewalApps.some(app => {
      const appRenewedCertId = (app.renewedCertificateId?._id || app.renewedCertificateId)?.toString();
      const appRenewedAppId = (app.renewedApplicationId?._id || app.renewedApplicationId)?.toString();
      return (appRenewedCertId && appRenewedCertId === certId) || (appRenewedAppId && certAppId && appRenewedAppId === certAppId);
    });

    if (isUnderRenewal) return false;

    if (status === 'expired' || status === 'expiring soon') return true;
    if (cert.expiryDate) {
      const today = new Date();
      const expiry = new Date(cert.expiryDate);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) return true;
    }
    return false;
  }) || applications.some(app => {
    const status = app.status?.toLowerCase().trim();
    return status === 'expired' || status === 'expiring soon';
  });

  return (
    <div className="dash">
      <Sidebar activeApp="active" />
      <main className="content cert">
        <div className="manage-applications">
          <div className="header">
            <h2>Manage Applications</h2>
            <div className="header-actions">              

              <div className="tooltip-wrapper">
                <button
                  className="new-btn"
                  onClick={handleNewApplication}
                >
                  <i className="fas fa-plus"></i> New Application
                </button>
              </div>

              {hasExpiredOrExpiringCert && (
                <button
                  className="renew-btn"
                  onClick={handleRenewApplication}
                  disabled={productsLoading}
                >
                  <i className="fas fa-sync-alt"></i> Renew
                </button>
              )}

              <button
                className="renew-btn"
                onClick={handleAdOnApplication}
                disabled={applications.filter(app => ["issued", "certified", "approved"].includes(app.status?.toLowerCase())).length === 0}
                title={applications.filter(app => ["issued", "certified", "approved"].includes(app.status?.toLowerCase())).length === 0 ? "No certified sites available for Additional Certificate application" : "Apply for an Additional Certificate for a certified site"}
                style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
              >
                <i className="fas fa-plus-circle"></i>Appy For Additional Certificate
              </button>
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
                    <th>Manufacturing Facility</th>
                    <th>Category</th>
                    {/* <th>Product</th> */}
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
                      <td>{app.branchId?.branchName || "N/A"}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: app.category === 'Ad-On Application' ? '#ede9fe' : app.category === 'Renewal Application' ? '#dbeafe' : '#dcfce7',
                          color: app.category === 'Ad-On Application' ? '#7c3aed' : app.category === 'Renewal Application' ? '#1e40af' : '#15803d'
                        }}>
                          {app.category || "N/A"}
                        </span>
                      </td>
                      {/* <td>{app.product || "N/A"}</td> */}
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
                        <TableActions
                          actions={[
                            {
                              label: 'Track Processing',
                              icon: <i className="fas fa-tasks"></i>,
                              onClick: () => navigate(`/applications/${app._id}/track`)
                            },
                            {
                              label: 'View Details',
                              icon: <i className="fas fa-eye"></i>,
                              onClick: () => handleViewApplication(app._id)
                            },
                            // (app.status === "Submitted" || app.status === "Pending Review") && {
                            //   label: 'Edit Application',
                            //   icon: <i className="fas fa-edit"></i>,
                            //   onClick: () => handleEditApplication(app._id)
                            // },
                            (app.status.toLowerCase() === "renewal" || app.status.toLowerCase() === "renewal application") && {
                              label: 'Cancel Renewal',
                              icon: <i className="fas fa-trash-alt"></i>,
                              onClick: () => handleDeleteApplication(app._id),
                              variant: 'danger'
                            }
                          ].filter(Boolean)}
                        />
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
                <h3>
                  {formData.category === "Renewal Application" ? "🔄 Renewal Application" : formData.category === "Ad-On Application" ? "➕ Ad-On Application" : "New Application"}
                </h3>
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
                      <label>Branch *</label>
                      <select
                        name="branchId"
                        value={formData.branchId}
                        onChange={async (e) => {
                          const bId = e.target.value;
                          const selectedBranch = branches.find(b => b._id === bId);
                          if (selectedBranch) {
                            if (formData.category === "Renewal Application") {
                              const branchEligibleApp = applications.find(app =>
                                app.branchId?._id === bId &&
                                ["Accepted", "Certified", "Expired", "Issued", "Renewal", "Renewal Application", "renewal", "expired"].includes(app.status)
                              );
                              if (branchEligibleApp) {
                                await prefillFormFromApp(branchEligibleApp);
                                return;
                              }
                            }
                            setFormData(prev => ({
                              ...prev,
                              branchId: bId,
                              manufacturingFacility: {
                                companyName: selectedBranch.branchName,
                                address: selectedBranch.address,
                                localGovtArea: selectedBranch.lga,
                                city: selectedBranch.city,
                                state: selectedBranch.state,
                                country: selectedBranch.country,
                                plantContact: selectedBranch.contactName,
                                positionTitle: selectedBranch.positionTitle,
                                telephoneNo: selectedBranch.contactNumber,
                                emailAddress: user.email,
                                webAddress: selectedBranch.webAddress,
                                governmentPlantCode: selectedBranch.governmentPlantCode
                              }
                            }));
                          } else {
                            setFormData(prev => ({ ...prev, branchId: bId }));
                          }
                        }}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => {
                          const isCertified = applications.some(
                            app => (app.branchId?._id === branch._id || app.branchId === branch._id) && ["issued", "certified", "approved"].includes(app.status?.toLowerCase())
                          );
                          const isAdOn = formData.category === "Ad-On Application";
                          const isDisabled = isAdOn && !isCertified;
                          return (
                            <option key={branch._id} value={branch._id} disabled={isDisabled}>
                              {branch.branchName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

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

                    {/* Product List */}
                    <div className="form-group">
                      <label>Products to Certify *</label>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', marginTop: 0 }}>
                        Add all products you wish to have certified under this application.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          id="productListInput"
                          placeholder="Enter product name and click Add"
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              const list = formData.productList || [];
                              if (val && !list.includes(val)) {
                                setFormData(prev => ({ ...prev, productList: [...(prev.productList || []), val] }));
                                e.target.value = '';
                              }
                            }
                          }}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          style={{ padding: '8px 16px', background: '#00853b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            const input = document.getElementById('productListInput');
                            const val = input.value.trim();
                            const list = formData.productList || [];
                            if (val && !list.includes(val)) {
                              setFormData(prev => ({ ...prev, productList: [...(prev.productList || []), val] }));
                              input.value = '';
                            }
                          }}
                          disabled={loading}
                        >
                          + Add
                        </button>
                      </div>
                      {(formData.productList || []).length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(formData.productList || []).map((prod, idx) => (
                            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 500 }}>
                              {prod}
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, productList: (prev.productList || []).filter((_, i) => i !== idx) }))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontWeight: 700, fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
                                disabled={loading}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>No products added yet.</p>
                      )}
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

                  {/* Primary Contact Information */}
                  <div className="form-section">
                    <h4>Primary Contact Information</h4>

                    <div className="form-group">
                      <label>Primary Contact Name *</label>
                      <input
                        type="text"
                        name="primaryContact.name"
                        value={formData.primaryContact?.name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter primary contact name"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Primary Contact Email *</label>
                      <input
                        type="email"
                        name="primaryContact.email"
                        value={formData.primaryContact?.email || ""}
                        onChange={handleInputChange}
                        placeholder="Enter primary contact email"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Position/Title *</label>
                      <input
                        type="text"
                        name="primaryContact.positionTitle"
                        value={formData.primaryContact?.positionTitle || ""}
                        onChange={handleInputChange}
                        placeholder="Enter position or title"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="primaryContact.telephoneNo"
                        value={formData.primaryContact?.telephoneNo || ""}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        disabled={loading}
                        required
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

                      {formData.geographicMarkets.includes("Within Nigeria") && (
                        <div className="conditional-field nigeria-region-section">
                          <div className="form-group">
                            <label>Geopolitical Region *</label>
                            <select
                              value={formData.geopoliticalRegion}
                              onChange={e => setFormData(prev => ({ ...prev, geopoliticalRegion: e.target.value, nigerianState: "" }))}
                              disabled={loading}
                              required
                            >
                              <option value="">Select Geopolitical Region</option>
                              {Object.keys(nigerianGeopoliticalData).map(region => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                          </div>

                          {formData.geopoliticalRegion && (
                            <div className="form-group">
                              <label>State *</label>
                              <select
                                value={formData.nigerianState}
                                onChange={e => setFormData(prev => ({ ...prev, nigerianState: e.target.value }))}
                                disabled={loading}
                                required
                              >
                                <option value="">Select State</option>
                                {nigerianGeopoliticalData[formData.geopoliticalRegion].map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>



                  {/* Prepared By */}
                  <div className="form-section">
                    <h4>Application Prepared By</h4>

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

                  {/* Document Uploads */}
                  <div className="form-section">
                    <h4>Supporting Documents</h4>

                    <div className="form-group">
                      <label>Mancap (If applicable)</label>
                      <input
                        type="file"
                        name="mancapDocument"
                        onChange={handleDocumentChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Nafdac (If applicable)</label>
                      <input
                        type="file"
                        name="nafdacDocument"
                        onChange={handleDocumentChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>CAC (Compulsory) *</label>
                      <input
                        type="file"
                        name="cacDocument"
                        onChange={handleDocumentChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Company Profile (Compulsory) *</label>
                      <input
                        type="file"
                        name="companyProfileDocument"
                        onChange={handleDocumentChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>List of raw materials (Compulsory) *</label>
                      <input
                        type="file"
                        name="rawMaterialsDocument"
                        onChange={handleDocumentChange}
                        disabled={loading}
                        required
                      />
                    </div>
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
                    disabled={loading || !formData.category || !formData.primaryContact?.name || !formData.primaryContact?.email || !formData.primaryContact?.positionTitle || !formData.primaryContact?.telephoneNo || !formData.rawMaterialsDocument || !formData.hasAppliedBefore || !formData.hasBeenSupervisedBefore || formData.foodSafetyPrograms.length === 0 || !formData.marketType || !formData.brandType || !formData.usesPorkOrDerivatives || !formData.usesAnimalMeatOrDerivatives || !formData.usesGelatinOrCapsule || !formData.containsAlcohol || !formData.additivesOrFlavourContainAlcohol || !formData.usesGlycerineOrDerivatives || formData.geographicMarkets.length === 0 || !formData.authorizedBy.name || !formData.authorizedBy.positionTitle}
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

                  {/* Primary Contact Information */}
                  <div className="form-section">
                    <h4>Primary Contact Information</h4>

                    <div className="form-group">
                      <label>Primary Contact Name *</label>
                      <input
                        type="text"
                        name="primaryContact.name"
                        value={formData.primaryContact?.name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter primary contact name"
                        disabled={editLoading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Primary Contact Email *</label>
                      <input
                        type="email"
                        name="primaryContact.email"
                        value={formData.primaryContact?.email || ""}
                        onChange={handleInputChange}
                        placeholder="Enter primary contact email"
                        disabled={editLoading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Position/Title *</label>
                      <input
                        type="text"
                        name="primaryContact.positionTitle"
                        value={formData.primaryContact?.positionTitle || ""}
                        onChange={handleInputChange}
                        placeholder="Enter position or title"
                        disabled={editLoading}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="primaryContact.telephoneNo"
                        value={formData.primaryContact?.telephoneNo || ""}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        disabled={editLoading}
                        required
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

                      {formData.geographicMarkets.includes("Within Nigeria") && (
                        <div className="conditional-field nigeria-region-section">
                          <div className="form-group">
                            <label>Geopolitical Region *</label>
                            <select
                              value={formData.geopoliticalRegion}
                              onChange={e => setFormData(prev => ({ ...prev, geopoliticalRegion: e.target.value, nigerianState: "" }))}
                              disabled={editLoading}
                              required
                            >
                              <option value="">Select Geopolitical Region</option>
                              {Object.keys(nigerianGeopoliticalData).map(region => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                          </div>

                          {formData.geopoliticalRegion && (
                            <div className="form-group">
                              <label>State *</label>
                              <select
                                value={formData.nigerianState}
                                onChange={e => setFormData(prev => ({ ...prev, nigerianState: e.target.value }))}
                                disabled={editLoading}
                                required
                              >
                                <option value="">Select State</option>
                                {nigerianGeopoliticalData[formData.geopoliticalRegion].map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prepared By */}
                  <div className="form-section">
                    <h4>Application Prepared By</h4>

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
                    disabled={editLoading || !formData.category || !formData.primaryContact?.name || !formData.primaryContact?.email || !formData.primaryContact?.positionTitle || !formData.primaryContact?.telephoneNo || !formData.hasAppliedBefore || !formData.hasBeenSupervisedBefore || formData.foodSafetyPrograms.length === 0 || !formData.marketType || !formData.brandType || !formData.usesPorkOrDerivatives || !formData.usesAnimalMeatOrDerivatives || !formData.usesGelatinOrCapsule || !formData.containsAlcohol || !formData.additivesOrFlavourContainAlcohol || !formData.usesGlycerineOrDerivatives || formData.geographicMarkets.length === 0 || !formData.authorizedBy.name || !formData.authorizedBy.positionTitle}
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

        {/* Renewal Certificate Selection Modal */}
        {showRenewalSelectModal && (
          <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }}>
            <div className="modal-content" style={{ maxWidth: '680px', width: '100%', borderRadius: '16px', overflow: 'hidden', padding: '0', background: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00853b' }}>
                    <i className="fas fa-sync-alt fa-lg"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>Select Certificate to Renew</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Choose which certificate or endorsement you wish to renew</p>
                  </div>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setShowRenewalSelectModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {certificates.map((cert) => {
                    const isAdOn = cert.certificateType?.toLowerCase().includes('ad-on') || cert.remarks?.toLowerCase().includes('ad-on');
                    const branch = branches.find(b => (b._id === (cert.branchId?._id || cert.branchId)));
                    const facilityName = branch?.branchName || cert.branchId?.branchName || "Main Facility";
                    
                    const certId = (cert._id?.toString() || cert._id);
                    const certAppId = (cert.applicationId?._id || cert.applicationId)?.toString();
                    const isUnderRenewal = activeRenewalApps.some(app => {
                      const appRenewedCertId = (app.renewedCertificateId?._id || app.renewedCertificateId)?.toString();
                      const appRenewedAppId = (app.renewedApplicationId?._id || app.renewedApplicationId)?.toString();
                      return (appRenewedCertId && appRenewedCertId === certId) || (appRenewedAppId && certAppId && appRenewedAppId === certAppId);
                    });

                    return (
                      <div 
                        key={cert._id}
                        style={{
                          border: isUnderRenewal ? '1px solid #e5e7eb' : '1.5px solid #d1d5db',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: isUnderRenewal ? '#f9fafb' : '#ffffff',
                          opacity: isUnderRenewal ? 0.65 : 1,
                          transition: 'all 0.2s ease',
                          gap: '16px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span 
                              style={{ 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                padding: '2px 8px', 
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                backgroundColor: isAdOn ? '#ede9fe' : '#dcfce7',
                                color: isAdOn ? '#7c3aed' : '#15803d'
                              }}
                            >
                              {isAdOn ? 'Additional Certificate (Ad-On)' : 'Initial Certificate'}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                              {cert.certificateNumber}
                            </span>
                          </div>
                          
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
                            <i className="fas fa-map-marker-alt" style={{ marginRight: '6px', color: '#9ca3af' }}></i>
                            {facilityName}
                          </p>

                          {cert.product && cert.product.length > 0 && (
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                              <strong>Products:</strong> {cert.product.join(', ')}
                            </p>
                          )}

                          <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                            Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                        </div>

                        <div>
                          {isUnderRenewal ? (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fas fa-spinner fa-spin"></i> Renewal in progress
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                setShowRenewalSelectModal(false);
                                const targetApp = applications.find(a => (a._id === (cert.applicationId?._id || cert.applicationId)));
                                await prefillFormFromApp(targetApp, cert);
                                setShowApplicationForm(true);
                              }}
                              style={{
                                padding: '8px 16px',
                                background: '#00853b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <i className="fas fa-sync-alt"></i> Renew
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f9fafb' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRenewalSelectModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}


      </main>
    </div>
  );
}

export default Applications;