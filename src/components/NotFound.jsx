import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  // Main container style
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  // Animated background shapes
  const animatedBackgroundStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 1
  };

  const shapeStyle = {
    position: 'absolute',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)'
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '800px'
  };

  // Error card
  const errorCardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '50px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    textAlign: 'center'
  };

  // Error code (404)
  const errorCodeStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '20px'
  };

  const digitStyle = {
    fontSize: '12rem',
    fontWeight: 900,
    lineHeight: 1,
    color: '#3b82f6',
    textShadow: '5px 5px 0 rgba(59, 130, 246, 0.2)'
  };

  const zeroContainerStyle = {
    position: 'relative',
    width: '160px',
    height: '160px',
    border: '15px solid #3b82f6',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const innerZeroStyle = {
    width: '60px',
    height: '60px',
    border: '8px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '50%'
  };

  // Text styles
  const errorTitleStyle = {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '20px',
    lineHeight: 1.2
  };

  const errorMessageStyle = {
    fontSize: '1.2rem',
    color: '#6b7280',
    marginBottom: '40px',
    lineHeight: 1.6,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  };

  // Search suggestion
  const searchSuggestionStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '40px',
    padding: '20px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '15px',
    borderLeft: '5px solid #3b82f6'
  };

  // Quick links
  const quickLinksStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '40px'
  };

  const quickLinkStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'white',
    borderRadius: '15px',
    textDecoration: 'none',
    color: '#374151',
    fontWeight: 600,
    border: '2px solid #e5e7eb',
    transition: 'all 0.3s ease'
  };

  // Home button
  const homeButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '50px',
    fontWeight: 600,
    fontSize: '1.1rem',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '40px',
    transition: 'all 0.3s ease'
  };

  // Help section
  const helpSectionStyle = {
    paddingTop: '30px',
    borderTop: '1px solid #e5e7eb'
  };

  const helpButtonsStyle = {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const helpButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: 600,
    textDecoration: 'none',
    border: '2px solid #3b82f6',
    background: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  // Footer
  const footerStyle = {
    marginTop: '40px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)'
  };

  const footerLinksStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  };

  const footerLinkStyle = {
    color: 'rgba(255, 255, 255, 0.8)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 0.3s ease'
  };

  // Animation styles
  const styleTag = (
    <style>
      {`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, 10px) rotate(90deg); }
          50% { transform: translate(0, 20px) rotate(180deg); }
          75% { transform: translate(-10px, 10px) rotate(270deg); }
        }
        
        @keyframes digitBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes rotateZero {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .error-card {
          animation: slideUp 0.8s ease-out;
        }
        
        .shape {
          animation: float 15s infinite linear;
        }
        
        .shape1 { animation-delay: 0s; }
        .shape2 { animation-delay: 2s; }
        .shape3 { animation-delay: 4s; }
        .shape4 { animation-delay: 6s; }
        
        .digit {
          animation: digitBounce 2s infinite;
        }
        
        .digit-1 { animation-delay: 0.1s; }
        .digit-2 { animation-delay: 0.2s; }
        .digit-3 { animation-delay: 0.3s; }
        
        .zero-container {
          animation: rotateZero 10s infinite linear;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .error-card { padding: 30px 20px; }
          .digit { font-size: 8rem !important; }
          .zero-container { 
            width: 120px !important; 
            height: 120px !important; 
            border-width: 12px !important; 
          }
          .inner-zero { 
            width: 45px !important; 
            height: 45px !important; 
            border-width: 6px !important; 
          }
          .error-title { font-size: 2rem !important; }
          .error-message { font-size: 1rem !important; }
          .quick-links { grid-template-columns: repeat(2, 1fr) !important; }
          .help-buttons { flex-direction: column; }
          .help-button { width: 100% !important; }
        }
        
        @media (max-width: 480px) {
          .error-code { gap: 10px !important; }
          .digit { font-size: 6rem !important; }
          .zero-container { 
            width: 90px !important; 
            height: 90px !important; 
            border-width: 10px !important; 
          }
          .inner-zero { 
            width: 35px !important; 
            height: 35px !important; 
            border-width: 5px !important; 
          }
          .error-title { font-size: 1.8rem !important; }
          .quick-links { grid-template-columns: 1fr !important; }
          .search-suggestion { 
            flex-direction: column !important; 
            text-align: center !important; 
          }
          .home-button { 
            width: 100% !important; 
            padding: 14px 20px !important; 
          }
        }
      `}
    </style>
  );

  return (
    <>
      {styleTag}
      <div style={containerStyle}>
        {/* Animated Background */}
        <div style={animatedBackgroundStyle}>
          <div 
            className="shape shape1"
            style={{ 
              ...shapeStyle, 
              width: '300px', 
              height: '300px', 
              top: '-150px', 
              left: '-150px' 
            }}
          ></div>
          <div 
            className="shape shape2"
            style={{ 
              ...shapeStyle, 
              width: '200px', 
              height: '200px', 
              bottom: '-100px', 
              right: '10%' 
            }}
          ></div>
          <div 
            className="shape shape3"
            style={{ 
              ...shapeStyle, 
              width: '150px', 
              height: '150px', 
              top: '20%', 
              right: '-75px' 
            }}
          ></div>
          <div 
            className="shape shape4"
            style={{ 
              ...shapeStyle, 
              width: '250px', 
              height: '250px', 
              bottom: '20%', 
              left: '-125px' 
            }}
          ></div>
        </div>

        {/* Main Content */}
        <div style={contentStyle}>
          <div style={errorCardStyle} className="error-card">
            {/* Error Code */}
            <div style={errorCodeStyle} className="error-code">
              <span style={digitStyle} className="digit digit-1">4</span>
              <span style={digitStyle} className="digit digit-2">
                <div style={zeroContainerStyle} className="zero-container">
                  <div style={innerZeroStyle} className="inner-zero"></div>
                </div>
              </span>
              <span style={digitStyle} className="digit digit-3">4</span>
            </div>

            {/* Error Message */}
            <h1 style={errorTitleStyle} className="error-title">Page Not Found</h1>
            <p style={errorMessageStyle} className="error-message">
              Oops! The page you're looking for seems to have wandered off into the digital abyss.
            </p>

            {/* Search Suggestion */}
            <div style={searchSuggestionStyle} className="search-suggestion">
              <div style={{ fontSize: '24px', color: '#3b82f6' }}>
                <i className="fas fa-search"></i>
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem', color: '#374151', fontWeight: 500 }}>
                Maybe you were looking for one of these?
              </p>
            </div>

            {/* Quick Links */}
            <div style={quickLinksStyle} className="quick-links">
              {[
                { to: "/", icon: "fa-home", label: "Home" },
                { to: "/dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
                { to: "/applications", icon: "fa-file-alt", label: "Applications" },
                { to: "/certificates", icon: "fa-certificate", label: "Certificates" }
              ].map((link, index) => (
                <Link 
                  key={index}
                  to={link.to} 
                  style={quickLinkStyle}
                  className="quick-link"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.color = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <i 
                    className={`fas ${link.icon}`} 
                    style={{ fontSize: '24px', marginBottom: '10px' }}
                  ></i>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Main Action Button */}
            <Link 
              to="/" 
              style={homeButtonStyle}
              className="home-button"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(102, 126, 234, 0.4)';
                e.currentTarget.style.gap = '15px';
                const icon = e.currentTarget.querySelector('i');
                if (icon) icon.style.transform = 'translateX(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.gap = '12px';
                const icon = e.currentTarget.querySelector('i');
                if (icon) icon.style.transform = 'translateX(0)';
              }}
            >
              <i className="fas fa-arrow-left"></i>
              Go Back Home
            </Link>

            {/* Help Section */}
            <div style={helpSectionStyle} className="help-section">
              <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '20px' }} className="help-text">
                Still can't find what you're looking for?
              </p>
              {/* <div style={helpButtonsStyle} className="help-buttons">
                <Link 
                  // to="/contact" 
                  style={helpButtonStyle}
                  className="help-button"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <i className="fas fa-headset"></i>
                  Contact Support
                </Link>
                <button 
                  style={{ 
                    ...helpButtonStyle, 
                    background: 'white', 
                    color: '#3b82f6' 
                  }} 
                  className="help-button secondary"
                  onClick={() => window.history.back()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#3b82f6';
                  }}
                >
                  <i className="fas fa-undo"></i>
                  Go Back
                </button>
              </div> */}
            </div>
          </div>

          {/* Footer */}
          <div style={footerStyle} className="not-found-footer">
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }} className="footer-text">
              © {new Date().getFullYear()} Certification Portal. All rights reserved.
            </p>
            <div style={footerLinksStyle} className="footer-links">
              {[
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms of Service" },
                { to: "/help", label: "Help Center" }
              ].map((link, index, array) => (
                <React.Fragment key={link.to}>
                  <Link 
                    // to={link.to} 
                    style={footerLinkStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {link.label}
                  </Link>
                  {index < array.length - 1 && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;