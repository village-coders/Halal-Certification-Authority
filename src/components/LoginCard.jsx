import "./css/LoginCard.css";
import { useAuth } from '../hooks/useAuth';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

function LoginCard() {
  const { signin, signingIn } = useAuth();
  const navigate = useNavigate();

  const defaultData = {
    email: "",
    password: ""
  };

  const [formData, setFormData] = useState(defaultData);
  const [showPassword, setShowPassword] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signin({...formData, email: formData.email.toLowerCase()}, navigate);
  };

  return (
    <div className="login-card">
      <form className="auth-form active" onSubmit={handleSubmit}>
        <h2 className="form-title">Login to Your Account</h2>
        <p className="form-subtitle">Enter your credentials to access the portal</p>
        
        <div className="form-group">
            <label htmlFor="login-email" className="required">E-Mail</label>
            <input type="email" name="email" onChange={handleInput} required/>
        </div>
        
        <div className="form-group">
            <label htmlFor="password" className="required">Your Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleInput}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#6c757d',
                  display: 'flex', alignItems: 'center', padding: 0,
                  width: 'auto'
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
        </div>
        
        <div className="checkbox-group">
            <input type="checkbox" id="remember-me"/>
            <label htmlFor="remember-me">Keep me logged in</label>
        </div>
        
        <button type="submit" className="btn btn-primary" style={{marginTop: "20px"}}>
            <i className="fas fa-sign-in-alt"></i> Login
        </button>
        
        <div className="auth-links">
            <a href="#" id="login-forgot-password">Forgot password?</a>
            <a href="#" id="login-resend-activation">Resend Activation Email?</a>
        </div>
      </form>
    </div>
  );
}

export default LoginCard;
