import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from '../assets/hcaLogo.webp'
import { toast } from "sonner";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, resettingPassword } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    const result = await resetPassword(token, password);
    if (result.success) {
      setTimeout(() => navigate("/"), 2000);
    }
  };

  const styles = {
    root: {
      background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9eb 100%)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: "'Poppins', sans-serif"
    },
    container: {
      width: '100%',
      maxWidth: '480px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      padding: '50px',
      textAlign: 'center',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      animation: 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    logo: {
      maxWidth: '160px',
      margin: '0 auto 24px',
      display: 'block',
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))'
    },
    title: {
      fontSize: '2.2rem',
      color: '#1a5f7a',
      fontWeight: 800,
      marginBottom: '12px',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      color: '#64748b',
      marginBottom: '40px',
      fontSize: '1.05rem',
      lineHeight: '1.5'
    },
    formGroup: {
      marginBottom: '28px',
      textAlign: 'left',
      position: 'relative'
    },
    label: {
      display: 'block',
      marginBottom: '10px',
      fontWeight: 600,
      color: '#334155',
      fontSize: '0.95rem'
    },
    input: {
      width: '100%',
      padding: '16px 20px',
      border: '2px solid #e2e8f0',
      borderRadius: '14px',
      fontSize: '1rem',
      fontFamily: "'Poppins', sans-serif",
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: '#fff',
      outline: 'none'
    },
    inputFocus: {
      borderColor: '#1a5f7a',
      boxShadow: '0 0 0 4px rgba(26, 95, 122, 0.1)'
    },
    btn: {
      width: '100%',
      padding: '18px',
      border: 'none',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #1a5f7a 0%, #159895 100%)',
      color: 'white',
      fontSize: '1.1rem',
      fontWeight: 700,
      cursor: 'pointer',
      marginTop: '15px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 10px 15px -3px rgba(21, 152, 149, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      opacity: resettingPassword ? 0.7 : 1
    },
    backLink: {
      marginTop: '30px',
      display: 'inline-block',
      color: '#64748b',
      textDecoration: 'none',
      fontWeight: 500,
      fontSize: '0.95rem',
      transition: 'color 0.3s ease'
    },
    backLinkHover: {
      color: '#1a5f7a'
    },
    eyeIcon: {
      position: 'absolute',
      right: '20px',
      top: '50px',
      cursor: 'pointer',
      color: '#94a3b8',
      fontSize: '1.3rem',
      transition: 'color 0.3s ease',
      zIndex: 1
    }
  };

  return (
    <div style={styles.root}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div style={styles.container}>
        <img src={logo} alt="HCA Logo" style={styles.logo} />
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Secure your account by choosing a strong new password.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                style={styles.input}
                onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, styles.input)}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            style={styles.btn}
            disabled={resettingPassword}
            onMouseEnter={(e) => {
              if (!resettingPassword) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 20px -3px rgba(21, 152, 149, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = styles.btn.boxShadow;
            }}
          >
            {resettingPassword ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Resetting...
              </>
            ) : "Update Password"}
          </button>
        </form>
        
        <Link 
          to="/" 
          style={styles.backLink}
          onMouseEnter={(e) => Object.assign(e.target.style, styles.backLinkHover)}
          onMouseLeave={(e) => Object.assign(e.target.style, styles.backLink)}
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
