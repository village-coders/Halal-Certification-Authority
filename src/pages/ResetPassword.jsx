import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from '../assets/hcaLogo.webp'
import { toast } from "sonner";
import { FiEye, FiEyeOff } from "react-icons/fi";

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
      maxWidth: '450px',
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
      padding: '40px',
      textAlign: 'center'
    },
    logo: {
      maxWidth: '180px',
      margin: '0 auto 20px',
      display: 'block'
    },
    title: {
      fontSize: '1.8rem',
      color: '#1a5f7a',
      fontWeight: 700,
      marginBottom: '10px'
    },
    subtitle: {
      color: '#6c757d',
      marginBottom: '30px'
    },
    formGroup: {
      marginBottom: '20px',
      textAlign: 'left',
      position: 'relative'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 600,
      color: '#2d3e50'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '1rem',
      fontFamily: "'Poppins', sans-serif",
      transition: 'border-color 0.3s ease'
    },
    btn: {
      width: '100%',
      padding: '14px',
      border: 'none',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #1a5f7a 0%, #159895 100%)',
      color: 'white',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'transform 0.2s ease',
      opacity: resettingPassword ? 0.7 : 1
    },
    backLink: {
      marginTop: '20px',
      display: 'block',
      color: '#1a5f7a',
      textDecoration: 'none',
      fontWeight: 500
    },
    eyeIcon: {
      position: 'absolute',
      right: '15px',
      top: '45px',
      cursor: 'pointer',
      color: '#6c757d',
      fontSize: '1.2rem'
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <img src={logo} alt="HCA Logo" style={styles.logo} />
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Enter your new password below.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              style={styles.input}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              style={styles.input}
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
          >
            {resettingPassword ? "Updating..." : "Reset Password"}
          </button>
        </form>
        
        <Link to="/" style={styles.backLink}>Back to Home</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
