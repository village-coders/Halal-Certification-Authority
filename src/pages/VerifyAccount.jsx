import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../App.css'

const VerifyAccount = () => {
    const {token} = useParams()
    const {verifyAccount, verifyingAccount, verificationData} = useAuth();
    
    useEffect(()=>{
      if (token) {
        verifyAccount(token)
      }
    },[token]);

  return (
    <div className="verify-account-container">
      <div className="verify-account-card">
        <div className="verify-account-icon">
          {verifyingAccount ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : verificationData?.status === "success" ? (
            <i className="fas fa-check-circle"></i>
          ) : (
            <i className="fas fa-exclamation-circle"></i>
          )}
        </div>
        
        <h1 className="verify-account-title">
          {verifyingAccount ? 'Verifying Account' : 
           verificationData?.status === "success" ? 'Account Verified!' : 
           'Verification Failed'}
        </h1>
        
        <div className="verify-account-message">
          {verifyingAccount ? (
            <div className="loading-container">
              <p>Please wait while we verify your account...</p>
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <p className={`message-text ${verificationData?.status === "error" ? 'error' : 'success'}`}>
              {verificationData?.message}
            </p>
          )}
        </div>

        {!verifyingAccount && verificationData?.status === "success" && (
          <div className="verify-account-actions">
            <a href="/" className="login-btn">
              <i className="fas fa-sign-in-alt"></i>
              Go to Login
            </a>
            <a href="/" className="home-btn">
              <i className="fas fa-home"></i>
              Back to Home
            </a>
          </div>
        )}

        {!verifyingAccount && verificationData?.status === "error" && (
          <div className="verify-account-actions">
            <a href="/" className="home-btn">
              <i className="fas fa-home"></i>
              Back to Home
            </a>
            {/* <a href="/contact-support" className="support-btn">
              <i className="fas fa-headset"></i>
              Contact Support
            </a> */}
          </div>
        )}

        {/* <div className="verify-account-footer">
          <p>Having trouble? <a href="/help">Get help</a></p>
        </div> */}
      </div>
    </div>
  )
}

export default VerifyAccount