import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logo from '../assets/hcaLogo.webp'
import { useAuth } from '../hooks/useAuth'; // Adjust the path to your useAuth hook

const Home = () => {
  // State management
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    loginEmail: '',
    loginPassword: '',
    rememberMe: false,
    contactName: '',
    phoneNumber: '',
    companyName: '',
    registerEmail: '',
    registerPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [registrationStep, setRegistrationStep] = useState(1); // 1: Company Info, 2: Login Info
  
  const navigate = useNavigate();
  const auth = useAuth();

  // Reset registration step when switching tabs
  useEffect(() => {
    if (activeTab === 'register') {
      setRegistrationStep(1);
    }
  }, [activeTab]);

  // Styles
  const styles = {

    root: {
      background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9eb 100%)',
      color: '#2d3e50',
      lineHeight: 1.6,
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: "'Poppins', sans-serif"
    },
    portalContainer: {
      display: 'flex',
      width: '100%',
      maxWidth: '1000px',
      background: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      minHeight: '600px',
      animation: 'fadeIn 0.8s ease'
    },
    welcomeSection: {
      flex: 1,
      background: 'linear-gradient(135deg, #1a5f7a 0%, #159895 100%)',
      color: 'white',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    welcomeSectionBefore: {
      content: "''",
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
      transform: 'rotate(30deg)'
    },
    welcomeContent: {
      position: 'relative',
      zIndex: 2
    },
    welcomeTitle: {
      fontSize: '2.2rem',
      marginBottom: '20px',
      fontWeight: 700
    },
    welcomeText: {
      fontSize: '1.1rem',
      marginBottom: '30px',
      opacity: 0.9
    },
    logo: {
      maxWidth: "100%",
    },
    userGuide: {
      background: 'rgba(255, 255, 255, 0.15)',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)'
    },
    userGuideTitle: {
      marginBottom: '15px',
      fontWeight: 600
    },
    createAccountBtn: {
      display: 'inline-block',
      background: '#ffc107',
      color: '#2d3e50',
      padding: '12px 25px',
      borderRadius: '50px',
      textDecoration: 'none',
      fontWeight: 600,
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
      cursor: 'pointer',
      border: 'none',
      fontFamily: "'Poppins', sans-serif"
    },
    divider: {
      height: '2px',
      background: 'rgba(255, 255, 255, 0.3)',
      margin: '30px 0'
    },
    authSection: {
      flex: 1,
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    authTabs: {
      display: 'flex',
      marginBottom: '30px',
      borderBottom: '2px solid #eee'
    },
    authTab: {
      padding: '15px 25px',
      cursor: 'pointer',
      fontWeight: 500,
      transition: 'all 0.3s ease',
      position: 'relative',
      color: '#6c757d'
    },
    authTabActive: {
      color: '#1a5f7a',
      fontWeight: 600
    },
    authTabActiveAfter: {
      content: "''",
      position: 'absolute',
      bottom: '-2px',
      left: 0,
      width: '100%',
      height: '3px',
      background: 'linear-gradient(to right, #1a5f7a, #159895)',
      borderRadius: '3px'
    },
    authForm: {
      display: 'none',
      animation: 'slideIn 0.5s ease',
    },
    authFormActive: {
      display: 'block'
    },
    formTitle: {
      fontSize: '1.8rem',
      marginBottom: '10px',
      color: '#1a5f7a',
      fontWeight: 600
    },
    formSubtitle: {
      color: '#6c757d',
      marginBottom: '30px'
    },
    formSection: {
      marginBottom: '25px',
      padding: '20px',
      background: '#f8f9fa',
      borderRadius: '8px'
    },
    sectionTitle: {
      fontSize: '1.2rem',
      marginBottom: '20px',
      color: '#1a5f7a',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center'
    },
    sectionIcon: {
      marginRight: '10px',
      color: '#159895'
    },
    formGroup: {
      marginBottom: '20px',
      position: 'relative'
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 500,
      color: '#2d3e50'
    },
    formInput: {
      width: '100%',
      padding: '14px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      fontFamily: "'Poppins', sans-serif"
    },
    formInputFocus: {
      borderColor: '#1a5f7a',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(26, 95, 122, 0.1)'
    },
    required: {
      display: 'inline'
    },
    requiredAfter: {
      content: "'*'",
      color: '#dc3545',
      marginLeft: '4px'
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      marginTop: '20px'
    },
    checkboxInput: {
      width: 'auto',
      marginRight: '10px'
    },
    btn: {
      padding: '14px 24px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      fontFamily: "'Poppins', sans-serif"
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #1a5f7a 0%, #159895 100%)',
      color: 'white',
      width: '100%'
    },
    btnSecondary: {
      background: '#f8f9fa',
      color: '#2d3e50',
      border: '2px solid #e2e8f0'
    },
    btnHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 7px 14px rgba(26, 95, 122, 0.2)'
    },
    btnSecondaryHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 7px 14px rgba(0, 0, 0, 0.1)',
      background: '#e9ecef'
    },
    btnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    authLinks: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '20px',
      fontSize: '0.9rem'
    },
    authLink: {
      color: '#1a5f7a',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    authLinkHover: {
      color: '#159895',
      textDecoration: 'underline'
    },
    // Registration Steps
    registrationSteps: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '30px',
      position: 'relative'
    },
    step: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      zIndex: 2
    },
    stepCircle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: '1.1rem',
      marginBottom: '10px',
      transition: 'all 0.3s ease'
    },
    stepCircleActive: {
      background: 'linear-gradient(135deg, #1a5f7a 0%, #159895 100%)',
      color: 'white',
      boxShadow: '0 4px 10px rgba(26, 95, 122, 0.3)'
    },
    stepCircleInactive: {
      background: '#e9ecef',
      color: '#6c757d'
    },
    stepLine: {
      height: '3px',
      background: '#e9ecef',
      flex: 1,
      margin: '0 20px'
    },
    stepLineActive: {
      background: 'linear-gradient(to right, #1a5f7a, #159895)'
    },
    stepLabel: {
      fontSize: '0.9rem',
      fontWeight: 500,
      color: '#6c757d'
    },
    stepLabelActive: {
      color: '#1a5f7a',
      fontWeight: 600
    },
    // Form Navigation
    formNavigation: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '15px',
      marginTop: '30px'
    },
    // Modal Styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9998,
      opacity: 0,
      visibility: 'hidden',
      transition: 'all 0.3s ease'
    },
    modalOverlayActive: {
      opacity: 1,
      visibility: 'visible'
    },
    modal: {
      background: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '450px',
      padding: '25px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease'
    },
    modalActive: {
      transform: 'translateY(0)'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1a5f7a'
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#6c757d'
    },
    modalBody: {
      marginBottom: '25px'
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px'
    },
    modalBtn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 500,
      transition: 'all 0.3s ease',
      fontFamily: "'Poppins', sans-serif"
    },
    modalBtnPrimary: {
      background: '#1a5f7a',
      color: 'white'
    },
    modalBtnPrimaryHover: {
      background: '#124c63'
    },
    modalBtnSecondary: {
      background: '#f8f9fa',
      color: '#2d3e50'
    },
    modalBtnSecondaryHover: {
      background: '#e9ecef'
    },
    modalBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  };

  // Email validation
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Email Modal Component
  const EmailModal = () => {
    const [email, setEmail] = useState(modalEmail);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!isValidEmail(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      setLoading(true);
      try {
        if (modalAction === 'forgot-password') {
          // Call reset password API
          await auth.resetPassword(email);
          toast.success('Password reset instructions sent to your email.');
        } else if (modalAction === 'resend-activation') {
          toast.info('Please sign in first, then verify your email from your account settings.');
        }
        setShowEmailModal(false);
      } catch (error) {
        toast.error(error.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div 
        style={{
          ...styles.modalOverlay,
          ...(showEmailModal ? styles.modalOverlayActive : {})
        }}
        onClick={() => setShowEmailModal(false)}
      >
        <div 
          style={{
            ...styles.modal,
            ...(showEmailModal ? styles.modalActive : {})
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              {modalAction === 'forgot-password' ? 'Reset Password' : 'Resend Activation'}
            </h3>
            <button 
              onClick={() => setShowEmailModal(false)}
              style={styles.modalClose}
            >
              ×
            </button>
          </div>
          
          <div style={styles.modalBody}>
            <p>Please enter your email address:</p>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={styles.formInput}
                  onFocus={(e) => e.target.style = { ...styles.formInput, ...styles.formInputFocus }}
                  onBlur={(e) => e.target.style = styles.formInput}
                />
              </div>
              
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  style={{ ...styles.modalBtn, ...styles.modalBtnSecondary }}
                  onMouseEnter={(e) => e.target.style.background = styles.modalBtnSecondaryHover.background}
                  onMouseLeave={(e) => e.target.style.background = styles.modalBtnSecondary.background}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    ...styles.modalBtn, 
                    ...styles.modalBtnPrimary,
                    ...(loading ? styles.modalBtnDisabled : {})
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = styles.modalBtnPrimaryHover.background;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = styles.modalBtnPrimary.background;
                  }}
                >
                  {loading ? 'Processing...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Registration Steps Component
  const RegistrationSteps = () => {
    return (
      <div style={styles.registrationSteps}>
        <div style={styles.step}>
          <div style={{
            ...styles.stepCircle,
            ...(registrationStep === 1 ? styles.stepCircleActive : styles.stepCircleInactive)
          }}>
            1
          </div>
          <div style={{
            ...styles.stepLabel,
            ...(registrationStep === 1 ? styles.stepLabelActive : {})
          }}>
            Company Info
          </div>
        </div>
        
        <div style={{
          ...styles.stepLine,
          ...(registrationStep >= 2 ? styles.stepLineActive : {})
        }}></div>
        
        <div style={styles.step}>
          <div style={{
            ...styles.stepCircle,
            ...(registrationStep === 2 ? styles.stepCircleActive : styles.stepCircleInactive)
          }}>
            2
          </div>
          <div style={{
            ...styles.stepLabel,
            ...(registrationStep === 2 ? styles.stepLabelActive : {})
          }}>
            Login Info
          </div>
        </div>
      </div>
    );
  };

  // Handle Next Step in Registration
  const handleNextStep = (e) => {
    e.preventDefault();
    
    // Validate company information
    if (!formData.contactName.trim() || !formData.phoneNumber.trim() || !formData.companyName.trim()) {
      toast.error('Please fill in all company information fields');
      return;
    }

    // Additional validation for phone number if needed
    if (formData.phoneNumber.trim().length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setRegistrationStep(2);
  };

  // Handle Previous Step in Registration
  const handlePrevStep = (e) => {
    e.preventDefault();
    setRegistrationStep(1);
  };

  // Handle Forgot Password
  const handleForgotPassword = (prefilledEmail = '') => {
    if (prefilledEmail && isValidEmail(prefilledEmail)) {
      handleForgotPasswordSubmit(prefilledEmail);
    } else {
      setModalAction('forgot-password');
      setModalEmail(prefilledEmail);
      setShowEmailModal(true);
    }
  };

  const handleForgotPasswordSubmit = async (email) => {
    try {
      await auth.resetPassword(email);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      toast.error(`Error sending password reset email: ${error.message}`);
    }
  };

  // Handle Resend Activation
  const handleResendActivation = (prefilledEmail = '') => {
    if (prefilledEmail && isValidEmail(prefilledEmail)) {
      setModalAction('resend-activation');
      setModalEmail(prefilledEmail);
      setShowEmailModal(true);
    } else {
      setModalAction('resend-activation');
      setShowEmailModal(true);
    }
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const loginData = {
      email: formData.loginEmail,
      password: formData.loginPassword
    };

    try {
      await auth.signin(loginData, navigate);

    } catch (error) {
      toast.error(`Login failed: ${error.message || 'Invalid credentials'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.registerPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.registerPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!isValidEmail(formData.registerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    const registerData = {
      email: formData.registerEmail,
      password: formData.registerPassword,
      fullName: formData.contactName,
      companyContact: formData.phoneNumber,
      companyName: formData.companyName,
      role: 'company'
    };

    try {
      const message = await auth.signup(registerData);
      toast.success(message || 'Account created successfully! Please check your email for verification.');

      // Switch to login tab and pre-fill email
      setActiveTab('login');
      setFormData(prev => ({
        ...prev,
        loginEmail: formData.registerEmail,
        registerEmail: '',
        registerPassword: '',
        confirmPassword: '',
        contactName: '',
        phoneNumber: '',
        companyName: ''
      }));
      setRegistrationStep(1); // Reset to step 1
    } catch (error) {
      toast.error(`Registration failed: ${error.message || 'Server error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  // CSS keyframes as style tag
  const KeyframesStyle = () => (
    <style>
      {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-20px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(26, 95, 122, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(26, 95, 122, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(26, 95, 122, 0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        .required::after {
          content: '*';
          color: #dc3545;
          margin-left: 4px;
        }
        
        .pulse {
          animation: pulse 2s infinite;
        }
        
        .float {
          animation: float 3s ease-in-out infinite;
        }
        
        .slide-out {
          animation: slideOut 0.3s ease forwards;
        }
        
        .slide-in-right {
          animation: slideInRight 0.3s ease forwards;
        }
        
        @media (max-width: 900px) {
          .portal-container {
            flex-direction: column !important;
            max-width: 500px;
          }

          
          
          .welcome-section {
            order: 2;
            padding: 30px;
          }
          
          .auth-section {
            order: 1;
            padding: 20px !important;
          }
        }

        @media (max-width: 576px) {
          .auth-tabs {
            flex-direction: column;
            border-bottom: none;
          }
          
          .auth-tab {
            border-bottom: 2px solid #eee;
          }
          
          .auth-tab.active::after {
            display: none;
          }
          
          .welcome-section h1 {
            font-size: 1.8rem;
          }
          
          .form-title {
            font-size: 1.5rem;
          }

          .auth-links {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          
          .registration-steps {
            flex-direction: column;
            gap: 20px;
          }
          
          .step-line {
            width: 3px;
            height: 40px;
            margin: 10px 0;
          }
          
          .form-navigation {
            flex-direction: column;
          }
          
          .form-navigation button {
            width: 100%;
          }
        }
      `}
    </style>
  );

  return (
    <>
      <KeyframesStyle />
      <div style={styles.root}>
        {/* Email Modal */}
        {showEmailModal && <EmailModal />}

        <div className='portal-container' style={styles.portalContainer}>
          {/* Welcome Section */}
          <div style={styles.welcomeSection}>
            <div style={styles.welcomeSectionBefore}></div>
            <div style={styles.welcomeContent}>
              <a target='blank' href="https://halalcert.vercel.app/">
                <img style={styles.logo} src={logo} alt="HCA logo" />
              </a>
              <h1 style={styles.welcomeTitle}>Welcome to HDI Certification Portal</h1>
              <p style={styles.welcomeText}>
                Register, apply, submit, track the progress of application and download your certificate through the HDI certification portal.
              </p>
              
              <div style={styles.userGuide}>
                <h3 style={styles.userGuideTitle}>User's guide</h3>
                <button
                  style={styles.createAccountBtn}
                  onClick={() => {activeTab === "login" ? setActiveTab('register') : setActiveTab('login')}}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
                  }}
                >
                  {activeTab === "login" ? "Click Here To Create Account" : "Click Here To Login" }
                </button>
              </div>
              
              <div style={styles.divider}></div>
              
              <div className="login-info">
                <h3>Login</h3>
                <p>Enter Details to Login</p>
                <ul>
                  <li>E-Mail</li>
                  <li>Your Password</li>
                  <li>Keep me login</li>
                </ul>
              </div>
              
              <div style={{ ...styles.authLinks, marginTop: '20px', justifyContent: 'center', alignItems: "Center", gap: '20px' }}>
                <a href='https://theyoungpioneers.com/' style={{textAlign: "center", color: "#ffc107"}}>Developed by TheYoungPioneers</a>
              </div>
            </div>
          </div>
          
          {/* Auth Section */}
          <div className='auth-section' style={styles.authSection}>
            <div style={styles.authTabs}>
              <div 
                style={{
                  ...styles.authTab,
                  ...(activeTab === 'login' ? styles.authTabActive : {})
                }}
                onClick={() => setActiveTab('login')}
              >
                Login
                {activeTab === 'login' && <div style={styles.authTabActiveAfter} />}
              </div>
              <div 
                style={{
                  ...styles.authTab,
                  ...(activeTab === 'register' ? styles.authTabActive : {})
                }}
                onClick={() => setActiveTab('register')}
              >
                Register
                {activeTab === 'register' && <div style={styles.authTabActiveAfter} />}
              </div>
            </div>
            
            {/* Login Form */}
            <form 
              style={{ 
                ...styles.authForm, 
                ...(activeTab === 'login' ? styles.authFormActive : {})
              }} 
              id="login-form"
              onSubmit={handleLogin}
            >
              <h2 style={styles.formTitle}>Login to Your Account</h2>
              <p style={styles.formSubtitle}>Enter your credentials to access the portal</p>
              
              <div style={styles.formGroup}>
                <label htmlFor="loginEmail" style={styles.formLabel} className="required">E-Mail</label>
                <input
                  type="email"
                  id="loginEmail"
                  value={formData.loginEmail}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                  onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label htmlFor="loginPassword" style={styles.formLabel} className="required">Your Password</label>
                <input
                  type="password"
                  id="loginPassword"
                  value={formData.loginPassword}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                  onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                />
              </div>
              
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  style={styles.checkboxInput}
                />
                <label htmlFor="rememberMe">Keep me logged in</label>
              </div>
              
              <button 
                type="submit" 
                style={{ 
                  ...styles.btn, 
                  ...styles.btnPrimary,
                  ...((isLoading || auth.signingIn) ? styles.btnDisabled : {})
                }}
                disabled={isLoading || auth.signingIn}
                onMouseEnter={(e) => {
                  if (!isLoading && !auth.signingIn) {
                    Object.assign(e.target.style, styles.btnHover);
                  }
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.target.style, { ...styles.btn, ...styles.btnPrimary });
                }}
              >
                {(isLoading || auth.signingIn) ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Logging in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i> Login
                  </>
                )}
              </button>
              
              <div style={styles.authLinks}>
                <a 
                  style={styles.authLink}
                  onClick={() => handleForgotPassword(formData.loginEmail)}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.authLinkHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, styles.authLink)}
                >
                  Forgot password?
                </a>
                <a 
                  style={styles.authLink}
                  onClick={() => handleResendActivation(formData.loginEmail)}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.authLinkHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, styles.authLink)}
                >
                  Resend Activation Email?
                </a>
              </div>
            </form>
            
            {/* Registration Form */}
            <div 
              style={{ 
                ...styles.authForm, 
                ...(activeTab === 'register' ? styles.authFormActive : {})
              }} 
              id="register-form"
            >
              <h2 style={styles.formTitle}>Register your account as Halal Certification Authority Applicant</h2>
              <p style={styles.formSubtitle}>To enjoy our service</p>
              
              {/* Registration Steps */}
              <RegistrationSteps />
              
              {/* Step 1: Company Information */}
              <form 
                onSubmit={handleNextStep}
                style={{ 
                  display: registrationStep === 1 ? 'block' : 'none',
                  animation: registrationStep === 1 ? 'slideIn 0.5s ease' : 'slideOut 0.3s ease'
                }}
              >
                <div style={styles.formSection}>
                  <h3 style={styles.sectionTitle}>
                    <i className="fas fa-building" style={styles.sectionIcon}></i> Company Information
                  </h3>
                  
                  <div style={styles.formGroup}>
                    <label htmlFor="contactName" style={styles.formLabel} className="required">Contact Name</label>
                    <input
                      type="text"
                      id="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      required
                      style={styles.formInput}
                      onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="phoneNumber" style={styles.formLabel} className="required">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      style={styles.formInput}
                      onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="companyName" style={styles.formLabel} className="required">Company Name</label>
                    <input
                      type="text"
                      id="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      style={styles.formInput}
                      onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                    />
                  </div>
                </div>
                
                <div style={styles.formNavigation}>
                  <div style={{ flex: 1 }}></div>
                  <button 
                    type="submit"
                    style={{ 
                      ...styles.btn, 
                      ...styles.btnPrimary,
                      padding: '14px 30px',
                      minWidth: '150px'
                    }}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.btnHover)}
                    onMouseLeave={(e) => Object.assign(e.target.style, { ...styles.btn, ...styles.btnPrimary })}
                  >
                    Next <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </form>
              
              {/* Step 2: Login Information */}
              <form 
                onSubmit={handleRegister}
                style={{ 
                  display: registrationStep === 2 ? 'block' : 'none',
                  animation: registrationStep === 2 ? 'slideInRight 0.5s ease' : 'slideOut 0.3s ease'
                }}
              >
                <div style={styles.formSection}>
                  <h3 style={styles.sectionTitle}>
                    <i className="fas fa-user-lock" style={styles.sectionIcon}></i> Login Information
                  </h3>
                  
                  <div style={styles.formGroup}>
                    <label htmlFor="registerEmail" style={styles.formLabel} className="required">Login Email Address</label>
                    <input
                      type="email"
                      id="registerEmail"
                      value={formData.registerEmail}
                      onChange={handleInputChange}
                      required
                      style={styles.formInput}
                      onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label htmlFor="registerPassword" style={styles.formLabel} className="required">Password</label>
                    <input
                      type="password"
                      id="registerPassword"
                      value={formData.registerPassword}
                      onChange={handleInputChange}
                      required
                      style={styles.formInput}
                      onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label htmlFor="confirmPassword" style={styles.formLabel} className="required">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      style={styles.formInput}
                      onFocus={(e) => Object.assign(e.target.style, styles.formInputFocus)}
                      onBlur={(e) => Object.assign(e.target.style, styles.formInput)}
                    />
                  </div>
                </div>
                
                <div style={styles.formNavigation}>
                  <button 
                    type="button"
                    onClick={handlePrevStep}
                    style={{ 
                      ...styles.btn, 
                      ...styles.btnSecondary,
                      padding: '14px 30px',
                      minWidth: '150px'
                    }}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.btnSecondaryHover)}
                    onMouseLeave={(e) => Object.assign(e.target.style, { ...styles.btn, ...styles.btnSecondary })}
                  >
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button 
                    type="submit" 
                    style={{ 
                      ...styles.btn, 
                      ...styles.btnPrimary,
                      padding: '14px 30px',
                      minWidth: '150px',
                      ...((isLoading || auth.signingUp) ? styles.btnDisabled : {})
                    }}
                    disabled={isLoading || auth.signingUp}
                    onMouseEnter={(e) => {
                      if (!isLoading && !auth.signingUp) {
                        Object.assign(e.target.style, styles.btnHover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.target.style, { ...styles.btn, ...styles.btnPrimary });
                    }}
                  >
                    {(isLoading || auth.signingUp) ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Registering...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i> Register
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div style={styles.authLinks}>
                <a 
                  style={styles.authLink}
                  onClick={() => setActiveTab('login')}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.authLinkHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, styles.authLink)}
                >
                  Already have an account? Login
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>      
    </>
  );
};

export default Home;