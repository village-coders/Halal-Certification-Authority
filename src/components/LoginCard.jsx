import "./css/LoginCard.css";
import { useAuth } from '../hooks/useAuth';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginCard() {
  const { signin, signingIn } = useAuth();
  const navigate = useNavigate();

  const defaultData = {
    email: "",
    password: ""
  };

  const [formData, setFormData] = useState(defaultData);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signin(formData, navigate);
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
            <input type="password" name="password" required/>
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
